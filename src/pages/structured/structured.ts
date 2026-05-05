import { ChangeDetectionStrategy, Component, OnInit, inject, signal, input, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { CtaSectionComponent } from "../../shared/cta-section/cta-section.component";
import { VideoHero } from '../../shared/video-hero/video-hero';
import { SeoMetaService } from '../../app/services/seo-meta.service';
import { GraphQLContentService } from '../../app/services/graphql-content.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { catchError, forkJoin, of, take } from 'rxjs';
import type { GenContentListNode } from '../../app/api/graphql';

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

  constructor() {
    effect(() => {
      const override = this.contentOverride();
      if (override?.hero && Array.isArray(override.sections) && override.cta) {
        this.pageContent.set(override);
        this.updateSeo();
      }
    });
  }

  ngOnInit() {
    const override = this.contentOverride();
    if (override?.hero && Array.isArray(override.sections) && override.cta) {
      this.pageContent.set(override);
      this.updateSeo();
      return;
    }

    // Cargar shell (hero/sections/cta) y los items del CMS en paralelo. La shell viene de:
    //   1) CMS page (slug: structured-engagement-page)
    //   2) JSON estático /structured-page-content.json (fallback)
    // Las cards de cada section se reemplazan por items del CMS agrupados por primary tag.
    forkJoin({
      cms: this.graphql.getStructuredEngagementPageContent().pipe(
        take(1),
        catchError(() => of(null))
      ),
      offers: this.graphql.getStructuredEngagements().pipe(
        take(1),
        catchError(() => of([] as GenContentListNode[]))
      ),
    }).subscribe(({ cms, offers }) => {
      const cmsShell = this.asStructuredPageContent(cms);
      if (cmsShell) {
        this.pageContent.set(this.applyCmsOffersToShell(cmsShell, offers));
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
            this.pageContent.set(this.applyCmsOffersToShell(jsonData, offers));
          }
          this.updateSeo();
        });
    });

    this.updateSeo();
  }

  /**
   * Reemplaza las cards de cada section por los items CMS cuyo primary tag
   * matchea el título de la sección. Si no hay items CMS para esa sección,
   * conserva las cards estáticas existentes.
   */
  private applyCmsOffersToShell(
    shell: StructuredPageContent,
    offers: GenContentListNode[],
  ): StructuredPageContent {
    if (!offers || offers.length === 0) {
      return shell;
    }

    const sections = shell.sections.map((section) => {
      const matched = offers.filter((node) =>
        this.sectionMatchesGenContent(section.title, node)
      );
      if (matched.length === 0) {
        return section;
      }
      const cards: StructuredPageCard[] = matched.map((node) => this.genContentToCard(node));
      return { ...section, cards };
    });

    return { ...shell, sections };
  }

  /**
   * Heurística: matchea el título de una section (ej. "Data & AI") con el
   * primary tag slug/name de un GenContent. Tolerante a variaciones de naming.
   */
  private sectionMatchesGenContent(sectionTitle: string, node: GenContentListNode): boolean {
    const title = (sectionTitle ?? '').toLowerCase();
    const tagSlugs = (node.genContentTags?.nodes ?? []).map((t) => (t.slug ?? '').toLowerCase());
    const tagNames = (node.genContentTags?.nodes ?? []).map((t) => (t.name ?? '').toLowerCase());
    const primary = (node.primaryTagName ?? '').toLowerCase();

    const haystack = [primary, ...tagSlugs, ...tagNames].filter(Boolean);
    if (haystack.length === 0) return false;

    if (title.includes('data') && title.includes('ai')) {
      return haystack.some((h) => h.includes('data') && h.includes('ai'));
    }
    if (title.includes('cloud')) {
      return haystack.some((h) => h.includes('cloud'));
    }
    if (title.includes('application')) {
      return haystack.some((h) => h.includes('application'));
    }
    if (title.includes('hpc') || title.includes('high performance') || title.includes('high-performance')) {
      return haystack.some((h) => h.includes('hpc') || h.includes('high-performance') || h.includes('high performance'));
    }
    if (title.includes('modern')) {
      return haystack.some((h) => h.includes('modern'));
    }
    if (title.includes('managed')) {
      return haystack.some((h) => h.includes('managed'));
    }
    return false;
  }

  private genContentToCard(node: GenContentListNode): StructuredPageCard {
    const description = (node.excerpt ?? '').replace(/<[^>]+>/g, '').trim();
    const icon = node.featuredImage?.node?.sourceUrl ?? undefined;
    return {
      title: node.title,
      description,
      slug: node.slug,
      linkText: 'View offer',
      icon,
    };
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
    return this.normalizeIconValue(card.iconSvg ?? card.icon);
  }

  isIconAssetUrl(icon?: string): boolean {
    const value = this.normalizeIconValue(icon).toLowerCase();

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
    return this.normalizeIconValue(icon);
  }

  private normalizeIconValue(icon?: string): string {
    const value = icon?.trim() ?? '';
    const lower = value.toLowerCase();
    if (!value || lower === 'undefined' || lower === 'null') {
      return '';
    }
    return value;
  }
}

