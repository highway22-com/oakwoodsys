import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, signal, inject, input, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, NgClass } from '@angular/common';
import { GraphQLContentService } from '../../app/services/graphql-content.service';
import { Footer as AppFooter } from '../../shared/footer/footer';

/** Estructura de la sección footer según CMS (slug: footer). */
export interface FooterSection {
  type: string;
  logo: {
    text: string;
    icon: string;
  };
  contact: {
    heading: string;
    phone: {
      text: string;
      link: string;
    };
    email: {
      text: string;
      link: string;
    };
  };
  socialMedia: Array<{
    name: string;
    link: string;
    icon: string;
  }>;
  links: {
    services: Array<{
      text: string;
      routerLink: string;
    }>;
    industries: Array<{
      text: string;
      routerLink: string;
    }>;
    resources: Array<{
      text: string;
      routerLink: string;
    }>;
    company: Array<{
      text: string;
      routerLink: string;
    }>;
  };
  copyright: string;
  policies: Array<{
    text: string;
    link: string;
  }>;
}

@Component({
  selector: 'app-footer',
  imports: [RouterLink, CommonModule, NgClass, AppFooter],
  templateUrl: './footer.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer implements OnInit, OnDestroy {
  private readonly graphql = inject(GraphQLContentService);

  /** Cuando se proporciona, se usa en lugar de cargar desde CMS (para preview en edit) */
  readonly dataOverride = input<FooterSection | null>(null);

  readonly footerData = signal<FooterSection | null>(null);
  readonly loading = signal(true);
  readonly openGroupIdx = signal<number | null>(null);
  readonly isMobile = signal(false);

  private resizeHandler: (() => void) | null = null;

  constructor() {
    effect(() => {
      const override = this.dataOverride();
      if (override) {
        this.footerData.set(override);
        this.loading.set(false);
      }
    });
  }

  ngOnInit() {
    if (typeof window !== 'undefined') {
      this.isMobile.set(window.innerWidth < 1024);
      this.resizeHandler = () => {
        this.isMobile.set(window.innerWidth < 1024);
        if (!this.isMobile()) this.openGroupIdx.set(null);
      };
      window.addEventListener('resize', this.resizeHandler);
    }
    const override = this.dataOverride();
    if (override) {
      this.footerData.set(override);
      this.loading.set(false);
      return;
    }
    this.graphql.getCmsPageBySlug('footer', { fetchPolicy: 'network-only' }).subscribe({
      next: (data) => {
        const section = this.extractFooterSection(data);
        if (section) {
          this.footerData.set(section);
        } else {
          this.loadFooterFromHome();
        }
        this.loading.set(false);
      },
      error: () => {
        this.loadFooterFromHome();
        this.loading.set(false);
      },
    });
  }

  ngOnDestroy() {
    if (typeof window !== 'undefined' && this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
  }

  // Toggle group open/close (mobile only)
  toggleGroup(idx: number) {
    if (!this.isMobile()) return;
    this.openGroupIdx.set(this.openGroupIdx() === idx ? null : idx);
  }



  /** Grupos de enlaces para iterar en el template (Services, Industries, Resources, Company). */
  linkGroups(): { title: string; links: Array<{ text: string; routerLink: string }> }[] {
    const data = this.footerData();
    if (!data?.links) return [];
    return [
      { title: 'Services', links: data.links.services ?? [] },
      { title: 'Industries', links: data.links.industries ?? [] },
      { title: 'Resources', links: data.links.resources ?? [] },
      { title: 'Company', links: data.links.company ?? [] },
    ];
  }



  private loadFooterFromHome() {
    this.loading.set(false);
    // Opcional: cargar footer desde home si existe página 'home' con sección footer

  }

  private extractFooterSection(data: { type?: string; sections?: Array<{ type?: string;[key: string]: unknown }> } | null): FooterSection | null {
    if (!data) return null;
    // Si el contenido de la página es directamente la sección footer (type === 'footer')
    if ((data as { type?: string }).type === 'footer') {

      return data as unknown as FooterSection;
    }
    // Si viene dentro de sections[] (p. ej. { page: 'footer', sections: [{ type: 'footer', ... }] })

    const section = data.sections?.find(s => s.type === 'footer');
    return section ? (section as unknown as FooterSection) : null;
  }
}
