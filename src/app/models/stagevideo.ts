/**
 * Describes a single clip that the intro `Stage` banner can play.
 *
 * `desktopVideo` is the landscape cut used on wide viewports and
 * `mobileVideo` is the vertical, Instagram style cut used on phones - the
 * same split that used to be hardcoded as two constants in `Stage`.
 *
 * The list is currently hardcoded in `Stage`, but this shape mirrors what
 * the backend is expected to return once the stage clips become manageable
 * from an admin panel (see `fromApi` / `listFromApi`, following the same
 * pattern as `Filesmodel` and `Newsmodel`).
 *
 * `description`, `thumbnail`, `durationSeconds` and `uploadDate` are not
 * used by `Stage` itself - they only exist so `Home` can publish a
 * `VideoObject` JSON-LD block per clip for video rich results.
 */
export class StageVideo {
  constructor(
    public id: number,
    public title: string,
    public desktopVideo: string,
    public mobileVideo: string,
    public description: string = '',
    public thumbnail: string = '',
    public durationSeconds: number = 0,
    /** ISO date (YYYY-MM-DD) the clip was published. */
    public uploadDate: string = ''
  ) {}

  static fromApi(raw: any): StageVideo {
    return new StageVideo(
      raw?.id ?? 0,
      raw?.title ?? '',
      raw?.desktopVideo ?? '',
      raw?.mobileVideo ?? '',
      raw?.description ?? '',
      raw?.thumbnail ?? '',
      raw?.durationSeconds ?? 0,
      raw?.uploadDate ?? ''
    );
  }

  static listFromApi(raw: any): Array<StageVideo> {
    return Array.isArray(raw) ? raw.map(video => StageVideo.fromApi(video)) : [];
  }

  /** `durationSeconds` as an ISO 8601 duration (e.g. `PT35S`), as required by schema.org/VideoObject. */
  getIsoDuration(): string {
    const total = Math.round(this.durationSeconds);
    if (!total || total <= 0) {
      return '';
    }
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `PT${minutes ? `${minutes}M` : ''}${seconds}S`;
  }
}

/**
 * Clips currently shown by the home page stage. Hardcoded for now; once the
 * backend can manage them this becomes an API call using
 * `StageVideo.listFromApi()` instead (same pattern as `Filesmodel`/`Newsmodel`).
 * Shared between `Stage` (playback) and `Home` (VideoObject JSON-LD) so the
 * two never drift apart.
 */
export const DEFAULT_STAGE_VIDEOS: Array<StageVideo> = [
  new StageVideo(
    1,
    'Moments of the day',
    'assets/videos/surfwave1.webm',
    'assets/videos/surfwave1.mp4',
    'Momentos destacados de sesiones de surf y kitesurf, presentación de Olas y Vientos.',
    'assets/images/stage/moments-of-the-day.jpg',
    25,
    '2026-09-21',
  ),
  new StageVideo(
    2,
    'Atardecer',
    'assets/videos/surfwave2.webm',
    'assets/videos/surfwave2.mp4',
    'Atardecer surfero: una sesión de olas con la última luz del día.',
    'assets/images/stage/atardecer.jpg',
    20,
    '2026-09-20',
  ),
  new StageVideo(
    3,
    'Atardecer',
    'assets/videos/surfwave3.webm',
    'assets/videos/surfwave3.mp4',
    'Atardecer surfero: una sesión de olas con la última luz del día.',
    'assets/images/stage/atardecer.jpg',
    20,
    '2026-09-20',
  ),
];


