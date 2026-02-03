import { ChangeDetectionStrategy, Component, OnInit, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, NgClass } from '@angular/common';
import { GraphQLContentService } from '../../app/services/graphql-content.service';

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
  imports: [RouterLink, CommonModule, NgClass],
  templateUrl: './footer.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer implements OnInit {
  private readonly graphql = inject(GraphQLContentService);

  readonly footerData = signal<FooterSection | null>(null);
  readonly loading = signal(true);

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

  ngOnInit() {
    this.graphql.getCmsPageBySlug('footer').subscribe({
      next: (data) => {
        const section = this.extractFooterSection(data);
        if (section) {
          this.footerData.set(section);
          this.loading.set(false);
          return;
        }
        this.loadFooterFromHome();
      },
      error: () => {
        this.loadFooterFromHome();
      }
    });
  }

  private loadFooterFromHome() {
    this.graphql.getCmsPageBySlug('home').subscribe({
      next: (data) => {
        const section = this.extractFooterSection(data);
        if (section) {
          this.footerData.set(section);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  private extractFooterSection(data: { sections?: Array<{ type?: string; [key: string]: unknown }> } | null): FooterSection | null {
    const section = data?.sections?.find(s => s.type === 'footer');
    return section ? (section as unknown as FooterSection) : null;
  }
}
