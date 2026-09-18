import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  ViewChild,
  ChangeDetectorRef,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import {CommonModule, isPlatformBrowser} from '@angular/common';
import {StageVideo, DEFAULT_STAGE_VIDEOS} from '../models/stagevideo';

/**
 * Full screen intro ("stage") that plays a short clip when the home page is
 * opened and then removes itself.
 *
 * A different file is used per viewport: a landscape cut for desktop and a
 * vertical, Instagram style cut for phones.
 *
 * The banner can hold several clips (see `StageVideo`/`videos`). A single
 * arrow button on each edge (styled like `EventStrip`'s nav, but bigger)
 * cycles to the previous/next clip; the switch itself is a crossfade between
 * two stacked `<video>` layers so there is never a black flash between clips.
 */
@Component({
  selector: 'app-stage',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stage.html',
  styleUrl: './stage.scss',
})
export class Stage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('layer0') private layer0Ref?: ElementRef<HTMLVideoElement>;
  @ViewChild('layer1') private layer1Ref?: ElementRef<HTMLVideoElement>;

  /** Controls whether the overlay is in the DOM at all. */
  public visible: boolean = false;
  /** Drives the fade-out transition before the overlay is destroyed. */
  public leaving: boolean = false;
  /** True when autoplay was refused and the user has to press play. */
  public needsUserGesture: boolean = false;
  /** True while a crossfade between two clips is in progress. */
  public switching: boolean = false;

  /**
   * Clips available to the stage. Hardcoded for now; once the backend can
   * manage them this will be populated from an API call instead, using
   * `StageVideo.listFromApi()` (same pattern as `Filesmodel`/`Newsmodel`).
   * Shared with `Home`'s VideoObject JSON-LD so both stay in sync.
   */
  public videos: Array<StageVideo> = DEFAULT_STAGE_VIDEOS;

  /** Index into `videos` of the clip currently on screen. */
  public currentIndex: number = 0;
  /** Which of the two stacked `<video>` layers is currently visible. */
  public activeLayer: 0 | 1 = 0;
  /** `src` bound to each layer; kept apart so switching one never touches the other. */
  public layerSrc: [string, string] = ['', ''];
  /**
   * `poster` bound to each layer. It is what the browser paints while the clip
   * is still buffering, so it - and not the multi-MB video - becomes the
   * Largest Contentful Paint element.
   */
  public layerPoster: [string, string] = ['', ''];
  /** 0-100 playback progress of the active layer, drives the dot's loading bar. */
  public progress: number = 0;

  /** Viewport width (px) below which the vertical cut is used. */
  private static readonly MOBILE_BREAKPOINT = 768;

  /** How long the fade-out lasts. Must match $fade-duration in the SCSS. */
  private static readonly FADE_MS = 600;

  /** How long the crossfade between two clips lasts. Must match the SCSS. */
  private static readonly SWITCH_MS = 900;

  /**
   * If playback has not started within this window the clip is probably not
   * coming (stalled network, bad codec), so the stage gets out of the way.
   * The timer is cleared as soon as the first frame plays, so a long video is
   * never cut short - only a video that never starts.
   */
  private static readonly START_TIMEOUT_MS = 15000;

  private fadeTimer?: ReturnType<typeof setTimeout>;
  private startTimer?: ReturnType<typeof setTimeout>;
  private switchTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  /** Clip currently shown, used by the title and the arrow buttons. */
  public get currentVideo(): StageVideo | undefined {
    return this.videos[this.currentIndex];
  }

  ngOnInit(): void {
    // Never render on the server: an autoplaying banner would end up in the
    // prerendered HTML and flash for users (and crawlers) before hydration.
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Users who asked the OS to reduce motion should go straight to content.
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    if (!this.videos.length) {
      return;
    }

    this.currentIndex = 0;
    this.activeLayer = 0;
    this.layerPoster[0] = this.videos[0].thumbnail;
    this.layerSrc[0] = this.pickSource(this.videos[0]);
    this.progress = 0;
    this.visible = true;

    this.startTimer = setTimeout(() => {
      console.warn('[stage] video never started, dismissing');
      this.dismiss();
    }, Stage.START_TIMEOUT_MS);
  }

  ngAfterViewInit(): void {
    if (!this.visible) {
      return;
    }
    void this.play(this.layer0Ref?.nativeElement);
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }

  /** First frames of the active layer are playing: the startup watchdog is no longer needed. */
  public onPlaying(layer: 0 | 1): void {
    if (layer !== this.activeLayer) {
      return;
    }
    if (this.startTimer) {
      clearTimeout(this.startTimer);
      this.startTimer = undefined;
    }
  }

  /** `ended` handler: the active clip played through, collapse the banner. */
  public onEnded(layer: 0 | 1): void {
    if (layer !== this.activeLayer) {
      return;
    }
    this.dismiss();
  }

  /** The active clip could not be loaded or decoded: drop the banner immediately. */
  public onError(layer: 0 | 1): void {
    if (layer !== this.activeLayer) {
      return;
    }
    const el = layer === 0 ? this.layer0Ref?.nativeElement : this.layer1Ref?.nativeElement;
    console.error('[stage] video failed to load', el?.currentSrc, el?.error);
    this.dismiss(true);
  }

  /**
   * `timeupdate` handler for the active layer: turns raw playback time into
   * the 0-100 value the active dot's loading bar reads, mirroring the
   * progress bar of a normal video player. Events from the layer that is
   * fading out are ignored so the bar cannot jump backwards mid-crossfade.
   */
  public onTimeUpdate(layer: 0 | 1): void {
    if (layer !== this.activeLayer) {
      return;
    }
    const el = layer === 0 ? this.layer0Ref?.nativeElement : this.layer1Ref?.nativeElement;
    if (!el || !isFinite(el.duration) || el.duration <= 0) {
      this.progress = 0;
      return;
    }
    this.progress = Math.min(100, (el.currentTime / el.duration) * 100);
  }

  /** "Ocultar" button. */
  public skip(): void {
    this.dismiss();
  }

  /**
   * Row selector: crossfades from the clip on screen to `videos[index]`.
   *
   * The inactive `<video>` layer is loaded and started first, then the CSS
   * opacity transition on `.stage__video--active` does the actual crossfade,
   * so there is never a black frame between the two clips.
   */
  public async selectVideo(index: number): Promise<void> {
    if (this.switching || index === this.currentIndex || !this.videos[index]) {
      return;
    }

    const nextLayer: 0 | 1 = this.activeLayer === 0 ? 1 : 0;
    const nextEl = (nextLayer === 0 ? this.layer0Ref : this.layer1Ref)?.nativeElement;
    const previousEl = (nextLayer === 0 ? this.layer1Ref : this.layer0Ref)?.nativeElement;
    if (!nextEl) {
      return;
    }

    this.switching = true;
    this.layerPoster[nextLayer] = this.videos[index].thumbnail;
    this.layerSrc[nextLayer] = this.pickSource(this.videos[index]);
    this.cdr.detectChanges();

    // Autoplay policies are far more forgiving here than on first load: this
    // call happens synchronously inside a user click.
    nextEl.defaultMuted = true;
    nextEl.muted = true;
    nextEl.volume = 0;
    try {
      nextEl.currentTime = 0;
    } catch {
      // Ignored: currentTime can throw before metadata is ready; play() below
      // still starts the clip from 0 in that case.
    }

    try {
      await nextEl.play();
    } catch (err) {
      console.warn('[stage] clip switch autoplay blocked', err);
    }

    this.currentIndex = index;
    this.activeLayer = nextLayer;
    // The new layer starts from 0, so its loading bar should too - without
    // this it would flash at whatever progress the previous clip left behind.
    this.progress = 0;
    this.cdr.detectChanges();

    if (this.switchTimer) {
      clearTimeout(this.switchTimer);
    }
    // Only pause the outgoing layer once it has fully faded out - pausing it
    // earlier would freeze it on a visible frame mid-transition.
    this.switchTimer = setTimeout(() => {
      previousEl?.pause();
      this.switching = false;
      this.switchTimer = undefined;
    }, Stage.SWITCH_MS);
  }

  /** Left arrow: crossfades to the previous clip in `videos`, wrapping around. */
  public previousVideo(): void {
    if (!this.videos.length) {
      return;
    }
    const index = (this.currentIndex - 1 + this.videos.length) % this.videos.length;
    void this.selectVideo(index);
  }

  /** Right arrow: crossfades to the next clip in `videos`, wrapping around. */
  public nextVideo(): void {
    if (!this.videos.length) {
      return;
    }
    const index = (this.currentIndex + 1) % this.videos.length;
    void this.selectVideo(index);
  }

  /**
   * The `muted` attribute in the template is not enough: Angular creates the
   * element and then sets attributes, while the autoplay policy is evaluated
   * against the `muted` *property*. Without setting it here Chrome rejects
   * play() with NotAllowedError. `defaultMuted` is the one that reflects back
   * to the attribute, so both are set.
   */
  private async play(video: HTMLVideoElement | undefined): Promise<void> {
    if (!video) {
      this.dismiss(true);
      return;
    }

    video.defaultMuted = true;
    video.muted = true;
    video.volume = 0;

    try {
      await video.play();
    } catch (err) {
      // Autoplay was blocked. Do not vanish silently - that looks like the
      // feature is broken. Offer a manual start instead.
      console.warn('[stage] autoplay blocked, showing manual start', err);
      this.needsUserGesture = true;
      this.cdr.detectChanges();
    }
  }

  /** Manual start used when the browser refuses to autoplay. */
  public startManually(): void {
    this.needsUserGesture = false;
    void this.play(this.layer0Ref?.nativeElement);
  }

  private pickSource(video: StageVideo): string {
    const isMobile = window.matchMedia?.(
      `(max-width: ${Stage.MOBILE_BREAKPOINT - 1}px)`
    ).matches;
    return isMobile ? video.mobileVideo : video.desktopVideo;
  }

  /**
   * Collapses the banner and then removes it from the DOM.
   * @param immediate skip the animation (used when there is nothing to show).
   */
  private dismiss(immediate: boolean = false): void {
    if (!this.visible || this.leaving) {
      return;
    }
    this.clearTimers();

    if (immediate) {
      this.visible = false;
      this.cdr.detectChanges();
      return;
    }

    this.leaving = true;
    this.cdr.detectChanges();

    this.fadeTimer = setTimeout(() => {
      this.visible = false;
      this.leaving = false;
      this.cdr.detectChanges();
    }, Stage.FADE_MS);
  }

  private clearTimers(): void {
    if (this.fadeTimer) {
      clearTimeout(this.fadeTimer);
      this.fadeTimer = undefined;
    }
    if (this.startTimer) {
      clearTimeout(this.startTimer);
      this.startTimer = undefined;
    }
  }
}

