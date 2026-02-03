import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  PLATFORM_ID,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

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
export class TrustedBySectionComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() title = '';
  @Input() companies: TrustedByCompany[] = [];
  @ViewChild('scrollContainer') scrollContainer?: ElementRef<HTMLDivElement>;

  private readonly platformId = inject(PLATFORM_ID);
  private readonly scrollAmount = 280;
  private autoScrollTimer: ReturnType<typeof setInterval> | null = null;
  private readonly autoScrollIntervalMs = 30;
  private readonly autoScrollPx = 1;

  /** Lista duplicada para carrusel infinito (bucle izquierda → derecha). */
  get displayCompanies(): TrustedByCompany[] {
    const list = this.companies ?? [];
    return list.length ? [...list, ...list] : [];
  }

  ngAfterViewInit(): void {
    this.startAutoScroll();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['companies'] && this.scrollContainer?.nativeElement) {
      this.startAutoScroll();
    }
  }

  ngOnDestroy(): void {
    this.stopAutoScroll();
  }

  private startAutoScroll(): void {
    this.stopAutoScroll();
    if (!isPlatformBrowser(this.platformId) || !this.companies?.length) return;
    this.autoScrollTimer = setInterval(() => {
      const el = this.scrollContainer?.nativeElement as HTMLElement | undefined;
      if (!el || typeof el.scrollBy !== 'function') return;
      el.scrollBy({ left: this.autoScrollPx, behavior: 'auto' });
      this.onScroll();
    }, this.autoScrollIntervalMs);
  }

  private stopAutoScroll(): void {
    if (this.autoScrollTimer) {
      clearInterval(this.autoScrollTimer);
      this.autoScrollTimer = null;
    }
  }

  /** Pausa la animación al pasar el ratón (para usar los botones). */
  onCarouselMouseEnter(): void {
    this.stopAutoScroll();
  }

  /** Reanuda la animación al salir el ratón. */
  onCarouselMouseLeave(): void {
    this.startAutoScroll();
  }

  getLogoUrl(company: TrustedByCompany): string | undefined {
    if (company.logo) return company.logo;
    const name = company.name?.trim();
    if (name && LOGO_BY_NAME[name]) return LOGO_BY_NAME[name];
    return undefined;
  }

  /** Ajusta la posición al cruzar la mitad para efecto infinito (bucle). */
  onScroll(): void {
    const el = this.scrollContainer?.nativeElement;
    if (!el) return;
    const half = el.scrollWidth / 2;
    if (el.scrollLeft >= half) {
      el.scrollLeft = el.scrollLeft - half;
    }
  }

  scrollPrev(): void {
    const el = this.scrollContainer?.nativeElement;
    if (!el) return;
    const half = el.scrollWidth / 2;
    if (el.scrollLeft < this.scrollAmount) {
      el.scrollLeft = half + el.scrollLeft;
    }
    el.scrollBy({ left: -this.scrollAmount, behavior: 'smooth' });
    setTimeout(() => this.onScroll(), 350);
  }

  scrollNext(): void {
    const el = this.scrollContainer?.nativeElement;
    if (!el) return;
    el.scrollBy({ left: this.scrollAmount, behavior: 'smooth' });
    setTimeout(() => this.onScroll(), 350);
  }
}
