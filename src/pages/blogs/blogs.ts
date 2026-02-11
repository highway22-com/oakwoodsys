import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Apollo } from 'apollo-angular';
import {
  GET_GEN_CONTENTS_BY_CATEGORY,
  GET_GEN_CONTENTS_BY_CATEGORY_PAGINATED,
} from '../../app/api/graphql';
import { PageHeroComponent, type PageHeroBreadcrumb } from '../../shared/page-hero/page-hero.component';
import { ButtonPrimaryComponent } from "../../shared/button-primary/button-primary.component";
import { CtaSectionComponent } from '../../shared/cta-section/cta-section.component';
import { BlogCardComponent } from '../../shared/blog-card/blog-card.component';
import { readingTimeMinutes } from '../../app/utils/reading-time.util';

interface PostAuthor {
  node: {
    email: string;
    firstName: string;
    id: string;
  };
}

export interface PersonSocialLink {
  platform: string;
  url: string;
}

export interface AuthorPerson {
  id: string;
  name: string | null;
  firstName: string | null;
  position: string | null;
  picture: string | null;
  socialLinks: PersonSocialLink[];
}

export interface FeaturedImageNode {
  sourceUrl: string;
  altText: string | null;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  date: string;
  author: PostAuthor;
  tags: string[];
  primaryTag: string | null;
  authorPerson: AuthorPerson | null;
  featuredImage: { node: FeaturedImageNode } | null;
  sanitizedContent?: SafeHtml;
  sanitizedExcerpt?: SafeHtml;
  /** Head (Gen Content ACF oakwood_* — no chocar con otros plugins SEO). */
  headTitle?: string | null;
  headDescription?: string | null;
  headCanonicalUrl?: string | null;
  headGeoRegion?: string | null;
  headGeoPlacename?: string | null;
  headGeoPosition?: string | null;
  headJsonLdData?: string | null;
}

const PAGE_SIZE = 10;

@Component({
  selector: 'app-bloq',
  imports: [CommonModule, PageHeroComponent, ButtonPrimaryComponent, CtaSectionComponent, BlogCardComponent],
  templateUrl: './blogs.html',
  styleUrl: './blogs.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Blogs implements OnInit {
  private readonly apollo = inject(Apollo);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);

  readonly blogHeroBreadcrumbs: PageHeroBreadcrumb[] = [
    { label: 'Home', routerLink: '/' },
    { label: 'Resources' },
    { label: 'IT Blog' },
  ];

  readonly serviceLines: { label: string; link: string }[] = [
    { label: 'Data Center', link: '/services/cloud-and-infrastructure' },
    { label: 'Application Innovation', link: '/services/application-innovation' },
    { label: 'High-Performance Computing (HPC)', link: '/services/high-performance-computing' },
    { label: 'Modern Work', link: '/services/modern-work' },
    { label: 'Managed Services', link: '/services/managed-services' },
  ];

  /** Elemento centinela al final de la lista para activar "cargar más" al hacer scroll. */
  readonly scrollSentinel = viewChild<ElementRef<HTMLElement>>('scrollSentinel');

  readonly posts = signal<{ nodes: Post[] } | null>(null);
  /** En modo fallback (sin cursor), cuántos nodos mostrar; 0 = mostrar todos. */
  private displayCount = signal(0);
  /** Lista que se muestra: o bien posts().nodes o slice(0, displayCount()) en fallback. */
  readonly displayedNodes = computed(() => {
    const p = this.posts();
    const n = p?.nodes ?? [];
    const count = this.displayCount();
    return count > 0 ? n.slice(0, count) : n;
  });
  readonly loading = signal(true);
  readonly loadingMore = signal(false);
  readonly error = signal<any>(null);
  readonly hasNextPage = signal(true);
  private endCursor: string | null = null;
  private readonly categoryId = 'bloq';

  /** Utilidad de tiempo de lectura (expuesta en template). */
  readonly readingTimeMinutes = readingTimeMinutes;

  /** Autor a mostrar: authorPerson si existe, sino nombre del author WP. */
  authorDisplayName(post: Post): string {
    if (post.authorPerson?.name) return post.authorPerson.name;
    if (post.authorPerson?.firstName) return post.authorPerson.firstName;
    if (post.author?.node?.firstName) return post.author.node.firstName;
    return 'Author';
  }

  private transformNodes(nodes: Post[]): Post[] {
    return nodes.map((post: Post) => ({
      ...post,
      excerpt: post.excerpt ?? '',
      tags: post.tags ?? [],
      primaryTag: post.primaryTag ?? null,
      authorPerson: post.authorPerson ?? null,
      featuredImage: post.featuredImage ?? null,
      sanitizedContent: this.sanitizer.bypassSecurityTrustHtml(post.content || ''),
      sanitizedExcerpt:
        post.excerpt && post.excerpt.trim()
          ? this.sanitizer.bypassSecurityTrustHtml(post.excerpt.trim())
          : undefined,
    }));
  }

  private readonly platformId = inject(PLATFORM_ID);

  constructor() {
    effect(() => {
      const sentinel = this.scrollSentinel()?.nativeElement;
      const _ = this.posts();
      if (sentinel && isPlatformBrowser(this.platformId)) this.setupScrollObserver(sentinel);
    });
    this.destroyRef.onDestroy(() => {
      this.observer?.disconnect();
      this.observer = null;
    });
  }

  ngOnInit() {
    this.loadFirstPage();
  }

  private loadFirstPage() {
    this.apollo
      .query({
        query: GET_GEN_CONTENTS_BY_CATEGORY_PAGINATED,
        variables: {
          categoryId: this.categoryId,
          first: PAGE_SIZE,
          after: null,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result: any) => {
          const conn = result.data?.genContentCategory?.genContents;
          const nodes = conn?.nodes;
          const pageInfo = conn?.pageInfo;
          if (nodes?.length !== undefined) {
            this.posts.set({ nodes: this.transformNodes(nodes) });
            this.hasNextPage.set(pageInfo?.hasNextPage ?? false);
            this.endCursor = pageInfo?.endCursor ?? null;
          } else {
            this.fallbackLoadAll();
          }
          this.loading.set(false);
          this.error.set(result.error);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err);
          this.fallbackLoadAll();
        },
      });
  }

  /** Si la API paginada falla, cargar todo y mostrar de 10 en 10 por scroll. */
  private fallbackLoadAll() {
    this.apollo
      .query({
        query: GET_GEN_CONTENTS_BY_CATEGORY,
        variables: { categoryId: this.categoryId },
        fetchPolicy: 'network-only',
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result: any) => {
        const nodes = result.data?.genContentCategory?.genContents?.nodes;
        if (nodes?.length) {
          const transformed = this.transformNodes(nodes);
          this.posts.set({ nodes: transformed });
          this.displayCount.set(Math.min(PAGE_SIZE, transformed.length));
          this.hasNextPage.set(transformed.length > PAGE_SIZE);
          this.endCursor = null;
        }
        this.loading.set(false);
      });
  }

  loadMore() {
    if (this.loadingMore() || !this.hasNextPage()) return;
    // Modo fallback: sin cursor, revelar 10 más del array ya cargado
    if (this.endCursor == null) {
      const p = this.posts();
      const total = p?.nodes?.length ?? 0;
      const next = Math.min(this.displayCount() + PAGE_SIZE, total);
      this.displayCount.set(next);
      this.hasNextPage.set(next < total);
      return;
    }
    this.loadingMore.set(true);
    this.apollo
      .query({
        query: GET_GEN_CONTENTS_BY_CATEGORY_PAGINATED,
        variables: {
          categoryId: this.categoryId,
          first: PAGE_SIZE,
          after: this.endCursor,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result: any) => {
          const conn = result.data?.genContentCategory?.genContents;
          const nodes = conn?.nodes as Post[] | undefined;
          const pageInfo = conn?.pageInfo;
          if (nodes?.length) {
            const current = this.posts();
            const merged = current
              ? { nodes: [...current.nodes, ...this.transformNodes(nodes)] }
              : { nodes: this.transformNodes(nodes) };
            this.posts.set(merged);
          }
          this.hasNextPage.set(pageInfo?.hasNextPage ?? false);
          this.endCursor = pageInfo?.endCursor ?? null;
          this.loadingMore.set(false);
        },
        error: () => {
          this.loadingMore.set(false);
        },
      });
  }

  private observer: IntersectionObserver | null = null;

  private setupScrollObserver(sentinel: HTMLElement) {
    if (!isPlatformBrowser(this.platformId) || typeof IntersectionObserver === 'undefined') return;
    this.observer?.disconnect();
    this.observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && this.hasNextPage() && !this.loadingMore() && !this.loading()) {
          this.loadMore();
        }
      },
      { root: null, rootMargin: '200px', threshold: 0 }
    );
    this.observer.observe(sentinel);
  }
}
