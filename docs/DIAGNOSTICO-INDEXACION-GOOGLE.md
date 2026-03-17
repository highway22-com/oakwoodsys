# Diagnóstico: Indexación en Google (oakwoodsys.com)

Este documento explica por qué tu sitio puede no estar indexándose correctamente y qué se ha corregido.

---

## Resumen ejecutivo

| Problema | Causa | Estado |
|----------|-------|--------|
| Favicon no aparece en Google | Archivo `favicon.svg` no existía; tipo MIME incorrecto | ✅ Corregido |
| Logo no indexado en Knowledge Panel | JSON-LD apuntaba a `oakwoodsystemsgroup.com` (dominio distinto) | ✅ Corregido |
| Sitemap "Success" pero páginas no indexadas | Comportamiento normal: el sitemap es solo una sugerencia | Ver acciones |
| Sitemaps mezclados (www vs non-www) | `sitemap_index.xml` con www puede generar confusión | Ver acciones |

---

## 1. Favicon

### Problema
- `index.html` referenciaba `favicon.svg` pero el archivo **no existía** en el proyecto.
- Tipo MIME incorrecto: `image/svg` → debe ser `image/svg+xml`.
- Google necesita que el favicon sea accesible (HTTP 200) y cumpla requisitos (48×48 mínimo, proporción 1:1).

### Correcciones aplicadas
- Creado `public/favicon.svg` con diseño simple (círculo "O" para Oakwood).
- Corregido el tipo MIME en `index.html`: `type="image/svg+xml"`.

### Recomendación
Si tienes el logo oficial de Oakwood en PNG/SVG, reemplaza `public/favicon.svg` por tu versión. Google recomienda:
- Tamaño mínimo: 48×48 px
- Proporción 1:1 (cuadrado)
- Formato: SVG, ICO o PNG

---

## 2. Logo en JSON-LD (Knowledge Panel)

### Problema
El logo en el schema `Organization` apuntaba a:
```
https://oakwoodsystemsgroup.com/wp-content/uploads/2018/06/cropped-logo2-2.png
```
Google prefiere que el logo esté en el **mismo dominio** que el sitio para el Knowledge Panel.

### Corrección aplicada
Actualizado a:
```
https://oakwoodsys.com/assets/og-image.png
```

### Recomendación
Si tienes el logo de Oakwood en alta resolución, súbelo a `public/assets/` (ej: `logo-oakwood.png`) y actualiza la URL en el JSON-LD de `src/index.html`.

---

## 3. Sitemap: "Success" pero páginas no indexadas

### Comportamiento de Google
Google indica que **enviar un sitemap es solo una sugerencia**, no garantiza que las URLs se rastreen o indexen.

### Motivos habituales por los que no se indexa
1. **Prioridad de rastreo**: Google decide qué páginas rastrear primero.
2. **Enlaces internos débiles**: Páginas poco enlazadas se priorizan menos.
3. **Contenido duplicado o de bajo valor**: Google puede decidir no indexar.
4. **Bloqueos técnicos**: `noindex`, `robots.txt`, cabeceras HTTP.
5. **Tiempo**: Puede tardar días o semanas en indexar.

### Acciones recomendadas
1. **Search Console → Informe de indexación (Pages)**  
   Revisa el motivo por el que cada URL no está indexada.
2. **Inspección de URLs**  
   Para URLs importantes: pega la URL → "Solicitar indexación".
3. **Enlaces internos**  
   Asegura que las páginas clave estén enlazadas desde la home y el menú.
4. **Paciencia**  
   Tras correcciones, espera 1–4 semanas.

---

## 4. Sitemaps mezclados

### Situación actual
En Search Console aparecen:
- `https://oakwoodsys.com/sitemap.xml` (23 páginas) – Angular/Netlify ✅
- `https://oakwoodsys.com/page-sitemap.xml` (117 páginas) – WordPress
- `https://oakwoodsys.com/post-sitemap.xml` (60 páginas) – WordPress
- `https://www.oakwoodsys.com/sitemap_index.xml` – posible sitemap de WordPress

### Posibles problemas
- `www.oakwoodsys.com` redirige a `oakwoodsys.com` (Netlify).
- `sitemap_index.xml`, `page-sitemap.xml` y `post-sitemap.xml` parecen de WordPress (oakwoodsystemsgroup.com).
- Si esos sitemaps no se sirven desde oakwoodsys.com, Google puede recibir errores o URLs incorrectas.

### Acciones recomendadas
1. **Unificar propiedad en Search Console**  
   Usa solo `https://oakwoodsys.com` (sin www) como propiedad principal.
2. **Eliminar sitemaps incorrectos**  
   En Search Console → Sitemaps, elimina `sitemap_index.xml` si no existe en oakwoodsys.com.
3. **Mantener solo el sitemap de Angular**  
   `https://oakwoodsys.com/sitemap.xml` es el sitemap correcto para el sitio en Netlify.

---

## 5. Verificaciones técnicas

### robots.txt
- URL: https://oakwoodsys.com/robots.txt
- Debe incluir: `Sitemap: https://oakwoodsys.com/sitemap.xml`
- Estado actual: ✅ Correcto

### Sitemap
- URL: https://oakwoodsys.com/sitemap.xml
- Debe devolver XML válido con las URLs del sitio.
- Si devuelve 500 o HTML, revisa el despliegue en Netlify.

### Favicon
- URL: https://oakwoodsys.com/favicon.svg
- Debe devolver el SVG (HTTP 200).
- Tras el despliegue, comprueba que sea accesible.

---

## 6. Acelerar la actualización del favicon en Google

Google cachea los favicons de forma agresiva. Para forzar una actualización:

1. Visita: `https://www.google.com/s2/favicons?domain=oakwoodsys.com&sz=512`
2. Visita: `https://www.google.com/s2/favicons?domain=oakwoodsys.com&sz=1024`
3. En Search Console: Inspección de URLs → `https://oakwoodsys.com` → Solicitar indexación

Esto puede hacer que Google actualice el favicon en horas en lugar de semanas.

---

## Resumen de cambios en el código

| Archivo | Cambio |
|---------|--------|
| `public/favicon.svg` | Creado (no existía) |
| `src/index.html` | `type="image/svg"` → `type="image/svg+xml"` |
| `src/index.html` | Logo JSON-LD: `oakwoodsystemsgroup.com` → `oakwoodsys.com/assets/og-image.png` |

---

## Próximos pasos

1. Desplegar los cambios a Netlify.
2. Verificar que `https://oakwoodsys.com/favicon.svg` devuelva 200.
3. En Search Console: eliminar sitemaps incorrectos y mantener solo `sitemap.xml`.
4. Revisar el informe de indexación para ver motivos de "no indexado".
5. Solicitar indexación de la home y páginas clave.
6. Esperar 1–4 semanas para ver mejoras.
