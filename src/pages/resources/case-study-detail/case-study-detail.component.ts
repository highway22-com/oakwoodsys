import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

/** Card para lista de recursos / related case studies / latest insights. */
export interface CaseStudyDetailCard {
  id: string;
  image: string;
  category: string;
  date?: string;
  title: string;
  description: string;
  link: string;
  slug: string;
}

/** Detalle de un case study (GraphQL → transformGraphQLToCaseStudyDetail). */
export interface CaseStudyDetailData {
  slug: string;
  title: string;
  heroImage: string;
  tags: string[];
  overview: string;
  businessChallenge: string;
  solution: string;
  solutionImage?: string;
  testimonial?: {
    company: string;
    companyLogo?: string;
    quote: string;
    author: string;
    role: string;
  };
  relatedCaseStudies: CaseStudyDetailCard[];
  connectedServices: {
    id: string;
    icon: string;
    title: string;
    description: string;
    link: string;
    slug: string;
  }[];
}

/** Resultado de parsear HTML: HTML con ids en h1–h5 y lista de headings para TOC. */
function parseHtmlAndExtractHeadings(html: string): { processedHtml: string; headings: { id: string; text: string }[] } {
  if (!html || typeof html !== 'string') {
    return { processedHtml: html || '', headings: [] };
  }
  const headings: { id: string; text: string }[] = [];
  const seen = new Map<string, number>();

  function slugify(text: string): string {
    const base = text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'heading';
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count}`;
  }

  const regex = /<h([1-5])(\s[^>]*)?>([\s\S]*?)<\/h\1>/gi;
  const processedHtml = html.replace(regex, (full: string, level: string, attrs: string, content: string) => {
    const text = content.replace(/<[^>]+>/g, '').trim();
    if (!text) return full;
    const id = slugify(text);
    const cleanAttrs = (attrs || '').replace(/\s*id\s*=\s*["'][^"']*["']/gi, '').trim();
    headings.push({ id, text });
    return `<h${level} id="${id}"${cleanAttrs ? ` ${cleanAttrs}` : ''}>${content}</h${level}>`;
  });

  return { processedHtml, headings };
}

@Component({
  selector: 'app-case-study-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './case-study-detail.component.html',
  styleUrl: './case-study-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CaseStudyDetailComponent implements OnChanges {
  private readonly sanitizer = inject(DomSanitizer);

  @Input() detail: CaseStudyDetailData | null = null;
  @Input() tableOfContents: { id: string; text: string }[] = [];
  @Input() activeSection = '';
  @Input() latestInsights: CaseStudyDetailCard[] = [];
  @Output() sectionScroll = new EventEmitter<string>();
  /** Emite el TOC calculado (secciones + h1–h5 del HTML) para que el padre actualice el scroll listener. */
  @Output() tableOfContentsReady = new EventEmitter<{ id: string; text: string }[]>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['detail'] && this.detail) {
      const { tableOfContents } = this.getProcessedContent();
      this.tableOfContentsReady.emit(tableOfContents);
    }
  }

  /** Contenido procesado (HTML con ids en h1–h5) y TOC unificado (secciones + h1–h5 del HTML). */
  getProcessedContent(): {
    processedOverview: SafeHtml;
    processedBusinessChallenge: SafeHtml;
    processedSolution: SafeHtml;
    tableOfContents: { id: string; text: string }[];
  } {
    const empty = { processedOverview: '', processedBusinessChallenge: '', processedSolution: '', tableOfContents: this.tableOfContents };
    if (!this.detail) return empty;

    const o = parseHtmlAndExtractHeadings(this.detail.overview ?? '');
    const b = parseHtmlAndExtractHeadings(this.detail.businessChallenge ?? '');
    const s = parseHtmlAndExtractHeadings(this.detail.solution ?? '');

    const toc: { id: string; text: string }[] = [
      { id: 'overview', text: 'Overview' },
      ...o.headings,
      { id: 'business-challenge', text: 'Business Challenge' },
      ...b.headings,
      { id: 'solution', text: 'Solution' },
      ...s.headings,
    ];
    if (this.detail.testimonial) {
      toc.push({ id: 'testimonial', text: 'Testimonial' });
    }

    return {
      processedOverview: this.getSafeHtml(o.processedHtml),
      processedBusinessChallenge: this.getSafeHtml(b.processedHtml),
      processedSolution: this.getSafeHtml(s.processedHtml),
      tableOfContents: toc,
    };
  }

  /** Sanitiza HTML de WordPress/ACF para renderizar de forma segura (overview, businessChallenge, solution). */
  getSafeHtml(html: string | undefined): SafeHtml {
    if (html == null || html.trim() === '') {
      return '';
    }
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  scrollToSection(sectionId: string): void {
    this.sectionScroll.emit(sectionId);
  }
}
