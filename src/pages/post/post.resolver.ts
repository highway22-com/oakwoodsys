import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { Apollo, gql } from 'apollo-angular';
import { catchError, map, of } from 'rxjs';

import { SeoMetaService } from '../../app/services/seo-meta.service';
import { humanizeSlug } from '../../app/utils/humanize-slug';
import { logError } from '../../app/utils/logger';

const POST_SEO_QUERY = gql`
  query GetPostSeo($slug: String!, $id: ID!) {
    genContent(id: $id, idType: SLUG) {
      title
      excerpt
      headTitle
      headDescription
      featuredImage {
        node {
          sourceUrl
          altText
        }
      }
    }
    postBy(slug: $slug) {
      title
      excerpt
      featuredImage {
        node {
          sourceUrl
          altText
        }
      }
    }
  }
`;

interface PostSeoRaw {
  title?: string;
  excerpt?: string;
  headTitle?: string;
  headDescription?: string;
  featuredImage?: { node?: { sourceUrl?: string; altText?: string } };
}

function absoluteImageUrl(src: string | undefined): string | undefined {
  if (!src) return undefined;
  return src.startsWith('http') ? src : `https://oakwoodsystemsgroup.com${src.startsWith('/') ? '' : '/'}${src}`;
}

/**
 * Shared resolver for blog/:slug and resources/case-studies/:slug (both use the `post`
 * component). Runs before route activation so SSR waits for real per-post SEO instead of
 * shipping index.html's site-wide defaults — post.ts's own updateSeoMeta only fires after
 * ngOnInit's Apollo query resolves, with nothing blocking route activation on it.
 * Which base path to canonicalize under comes from route data (isCaseStudy), set in app.routes.ts.
 */
export const postSeoResolver: ResolveFn<boolean> = (route: ActivatedRouteSnapshot) => {
  const apollo = inject(Apollo);
  const seoMeta = inject(SeoMetaService);
  const slug = route.paramMap.get('slug');
  const isCaseStudy = route.data['isCaseStudy'] === true;
  const basePath = isCaseStudy ? 'resources/case-studies' : 'blog';

  if (!slug) {
    return of(true);
  }

  const applyFallback = () => {
    seoMeta.updateMeta({
      title: `${humanizeSlug(slug)} | Oakwood Systems`,
      description: seoMeta.defaultDescription,
      canonicalPath: `/${basePath}/${slug}`,
      noindex: true,
    });
    return of(true);
  };

  return apollo
    .query<{ genContent?: PostSeoRaw | null; postBy?: PostSeoRaw | null }>({
      query: POST_SEO_QUERY,
      variables: { slug, id: slug },
      fetchPolicy: 'network-only',
    })
    .pipe(
      map(({ data }) => {
        const raw = data?.genContent ?? data?.postBy;
        if (!raw?.title) {
          throw new Error(`Post "${slug}" not found`);
        }
        const description =
          raw.headDescription?.trim() ||
          raw.excerpt?.replace(/<[^>]*>/g, '').replace(/\[&hellip;\]/g, '...').trim() ||
          seoMeta.defaultDescription;
        seoMeta.updateMeta({
          title: raw.headTitle?.trim() || `${raw.title} | Oakwood Systems`,
          description,
          canonicalPath: `/${basePath}/${slug}`,
          image: absoluteImageUrl(raw.featuredImage?.node?.sourceUrl),
          imageAlt: raw.featuredImage?.node?.altText ?? raw.title,
          ogType: 'article',
        });
        return true;
      }),
      catchError((error) => {
        logError(`[post] SEO resolver failed for slug "${slug}" (${basePath}):`, error);
        return applyFallback();
      }),
    );
};
