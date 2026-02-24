import { inject, Injectable, makeStateKey, PLATFORM_ID, signal, TransferState } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Apollo } from 'apollo-angular';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError, tap, filter, switchMap, take, shareReplay } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import {
  GET_GEN_CONTENTS_BY_CATEGORY,
  GET_GEN_CONTENTS_BY_CATEGORY_PAGINATED,
  GET_GEN_CONTENTS_BY_TAG_AND_CATEGORY,
  GET_GEN_CONTENTS_FOR_SEARCH,
  GET_CASE_STUDY_BY_SLUG,
  GET_GEN_CONTENT_BY_SLUG,
  GET_CASE_STUDY_DETAIL,
  GET_CMS_PAGE,
  GET_GEN_CONTENT_TAXONOMIES,
  type CaseStudy,
  type CaseStudyBy,
  type GenContentDetailNode,
  type GenContentListNode,
  type GenContentsByCategoryPaginatedResponse,
  type GenContentsByCategoryResponse,
  type GenContentsByTagAndCategoryResponse,
  type CaseStudyByResponse,
  type GenContentBySlugResponse,
  type CaseStudyDetailResponse,
  type CmsPageContent,
  type CmsPageResponse,
  type CmsSection,
  type GenContentTaxonomiesResponse,
  type GenContentTaxonomyTerm,
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
  readonly blogs = signal<GenContentListNode[]>([]);
  readonly loading = signal<boolean>(false);
  readonly errors = signal<Error | null>(null);

  /** Observables cacheados: primera suscripción dispara la carga, las siguientes reutilizan el resultado. */
  private blogs$ = this.createBlogsStream();
  private caseStudies$ = this.createCaseStudiesStream();

  /** Categorías y tags de Gen Content (cargados al inicio). Acceso global. */
  readonly genContentCategories = signal<GenContentTaxonomyTerm[]>([]);
  readonly genContentTags = signal<GenContentTaxonomyTerm[]>([]);

  /** Contenido CMS de home (cargado en APP_INITIALIZER). Observable para suscribirse. */
  private readonly homePageContentSubject = new BehaviorSubject<CmsPageContent | null>(null);
  readonly homePageContent$: Observable<CmsPageContent | null> = this.homePageContentSubject.asObservable();

  /** Carga home en APP_INITIALIZER. Acceso vía homePageContent$ o homePageContentSubject.value. */
  loadHomePageContent(): Promise<void> {
    return firstValueFrom(this.getCmsPageBySlug('home')).then((data) => {
      this.homePageContentSubject.next(data);
    }).catch(() => {
      this.homePageContentSubject.next(null);
    });
  }

  /** Lista paginada por categoría (blog o case-study). Apollo cache-and-network. */
  getGenContentsPaginated(
    categoryId: 'blog' | 'case-study',
    first: number,
    after: string | null
  ): Observable<{
    nodes: GenContentListNode[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  }> {
    return this.apollo
      .watchQuery<GenContentsByCategoryPaginatedResponse>({
        query: GET_GEN_CONTENTS_BY_CATEGORY_PAGINATED,
        variables: { categoryId, first, after },
        fetchPolicy: 'cache-and-network',
      })
      .valueChanges.pipe(
        filter((result) => !result.loading),
        map((result) => {
          const data = result.data as GenContentsByCategoryPaginatedResponse | undefined;
          const conn = data?.genContentCategory?.genContents;
          const nodes = conn?.nodes ?? [];
          const pageInfo = conn?.pageInfo ?? {};
          return {
            nodes,
            pageInfo: {
              hasNextPage: pageInfo.hasNextPage ?? false,
              endCursor: pageInfo.endCursor ?? null,
            },
          };
        }),
        catchError(() =>
          of({ nodes: [], pageInfo: { hasNextPage: false, endCursor: null } })
        )
      );
  }

  /** Prefetch: carga primera página de blogs en background. Apollo cachea; al navegar a /blog se usa caché. */
  prefetchBlogs(): void {
    this.getGenContentsPaginated('blog', 10, null).subscribe();
  }

  /** Stream de blogs (cache compartido). Primera suscripción carga; siguientes reutilizan. */
  private createBlogsStream(): Observable<GenContentListNode[]> {
    return this.apollo
      .watchQuery<GenContentsByCategoryResponse>({
        query: GET_GEN_CONTENTS_BY_CATEGORY,
        variables: { categoryId: 'blog' },
        fetchPolicy: 'cache-and-network',
      })
      .valueChanges.pipe(
        filter((result) => !result.loading),
        map((result) => {
          const data = result.data as GenContentsByCategoryResponse | undefined;
          const nodes: GenContentListNode[] =
            data?.genContentCategory?.genContents?.nodes ?? [];
          this.blogs.set(nodes);
          this.loading.set(false);
          return nodes;
        }),
        catchError((error) => {
          this.errors.set(error);
          this.loading.set(false);
          return of([]);
        }),
        shareReplay(1)
      );
  }

  /** Lista de posts de blog (genContent categoría "blog"). Usa cache compartido. */
  getBlogs(): Observable<GenContentListNode[]> {
    this.loading.set(true);
    this.errors.set(null);
    return this.blogs$;
  }

  /**
   * Lista de Gen Content por tag y categoría (blog o case-study).
   * Útil para related posts por primaryTag.
   */
  getGenContentsByTagAndCategory(
    tagSlug: string,
    categorySlug: 'blog' | 'case-study',
    limit = 6
  ): Observable<GenContentListNode[]> {
    if (!tagSlug?.trim()) return of([]);
    return this.apollo
      .query<GenContentsByTagAndCategoryResponse>({
        query: GET_GEN_CONTENTS_BY_TAG_AND_CATEGORY,
        variables: { tagSlug: tagSlug.trim(), categorySlug },
        fetchPolicy: 'cache-first',
      })
      .pipe(
        map((result) => {
          const nodes = (result.data as GenContentsByTagAndCategoryResponse)?.genContents?.nodes ?? [];
          return nodes.slice(0, limit);
        }),
        catchError(() => of([]))
      );
  }

  /**
   * Slugs de los primeros N case studies filtrados por tag (primary tag).
   * Útil para featured case studies en páginas de servicio (ej. servicio "manufacturing" → case studies con tag manufacturing).
   */
  getCaseStudySlugsByTag(tagSlug: string, limit = 2): Observable<string[]> {
    if (!tagSlug?.trim()) return of([]);
    return this.apollo
      .query<GenContentsByTagAndCategoryResponse>({
        query: GET_GEN_CONTENTS_BY_TAG_AND_CATEGORY,
        variables: { tagSlug: tagSlug.trim(), categorySlug: 'case-study' },
        fetchPolicy: 'cache-first',
      })
      .pipe(
        map((result) => {
          const nodes = (result.data as GenContentsByTagAndCategoryResponse)?.genContents?.nodes ?? [];
          return nodes
            .slice(0, limit)
            .map((n) => n.slug)
            .filter((s): s is string => !!s);
        }),
        catchError(() => of([]))
      );
  }

  /** Stream de case studies (cache compartido). Primera suscripción carga; siguientes reutilizan. */
  private createCaseStudiesStream(): Observable<CaseStudy[]> {
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
        }),
        shareReplay(1)
      );
  }

  /** Lista de case studies. Usa cache compartido. */
  getCaseStudies(): Observable<CaseStudy[]> {
    this.loading.set(true);
    this.errors.set(null);
    return this.caseStudies$;
  }

  private genContentNodeToCaseStudy(n: GenContentListNode): CaseStudy {
    const rawNodes = n.genContentCategories?.nodes ?? [];
    const categoryNodes =
      rawNodes.length > 0
        ? rawNodes.map((c) => ({ name: c.name, slug: c.slug }))
        : [{ name: 'Case Study', slug: 'case-study' }];
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
        nodes: categoryNodes,
      },
      genContentTags: n.genContentTags
        ? { nodes: [...(n.genContentTags.nodes ?? [])] }
        : undefined,
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
   * Contenido de una página CMS por slug (home, services, about-us, blog, industries).
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
   * Service lines para sidebar/filtros (blogs, etc.). Obtiene desde CMS: home (services section) → footer (links.services).
   */
  getServiceLines(): Observable<{ label: string; link: string }[]> {
    return this.getCmsPageBySlug('home').pipe(
      switchMap((home) => {
        const fromHome = this.extractServiceLinesFromCms(home);
        if (fromHome.length > 0) return of(fromHome);
        return this.getCmsPageBySlug('footer').pipe(
          map((footer) => this.extractServiceLinesFromFooter(footer)),
          catchError(() => of([]))
        );
      }),
      catchError(() =>
        this.getCmsPageBySlug('footer').pipe(
          map((footer) => this.extractServiceLinesFromFooter(footer)),
          catchError(() => of([]))
        )
      )
    );
  }

  private extractServiceLinesFromCms(data: CmsPageContent | null): { label: string; link: string }[] {
    if (!data?.sections) return [];
    const section = data.sections.find((s) => s.type === 'services' && s.services?.length);
    if (!section?.services) return [];
    return section.services
      .map((s) => ({ label: s.title ?? '', link: s.link ?? '' }))
      .filter((x) => x.label && x.link);
  }

  private extractServiceLinesFromFooter(
    data: CmsPageContent | { type?: string; sections?: Array<{ type?: string; links?: { services?: Array<{ text?: string; routerLink?: string }> } }>; links?: { services?: Array<{ text?: string; routerLink?: string }> } } | null
  ): { label: string; link: string }[] {
    if (!data) return [];
    const d = data as { type?: string; sections?: Array<{ type?: string; links?: { services?: Array<{ text?: string; routerLink?: string }> } }>; links?: { services?: Array<{ text?: string; routerLink?: string }> } };
    let services = d.links?.services ?? [];
    if (services.length === 0 && d.sections) {
      const footerSection = d.sections.find((s) => s.type === 'footer');
      services = (footerSection as { links?: { services?: Array<{ text?: string; routerLink?: string }> } })?.links?.services ?? [];
    }
    return services
      .map((s) => ({ label: s.text ?? '', link: s.routerLink ?? '' }))
      .filter((x) => x.label && x.link);
  }

  /**
   * Categorías y tags de Gen Content desde GraphQL (gen_content_category, gen_content_tag).
   * Para filtros, sidebars, etc.
   */
  getGenContentTaxonomies(): Observable<{
    categories: GenContentTaxonomyTerm[];
    tags: GenContentTaxonomyTerm[];
  }> {
    return this.apollo
      .query<GenContentTaxonomiesResponse>({
        query: GET_GEN_CONTENT_TAXONOMIES,
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((result) => {
          const data = result.data as GenContentTaxonomiesResponse | undefined;
          return {
            categories: data?.genContentCategoriesList?.nodes ?? [],
            tags: data?.genContentTagsList?.nodes ?? [],
          };
        }),
        catchError(() =>
          of({
            categories: [],
            tags: [],
          })
        )
      );
  }

  /**
   * Carga categorías y tags al inicio y los guarda en signals.
   * Se llama desde APP_INITIALIZER. Acceso vía genContentCategories() y genContentTags().
   */
  loadGenContentTaxonomies(): Promise<void> {
    return firstValueFrom(this.getGenContentTaxonomies())
      .then(({ categories, tags }) => {
        this.genContentCategories.set(categories);
        this.genContentTags.set(tags);
      })
      .catch(() => {
        this.genContentCategories.set([]);
        this.genContentTags.set([]);
      });
  }

  /**
   * Búsqueda rápida: solo blogs y case studies con título + excerpt (query ligera, sin content ni CMS).
   */
  getSearchableContent(): Observable<SearchResultItem[]> {
    return combineLatest({
      blogs: this.getGenContentsForSearch('blog'),
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
