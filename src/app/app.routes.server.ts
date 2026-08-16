import { PrerenderFallback, RenderMode, ServerRoute } from '@angular/ssr';
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

function getWordPressPageSlugs(): string[] {
  try {
    const path = join(process.cwd(), 'wp-page-slugs.json');
    const raw = readFileSync(path, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data?.slugs) ? data.slugs.filter(Boolean) : [];
  } catch {
    return [];
  }
}

/**
 * Rutas dinámicas prerenderizadas o SSR en runtime (Netlify).
 * Las páginas WordPress de un segmento (`:wpPageSlug`) se prerenderizan en build.
 */
export const serverRoutes: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Server,
  },
  {
    path: 'home',
    renderMode: RenderMode.Server,
  },
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
    path: 'resources/events',
    renderMode: RenderMode.Server,
  },
  {
    path: 'resources/events/:slug',
    renderMode: RenderMode.Server,
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
    path: ':wpPageSlug',
    renderMode: RenderMode.Prerender,
    fallback: PrerenderFallback.Server,
    getPrerenderParams: async () => getWordPressPageSlugs().map((slug) => ({ wpPageSlug: slug })),
  },
  {
    path: '**',
    renderMode: RenderMode.Server,
  },
];
