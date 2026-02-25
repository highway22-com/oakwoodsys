import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  Input,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
/** Mapeo nombre empresa -> asset logo local (public/assets/logos). */
const LOGO_BY_NAME: Record<string, string> = {
  'Microsoft': '/assets/logos/microsoft.png',
  'ARCO': '/assets/logos/arco.png',
  'APPLIED MATERIALS': '/assets/logos/applied-materials.png',
  'CLARIOS': '/assets/logos/clarios.png',
  'onsemi': '/assets/logos/onsemi.png',
  'Duke': '/assets/logos/duke-university.png',
  'BJC': '/assets/logos/bjc-healthcare.png',
};

export interface TrustedByCompany {
  name?: string;
  type?: string;
  subtitle?: string;
  tagline?: string;
  logo?: string;
  trademark?: string;
}

@Component({
  selector: 'app-trusted-by',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trusted-by.html',
  styleUrl: './trusted-by.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})


export class TrustedBySectionComponent implements AfterViewInit {
  @Input() title = '';
  @Input() companies: TrustedByCompany[] = [];

  @ViewChild('logoRow') logoRow?: ElementRef<HTMLDivElement>;
  @ViewChild('logoScroll') logoScroll?: ElementRef<HTMLDivElement>;
  private renderer = inject(Renderer2);

  ngAfterViewInit() {
    // Pause animation on hover (for accessibility, also handled in CSS)
    const row = this.logoRow?.nativeElement;
    if (row) {
      this.renderer.listen(row, 'mouseenter', () => {
        row.style.animationPlayState = 'paused';
      });
      this.renderer.listen(row, 'mouseleave', () => {
        row.style.animationPlayState = 'running';
      });
    }
  }

  scrollPrev() {
    const scroll = this.logoScroll?.nativeElement;
    const row = this.logoRow?.nativeElement;
    if (scroll && row) {
      // Pause animation
      row.style.animation = 'none';
      // If at start, jump to middle
      if (scroll.scrollLeft <= 0) {
        scroll.scrollLeft = scroll.scrollWidth / 3;
      }
      scroll.scrollBy({ left: -200, behavior: 'smooth' });
      setTimeout(() => {
        row.style.animation = '';
      }, 600);
    }
  }

  scrollNext() {
    const scroll = this.logoScroll?.nativeElement;
    const row = this.logoRow?.nativeElement;
    if (scroll && row) {
      // Pause animation
      row.style.animation = 'none';
      // If at end, jump to start
      if (scroll.scrollLeft + scroll.offsetWidth >= scroll.scrollWidth) {
        scroll.scrollLeft = scroll.scrollWidth / 3;
      }
      scroll.scrollBy({ left: 200, behavior: 'smooth' });
      setTimeout(() => {
        row.style.animation = '';
      }, 600);
    }
  }

  /** Lista duplicada para carrusel infinito (bucle izquierda → derecha). */
  get displayCompanies(): TrustedByCompany[] {
    const list = this.companies ?? [];
    if (!list.length) return [];
    // Ensure the row is at least 2x the container width for seamless loop
    // Estimate: if < 10 items, duplicate 3x; if < 20, duplicate 2x; else 1x
    if (list.length < 10) return [...list, ...list, ...list];
    if (list.length < 20) return [...list, ...list];
    return [...list];
  }

  getLogoUrl(company: TrustedByCompany): string | undefined {
    if (company.logo) return company.logo;
    const name = company.name?.trim();
    if (name && LOGO_BY_NAME[name]) return LOGO_BY_NAME[name];
    return undefined;
  }
}

