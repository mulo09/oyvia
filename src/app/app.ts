import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Logo } from './logo/logo';
import { Navbar } from './navbar/navbar';
import { SocialMedia } from './social-media/social-media';
import { LanguageSwitcher } from './language-switcher/language-switcher';
import { EventStrip } from './event-strip/event-strip';
import { Footer } from './footer/footer';
import { SeoService, PageMeta } from './services/seo';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Logo, Navbar, SocialMedia, LanguageSwitcher, EventStrip, Footer],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('Olas y Vientos');

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);

  ngOnInit(): void {
    this.applyRouteMeta();
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.applyRouteMeta());
  }

  /**
   * Applies the metadata declared in the route definition. Routes without `seo`
   * data (currently the article detail page) manage their own tags.
   */
  private applyRouteMeta(): void {
    let route = this.route;
    while (route.firstChild) {
      route = route.firstChild;
    }
    const meta = route.snapshot.data['seo'] as PageMeta | undefined;
    if (meta) {
      this.seo.setPageMeta(meta);
    }
  }
}
