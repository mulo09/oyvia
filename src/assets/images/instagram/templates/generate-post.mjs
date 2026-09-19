#!/usr/bin/env node
/**
 * Genera un post de Instagram (1080x1350) a partir de un artículo publicado
 * en olasyvientos.es. Composición: FOTO + TITULAR (sin fecha, sin entradilla,
 * sin botón).
 *
 *   node generate-post.mjs 97
 *   node generate-post.mjs 97 --title "Titular a medida"
 *
 * La imagen se toma SIEMPRE del elemento `.article-featured-image img`
 * de la página real (https://www.olasyvientos.es/article/<id>), renderizada
 * con Chrome porque el sitio es una SPA y ese <img> no existe en el HTML
 * que devuelve el servidor.
 *
 * Salida:  ../post-article-<id>.png
 *          ../post-article-<id>.txt   (caption + hashtags)
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, writeFile, readFile, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(DIR, '..');
const CACHE = path.join(DIR, '.cache');

const SITE = process.env.OYV_SITE || 'https://www.olasyvientos.es';
const API = process.env.OYV_API || `${SITE}/api/getarticles`;
const CHROME = process.env.CHROME ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

/* ------------------------------ args ------------------------------ */
const argv = process.argv.slice(2);
const id = Number(argv[0]);
if (!id) {
  console.error('Uso: node generate-post.mjs <idArticulo> [--title "..."]');
  process.exit(1);
}
const flag = (name) => {
  const i = argv.indexOf('--' + name);
  return i > -1 ? argv[i + 1] : undefined;
};

/* ---------------------------- helpers ----------------------------- */
const esc = (s = '') =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const stripHtml = (html = '') =>
  html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ').trim();

/** Titular de portada: corta por conectores antes de truncar a lo bruto. */
const smartTitle = (name, max = 78) => {
  let t = (name || '').trim().replace(/\s+/g, ' ');
  if (t.length <= max) return t;
  for (const sep of [' con ', ' tras ', ' en el que ', ' que ', ' - ', ' – ', ', ']) {
    const i = t.toLowerCase().indexOf(sep);
    if (i > 24 && i <= max) return t.slice(0, i).trim();
  }
  return t.slice(0, t.lastIndexOf(' ', max)).trim();
};

/** Resalta en naranja el tramo central del titular. */
const highlight = (title) => {
  const w = title.split(' ');
  if (w.length < 4) return esc(title);
  const a = Math.floor(w.length / 3);
  const b = Math.min(w.length, a + Math.max(2, Math.round(w.length / 3)));
  return `${esc(w.slice(0, a).join(' '))} <span class="hl">${esc(w.slice(a, b).join(' '))}</span> ${esc(w.slice(b).join(' '))}`;
};

/** Blogger/Google sirve la imagen a la resolución que pidas en /sNNN/. */
const upscale = (url) =>
  url.replace(/\/s\d{2,4}(-c)?\//, '/s1600/').replace(/=s\d{2,4}(-c)?$/, '=s1600');

const mimeOf = (buf) => {
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'image/jpeg';
  if (buf[0] === 0x89 && buf[1] === 0x50) return 'image/png';
  if (buf.slice(8, 12).toString() === 'WEBP') return 'image/webp';
  return null;
};

/* ------------------- 1 · imagen desde el DOM real ------------------ */
const pageUrl = `${SITE}/article/${id}`;
console.log(`▶ Renderizando ${pageUrl} para leer .article-featured-image`);

const { stdout: dom } = await execFileAsync(CHROME, [
  '--headless=new', '--disable-gpu', '--virtual-time-budget=20000',
  '--dump-dom', pageUrl,
], { maxBuffer: 64 * 1024 * 1024 });

const featured = dom.match(
  /class="[^"]*article-featured-image[^"]*"[\s\S]{0,800}?<img[^>]*\ssrc="([^"]+)"/i
);
if (!featured) {
  console.error('❌ No se encontró .article-featured-image en la página renderizada.');
  console.error('   ¿Tiene imagen ese artículo? ¿Cambió el maquetado?');
  process.exit(1);
}

const srcRaw = featured[1];
const src = upscale(srcRaw);
console.log(`  ↳ src original : ${srcRaw.slice(-58)}`);
if (src !== srcRaw) console.log(`  ↳ alta resolución: …${src.slice(-58)}`);

await mkdir(CACHE, { recursive: true });
let buf = Buffer.from(
  await (await fetch(src, { headers: { 'user-agent': 'Mozilla/5.0' } })).arrayBuffer()
);
let mime = mimeOf(buf);

// Si la versión ampliada falla, recupera la original del DOM.
if (!mime) {
  console.warn('⚠️  La versión ampliada no es una imagen válida; uso la original.');
  buf = Buffer.from(
    await (await fetch(srcRaw, { headers: { 'user-agent': 'Mozilla/5.0' } })).arrayBuffer()
  );
  mime = mimeOf(buf);
}
if (!mime) {
  console.error('❌ La URL no devolvió una imagen válida.');
  process.exit(1);
}

await writeFile(path.join(CACHE, `article-${id}${mime === 'image/png' ? '.png' : '.jpg'}`), buf);
console.log(`  ↳ descargada: ${(buf.length / 1024).toFixed(0)} KB (${mime})`);

// Se incrusta en base64: así Chrome no depende de rutas file:// al renderizar.
const dataUri = `data:${mime};base64,${buf.toString('base64')}`;

/* ---------------- 2 · titular desde la API ------------------------- */
let name = flag('title');

if (!name) {
  const articles = await (await fetch(API, { headers: { accept: 'application/json' } })).json();
  const art = articles.find((a) => Number(a.id) === id);
  if (art) name = smartTitle(art.name);
}
// Último recurso: el <h1 class="article-title"> de la propia página.
if (!name) {
  const h1 = dom.match(/class="[^"]*article-title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i);
  name = smartTitle(h1 ? stripHtml(h1[1]) : `Artículo ${id}`);
}
const title = name;

console.log(`\n  Titular : ${title}\n`);

/* ------------------------- 3 · render PNG -------------------------- */
const html = (await readFile(path.join(DIR, 'post-article.html'), 'utf8'))
  .replace('{{IMG}}', dataUri)
  .replace('{{TITLE}}', highlight(title));

const tmp = path.join(CACHE, `render-${id}.html`);
await writeFile(tmp, html);

/* Verificación previa: comprueba en el DOM que la foto se ha cargado de
   verdad. Sin esto, un fallo de carga produce un PNG vacío sin avisar. */
const { stdout: checkDom } = await execFileAsync(CHROME, [
  '--headless=new', '--disable-gpu', '--virtual-time-budget=8000',
  '--dump-dom', 'file://' + tmp,
], { maxBuffer: 64 * 1024 * 1024 });

const photoAttr = (checkDom.match(/data-photo="([^"]+)"/) || [])[1] || '';
const [photoBox, photoNat] = photoAttr.split('@');
console.log(`  Foto  : ${photoBox} px en lienzo · original ${photoNat}`);

if (!photoNat || photoNat.startsWith('0x')) {
  console.error('❌ La foto del artículo no se cargó en el render.');
  process.exit(1);
}

const outPng = path.join(OUT, `post-article-${id}.png`);
await rm(outPng, { force: true });
await execFileAsync(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars',
  '--force-device-scale-factor=1',
  '--virtual-time-budget=8000',
  '--window-size=1080,1350',
  `--screenshot=${outPng}`,
  'file://' + tmp,
]);

const info = await stat(outPng).catch(() => null);
if (!info || info.size < 20000) {
  console.error('❌ El render falló o salió vacío.');
  process.exit(1);
}

/* --------------------------- 4 · caption --------------------------- */
const tags = ['#olasyvientos', '#surfespaña', '#surfnews', '#surf', '#surfing',
  '#olas', '#surfcommunity', '#deportesacuaticos', '#vidasurf', '#surfphotography'];

await writeFile(path.join(OUT, `post-article-${id}.txt`),
`URL: ${pageUrl}

--- CAPTION ---
${title}.

Te lo contamos entero en la web 👇
🔗 Enlace en la bio · olasyvientos.es

.
.
${tags.join(' ')}
`);

await rm(tmp, { force: true });
console.log(`✅ post-article-${id}.png  (${(info.size / 1024).toFixed(0)} KB)`);
console.log(`✅ post-article-${id}.txt  (caption)`);

