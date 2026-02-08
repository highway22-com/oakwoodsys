import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Apollo } from 'apollo-angular';
import { GET_GEN_CONTENTS_BY_CATEGORY } from '../../app/api/graphql';

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

@Component({
  selector: 'app-bloq',
  imports: [RouterLink, RouterLinkActive, CommonModule, DatePipe],
  templateUrl: './blogs.html',
  styleUrl: './blogs.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Blogs implements OnInit {
  private readonly apollo = inject(Apollo);
  private readonly sanitizer = inject(DomSanitizer);
  readonly posts = signal<{ nodes: Post[] } | null>(null);
  readonly loading = signal(true);
  readonly error = signal<any>(null);

  /** Tiempo de lectura aproximado (min) desde contenido HTML. ~200 palabras/min. */
  readingTimeMinutes(content: string | null | undefined): number {
    if (!content || typeof content !== 'string') return 0;
    const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = text ? text.split(/\s+/).length : 0;
    return Math.max(1, Math.ceil(words / 200));
  }

  /** Autor a mostrar: authorPerson si existe, sino nombre del author WP. */
  authorDisplayName(post: Post): string {
    if (post.authorPerson?.name) return post.authorPerson.name;
    if (post.authorPerson?.firstName) return post.authorPerson.firstName;
    if (post.author?.node?.firstName) return post.author.node.firstName;
    return 'Author';
  }

  ngOnInit() {
    this.apollo
      .watchQuery({
        query: GET_GEN_CONTENTS_BY_CATEGORY,
        variables: { categoryId: 'bloq' },
        fetchPolicy: 'network-only',
      })
      .valueChanges.subscribe((result: any) => {
        const nodes = result.data?.genContentCategory?.genContents?.nodes;
        if (nodes) {
          // Transform posts to include sanitized HTML content
          const transformedPosts = {
            nodes: nodes.map((post: Post) => ({
              ...post,
              excerpt: post.excerpt ?? '',
              tags: post.tags ?? [],
              primaryTag: post.primaryTag ?? null,
              authorPerson: post.authorPerson ?? null,
              featuredImage: post.featuredImage ?? null,
              sanitizedContent: this.sanitizer.bypassSecurityTrustHtml(post.content || ''),
              sanitizedExcerpt: (post.excerpt && post.excerpt.trim())
                ? this.sanitizer.bypassSecurityTrustHtml(post.excerpt.trim())
                : undefined,
            })),
          };
          this.posts.set(transformedPosts);
        } else {
          this.posts.set(null);
        }
        this.loading.set(false);
        this.error.set(result.error);
      });
  }
}
