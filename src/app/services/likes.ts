import {Injectable, PLATFORM_ID, inject, signal} from '@angular/core';
import {isPlatformBrowser} from '@angular/common';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {Newsmodel} from '../models/newsmodel';

/**
 * Keeps track of which articles the visitor liked (locally, per browser) and
 * how many likes each article has (globally, shared by everyone).
 *
 * The global counter is stored by the Go backend (`article.likes` column +
 * `POST /likearticle`) so it is the same number for every visitor regardless
 * of device or network — that's the whole point of moving it server side
 * instead of keeping it in localStorage only.
 *
 * `seedCounts()` is called whenever the article grid or the article detail
 * page fetches `/getarticles` (which now returns a `likes` field per
 * article), so the counters shown are always fresh without a dedicated
 * "get likes" round trip.
 */
@Injectable({providedIn: 'root'})
export class LikesService {
  /** Ids liked by this visitor/browser. There is no login, so this is the
   * only way to know "did *I* already like this". */
  private static readonly LIKED_KEY = 'oyv:liked-articles';

  /**
   * Stable per-browser id. The backend rejects `POST /likearticle` with
   * `400 "user_identifier is required"` when it is missing, and uses it to
   * make likes idempotent (liking twice from the same browser counts once).
   */
  private static readonly USER_KEY = 'oyv:user-id';

  private static readonly LIKE_ENDPOINT = '/api/likearticle';

  private readonly http = inject(HttpClient);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  // Signals so every like button on screen (grid + detail) re-renders when a
  // counter changes, without any manual change detection plumbing.
  private readonly likedIds = signal<ReadonlySet<number>>(new Set<number>());
  private readonly counts = signal<Readonly<Record<number, number>>>({});

  constructor() {
    this.likedIds.set(new Set(this.readStoredLikedIds()));
  }

  /** True when this visitor already liked the article. */
  isLiked(id: number): boolean {
    return this.likedIds().has(id);
  }

  /** Number of likes known for the article (0 when it has none yet). */
  getCount(id: number): number {
    return this.counts()[id] ?? 0;
  }

  /**
   * Refreshes the counters from a batch of articles just fetched from the
   * API. Called by the article grid and the article detail page every time
   * they load `/getarticles`, since the backend is the source of truth.
   */
  seedCounts(articles: ReadonlyArray<Newsmodel>): void {
    if (!articles.length) {
      return;
    }
    const next = {...this.counts()};
    for (const article of articles) {
      next[article.id] = article.likes ?? 0;
    }
    this.counts.set(next);
  }

  /** Likes / unlikes an article, updating the counter optimistically. */
  toggle(id: number): void {
    const liked = !this.isLiked(id);

    this.setLiked(id, liked);
    this.setCount(id, Math.max(0, this.getCount(id) + (liked ? 1 : -1)));

    this.sendLike(id, liked);
  }

  // ---------------------------------------------------------------- remote

  private async sendLike(id: number, liked: boolean): Promise<void> {
    if (!this.isBrowser) {
      return;
    }
    try {
      const data: any = await firstValueFrom(
        this.http.post(
          LikesService.LIKE_ENDPOINT,
          {id, liked, user_identifier: this.userIdentifier()},
          {headers: new HttpHeaders({'Content-Type': 'application/json'})}
        )
      );
      // The backend answers {id, likes, user_liked}. It is the source of
      // truth for both values, so reconcile the optimistic guesses with it.
      const likes = this.toCount(data?.likes);
      if (likes !== null) {
        this.setCount(id, likes);
      }
      if (typeof data?.user_liked === 'boolean' && data.user_liked !== liked) {
        this.setLiked(id, data.user_liked);
      }
    } catch (err) {
      // The like did not reach the database, so roll the optimistic update
      // back instead of showing a counter that will silently reset on the
      // next `seedCounts()`.
      console.warn('[likes] POST /likearticle failed, reverting', err);
      this.setLiked(id, !liked);
      this.setCount(id, Math.max(0, this.getCount(id) + (liked ? -1 : 1)));
    }
  }

  private toCount(value: unknown): number | null {
    const parsed = typeof value === 'string' ? parseInt(value, 10) : value;
    return typeof parsed === 'number' && isFinite(parsed) ? parsed : null;
  }

  private setCount(id: number, likes: number): void {
    this.counts.set({...this.counts(), [id]: likes});
  }

  private setLiked(id: number, liked: boolean): void {
    const next = new Set(this.likedIds());
    if (liked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    this.likedIds.set(next);
    this.writeStoredLikedIds(next);
  }

  // --------------------------------------------------------------- identity

  /**
   * Returns (and lazily creates) the id that identifies this browser to the
   * backend. There is no login, so a random uuid kept in localStorage is the
   * best we can do. When storage is unavailable a fresh id is generated per
   * call, which still satisfies the backend's "required" check.
   */
  private userIdentifier(): string {
    try {
      const stored = window.localStorage?.getItem(LikesService.USER_KEY);
      if (stored) {
        return stored;
      }
      const created = this.randomId();
      window.localStorage?.setItem(LikesService.USER_KEY, created);
      return created;
    } catch {
      return this.randomId();
    }
  }

  private randomId(): string {
    const uuid = globalThis.crypto?.randomUUID?.();
    return uuid ?? `oyv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  // --------------------------------------------------------------- storage
  // localStorage is unavailable while prerendering and can throw in private
  // mode, so every access is guarded.

  private readStoredLikedIds(): Array<number> {
    if (!this.isBrowser) {
      return [];
    }
    try {
      const raw = window.localStorage?.getItem(LikesService.LIKED_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((id: unknown) => typeof id === 'number') : [];
    } catch {
      return [];
    }
  }

  private writeStoredLikedIds(ids: ReadonlySet<number>): void {
    if (!this.isBrowser) {
      return;
    }
    try {
      window.localStorage?.setItem(LikesService.LIKED_KEY, JSON.stringify([...ids]));
    } catch {
      // Quota/private mode: the value just stays in memory.
    }
  }
}

