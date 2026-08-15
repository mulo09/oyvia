export const SITE = {
  /** Canonical origin of the production site. Used to build absolute URLs. */
  url: 'https://olasyvientos.es',
  name: 'Olas y Vientos',
  title: 'Olas y Vientos | Noticias de Surf y Kitesurf',
  description:
    'Noticias, reportajes y calendario de competiciones de surf y kitesurf. ' +
    'Actualidad de las olas, el viento y la cultura surf desde Barcelona.',
  locale: 'es_ES',
  lang: 'es',
  defaultImage: 'assets/images/socialimage.jpg',
  twitterHandle: '@olasyvientos',
  social: [
    'https://www.instagram.com/olasyvientos/',
    'https://www.facebook.com/profile.php?id=100067519922191',
  ],
} as const;

/** Turns a relative path or a protocol-relative URL into an absolute one. */
export function absoluteUrl(pathOrUrl: string): string {
  const value = (pathOrUrl ?? '').trim();
  if (!value) {
    return SITE.url;
  }
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  if (value.startsWith('//')) {
    return 'https:' + value;
  }
  return SITE.url + (value.startsWith('/') ? value : '/' + value);
}
