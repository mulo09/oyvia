import {Component, Input, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {LikesService} from '../services/likes';

/**
 * Thumbs up button with the number of likes. Shared by the article detail and
 * the article grid, so both always show the same counter. The counter itself
 * is seeded by LikesService.seedCounts() whenever the parent component fetches
 * `/getarticles`, which now returns each article's global `likes` value.
 */
@Component({
  selector: 'app-like-button',
  imports: [CommonModule],
  templateUrl: './like-button.html',
  styleUrl: './like-button.scss',
})
export class LikeButton {
  /** Id of the article being liked. */
  @Input({required: true}) articleId!: number;
  /** Hides the "Me gusta" text and keeps only the heart + counter. */
  @Input() compact: boolean = false;

  private readonly likes = inject(LikesService);


  get liked(): boolean {
    return this.likes.isLiked(this.articleId);
  }

  get count(): number {
    return this.likes.getCount(this.articleId);
  }

  get label(): string {
    return this.liked ? 'Te gusta' : 'Me gusta';
  }

  get ariaLabel(): string {
    const suffix = this.count === 1 ? '1 me gusta' : `${this.count} me gusta`;
    return `${this.liked ? 'Quitar me gusta' : 'Me gusta'} (${suffix})`;
  }

  /**
   * The grid cards wrap their content in a router link, so the click must not
   * bubble up and navigate away.
   */
  toggle(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.likes.toggle(this.articleId);
  }
}


