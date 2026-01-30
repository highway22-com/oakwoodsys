import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, Output } from '@angular/core';
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

@Component({
  selector: 'app-case-study-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './case-study-detail.component.html',
  styleUrl: './case-study-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CaseStudyDetailComponent {
  private readonly sanitizer = inject(DomSanitizer);

  @Input() detail: CaseStudyDetailData | null = null;
  @Input() tableOfContents: { id: string; text: string }[] = [];
  @Input() activeSection = '';
  @Input() latestInsights: CaseStudyDetailCard[] = [];
  @Output() sectionScroll = new EventEmitter<string>();

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
