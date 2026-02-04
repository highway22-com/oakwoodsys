import { ChangeDetectionStrategy, Component, input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonPrimaryComponent } from "../../button-primary/button-primary.component";

export type OfferBorderColor = 'blue' | 'orange' | 'green' | 'purple';

export interface StructuredEngagementsOffer {
  id?: number;
  title?: string;
  description?: string;
  link?: string;
  linkText?: string;
  borderColor?: string;
  icon?: string;
}

export interface StructuredEngagementsSection {
  label?: string;
  /** Título como string o como objeto con line1/line2 (compatible con CmsSection). */
  title?: string | { line1?: string; line2?: string };
  tabs?: string[];
  activeTab?: string;
  offers?: StructuredEngagementsOffer[];
  cta?: { text?: string; link?: string; backgroundColor?: string };
}

@Component({
  selector: 'app-structured-engagements',
  standalone: true,
  imports: [CommonModule, ButtonPrimaryComponent],
  templateUrl: './structured-engagements.html',
  styleUrl: './structured-engagements.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StructuredEngagementsSectionComponent {
  readonly section = input.required<StructuredEngagementsSection>();

  @Output() readonly tabSelect = new EventEmitter<string>();
  @Output() readonly ctaClick = new EventEmitter<void>();

  /** Normaliza borderColor a minúsculas para que coincida aunque el CMS envíe "Blue", "Orange", etc. */
  normalizeBorderColor(borderColor?: string): string {
    return typeof borderColor === 'string' ? borderColor.trim().toLowerCase() : '';
  }

  getOfferCardClasses(borderColor?: string): Record<string, boolean> {
    const c = this.normalizeBorderColor(borderColor);
    return {
      'hover:shadow-blue-500/30': c === 'blue',
      'hover:shadow-orange-500/30': c === 'orange',
      'hover:shadow-green-500/30': c === 'green',
      'hover:shadow-purple-500/30': c === 'purple',
    };
  }

  /** Gradiente del borde: circular (centro brillante → bordes oscuros). */
  getOfferBorderGradient(borderColor?: string): string {
    switch (this.normalizeBorderColor(borderColor)) {
      case 'blue':
        return 'radial-gradient(circle at 10% 30%, #38bdf8 0%, #1e3a8a 45%, #0f172a 100%)';
      case 'orange':
        return 'radial-gradient(circle at bottom left, #fb923c 0%, #0f172a 45%, #7c2d12 100%)';
      case 'green':
        return 'radial-gradient(circle at bottom center, #4ade80 0%, #0f172a 45%, #052e16 100%)';
      case 'purple':
        return 'radial-gradient(circle at bottom right, #e879f9 0%, #0f172a 45%, #3b0764 100%)';
      default:
        return 'radial-gradient(circle at bottom right, #e879f9 0%, #0f172a 45%, #3b0764 100%)';
    }
  }

  /** Fondo interior de la tarjeta: gradiente oscuro que acompaña al borde. */
  getOfferBackground(borderColor?: string): string {
    switch (this.normalizeBorderColor(borderColor)) {
      case 'blue':
        return 'linear-gradient(135deg, rgba(30, 58, 138, 0.4) 0%, rgba(15, 23, 42, 0.85) 100%)';
      case 'orange':
        return 'linear-gradient(135deg, rgba(154, 52, 18, 0.4) 0%, rgba(30, 15, 10, 0.9) 100%)';
      case 'green':
        return 'linear-gradient(135deg, rgba(20, 83, 45, 0.4) 0%, rgba(5, 46, 22, 0.9) 100%)';
      case 'purple':
        return 'linear-gradient(135deg, rgba(88, 28, 135, 0.4) 0%, rgba(59, 7, 100, 0.9) 100%)';
      default:
        return 'linear-gradient(135deg, rgba(88, 28, 135, 0.4) 0%, rgba(30, 15, 42, 0.9) 100%)';
    }
  }

  getIconColor(borderColor?: string): string {
    switch (this.normalizeBorderColor(borderColor)) {
      case 'blue':
        return 'text-blue-400';
      case 'orange':
        return 'text-orange-400';
      case 'green':
        return 'text-green-400';
      case 'purple':
        return 'text-purple-400';
      default:
        return 'text-purple-400';
    }
  }

  /** Solo la clase de fondo del contenedor del icono (para combinar con w-[50px]      , etc.). */
  getOfferIconBgClass(borderColor?: string): string {
    switch (this.normalizeBorderColor(borderColor)) {
      case 'blue': return 'bg-blue-500/20';
      case 'orange': return 'bg-orange-500/20';
      case 'green': return 'bg-green-500/20';
      case 'purple': return 'bg-purple-500/20';
      default: return 'bg-purple-500/20';
    }
  }

  getOfferIconContainerClasses(borderColor?: string): Record<string, boolean> {
    const c = this.normalizeBorderColor(borderColor);
    return {
      'w-12 h-12 sm:w-14 sm:h-14 bg-blue-500/20    flex items-center justify-center': c === 'blue',
      'w-12 h-12 sm:w-14 sm:h-14 bg-orange-500/20    flex items-center justify-center': c === 'orange',
      'w-12 h-12 sm:w-14 sm:h-14 bg-green-500/20    flex items-center justify-center': c === 'green',
      'w-12 h-12 sm:w-14 sm:h-14 bg-purple-500/20    flex items-center justify-center': c === 'purple',
    };
  }

  getOfferIconSvgClasses(borderColor?: string): Record<string, boolean> {
    const c = this.normalizeBorderColor(borderColor);
    return {
      'w-6 h-6 sm:w-7 sm:h-7 text-blue-400': c === 'blue',
      'w-6 h-6 sm:w-7 sm:h-7 text-orange-400': c === 'orange',
      'w-6 h-6 sm:w-7 sm:h-7 text-green-400': c === 'green',
      'w-6 h-6 sm:w-7 sm:h-7 text-purple-400': c === 'purple',
    };
  }

  getTabClasses(tab: string, activeTab?: string): string {
    const isActive = tab === activeTab;
    return isActive
      ? '      text-p-200 pb-2 border-b-2 border-blue-500 transition-colors duration-200'
      : 'text-white/70         text-p-200 pb-2 border-b-2 border-transparent hover:text-white hover:border-white/30 transition-colors duration-200';
  }

  /** Título para mostrar (string o line1 + line2). */
  getTitle(section: StructuredEngagementsSection): string {
    const t = section?.title;
    if (typeof t === 'string') return t;
    if (t && typeof t === 'object') return [t.line1, t.line2].filter(Boolean).join(' ') || '';
    return '';
  }
}
