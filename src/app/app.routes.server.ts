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
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return [
        { slug: 'data-ai-solutions' },
        { slug: 'cloud-and-infrastructure' },
        { slug: 'application-innovation' },
        { slug: 'high-performance-computing-hpc' },
        { slug: 'modern-work' },
        { slug: 'managed-services' },
      ];
    },
  },
  {
    path: 'structured-engagement/:slug',
    renderMode: RenderMode.Server,
  },
  {
    path: 'edit',
    renderMode: RenderMode.Server,
  },
  {
    path: 'edit/:slug',
    renderMode: RenderMode.Server,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
/**
/services/data-ai-solutions
/services/cloud-and-infrastructure
/services/application-innovation
/services/high-performance-computing-hpc
/services/modern-work
/services/managed-services
 */