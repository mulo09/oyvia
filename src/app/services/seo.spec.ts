import { TestBed } from '@angular/core/testing';

import { SeoService } from './seo';

describe('SeoService', () => {
  let seo: SeoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    seo = TestBed.inject(SeoService);
    document.head
      .querySelectorAll('meta[name], meta[property], link[rel="canonical"], script[type="application/ld+json"]')
      .forEach((node) => node.remove());
  });

  const content = (selector: string) =>
    document.head.querySelector(selector)?.getAttribute('content');

  it('appends the brand name to the page title', () => {
    seo.setPageMeta({ title: 'Contacto' });
    expect(document.title).toBe('Contacto | Olas y Vientos');
  });

  it('falls back to the site defaults when nothing is provided', () => {
    seo.setPageMeta();
    expect(document.title).toBe('Olas y Vientos | Noticias de Surf y Kitesurf');
    expect(content('meta[name="description"]')).toContain('surf');
  });

  it('strips HTML and truncates long descriptions', () => {
    seo.setPageMeta({ description: '<p>' + 'ola '.repeat(100) + '</p>' });
    const description = content('meta[name="description"]') ?? '';
    expect(description).not.toContain('<p>');
    expect(description.length).toBeLessThanOrEqual(156);
  });

  it('builds absolute Open Graph and Twitter urls from relative paths', () => {
    seo.setPageMeta({ title: 'Post', image: 'assets/images/a.jpg', url: '/article/3' });
    expect(content('meta[property="og:image"]')).toBe(
      'https://olasyvientos.es/assets/images/a.jpg'
    );
    expect(content('meta[property="og:url"]')).toBe('https://olasyvientos.es/article/3');
    expect(content('meta[name="twitter:card"]')).toBe('summary_large_image');
  });

  it('keeps already absolute image urls untouched', () => {
    seo.setPageMeta({ image: 'https://cdn.example.com/a.jpg' });
    expect(content('meta[property="og:image"]')).toBe('https://cdn.example.com/a.jpg');
  });

  it('updates the canonical link instead of appending duplicates', () => {
    seo.setPageMeta({ url: '/about' });
    seo.setPageMeta({ url: '/contact' });
    const links = document.head.querySelectorAll('link[rel="canonical"]');
    expect(links.length).toBe(1);
    expect(links[0].getAttribute('href')).toBe('https://olasyvientos.es/contact');
  });

  it('marks pages as noindex on request', () => {
    seo.setPageMeta({ noindex: true });
    expect(content('meta[name="robots"]')).toBe('noindex, follow');
  });

  it('replaces and removes the JSON-LD block', () => {
    seo.setJsonLd({ '@type': 'Article', headline: 'Uno' }, 'test-ld');
    seo.setJsonLd({ '@type': 'Article', headline: 'Dos' }, 'test-ld');
    const scripts = document.head.querySelectorAll('script#test-ld');
    expect(scripts.length).toBe(1);
    expect(scripts[0].textContent).toContain('Dos');

    seo.setJsonLd(null, 'test-ld');
    expect(document.head.querySelector('script#test-ld')).toBeNull();
  });
});
