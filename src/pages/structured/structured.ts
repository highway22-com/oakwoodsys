import { ChangeDetectionStrategy, Component, OnInit, inject, signal, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { CtaSectionComponent } from "../../shared/cta-section/cta-section.component";
import { VideoHero } from '../../shared/video-hero/video-hero';
import { SeoMetaService } from '../../app/services/seo-meta.service';
import { GraphQLContentService } from '../../app/services/graphql-content.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { catchError, of, take } from 'rxjs';

interface StructuredPageCard {
  title: string;
  description: string;
  slug: string;
  linkText: string;
  iconSvg?: string;
  icon?: string;
}

interface StructuredPageSection {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  background: 'white' | 'gray';
  cards: StructuredPageCard[];
}

export interface StructuredPageContent {
  hero: {
    videoUrls: string[];
    title: string;
    description: string;
  };
  sections: StructuredPageSection[];
  cta: {
    title: string;
    description: string;
    primaryText: string;
    primaryLink: string;
    secondaryText: string;
    secondaryLink: string;
  };
}

const DEFAULT_STRUCTURED_PAGE_CONTENT: StructuredPageContent = {
  hero: {
    videoUrls: [
      'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/02/Services-Data-Ai.mp4'
    ],
    title: 'Structured Engagements',
    description: 'Drive efficiency and innovation with tailored, strategic engagements designed to align technology solutions with your unique business goals.'
  },
  sections: [],
  cta: {
    title: "Let's move your vision forward",
    description: 'Connect with our experienced team to transform ideas into tangible results, on time and within budget.',
    primaryText: 'GET IN TOUCH',
    primaryLink: '/contact-us',
    secondaryText: 'VIEW ALL WORK',
    secondaryLink: '/resources/case-studies'
  }
};

@Component({
  selector: 'app-structured',
  imports: [CommonModule, RouterLink, VideoHero, CtaSectionComponent],
  templateUrl: './structured.html',
  styleUrl: './structured.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Structured implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly graphql = inject(GraphQLContentService);
  private readonly seoMeta = inject(SeoMetaService);
  private readonly sanitizer = inject(DomSanitizer);
  /** When provided (edit preview), use this instead of remote loading. */
  readonly contentOverride = input<StructuredPageContent | null>(null);
  readonly pageContent = signal<StructuredPageContent>(DEFAULT_STRUCTURED_PAGE_CONTENT);

  ngOnInit() {
    const override = this.contentOverride();
    if (override?.hero && Array.isArray(override.sections) && override.cta) {
      this.pageContent.set(override);
      this.updateSeo();
      return;
    }

    this.graphql.getStructuredEngagementPageContent()
      .pipe(
        take(1),
        catchError(() => of(null))
      )
      .subscribe((cmsData) => {
        const parsed = this.asStructuredPageContent(cmsData);
        if (parsed) {
          this.pageContent.set(parsed);
          this.updateSeo();
          return;
        }

        this.http.get<StructuredPageContent>('/structured-page-content.json')
          .pipe(
            take(1),
            catchError(() => of(null))
          )
          .subscribe((jsonData) => {
            if (jsonData?.hero && Array.isArray(jsonData.sections) && jsonData.cta) {
              this.pageContent.set(jsonData);
            }
            this.updateSeo();
          });
      });

    this.updateSeo();
  }

  private asStructuredPageContent(data: Record<string, unknown> | null): StructuredPageContent | null {
    if (!data || typeof data !== 'object') return null;

    const candidate = data as Partial<StructuredPageContent>;
    if (candidate.hero && Array.isArray(candidate.sections) && candidate.cta) {
      return candidate as StructuredPageContent;
    }

    const wrapped = data as { content?: Partial<StructuredPageContent>; page?: string };
    if (wrapped.content?.hero && Array.isArray(wrapped.content.sections) && wrapped.content.cta) {
      return wrapped.content as StructuredPageContent;
    }

    return null;
  }

  private updateSeo() {
    const content = this.pageContent();
    this.seoMeta.updateMeta({
      title: 'Structured Engagements | Oakwood Systems',
      description: content.hero.description,
      canonicalPath: '/structured-engagement',
    });
  }

  getSafeSvg(svg: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  getCardIcon(card: StructuredPageCard): string {
    return (card.iconSvg ?? card.icon ?? '').trim();
  }

  isIconAssetUrl(icon?: string): boolean {
    const value = icon?.trim().toLowerCase();

    if (!value) return false;
    if (value.startsWith('<svg')) return false;

    return (
      value.startsWith('http://') ||
      value.startsWith('https://') ||
      value.startsWith('/') ||
      value.startsWith('./') ||
      value.startsWith('../')
    );
  }

  getIconAssetSrc(icon?: string): string {
    return icon?.trim() ?? '';
  }
}

