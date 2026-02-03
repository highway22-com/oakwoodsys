import { inject, Injectable, makeStateKey, PLATFORM_ID, signal, TransferState } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable, of } from 'rxjs';
import { map, catchError, tap, filter } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import {
  GET_CASE_STUDIES,
  GET_CASE_STUDY_BY_SLUG,
  GET_CMS_PAGE,
  type CaseStudy,
  type CaseStudyBy,
  type CaseStudiesResponse,
  type CaseStudyByResponse,
  type CmsPageContent,
  type CmsPageResponse,
} from '../api/graphql';

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

  getCaseStudies(): Observable<CaseStudy[]> {
    this.loading.set(true);
    this.errors.set(null);

    return this.apollo
      .watchQuery<CaseStudiesResponse>({
        query: GET_CASE_STUDIES,
        fetchPolicy: 'cache-and-network',
      })
      .valueChanges.pipe(
        map((result) => {
          const data = result.data as CaseStudiesResponse | undefined;
          const nodes: CaseStudy[] = (data?.caseStudies?.nodes ?? []) as CaseStudy[];
          this.caseStudies.set(nodes);
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

  /** Siempre pide el detalle por slug para tener overview, businessChallenge, solution, testimonial, etc. (la lista no incluye esos campos). */
  getCaseStudyBySlug(slug: string): Observable<CaseStudyBy | null> {
    const normalizedSlug = slug.trim();
    if (!normalizedSlug) return of(null);

    this.loading.set(true);
    this.errors.set(null);

    return this.apollo
      .watchQuery<CaseStudyByResponse>({
        query: GET_CASE_STUDY_BY_SLUG,
        variables: { slug: normalizedSlug },
        fetchPolicy: 'cache-and-network',
      })
      .valueChanges.pipe(
        filter((result) => !result.loading),
        map((result) => {
          const data = result.data as CaseStudyByResponse | undefined;
          const caseStudy: CaseStudyBy | null = data?.caseStudyBy ?? null;
          this.loading.set(false);
          return caseStudy;
        }),
        catchError((error) => {
          this.errors.set(error);
          this.loading.set(false);
          return of(null);
        })
      );
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
}
