import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { GraphQLContentService } from '../../app/services/graphql-content.service';
import { SeoMetaService } from '../../app/services/seo-meta.service';
import { logError } from '../../app/utils/logger';

/** Known service slugs (mirrors services.ts SLUG_META) — a fixed, small set, unlike the
 *  open-ended CMS slugs on other routes, so an unresolved slug still gets real copy instead
 *  of a generic/noindex placeholder. */
const SLUG_META: Record<string, { title: string; description: string }> = {
  'data-ai-solutions': {
    title: 'Data & AI',
    description:
      'Unify, govern, and activate your data estate to deliver real AI outcomes with Microsoft Fabric, Synapse, Power BI, and Azure AI.',
  },
  'cloud-and-infrastructure': {
    title: 'Cloud & Infrastructure',
    description: 'Future-proof your business with scalable, secure, and optimized cloud solutions on Azure.',
  },
  'application-innovation': {
    title: 'Application Innovation',
    description: 'Modernize existing applications and build new digital solutions using cloud and AI.',
  },
  'high-performance-computing-hpc': {
    title: 'High Performance Computing (HPC)',
    description: 'Scale simulations, AI training, and PLM workloads with the power of Azure HPC.',
  },
  'modern-work': {
    title: 'Modern Work',
    description: 'Boost productivity, protect data, and improve employee experience with Microsoft 365 and Copilot.',
  },
  'managed-services': {
    title: 'Managed Services',
    description: 'Keep your Microsoft cloud running fast, secure, and cost effective with Oakwood.',
  },
};

interface ServiceSeoFields {
  title?: string;
  description?: string;
  backgroundImage?: string;
  mainDescription?: { text?: string };
  seo?: { headTitle?: string; headDescription?: string; ogImage?: string; keywords?: string };
}

/**
 * Runs before the services/:slug route activates. Applies the same slug->title/description
 * fallback services.ts already used synchronously (updateMetadataFromSlug), but from a
 * resolver so SSR actually waits for it, then refines it with the real CMS content.
 */
export const servicesSeoResolver: ResolveFn<boolean> = (route: ActivatedRouteSnapshot) => {
  const graphql = inject(GraphQLContentService);
  const seoMeta = inject(SeoMetaService);
  const slug = route.paramMap.get('slug');

  if (!slug) {
    return of(true);
  }

  const fallback = SLUG_META[slug];
  seoMeta.updateMeta({
    title: fallback ? `${fallback.title} | Oakwood Systems` : `${slug} | Oakwood Systems`,
    description: fallback?.description ?? 'Microsoft Solutions Partner for Azure, Data & AI, and Modern Work.',
    canonicalPath: `/services/${slug}`,
  });

  return graphql.getServicesContent().pipe(
    map((data) => {
      const service = data?.services?.[slug] as ServiceSeoFields | undefined;
      if (!service?.title) {
        throw new Error(`Service "${slug}" not found in CMS response`);
      }
      const s = service.seo;
      seoMeta.updateMeta({
        title: s?.headTitle?.trim() || `${service.title} | Oakwood Systems`,
        description: s?.headDescription?.trim() || service.mainDescription?.text || service.description || seoMeta.defaultDescription,
        canonicalPath: `/services/${slug}`,
        image: s?.ogImage?.trim() || service.backgroundImage,
        keywords: s?.keywords?.trim() || undefined,
      });
      return true;
    }),
    catchError((error) => {
      logError(`[services] SEO resolver failed for slug "${slug}":`, error);
      // Slug-based fallback above already applied — nothing further to do.
      return of(true);
    }),
  );
};
