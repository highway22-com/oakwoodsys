import { ChangeDetectionStrategy, Component, inject, OnInit, OnDestroy, signal, input, PLATFORM_ID, NgZone } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule, DatePipe, isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Apollo, gql } from 'apollo-angular';
import { SeoMetaService } from '../../app/services/seo-meta.service';
import { GET_GEN_CONTENTS_BY_SLUGS } from '../../app/api/graphql';
import { BlogCardComponent } from '../../shared/blog-card/blog-card.component';
import { readingTimeMinutes } from '../../app/utils/reading-time.util';
import { CtaSectionComponent } from '../../shared/cta-section/cta-section.component';
interface PostAuthor {
  node: {
    email: string;
    firstName: string;
    id: string;
  };
}

export interface AuthorPersonDetail {
  id: string;
  name: string | null;
  firstName: string | null;
  position: string | null;
  picture: string | null;
}

export interface PostDetail {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  date: string;
  author: PostAuthor;
  sanitizedContent?: SafeHtml;
  sanitizedExcerpt?: SafeHtml;
  /** Gen Content: tags, primaryTag, authorPerson, featuredImage, showContactSection */
  tags?: string[];
  primaryTag?: string | null;
  authorPerson?: AuthorPersonDetail | null;
  featuredImage?: { node: { sourceUrl: string; altText: string | null } } | null;
  showContactSection?: boolean;
  relatedBloqs?: PostDetail[];
  /** Head (Gen Content ACF oakwood_* — no chocar con otros plugins SEO). */
  headTitle?: string | null;
  headDescription?: string | null;
  headCanonicalUrl?: string | null;
  headGeoRegion?: string | null;
  headGeoPlacename?: string | null;
  headGeoPosition?: string | null;
  headJsonLdData?: string | null;
}

@Component({
  selector: 'app-post',
  imports: [RouterLink, CommonModule, DatePipe, CtaSectionComponent, BlogCardComponent],
  templateUrl: './post.html',
  styleUrl: './post.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Post implements OnInit, OnDestroy {
  slug = input<string>('');
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly apollo = inject(Apollo);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly seoMeta = inject(SeoMetaService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);
  private scrollListener?: () => void;
  private routeSub?: { unsubscribe(): void };

  readonly post = signal<PostDetail | null>(null);
  readonly loading = signal(true);
  readonly error = signal<any>(null);
  readonly activeSection = signal<string>('');
  readonly tableOfContents = signal<{ id: string; text: string }[]>([]);
  readonly readingTimeMinutes = readingTimeMinutes;

  /** Breadcrumbs: Home, (IT Blog | Case Studies), título del post. Basado en app.routes (blog vs resources/case-studies). */
  getBreadcrumbs(): { label: string; link?: string }[] {
    const isCaseStudy = this.router.url.startsWith('/resources/case-studies');
    const parentLabel = isCaseStudy ? 'Case Studies' : 'IT Blog';
    const parentLink = isCaseStudy ? '/resources/case-studies' : '/blog';
    const title = this.post()?.title ?? '';
    return [
      { label: 'Home', link: '/' },
      { label: parentLabel, link: parentLink },
      { label: title || 'Article' },
    ];
  }

  private mapRelatedBloqs(raw: Record<string, unknown>[]): PostDetail[] {
    const defaultAuthor: PostAuthor = { node: { email: '', firstName: '', id: '' } };
    return raw.map((r) => {
      const excerpt = (r['excerpt'] as string) ?? '';
      return {
        id: (r['id'] as string) ?? '',
        title: (r['title'] as string) ?? '',
        content: '',
        excerpt,
        slug: (r['slug'] as string) ?? '',
        date: '',
        author: defaultAuthor,
        sanitizedExcerpt: excerpt.trim()
          ? this.sanitizer.bypassSecurityTrustHtml(excerpt.trim())
          : undefined,
        featuredImage: (r['featuredImage'] as PostDetail['featuredImage']) ?? undefined,
        primaryTag: (r['primaryTag'] as string | null) ?? null,
      } as PostDetail;
    });
  }

  /** Autor a mostrar: authorPerson si existe, sino author WP. */
  authorDisplayName(p: PostDetail): string {
    if (p.authorPerson?.name) return p.authorPerson.name;
    if (p.authorPerson?.firstName) return p.authorPerson.firstName;
    if (p.author?.node?.firstName) return p.author.node.firstName;
    return 'Author';
  }

  ngOnInit() {
    this.routeSub = this.route.paramMap.subscribe((params) => {
      const slugValue = params.get('slug') || this.slug() || '';
      if (!slugValue) {
        this.loading.set(false);
        this.error.set('No slug provided');
        return;
      }
      this.loadPost(slugValue);
    });
  }

  private loadPost(slugValue: string) {
    this.loading.set(true);
    this.error.set(null);
    this.post.set(null);

    this.apollo
      .query({
        query: gql`
          query GetBlogOrPost($slug: String!, $id: ID!) {
            genContent(id: $id, idType: SLUG) {
              id
              title
              content
              excerpt
              slug
              date
              tags
              primaryTag
              showContactSection
              featuredImage {
                node {
                  sourceUrl
                  altText
                }
              }
              author {
                node {
                  email
                  firstName
                  id
                }
              }
              authorPerson {
                id
                name
                firstName
                position
                picture
              }
              headTitle
              headDescription
              headCanonicalUrl
              headGeoRegion
              headGeoPlacename
              headGeoPosition
              headJsonLdData
              relatedBloqSlugs
            }
            postBy(slug: $slug) {
              id
              title
              content
              excerpt
              slug
              date
              author {
                node {
                  email
                  firstName
                  id
                }
              }
            }
          }
        `,
        variables: { slug: slugValue, id: slugValue },
        fetchPolicy: 'network-only',
      })
      .subscribe({
        next: (result: any) => {
          const data = result?.data as {
            genContent?: Record<string, unknown> | null;
            postBy?: Record<string, unknown> | null;
          };
          const raw = data?.genContent ?? data?.postBy;
          if (raw) {
            const excerpt = (raw['excerpt'] as string) ?? '';
            const content = (raw['content'] as string) ?? '';
            const { content: contentWithIds, toc } = this.extractTocAndInjectIds(content);
            const postData: PostDetail = {
              id: raw['id'] as string,
              title: (raw['title'] as string) ?? '',
              content: contentWithIds,
              excerpt: excerpt.replace(/<[^>]*>/g, '').replace(/\[&hellip;\]/g, '...').trim(),
              slug: (raw['slug'] as string) ?? slugValue,
              date: (raw['date'] as string) ?? '',
              author: (raw['author'] as PostAuthor) ?? { node: { email: '', firstName: '', id: '' } },
              sanitizedContent: this.sanitizer.bypassSecurityTrustHtml(contentWithIds),
              sanitizedExcerpt:
                excerpt.trim() ?
                  this.sanitizer.bypassSecurityTrustHtml(excerpt.trim()) :
                  undefined,
              tags: (raw['tags'] as string[] | undefined) ?? undefined,
              primaryTag: (raw['primaryTag'] as string | null) ?? undefined,
              authorPerson: (raw['authorPerson'] as AuthorPersonDetail | null) ?? undefined,
              featuredImage: (raw['featuredImage'] as PostDetail['featuredImage']) ?? undefined,
              showContactSection: (raw['showContactSection'] as boolean | undefined) ?? undefined,
              headTitle: (raw['headTitle'] as string | null) ?? undefined,
              headDescription: (raw['headDescription'] as string | null) ?? undefined,
              headCanonicalUrl: (raw['headCanonicalUrl'] as string | null) ?? undefined,
              headGeoRegion: (raw['headGeoRegion'] as string | null) ?? undefined,
              headGeoPlacename: (raw['headGeoPlacename'] as string | null) ?? undefined,
              headGeoPosition: (raw['headGeoPosition'] as string | null) ?? undefined,
              headJsonLdData: (raw['headJsonLdData'] as string | null) ?? undefined,
              relatedBloqs: this.mapRelatedBloqs((raw['relatedBloqs'] as Record<string, unknown>[] | null | undefined) ?? []),
            };
            this.ngZone.run(() => {
              this.tableOfContents.set(toc);
              this.post.set(postData);
              if (toc.length > 0) this.activeSection.set(toc[0].id);
            });
            this.updateSeoMeta(postData, slugValue);
            const relatedSlugs = (raw['relatedBloqSlugs'] as string[] | null | undefined) ?? [];
            if (relatedSlugs.length > 0 && data?.genContent) {
              this.apollo.query({ query: GET_GEN_CONTENTS_BY_SLUGS, variables: { slugs: relatedSlugs }, fetchPolicy: 'network-only' }).subscribe({
                next: (res: any) => {
                  const nodes = (res?.data?.genContents?.nodes ?? []) as Record<string, unknown>[];
                  const related = this.mapRelatedBloqs(nodes);
                  this.ngZone.run(() => {
                    const current = this.post();
                    if (current) this.post.set({ ...current, relatedBloqs: related });
                  });
                },
              });
            }
            if (isPlatformBrowser(this.platformId)) {
              setTimeout(() => {
                this.setupScrollListener();
                this.scrollToFragmentFromUrl();
              }, 250);
            }
          } else {
            this.error.set('Post not found');
          }
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading post:', error);
          this.error.set(error);
          this.loading.set(false);
        },
      });
  }

  private updateSeoMeta(post: PostDetail, slug: string): void {
    const isCaseStudy = this.router.url.startsWith('/resources/case-studies');
    const canonicalPath = isCaseStudy ? `/resources/case-studies/${slug}` : `/blog/${slug}`;
    const title = post.headTitle || `${post.title} | Oakwood Systems`;
    const description = post.headDescription || post.excerpt || this.seoMeta.defaultDescription;
    const canonicalUrl = post.headCanonicalUrl || undefined;
    this.seoMeta.updateMeta({
      title,
      description,
      canonicalPath: canonicalUrl ?? canonicalPath,
      image: post.featuredImage?.node?.sourceUrl,
    });
  }

  ngOnDestroy() {
    this.routeSub?.unsubscribe();
    if (this.scrollListener && isPlatformBrowser(this.platformId)) {
      window.removeEventListener('scroll', this.scrollListener);
    }
  }

  /**
   * Extrae el TOC del HTML del contenido e inyecta IDs en los h2/h3.
   * Así el TOC está listo de inmediato y no depende del DOM.
   */
  private extractTocAndInjectIds(html: string): { content: string; toc: { id: string; text: string }[] } {
    const toc: { id: string; text: string }[] = [];
    let index = 0;
    const content = html.replace(/<(h[23])([^>]*)>([\s\S]*?)<\/\1>/gi, (match, tag: string, attrs: string, inner: string) => {
      const text = inner.replace(/<[^>]+>/g, '').trim();
      const id = `section-${index}`;
      index++;
      toc.push({ id, text });
      const attrsWithoutId = attrs.replace(/\s*id="[^"]*"/i, '').trim();
      const newAttrs = attrsWithoutId ? ` id="${id}" ${attrsWithoutId}` : ` id="${id}"`;
      return `<${tag}${newAttrs}>${inner}</${tag}>`;
    });
    return { content, toc };
  }

  private setupScrollListener(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const viewportActiveLine = 120; // px desde el top del viewport: debajo de esta línea = "activo"

    const updateActiveSection = (): void => {
      const toc = this.tableOfContents();
      if (toc.length === 0) return;

      let activeId = toc[0].id;
      for (const item of toc) {
        const el = document.getElementById(item.id);
        if (el) {
          const top = el.getBoundingClientRect().top;
          if (top <= viewportActiveLine) activeId = item.id;
        }
      }
      const nextId = activeId;
      this.ngZone.run(() => {
        if (this.activeSection() !== nextId) this.activeSection.set(nextId);
      });
    };

    this.scrollListener = () => updateActiveSection();
    window.addEventListener('scroll', this.scrollListener, { passive: true });
    setTimeout(() => updateActiveSection(), 200);
  }

  scrollToSection(sectionId: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 100; // Offset for sticky header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      this.activeSection.set(sectionId);
    }
  }

  /**
   * Si la URL tiene fragment (TOC #section-0 o búsqueda navbar #texto), hace scroll a esa posición.
   * Usa window.location.hash para evitar dependencia de RouterStateSnapshot.fragment.
   */
  private scrollToFragmentFromUrl(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const raw = (window.location.hash || '').replace(/^#/, '');
    if (!raw) return;
    const decoded = decodeURIComponent(raw).trim();
    if (!decoded) return;

    const byId = document.getElementById(decoded);
    if (byId) {
      this.scrollToSection(decoded);
      return;
    }

    const container = document.querySelector('.html-content');
    if (!container) return;
    const searchText = decoded.toLowerCase();
    const candidates = container.querySelectorAll('p, li, h2, h3, h4, blockquote');
    for (const el of candidates) {
      if ((el.textContent ?? '').toLowerCase().includes(searchText)) {
        const top = el.getBoundingClientRect().top + window.pageYOffset - 100;
        window.scrollTo({ top, behavior: 'smooth' });
        if (el.id) this.activeSection.set(el.id);
        break;
      }
    }
  }
}
