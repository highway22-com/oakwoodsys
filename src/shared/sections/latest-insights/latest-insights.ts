import { ChangeDetectionStrategy, Component, input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonPrimaryComponent } from "../../button-primary/button-primary.component";

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
  imports: [CommonModule, ButtonPrimaryComponent],
  templateUrl: './latest-insights.html',
  styleUrl: './latest-insights.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LatestInsightsSectionComponent {
  readonly section = input.required<LatestInsightsSection>();

  @Output() readonly ctaClick = new EventEmitter<void>();

  /** Título para mostrar (string o line1 + line2). */
  getTitle(section: LatestInsightsSection): string {
    const t = section?.title;
    if (typeof t === 'string') return t;
    if (t && typeof t === 'object') return [t.line1, t.line2].filter(Boolean).join(' ') || '';
    return '';
  }


}
