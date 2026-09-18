import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Articlegrid } from '../articlegrid/articlegrid';
import { Stage } from '../stage/stage';
import { SeoService } from '../services/seo';
import { SITE, absoluteUrl } from '../site.config';
import { DEFAULT_STAGE_VIDEOS } from '../models/stagevideo';

const STAGE_JSON_LD_ID = 'home-stage-video-json-ld';

@Component({
  selector: 'app-home',
  imports: [Articlegrid, RouterLink, Stage],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit, OnDestroy {
  private readonly seo = inject(SeoService);

  constructor(private router: Router) {}

  ngOnInit(): void {
    // One VideoObject per stage clip so each can surface in Google's video
    // rich results / video carousels, independent of the route-level page
    // meta already applied by `App` for the title/description/canonical.
    this.seo.setJsonLd(
      {
        '@context': 'https://schema.org',
        '@graph': DEFAULT_STAGE_VIDEOS.map((video) => ({
          '@type': 'VideoObject',
          name: video.title,
          description: this.seo.plainText(video.description) || video.title,
          thumbnailUrl: [absoluteUrl(video.thumbnail)],
          uploadDate: video.uploadDate,
          duration: video.getIsoDuration() || undefined,
          contentUrl: absoluteUrl(video.desktopVideo),
          isFamilyFriendly: true,
          inLanguage: SITE.lang,
          publisher: { '@id': `${SITE.url}/#organization` },
        })),
      },
      STAGE_JSON_LD_ID
    );
  }

  ngOnDestroy(): void {
    this.seo.setJsonLd(null, STAGE_JSON_LD_ID);
  }

  goToCalendar(): void {
    this.router.navigate(['/surf-calendar']);
  }

  scrollToArticles(): void {
    document.getElementById('articles')?.scrollIntoView({ behavior: 'smooth' });
  }
}
