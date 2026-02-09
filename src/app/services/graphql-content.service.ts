import { inject, Injectable, makeStateKey, PLATFORM_ID, signal, TransferState } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable, of } from 'rxjs';
import { map, catchError, tap, filter, switchMap, take } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import {
  GET_GEN_CONTENTS_BY_CATEGORY,
  GET_GEN_CONTENTS_FOR_SEARCH,
  GET_CASE_STUDY_BY_SLUG,
  GET_GEN_CONTENT_BY_SLUG,
  GET_CASE_STUDY_DETAIL,
  GET_CMS_PAGE,
  type CaseStudy,
  type CaseStudyBy,
  type GenContentDetailNode,
  type GenContentListNode,
  type GenContentsByCategoryResponse,
  type CaseStudyByResponse,
  type GenContentBySlugResponse,
  type CaseStudyDetailResponse,
  type CmsPageContent,
  type CmsPageResponse,
  type RelatedCaseStudyNode,
  type SearchResultItem,
} from '../api/graphql';
import { combineLatest } from 'rxjs';

const CMS_PAGE_STATE_KEY = (slug: string) => makeStateKey<CmsPageContent | null>(`cms-page-${slug}`);

@Injectable({
  providedIn: 'root',
})
export class GraphQLContentService {
  private readonly apollo = inject(Apollo);
  private readonly transferState = inject(TransferState);
  private readonly platformId = inject(PLATFORM_ID);

  readonly caseStudies = signal<CaseStudy[]>([]);
  readonly loading = signal<boolean>(false);
  readonly errors = signal<Error | null>(null);

  /** Lista de posts de blog (genContent categoría "bloq"). Misma query que case studies, idType SLUG. */
  getBlogs(): Observable<GenContentListNode[]> {
    this.loading.set(true);
    this.errors.set(null);

    return this.apollo
      .watchQuery<GenContentsByCategoryResponse>({
        query: GET_GEN_CONTENTS_BY_CATEGORY,
        variables: { categoryId: 'bloq' },
        fetchPolicy: 'cache-and-network',
      })
      .valueChanges.pipe(
        filter((result) => !result.loading),
        map((result) => {
          const data = result.data as GenContentsByCategoryResponse | undefined;
          const nodes: GenContentListNode[] =
            data?.genContentCategory?.genContents?.nodes ?? [];
          this.loading.set(false);
          return nodes;
        }),
        catchError((error) => {
          this.errors.set(error);
          this.loading.set(false);
          return of([]);
        })
      );
  }

  /** Lista de case studies: misma lógica que bloq, filtro categoría "case-study". */
  getCaseStudies(): Observable<CaseStudy[]> {
    this.loading.set(true);
    this.errors.set(null);

    return this.apollo
      .watchQuery<GenContentsByCategoryResponse>({
        query: GET_GEN_CONTENTS_BY_CATEGORY,
        variables: { categoryId: 'case-study' },
        fetchPolicy: 'cache-and-network',
      })
      .valueChanges.pipe(
        filter((result) => !result.loading),
        map((result) => {
          const data = result.data as GenContentsByCategoryResponse | undefined;
          const nodes: GenContentListNode[] =
            data?.genContentCategory?.genContents?.nodes ?? [];
          const caseStudies: CaseStudy[] = nodes.map((n) =>
            this.genContentNodeToCaseStudy(n)
          );
          this.caseStudies.set(caseStudies);
          this.loading.set(false);
          return caseStudies;
        }),
        catchError((error) => {
          this.errors.set(error);
          this.loading.set(false);
          return of([]);
        })
      );
  }

  private genContentNodeToCaseStudy(n: GenContentListNode): CaseStudy {
    const categoryName =
      n.genContentCategories?.nodes?.[0]?.name ?? 'Case Study';
    const categorySlug =
      n.genContentCategories?.nodes?.[0]?.slug ?? 'case-study';
    return {
      id: n.id,
      title: n.title,
      slug: n.slug,
      date: n.date,
      excerpt: n.excerpt ?? '',
      featuredImage: n.featuredImage
        ? {
          node: {
            sourceUrl: n.featuredImage.node.sourceUrl,
            altText: n.featuredImage.node.altText ?? undefined,
          },
        }
        : undefined,
      caseStudyCategories: {
        nodes: [{ name: categoryName, slug: categorySlug }],
      },
      caseStudyDetails: {
        tags: n.tags ?? undefined,
        cardDescription: n.excerpt ?? undefined,
      },
      headTitle: n.headTitle ?? undefined,
      headDescription: n.headDescription ?? undefined,
      headCanonicalUrl: n.headCanonicalUrl ?? undefined,
      headGeoRegion: n.headGeoRegion ?? undefined,
      headGeoPlacename: n.headGeoPlacename ?? undefined,
      headGeoPosition: n.headGeoPosition ?? undefined,
      headJsonLdData: n.headJsonLdData ?? undefined,
    };
  }

  /** Detalle por slug: una sola petición con genContent + caseStudyBy (como GetBlogOrPost). Prioridad genContent. */
  getCaseStudyBySlug(slug: string): Observable<CaseStudyBy | null> {
    const normalizedSlug = slug.trim();
    if (!normalizedSlug) return of(null);

    this.loading.set(true);
    this.errors.set(null);

    return this.apollo
      .query<CaseStudyDetailResponse>({
        query: GET_CASE_STUDY_DETAIL,
        variables: { slug: normalizedSlug, id: normalizedSlug },
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((res) => {
          const data = res.data as CaseStudyDetailResponse | undefined;
          const gen = data?.genContent;
          const caseStudy = data?.caseStudyBy ?? null;
          this.loading.set(false);
          if (gen) return this.genContentToCaseStudyBy(gen, caseStudy);
          return caseStudy;
        }),
        catchError((err) => {
          this.errors.set(err);
          this.loading.set(false);
          return of(null);
        })
      );
  }

  /** Mapea un Gen Content (categoría case-study) al formato CaseStudyBy. Si genContent.relatedCaseStudies falla o está vacío, usa caseStudyBy.caseStudyDetails.relatedCaseStudies (mapeo por slug). */
  private genContentToCaseStudyBy(g: GenContentDetailNode, caseStudyBy?: CaseStudyBy | null): CaseStudyBy {
    const fromGen = g.relatedCaseStudies ?? [];
    const fromCaseStudy = caseStudyBy?.caseStudyDetails?.relatedCaseStudies?.nodes ?? [];
    const source = fromGen.length > 0 ? fromGen : fromCaseStudy;
    const related = source.map((r: NonNullable<GenContentDetailNode['relatedCaseStudies']>[number] | RelatedCaseStudyNode) => {
      const hasGenCategories = 'genContentCategories' in r && r.genContentCategories;
      return {
        id: r.id,
        title: r.title,
        slug: r.slug,
        date: r.date,
        excerpt: r.excerpt,
        featuredImage: r.featuredImage ? { node: { sourceUrl: r.featuredImage.node?.sourceUrl ?? '' } } : undefined,
        caseStudyCategories: hasGenCategories ? { nodes: (r as { genContentCategories: { nodes: Array<{ name: string }> } }).genContentCategories.nodes } : (r as RelatedCaseStudyNode).caseStudyCategories,
      };
    });
    return {
      id: g.id,
      title: g.title,
      slug: g.slug,
      date: g.date,
      content: g.content ?? '',
      excerpt: g.excerpt ?? '',
      featuredImage: g.featuredImage
        ? { node: { sourceUrl: g.featuredImage.node?.sourceUrl ?? '', altText: g.featuredImage.node?.altText ?? undefined } }
        : undefined,
      caseStudyCategories: g.genContentCategories ? { nodes: g.genContentCategories.nodes } : undefined,
      caseStudyDetails: {
        heroImage: g.featuredImage ? { node: { sourceUrl: g.featuredImage.node?.sourceUrl ?? '', altText: g.featuredImage.node?.altText ?? undefined } } : undefined,
        tags: g.tags ?? [],
        cardDescription: g.excerpt ?? undefined,
        overview: g.content ?? '',
        businessChallenge: '',
        solution: '',
        solutionImage: undefined,
        testimonial: undefined,
        relatedCaseStudies: { nodes: related },
        connectedServices: [],
      },
    };
  }

  /**
   * Contenido de una página CMS por slug (home, services, about-us, bloq, industries).
   * En servidor (SSR): hace la petición GraphQL y guarda el resultado en TransferState.
   * En cliente (hidratación): reutiliza los datos del TransferState y no vuelve a llamar a GraphQL.
   */
  getCmsPageBySlug(slug: string): Observable<CmsPageContent | null> {
    const normalizedSlug = slug.trim();
    if (!normalizedSlug) return of(null);

    const stateKey = CMS_PAGE_STATE_KEY(normalizedSlug);

    if (isPlatformBrowser(this.platformId)) {
      const cached = this.transferState.get(stateKey, null);
      if (cached !== null) {
        this.transferState.remove(stateKey);
        return of(cached);
      }
    }

    this.loading.set(true);
    this.errors.set(null);

    return this.apollo
      .watchQuery<CmsPageResponse>({
        query: GET_CMS_PAGE,
        variables: { slug: normalizedSlug },
        fetchPolicy: 'cache-and-network',
      })
      .valueChanges.pipe(
        filter((result) => !result.loading),
        map((result) => {
          const data = result.data as CmsPageResponse | undefined;
          const raw = data?.cmsPage?.content ?? null;
          this.loading.set(false);
          if (raw == null) return null;
          try {
            return JSON.parse(raw) as CmsPageContent;
          } catch {
            return null;
          }
        }),
        tap((parsed) => {
          if (!isPlatformBrowser(this.platformId) && parsed != null) {
            this.transferState.set(stateKey, parsed);
          }
        }),
        catchError((error) => {
          this.errors.set(error);
          this.loading.set(false);
          return of(null);
        })
      );
  }

  /**
   * Búsqueda rápida: solo blogs y case studies con título + excerpt (query ligera, sin content ni CMS).
   */
  getSearchableContent(): Observable<SearchResultItem[]> {
    return combineLatest({
      blogs: this.getGenContentsForSearch('bloq'),
      caseStudies: this.getGenContentsForSearch('case-study'),
    }).pipe(
      map(({ blogs, caseStudies }) => {
        const blogItems: SearchResultItem[] = (blogs ?? []).map((n) => ({
          type: 'blog' as const,
          id: n.id,
          title: n.title ?? '',
          slug: n.slug ?? '',
          link: `/blog/${n.slug ?? ''}`,
          snippet: this.stripHtml((n.excerpt ?? n.title ?? '').slice(0, 160)),
          image: n.featuredImage?.node?.sourceUrl ?? '',
        }));
        const caseItems: SearchResultItem[] = (caseStudies ?? []).map((n) => ({
          type: 'case-study' as const,
          id: n.id,
          title: n.title ?? '',
          slug: n.slug ?? '',
          link: `/resources/case-studies/${n.slug ?? ''}`,
          snippet: this.stripHtml((n.excerpt ?? n.title ?? '').slice(0, 160)),
          image: n.featuredImage?.node?.sourceUrl ?? '',
        }));
        return [...blogItems, ...caseItems];
      }),
      catchError(() => of([]))
    );
  }

  private getGenContentsForSearch(categoryId: string): Observable<GenContentListNode[]> {
    return this.apollo
      .watchQuery<GenContentsByCategoryResponse>({
        query: GET_GEN_CONTENTS_FOR_SEARCH,
        variables: { categoryId },
        fetchPolicy: 'cache-and-network',
      })
      .valueChanges.pipe(
        filter((result) => !result.loading),
        map((result) => {
          const data = result.data as GenContentsByCategoryResponse | undefined;
          return data?.genContentCategory?.genContents?.nodes ?? [];
        }),
        catchError(() => of([]))
      );
  }

  private stripHtml(html: string): string {
    if (typeof document === 'undefined') {
      return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }
    const div = document.createElement('div');
    div.innerHTML = html;
    return (div.textContent ?? div.innerText ?? '').replace(/\s+/g, ' ').trim();
  }
}
