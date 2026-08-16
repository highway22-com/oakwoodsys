import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, signal, inject, input, effect, isDevMode } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, NgClass } from '@angular/common';
import { HttpClient } from '@angular/common/http';
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
    solutions?: {
      ai?: FooterSolutionItem[];
      dataAndAnalytics?: FooterSolutionItem[];
      cloud?: FooterSolutionItem[];
      modernWork?: FooterSolutionItem[];
      security?: FooterSolutionItem[];
      applications?: FooterSolutionItem[];
    };
  };
  copyright: string;
  policies: Array<{
    text: string;
    link: string;
  }>;
}

interface FooterSolutionItem {
  name: string;
  slug?: string;
  link?: string;
}

type FooterSolutionCategoryKey =
  | 'cloud'
  | 'ai'
  | 'dataAndAnalytics'
  | 'security'
  | 'applications'
  | 'modernWork';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, CommonModule, NgClass, AppFooter],
  templateUrl: './footer.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer implements OnInit, OnDestroy {
  private readonly graphql = inject(GraphQLContentService);
  private readonly http = inject(HttpClient);

  /** Cuando se proporciona, se usa en lugar de cargar desde CMS (para preview en edit) */
  readonly dataOverride = input<FooterSection | null>(null);

  readonly footerData = signal<FooterSection | null>(null);
  readonly loading = signal(true);
  readonly openGroupIdx = signal<number | null>(null);
  readonly openSolutions = signal(false);
  readonly openSolutionGroupIdx = signal<number | null>(null);
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
        if (!this.isMobile()) {
          this.openGroupIdx.set(null);
          this.openSolutions.set(false);
          this.openSolutionGroupIdx.set(null);
        }
      };
      window.addEventListener('resize', this.resizeHandler);
    }
    const override = this.dataOverride();
    if (override) {
      this.footerData.set(override);
      this.loading.set(false);
      return;
    }

  //   if (isDevMode()) {
  //     this.http.get<FooterSection>('/footer.json').subscribe({
  //       next: (data) => {
  //         this.footerData.set(data ?? null);
  //         this.loading.set(false);
  //       },
  //       error: () => {
  //         this.loadFooterFromCms();
  //       },
  //     });
  //     return;
  //   }

  //   this.loadFooterFromCms();
  // }

  // private loadFooterFromCms(): void {
    this.graphql.getFooterContent().subscribe({
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

  toggleSolutions() {
    if (!this.isMobile()) return;
    const nextState = !this.openSolutions();
    this.openSolutions.set(nextState);
    if (!nextState) {
      this.openSolutionGroupIdx.set(null);
    }
  }

  toggleSolutionGroup(idx: number) {
    if (!this.isMobile()) return;
    this.openSolutionGroupIdx.set(this.openSolutionGroupIdx() === idx ? null : idx);
  }

  resolveFooterRouterLink(link: { text: string; routerLink: string }): string {
    if (link.text?.trim().toLowerCase() === 'events') return '/resources/events';
    return link.routerLink;
  }

  getFooterEmailHref(email: { text: string; link: string } | null | undefined): string {
    if (!email) return 'mailto:';
    const rawLink = (email.link ?? '').trim();
    if (rawLink.toLowerCase().startsWith('mailto:')) {
      return rawLink;
    }
    const rawAddress = (rawLink || email.text || '').trim();
    return rawAddress ? `mailto:${rawAddress}` : 'mailto:';
  }

  private getSolutionCategoryRouteSegment(category: FooterSolutionCategoryKey): string {
    return category === 'dataAndAnalytics' ? 'data-analytics' : category;
  }

  getFooterSolutionHref(category: FooterSolutionCategoryKey, item: FooterSolutionItem): string {
    const categorySegment = this.getSolutionCategoryRouteSegment(category);
    const rawValue = (item.link ?? item.slug ?? '').trim();
    const normalized = rawValue.replace(/^\/+|\/+$/g, '');
    if (!normalized) {
      return `/solutions/${categorySegment}`;
    }
    const segments = normalized.split('/').filter(Boolean);
    const linkSegment = segments[segments.length - 1] ?? normalized;
    return `/solutions/${categorySegment}/${linkSegment}`;
  }

  solutionGroups(): Array<{ key: FooterSolutionCategoryKey; title: string; links: FooterSolutionItem[] }> {
    const solutions = this.footerData()?.links?.solutions;
    if (!solutions) return [];
    return [
      { key: 'cloud', title: 'Cloud', links: solutions.cloud ?? [] },
      { key: 'ai', title: 'AI', links: solutions.ai ?? [] },
      { key: 'dataAndAnalytics', title: 'Data & Analytics', links: solutions.dataAndAnalytics ?? [] },
      { key: 'security', title: 'Security', links: solutions.security ?? [] },
      { key: 'applications', title: 'Applications', links: solutions.applications ?? [] },
      { key: 'modernWork', title: 'Modern Work', links: solutions.modernWork ?? [] },
    ];
  }

  mobileSolutionGroups(): Array<{ key: FooterSolutionCategoryKey; title: string; links: FooterSolutionItem[] }> {
    const solutions = this.footerData()?.links?.solutions;
    if (!solutions) return [];
    const groups: Array<{ key: FooterSolutionCategoryKey; title: string; links: FooterSolutionItem[] }> = [
      { key: 'ai', title: 'AI', links: solutions.ai ?? [] },
      { key: 'cloud', title: 'Cloud', links: solutions.cloud ?? [] },
      { key: 'dataAndAnalytics', title: 'Data & Analytics', links: solutions.dataAndAnalytics ?? [] },
      { key: 'applications', title: 'Applications', links: solutions.applications ?? [] },
      { key: 'security', title: 'Security', links: solutions.security ?? [] },
      { key: 'modernWork', title: 'Modern Work', links: solutions.modernWork ?? [] },
    ];
    return groups.filter((group) => group.links.length);
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

  getMicrosoftLicensingLink(): { text: string; routerLink: string } | null {
    const companyLinks = this.footerData()?.links?.company ?? [];
    return companyLinks.find((link) => link.text?.trim().toLowerCase() === 'microsoft licensing') ?? null;
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
