import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Routes with parameters should use Server rendering (SSR) instead of Prerender
  {
    path: 'blog/:slug',
    renderMode: RenderMode.Server
  },
  {
    path: 'resources/case-studies/:slug',
    renderMode: RenderMode.Server
  },
  {
    path: 'industries/:slug',
    renderMode: RenderMode.Server
  },
  {
    path: 'services/:slug',
    renderMode: RenderMode.Server
  },
  // Static routes can use Prerender
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
