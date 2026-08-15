import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { SITE, absoluteUrl } from '../site.config';

export interface PageMeta {
  /** Page title without the brand suffix. Omit to use the site default title. */
  title?: string;
  description?: string;
  /** Relative or absolute image URL used for social previews. */
  image?: string;
  /** Relative or absolute canonical URL. Defaults to the current location. */
  url?: string;
  /** Open Graph type: "website" for landing pages, "article" for posts. */
  type?: 'website' | 'article';
  /** When true, asks search engines not to index the page. */
  noindex?: boolean;
}

const MAX_DESCRIPTION_LENGTH = 155;

const JSON_LD_ID = 'app-json-ld';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  setPageMeta(page: PageMeta = {}): void {
    const fullTitle = page.title ? `${page.title} | ${SITE.name}` : SITE.title;
    const description = this.truncate(page.description || SITE.description);
    const image = absoluteUrl(page.image || SITE.defaultImage);
    const url = absoluteUrl(page.url ?? this.currentPath());
    const type = page.type ?? 'website';

    this.title.setTitle(fullTitle);

    this.setTag('name', 'description', description);
    this.setTag('name', 'robots', page.noindex ? 'noindex, follow' : 'index, follow');

    this.setTag('property', 'og:site_name', SITE.name);
    this.setTag('property', 'og:locale', SITE.locale);
    this.setTag('property', 'og:type', type);
    this.setTag('property', 'og:title', fullTitle);
    this.setTag('property', 'og:description', description);
    this.setTag('property', 'og:image', image);
    this.setTag('property', 'og:url', url);

    this.setTag('name', 'twitter:card', 'summary_large_image');
    this.setTag('name', 'twitter:site', SITE.twitterHandle);
    this.setTag('name', 'twitter:title', fullTitle);
    this.setTag('name', 'twitter:description', description);
    this.setTag('name', 'twitter:image', image);

    this.setCanonical(url);
  }

  /** Replaces the page-level JSON-LD block. Pass null to remove it. */
  setJsonLd(data: unknown | null, id: string = JSON_LD_ID): void {
    const head = this.document.head;
    const existing = head.querySelector(`script[type="application/ld+json"]#${id}`);
    if (existing) {
      existing.remove();
    }
    if (!data) {
      return;
    }
    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.id = id;
    script.text = JSON.stringify(data);
    head.appendChild(script);
  }

  /** Strips HTML tags and collapses whitespace so descriptions stay meta-safe. */
  plainText(value: string | undefined): string {
    return (value ?? '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private truncate(value: string): string {
    const plain = this.plainText(value);
    if (plain.length <= MAX_DESCRIPTION_LENGTH) {
      return plain;
    }
    const cut = plain.slice(0, MAX_DESCRIPTION_LENGTH);
    const lastSpace = cut.lastIndexOf(' ');
    return (lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…';
  }

  private setTag(attr: 'name' | 'property', key: string, content: string): void {
    this.meta.updateTag({ [attr]: key, content }, `${attr}='${key}'`);
  }

  private setCanonical(url: string): void {
    let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private currentPath(): string {
    const location = this.document.location;
    return location ? location.pathname + location.search : '/';
  }
}
