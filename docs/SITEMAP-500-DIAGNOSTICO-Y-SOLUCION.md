# Diagnóstico y solución: sitemap.xml devolvía 500

## Problema detectado

Al verificar las URLs en vivo (marzo 2025):

- **robots.txt**: ✅ Funciona correctamente en https://oakwoodsys.com/robots.txt
- **sitemap.xml**: ❌ Devolvía **500 Internal Server Error** en https://oakwoodsys.com/sitemap.xml

## Causa

El sitio usa **Angular SSR** con `@netlify/angular-runtime`. Las peticiones pasan por el handler del servidor (`src/server.ts`) antes de llegar a los archivos estáticos. Cuando Angular intentaba procesar `/sitemap.xml` como una ruta de la SPA, fallaba y devolvía 500.

## Solución aplicada

Se añadió manejo explícito de `sitemap.xml` y `robots.txt` en `src/server.ts`, **antes** de que la petición llegue al motor de Angular. El servidor ahora:

1. Detecta peticiones a `/sitemap.xml` o `/robots.txt`
2. Lee el archivo desde el build (`dist/oaw/browser`) o desde `public`
3. Devuelve el contenido con el `Content-Type` correcto (`application/xml` o `text/plain`)

## Próximos pasos

1. **Desplegar** el cambio a Netlify (push a la rama principal o deploy manual)
2. **Verificar** que el sitemap responde correctamente:
   - Abre https://oakwoodsys.com/sitemap.xml en el navegador
   - Debe mostrarse el XML sin errores
3. **Enviar el sitemap a Google** (si aún no lo has hecho):
   - Google Search Console → Sitemaps → Añadir `sitemap.xml` → Enviar
4. **Ping directo** (opcional): https://www.google.com/ping?sitemap=https://oakwoodsys.com/sitemap.xml

## Referencia: robots.txt correcto

Tu `public/robots.txt` ya incluye la referencia al sitemap:

```
User-agent: *
Allow: /
Disallow: /admin/
Sitemap: https://oakwoodsys.com/sitemap.xml
```

## Confusión de dominios (oakwoodfence.com)

Gemini mencionó **oakwoodfence.com** como sitio relacionado. Ese es un dominio distinto. Tu sitio principal es **oakwoodsys.com** (Angular en Netlify). No hay que hacer nada con oakwoodfence.com.
