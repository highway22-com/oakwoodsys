import { ChangeDetectionStrategy, Component, inject, OnInit, OnDestroy, signal, input, PLATFORM_ID } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, DatePipe, isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Apollo, gql } from 'apollo-angular';

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
}

@Component({
  selector: 'app-post',
  imports: [RouterLink, CommonModule, DatePipe],
  templateUrl: './post.html',
  styleUrl: './post.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Post implements OnInit, OnDestroy {
  slug = input.required<string>();
  private readonly apollo = inject(Apollo);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly platformId = inject(PLATFORM_ID);
  private scrollListener?: () => void;

  readonly post = signal<PostDetail | null>(null);
  readonly loading = signal(true);
  readonly error = signal<any>(null);
  readonly activeSection = signal<string>('');
  readonly tableOfContents = signal<{ id: string; text: string }[]>([]);

  /** Autor a mostrar: authorPerson si existe, sino author WP. */
  authorDisplayName(p: PostDetail): string {
    if (p.authorPerson?.name) return p.authorPerson.name;
    if (p.authorPerson?.firstName) return p.authorPerson.firstName;
    if (p.author?.node?.firstName) return p.author.node.firstName;
    return 'Author';
  }

  ngOnInit() {
    const slugValue = this.slug();
    if (!slugValue) {
      this.loading.set(false);
      this.error.set('No slug provided');
      return;
    }

    this.apollo
      .watchQuery({
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
      .valueChanges.subscribe({
        next: (result: any) => {
          const data = result.data as {
            genContent?: Record<string, unknown> | null;
            postBy?: Record<string, unknown> | null;
          };
          const raw = data?.genContent ?? data?.postBy;
          if (raw) {
            const excerpt = (raw['excerpt'] as string) ?? '';
            const content = (raw['content'] as string) ?? '';
            const postData: PostDetail = {
              id: raw['id'] as string,
              title: (raw['title'] as string) ?? '',
              content,
              excerpt: excerpt.replace(/<[^>]*>/g, '').replace(/\[&hellip;\]/g, '...').trim(),
              slug: (raw['slug'] as string) ?? slugValue,
              date: (raw['date'] as string) ?? '',
              author: (raw['author'] as PostAuthor) ?? { node: { email: '', firstName: '', id: '' } },
              sanitizedContent: this.sanitizer.bypassSecurityTrustHtml(content),
              sanitizedExcerpt:
                excerpt.trim() ?
                  this.sanitizer.bypassSecurityTrustHtml(excerpt.trim()) :
                  undefined,
              tags: (raw['tags'] as string[] | undefined) ?? undefined,
              primaryTag: (raw['primaryTag'] as string | null) ?? undefined,
              authorPerson: (raw['authorPerson'] as AuthorPersonDetail | null) ?? undefined,
              featuredImage: (raw['featuredImage'] as PostDetail['featuredImage']) ?? undefined,
              showContactSection: (raw['showContactSection'] as boolean | undefined) ?? undefined,
            };
            this.post.set(postData);
            if (isPlatformBrowser(this.platformId)) {
              setTimeout(() => {
                this.extractTableOfContents(content);
                this.setupScrollListener();
              }, 100);
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

  ngOnDestroy() {
    if (this.scrollListener && isPlatformBrowser(this.platformId)) {
      window.removeEventListener('scroll', this.scrollListener);
    }
  }

  private extractTableOfContents(content: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

    setTimeout(() => {
      const blogContent = document.querySelector('.blog-content');
      if (!blogContent) return;

      const headings = blogContent.querySelectorAll('h2, h3');
      const toc: { id: string; text: string }[] = [];

      headings.forEach((heading, index) => {
        const text = heading.textContent || '';
        const id = `section-${index}`;
        heading.id = id;
        toc.push({ id, text: text.trim() });
      });

      this.tableOfContents.set(toc);
    }, 200);
  }

  private setupScrollListener(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.scrollListener = () => {
      const toc = this.tableOfContents();
      if (toc.length === 0) return;

      const scrollPosition = window.scrollY + 200; // Offset for sticky header

      for (let i = toc.length - 1; i >= 0; i--) {
        const element = document.getElementById(toc[i].id);
        if (element) {
          const elementTop = element.offsetTop;
          if (scrollPosition >= elementTop) {
            this.activeSection.set(toc[i].id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', this.scrollListener, { passive: true });
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
}
