import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Rutas dinámicas (blog, case-studies, etc.) usan SSR para que los crawlers
 * reciban HTML con meta OG correctos. Netlify ejecuta el servidor Angular
 * para estas rutas (antes del redirect /* → index.html).
 */
export const serverRoutes: ServerRoute[] = [
  {
    path: 'blog/:slug',
    renderMode: RenderMode.Server,
  },
  {
    path: 'resources/case-studies/:slug',
    renderMode: RenderMode.Server,
  },
  {
    path: 'industries/:slug',
    renderMode: RenderMode.Server,
  },
  {
    path: 'services/:slug',
    renderMode: RenderMode.Server,
  },
  {
    path: 'structured-engagement/:slug',
    renderMode: RenderMode.Server,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
