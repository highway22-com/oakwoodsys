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

interface PostDetail {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  date: string;
  author: PostAuthor;
  sanitizedContent?: SafeHtml;
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
          query GetPostBySlug($slug: String!) {
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
        variables: {
          slug: slugValue
        },
        fetchPolicy: 'network-only'
      })
      .valueChanges.subscribe({
        next: (result: any) => {
          if (result.data?.postBy) {
            // Clean excerpt HTML tags
            const cleanExcerpt = result.data.postBy.excerpt
              ? result.data.postBy.excerpt.replace(/<[^>]*>/g, '').replace(/\[&hellip;\]/g, '...').trim()
              : '';

            const postData: PostDetail = {
              ...result.data.postBy,
              excerpt: cleanExcerpt,
              sanitizedContent: this.sanitizer.bypassSecurityTrustHtml(result.data.postBy.content || '')
            };
            this.post.set(postData);
            if (isPlatformBrowser(this.platformId)) {
              setTimeout(() => {
                this.extractTableOfContents(result.data.postBy.content || '');
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
        }
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
