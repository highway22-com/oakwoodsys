import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, OnInit, Output, EventEmitter, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { take } from 'rxjs/operators';
import { ButtonPrimaryComponent } from '../../button-primary/button-primary.component';
import { BlogCardComponent } from '../../blog-card/blog-card.component';
import { GraphQLContentService } from '../../../app/services/graphql-content.service';
import { readingTimeMinutes } from '../../../app/utils/reading-time.util';
import { getPrimaryTagName, type GenContentListNode } from '../../../app/api/graphql';

/** Item para app-blog-card (mismo formato que en blogs). */
export interface LatestInsightsBlogCard {
  slug: string;
  imageUrl: string;
  imageAlt: string;
  tag: string | null;
  readingTimeMinutes: number;
  title: string;
  excerptHtml: ReturnType<DomSanitizer['bypassSecurityTrustHtml']> | null;
  authorDisplayName: string | null;
  authorPicture: string | null;
  authorInitial: string;
  date: string;
}

export interface LatestInsightsArticle {
  id?: number;
  title?: string;
  link?: string;
  linkText?: string;
  readingTime?: string;
  image?: { url?: string; alt?: string };
  tags?: string[];
}

export interface LatestInsightsSection {
  label?: string;
  title?: string | { line1?: string; line2?: string };
  subtitle?: string;
  articles?: LatestInsightsArticle[];
  cta?: { text?: string; link?: string; backgroundColor?: string };
}

@Component({
  selector: 'app-latest-insights',
  standalone: true,
  imports: [CommonModule, ButtonPrimaryComponent, BlogCardComponent],
  templateUrl: './latest-insights.html',
  styleUrl: './latest-insights.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LatestInsightsSectionComponent implements OnInit {
  private readonly graphql = inject(GraphQLContentService);
  private readonly destroyRef = inject(DestroyRef);

  readonly section = input.required<LatestInsightsSection>();
  /** Últimos 3 blog publicados por fecha (cargados desde GraphQL). */
  readonly articles = signal<LatestInsightsBlogCard[]>([]);
  private readonly sanitizer = inject(DomSanitizer);
  readonly loading = signal(true);

  @Output() readonly ctaClick = new EventEmitter<void>();

  /** Título para mostrar (string o line1 + line2). */
  getTitle(section: LatestInsightsSection): string {
    const t = section?.title;
    if (typeof t === 'string') return t;
    if (t && typeof t === 'object') return [t.line1, t.line2].filter(Boolean).join(' ') || '';
    return '';
  }

  ngOnInit(): void {
    this.graphql
      .getBlogs()
      .pipe(
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((nodes) => {
        const sorted = [...nodes].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        const latest3 = sorted.slice(0, 3).map((node) => this.nodeToBlogCard(node));
        this.articles.set(latest3);
        this.loading.set(false);
      });
  }

  private nodeToBlogCard(node: GenContentListNode): LatestInsightsBlogCard {
    const authorName =
      node.authorPerson?.name ?? node.authorPerson?.firstName ?? node.author?.node?.firstName ?? null;
    const authorInitial = (authorName ?? 'A').charAt(0);
    const tag = getPrimaryTagName(node.primaryTagName) ?? (node.tags?.length ? node.tags[0]! : null);
    return {
      slug: node.slug,
      imageUrl: node.featuredImage?.node?.sourceUrl ?? '',
      imageAlt: node.featuredImage?.node?.altText ?? node.title ?? 'Blog post',
      tag: tag ?? null,
      readingTimeMinutes: readingTimeMinutes(node.content),
      title: node.title ?? '',
      excerptHtml: node.excerpt ? this.sanitizer.bypassSecurityTrustHtml(node.excerpt) : null,
      authorDisplayName: authorName,
      authorPicture: node.authorPerson?.picture ?? null,
      authorInitial,
      date: node.date ?? '',
    };
  }
}
