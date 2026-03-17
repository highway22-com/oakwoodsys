import { RenderMode, ServerRoute } from '@angular/ssr';
import { readFileSync } from 'fs';
import { join } from 'path';

function getPrerenderSlugs(): { blog: string[]; caseStudy: string[] } {
  try {
    const path = join(process.cwd(), 'prerender-slugs.json');
    const raw = readFileSync(path, 'utf8');
    const data = JSON.parse(raw);
    return {
      blog: Array.isArray(data?.blog) ? data.blog : [],
      caseStudy: Array.isArray(data?.caseStudy) ? data.caseStudy : [],
    };
  } catch {
    return { blog: [], caseStudy: [] };
  }
}

/**
 * Rutas dinámicas (blog, case-studies, etc.) prerenderizadas o SSR.
 * Netlify ejecuta el servidor Angular para estas rutas.
 */
export const serverRoutes: ServerRoute[] = [
  {
    path: 'blog/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => getPrerenderSlugs().blog.map((slug) => ({ slug })),
  },
  {
    path: 'resources/case-studies/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => getPrerenderSlugs().caseStudy.map((slug) => ({ slug })),
  },
  {
    path: 'industries/:slug',
    renderMode: RenderMode.Server,
  },
  {
    path: 'services/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () =>
      ['data-ai-solutions', 'cloud-and-infrastructure', 'application-innovation', 'high-performance-computing-hpc', 'modern-work', 'managed-services'].map((slug) => ({ slug })),
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