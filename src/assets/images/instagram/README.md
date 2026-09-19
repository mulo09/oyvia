# Kit visual de Instagram — Olas y Vientos

Generación de publicaciones que replican el diseño de **olasyvientos.es**.
Los tokens no están inventados: salen de `src/styles.scss` y
`src/app/articlegrid/articlegrid.scss`.

**Hay dos formas de producir imágenes:**

| | Herramienta | Para qué |
|---|---|---|
| 🅰 | **`generate-post.mjs`** | Post real a partir de un artículo publicado. **Es lo que usarás a diario.** |
| 🅱 | **`render.sh`** | Exporta las plantillas de ejemplo (carrusel, reels, stories, perfil) como referencia de diseño. |

> **Son independientes.** `generate-post.mjs` **no** llama a `render.sh` ni al
> revés. Cada uno usa sus propias plantillas y lanza Chrome por su cuenta:
>
> - `generate-post.mjs` → solo `post-article.html`, con datos reales de la web
> - `render.sh` → el resto de plantillas, con contenido de ejemplo
>
> Para publicar el día a día **solo necesitas `generate-post.mjs`**.

---

## 1. Requisitos

- **Node.js 18+** (usa `fetch` nativo) — comprobar con `node -v`
- **Google Chrome** instalado (se usa en modo headless para renderizar)
- Conexión a internet (descarga el artículo y su foto)

Si Chrome no está en la ruta por defecto de macOS:

```bash
export CHROME="/ruta/a/Google Chrome"
```

---

# 🅰 Script principal: `generate-post.mjs`

Crea un post de Instagram **1080×1350** a partir de un artículo real de la web.

## 2.1 Uso básico

```bash
cd src/assets/images/instagram/templates
node generate-post.mjs 97
```

El `97` es el **id del artículo**, el mismo que aparece en la URL:
`https://www.olasyvientos.es/article/`**`97`**

## 2.2 Parámetros

| Parámetro | Obligatorio | Por defecto | Descripción |
|---|:---:|---|---|
| `<id>` | ✅ **Sí** | — | Id del artículo. Primer argumento, sin guiones. |
| `--title "..."` | No | Titular del artículo, acortado | Sustituye el titular por uno a medida. |

### Variables de entorno (opcionales)

| Variable | Por defecto | Para qué |
|---|---|---|
| `CHROME` | `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` | Ruta al binario de Chrome |
| `OYV_SITE` | `https://www.olasyvientos.es` | Apuntar a otro entorno (local, staging) |
| `OYV_API` | `$OYV_SITE/api/getarticles` | Endpoint del listado de artículos |

## 2.3 Ejemplos

**El caso normal** — todo automático:

```bash
node generate-post.mjs 97
```

**Titular a medida** — cuando el del artículo es demasiado largo o poco directo:

```bash
node generate-post.mjs 97 --title "España arranca fuerte en el Mundial Júnior"
```

**Contra un entorno local** — para probar sin tocar producción:

```bash
OYV_SITE=http://localhost:4200 node generate-post.mjs 97
```

**Chrome en otra ruta:**

```bash
CHROME="/Applications/Chromium.app/Contents/MacOS/Chromium" node generate-post.mjs 97
```

**Varios posts de golpe:**

```bash
for id in 84 97 71; do node generate-post.mjs $id; done
```

## 2.4 Archivos que produce

Para `node generate-post.mjs 97`:

| Archivo | Ubicación | Qué es |
|---|---|---|
| `post-article-97.png` | `src/assets/images/instagram/` | **La imagen a publicar.** 1080×1350 PNG |
| `post-article-97.txt` | `src/assets/images/instagram/` | URL del artículo + caption + hashtags, listo para pegar |
| `article-97.jpg` | `templates/.cache/` | Foto original descargada (caché, ignorada por git) |

> El nombre siempre es `post-article-<id>`, así que volver a lanzar el script
> **sobrescribe** la versión anterior de ese artículo.

## 2.5 Qué hace por dentro

1. **Renderiza** `https://www.olasyvientos.es/article/<id>` con Chrome headless.
   Hace falta porque el sitio es una **SPA**: el HTML que devuelve el servidor no
   contiene aún la foto.
2. **Extrae** el `src` del `<img>` que hay dentro de `.article-featured-image`.
3. **Sube la resolución**: cambia `/s800/` por `/s1600/` en la URL de Blogger,
   pasando de 800×600 a 1600×1200 para que no se vea pixelada al ampliar.
4. **Descarga** la foto, valida que sea una imagen real (comprueba los magic
   bytes) y la incrusta en **base64** para que el render no dependa de rutas.
5. **Obtiene el titular** de `/api/getarticles`, acortándolo por conectores
   (` con `, ` tras `, ` que `, `, `…) para que no entre el nombre kilométrico.
6. **Verifica** en el DOM que la foto se pintó de verdad; si no, **aborta** en
   lugar de generar un PNG equivocado en silencio.
7. **Captura** el PNG y escribe el `.txt` con el caption.

## 2.6 Composición de la pieza

```
┌─────────────────────────────┐
│ ▬▬▬▬ franja degradado 10px  │  ← firma de marca (#ff6b35 → #f7931e)
│                             │
│                             │
│        FOTO DEL ARTÍCULO    │  ← 880 px, object-fit: cover
│     (.article-featured-     │     velo negro degradado en la base
│         image)              │
│                             │
├─────────────────────────────┤
│ ▬▬▬                         │  ← regla naranja 120×7 px
│ TITULAR EN MAYÚSCULAS       │  ← blanco 900, tramo central en naranja
│                @olasyvientos│
└─────────────────────────────┘
```

**Sin badge, sin logo, sin fecha, sin entradilla y sin botón**: en Instagram
esos datos van en el caption, no quemados en el píxel.

El **auto-fit** ajusta el cuerpo del titular entre **34 y 92 px** hasta que
llena el bloque sin desbordar, sea cual sea su longitud.

## 2.7 Salida en consola

```
▶ Renderizando https://www.olasyvientos.es/article/97 para leer .article-featured-image
  ↳ src original : …/s800/sol-borelli.jpeg
  ↳ alta resolución: …/s1600/sol-borelli.jpeg
  ↳ descargada: 341 KB (image/jpeg)

  Titular : España firma un gran arranque en el ISA World Junior Surfing Championship 2026

  Foto  : 1076x880 px en lienzo · original 1600x1200
✅ post-article-97.png  (1124 KB)
✅ post-article-97.txt  (caption)
```

La línea **`Foto:`** es la comprobación clave: si el `original` fuese `0x0`,
la foto no cargó.

## 2.8 Errores frecuentes

| Mensaje | Causa | Solución |
|---|---|---|
| `No se encontró .article-featured-image` | El artículo no tiene imagen destacada, o cambió el maquetado | Añadir imagen al artículo, o revisar `article-detail.html` |
| `La foto del artículo no se cargó en el render` | La URL de la imagen dio error | Comprobar que la imagen abre en el navegador |
| `La URL no devolvió una imagen válida` | Blogger respondió HTML en vez de JPEG | El script ya reintenta con la URL original; si persiste, la imagen está caída |
| `spawn ... ENOENT` | No encuentra Chrome | Exportar `CHROME=` con la ruta correcta |

---

# 🅱 Plantillas de ejemplo: `render.sh`

Exporta a PNG las plantillas de referencia. **No usan datos reales**: son la
guía de diseño de cada formato.

```bash
cd src/assets/images/instagram/templates
./render.sh
```

Genera **20 PNG** de una pasada. No acepta parámetros.

## 3.1 Plantillas y archivos que produce cada una

| Plantilla | Genera | Tamaño |
|---|---|---|
| `carousel.html` | `carousel-01-portada.png`<br>`carousel-02-contexto.png`<br>`carousel-03-dato.png`<br>`carousel-04-claves.png`<br>`carousel-05-foto.png`<br>`carousel-06-cta.png` | 1080×1350 |
| `feed-post.html` | `post-a-noticia.png`<br>`post-b-parte-finde.png`<br>`post-c-spot-del-mes.png` | 1080×1350 |
| `reel.html` | `reel-00-zonas-seguras.png`<br>`reel-01-portada.png`<br>`reel-02-hook-subtitulos.png`<br>`reel-03-endcard.png` | 1080×1920 |
| `story.html` | `story-00-zonas-seguras.png`<br>`story-01-noticia-link.png`<br>`story-02-parte-viento.png`<br>`story-03-encuesta.png`<br>`story-04-ugc-countdown.png` | 1080×1920 |
| `grid-preview.html` | `grid-preview.png` | 1080×1560 |

## 3.2 Para qué sirve cada pieza

**Carrusel** — portada (hook) · contexto · dato gigante · 3 claves · foto con
crédito · CTA de cierre.

**Feed** — `post-a-noticia` (card de la web en 4:5) · `post-b-parte-finde`
(tabla de spots) · `post-c-spot-del-mes` (portada editorial).

**Reels** — portada del grid · frame con hook y subtítulos · end card ·
guía de zonas seguras.

**Stories** — noticia con sticker de link · parte de viento · encuesta ·
repost de comunidad con cuenta atrás · guía de zonas seguras.

**Perfil** — `grid-preview.png` simula el perfil entero (bio, destacados y 3×3).

## 3.3 Editar y previsualizar

- **Ver en el navegador**: abre el `.html` directamente; salen todos los slides en columna.
- **Aislar un slide**: `carousel.html?only=3`
- **Ver zonas seguras**: `reel.html?only=1&safe=1` · `story.html?only=2&safe=1`
- **Cambiar contenido**: edita el texto y el `src` de las imágenes en el HTML.
- **Cambiar la marca**: solo el bloque `:root` de cada plantilla.

---

## 4. Estructura de la carpeta

```
src/assets/images/instagram/
├── README.md                    este archivo
├── post-article-<id>.png        ← generado por generate-post.mjs
├── post-article-<id>.txt        ← caption del mismo
├── carousel-*.png               ← generados por render.sh
├── post-*.png                   ←
├── reel-*.png                   ←
├── story-*.png                  ←
├── grid-preview.png             ←
└── templates/
    ├── generate-post.mjs        ⭐ script principal
    ├── post-article.html        plantilla que usa generate-post.mjs
    ├── render.sh                exporta las plantillas de ejemplo
    ├── carousel.html
    ├── feed-post.html
    ├── reel.html
    ├── story.html
    ├── grid-preview.html
    ├── .gitignore               ignora .cache/
    └── .cache/                  fotos descargadas (no se versiona)
```

---

## 5. Tokens de diseño (idénticos a la web)

| Token | Valor | Origen en el código |
|---|---|---|
| Acento | `#ff6b35` | `--color-accent` |
| Fondo página | `#1a1a1a` | `body { background-color }` |
| Fondo tarjeta | `#000000` | `.event-feed-card` |
| Borde tarjeta | `#1f1f1f` (2px) | `.event-feed-card` |
| Texto | `#ffffff` | `.event-feed-card__title` |
| Texto secundario | `#cccccc` | `.event-feed-card__excerpt` |
| Separador "•" | `#555555` | `.event-feed-card__dot` |
| Degradado sunset | `linear-gradient(135deg,#ff6b35,#f7931e)` | `--gradient-sunset` |
| Velo sobre foto | `linear-gradient(to top,rgba(0,0,0,.85),transparent)` | `.event-feed-card--logo ::after` |
| Tipografía | **Roboto** 400 / 700 / 900 | `body { font-family }` |
| Titulares | `900` · `uppercase` · `letter-spacing:-1px` | `.overview__title` |
| Radio de borde | **0** (esquinas vivas) | `border-radius:0` |

> ⚠️ **Regla nº1: nada redondeado.** La web no usa `border-radius` en badges ni
> botones. Es la firma visual de la marca; mantenerla en Instagram.

> ⚠️ **Cuidado con la especificidad CSS.** En las plantillas conviven varias
> `<img>` dentro de `.media`. Usa selectores concretos (`.media > #photo`),
> nunca `.media img`, o una regla genérica acabará estirando el elemento
> equivocado.

---

## 6. Zonas seguras (crítico en 9:16)

La UI de Instagram tapa los bordes. **Nunca** pongas texto en estas franjas:

| Formato | Arriba | Abajo | Derecha |
|---|---|---|---|
| **Reels** | 250 px (cuenta/UI) | 420 px (caption, audio, CTA) | 180 px (like/comentar) |
| **Stories** | 250 px (barra de progreso) | 250 px (caja de respuesta) | — |

Las plantillas ya reservan esas franjas con `--safe-top`, `--safe-bottom` y
`--safe-right`.

**Regla adicional para Reels:** el grid del perfil recorta la portada a 4:5
centrado. El titular tiene que caber en esa franja central o se cortará.

---

## 7. Ritmo del grid

Una de cada tres piezas es una **tarjeta plana** (negra o naranja, solo
tipografía). Rompe el muro de fotos y hace que el perfil se lea como un
periódico deportivo, no como una galería. Ver `grid-preview.png`.

---

## 8. Checklist antes de publicar

- [ ] Titular en **mayúsculas**, máximo 7–8 palabras
- [ ] Crédito de foto en el caption (`📷 @autor`)
- [ ] Contraste suficiente del titular (el velo negro ayuda)
- [ ] Exportado a **1080×1350**, sin reescalar hacia arriba
- [ ] Caption copiado de `post-article-<id>.txt`
- [ ] El link de la bio lleva UTM (`?utm_source=instagram&utm_medium=social`)

### Extra para Reels

- [ ] Hook visible en el **primer segundo**
- [ ] Subtítulos quemados — el 80% lo ve en mudo
- [ ] Portada que funcione recortada a 4:5 en el grid
- [ ] End card de 1–2 s al final
- [ ] Nada de texto en los 420 px inferiores ni en los 180 px de la derecha

### Extra para Stories

- [ ] Sticker de link en el tercio central-bajo (zona del pulgar)
- [ ] Máximo 1 idea por story
- [ ] Alternar formatos: noticia → parte → encuesta → UGC
- [ ] Guardar en Destacados si es contenido perenne

---

## 9. Flujo recomendado del día a día

```bash
# 1. Publicas el artículo en la web y anotas su id
# 2. Generas la pieza
cd src/assets/images/instagram/templates
node generate-post.mjs 97

# 3. Revisas la imagen
open ../post-article-97.png

# 4. Copias el caption
cat ../post-article-97.txt

# 5. Subes a Instagram
```

Si el titular no convence, se repite el paso 2 con `--title "..."`.


