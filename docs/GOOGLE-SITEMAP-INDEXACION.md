# Cómo hacer que Google vea y use el sitemap de oakwoodsys.com

El sitemap está publicado en **https://oakwoodsys.com/sitemap.xml** y referenciado en `robots.txt`, pero Google no lo usa hasta que lo envíes explícitamente en Search Console.

---

## Requisito previo: dominio verificado

Antes de enviar el sitemap, debes tener **oakwoodsys.com** verificado en Google Search Console. Si aún no lo has hecho, sigue los pasos en [GOOGLE-SEARCH-CONSOLE-VERIFICACION.md](./GOOGLE-SEARCH-CONSOLE-VERIFICACION.md).

---

## Pasos para enviar el sitemap a Google

### 1. Entrar en Google Search Console

1. Ve a [search.google.com/search-console](https://search.google.com/search-console)
2. Inicia sesión con la cuenta de Google que usaste para verificar el dominio
3. Selecciona la propiedad **oakwoodsys.com** (o `https://oakwoodsys.com` si usaste prefijo de URL)

### 2. Ir a la sección Sitemaps

1. En el menú lateral, haz clic en **Sitemaps** (o **Mapas del sitio**)
2. Si no ves el menú lateral, usa el icono de menú (☰) en la esquina superior izquierda

### 3. Enviar el sitemap

1. En el campo **"Añadir un sitemap nuevo"** / **"Add a new sitemap"**
2. Escribe solo: `sitemap.xml`
   - No uses la URL completa; Search Console la construye con el dominio de la propiedad
   - Si usas prefijo de URL, la URL final será: `https://oakwoodsys.com/sitemap.xml`
3. Haz clic en **Enviar** / **Submit**

### 4. Comprobar el estado

- **Correcto**: Estado "Correcto" / "Success" → Google ha recibido el sitemap
- **Pendiente**: "Pendiente" / "Couldn't fetch" → espera unas horas y vuelve a comprobar
- **Error**: Revisa que la URL sea accesible y que el XML sea válido

---

## Tiempos habituales

| Fase | Tiempo aproximado |
|------|--------------------|
| Google procesa el sitemap | Minutos a horas |
| Google rastrea las URLs | 1–7 días |
| Las páginas aparecen en resultados | 1–4 semanas (o más) |

---

## Si el sitemap no se procesa

### Comprobar que el sitemap es accesible

1. Abre en el navegador: [https://oakwoodsys.com/sitemap.xml](https://oakwoodsys.com/sitemap.xml)
2. Debe mostrarse el XML sin errores 404 o 500

### Comprobar robots.txt

1. Abre: [https://oakwoodsys.com/robots.txt](https://oakwoodsys.com/robots.txt)
2. Debe incluir la línea: `Sitemap: https://oakwoodsys.com/sitemap.xml`

### Validar el XML

- Usa [XML Sitemap Validator](https://www.xml-sitemaps.com/validate-xml-sitemap.html) con `https://oakwoodsys.com/sitemap.xml`
- O [Google Search Console → Sitemaps] y revisa si hay errores concretos

---

## Acelerar la indexación de páginas concretas

Para una URL específica:

1. En Search Console, usa **Inspección de URLs** (barra superior)
2. Pega la URL (ej: `https://oakwoodsys.com/services`)
3. Haz clic en **Solicitar indexación** / **Request indexing**

Solo puedes solicitar indexación de unas pocas URLs al día.

---

## Ver el estado de indexación

1. En Search Console, ve a **Cobertura** o **Pages** (según la versión)
2. Ahí verás:
   - Páginas indexadas
   - Páginas excluidas
   - Errores de rastreo

---

## Resumen rápido

1. Verifica el dominio en Search Console (si falta)
2. Ve a **Sitemaps** → escribe `sitemap.xml` → **Enviar**
3. Espera a que Google procese (minutos a horas)
4. Revisa el estado en **Sitemaps** y en **Cobertura** / **Pages**
5. Para URLs concretas, usa **Inspección de URLs** → **Solicitar indexación**

---

## URLs incluidas en tu sitemap actual

El sitemap incluye 22 URLs, entre ellas:

- `/` (home)
- `/about`, `/contact-us`, `/blog`, `/resources`, `/resources/case-studies`
- `/services` y sus subpáginas
- `/industries` y sus subpáginas
- `/structured-engagement`, `/carrers`, `/privacy-policy`

Si alguna ruta cambia, actualiza `public/sitemap.xml` y vuelve a desplegar el sitio.
