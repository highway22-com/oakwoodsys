import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  PLATFORM_ID,
  signal,
  computed,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GraphQLContentService } from '../../app/services/graphql-content.service';
import { HttpClient } from '@angular/common/http';
import { Footer } from '../../layout/footer/footer';
import type { FooterSection } from '../../layout/footer/footer';
import { AppNavbar } from '../../layout/app-navbar/app-navbar';
import type { NavbarContent } from '../../layout/app-navbar/app-navbar';
import Industries from '../industries/industries';
import type { IndustriesContent } from '../industries/industries';
import Services from '../services/services';
import type { ServicesContent } from '../services/services';
import { StructuredEngagementsSectionComponent } from '../../shared/sections/structured-engagements/structured-engagements';

@Component({
  selector: 'app-edit-page',
  imports: [CommonModule, RouterLink, FormsModule, Footer, AppNavbar, Industries, Services, StructuredEngagementsSectionComponent],
  templateUrl: './edit-page.html',
  styleUrl: './edit-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class EditPage implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly graphql = inject(GraphQLContentService);
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  readonly slug = signal<string>('');
  readonly label = signal<string>('');
  readonly loading = signal(true);
  readonly editMode = signal(false);
  readonly jsonContentStr = signal('');
  readonly jsonError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly saveSuccess = signal(false);
  readonly panelVisible = signal(false);

  togglePanel() {
    this.panelVisible.set(!this.panelVisible());
  }

  readonly parsedFooterData = computed(() => {
    if (this.slug() !== 'footer') return null;
    try {
      const data = JSON.parse(this.jsonContentStr() || '{}');
      return this.extractFooterSection(data);
    } catch {
      return null;
    }
  });

  readonly parsedNavbarData = computed(() => {
    if (this.slug() !== 'menu') return null;
    try {
      return JSON.parse(this.jsonContentStr() || '{}') as NavbarContent;
    } catch {
      return null;
    }
  });

  readonly parsedIndustriesData = computed(() => {
    if (this.slug() !== 'industries') return null;
    try {
      return JSON.parse(this.jsonContentStr() || '{}') as IndustriesContent;
    } catch {
      return null;
    }
  });

  /** Primer slug disponible en industries para la vista previa */
  readonly industriesPreviewSlug = computed(() => {
    const data = this.parsedIndustriesData();
    if (!data?.industries) return 'healthcare';
    const keys = Object.keys(data.industries);
    return keys[0] ?? 'healthcare';
  });

  readonly parsedServicesData = computed(() => {
    if (this.slug() !== 'services') return null;
    try {
      return JSON.parse(this.jsonContentStr() || '{}') as ServicesContent;
    } catch {
      return null;
    }
  });

  readonly servicesPreviewSlug = computed(() => {
    const data = this.parsedServicesData();
    if (!data?.services) return 'data-ai-solutions';
    const keys = Object.keys(data.services);
    return keys[0] ?? 'data-ai-solutions';
  });

  readonly parsedStructuredEngagementsData = computed(() => {
    if (this.slug() !== 'structured-engagements') return null;
    try {
      return JSON.parse(this.jsonContentStr() || '{}');
    } catch {
      return null;
    }
  });

  private extractFooterSection(data: {
    type?: string;
    sections?: Array<{ type?: string }>;
  } | null): FooterSection | null {
    if (!data) return null;
    if ((data as { type?: string }).type === 'footer') {
      return data as unknown as FooterSection;
    }
    const section = data.sections?.find((s) => s.type === 'footer');
    return section ? (section as unknown as FooterSection) : null;
  }

  private readonly slugLabels: Record<string, string> = {
    home: 'Home',
    footer: 'Footer',
    menu: 'Menu',
    industries: 'Industries',
    services: 'Services',
    resources: 'Resources',
    'structured-engagements': 'Structured Engagements',
    about: 'About',
  };

  ngOnInit() {
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const enabled = params['edit'] === 'true';
        this.editMode.set(enabled);
        if (!enabled) {
          this.router.navigate(['/edit'], { queryParams: { edit: 'true' } });
          return;
        }
      });

    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const s = params.get('slug') ?? '';
        this.slug.set(s);
        this.label.set(this.slugLabels[s] ?? s);
        this.loadContent(s);
      });
  }

  private loadContent(slug: string) {
    if (!slug) {
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.jsonError.set(null);

    if (slug === 'industries') {
      this.graphql.getIndustriesContent().subscribe({
        next: (data) => {
          if (data) {
            this.jsonContentStr.set(JSON.stringify(data, null, 2));
          } else {
            this.loadEditPageFromStatic(slug, '/industries-content.json');
            return;
          }
          this.loading.set(false);
        },
        error: () => this.loadEditPageFromStatic(slug, '/industries-content.json'),
      });
      return;
    }

    if (slug === 'menu') {
      this.graphql.getMenuContent().subscribe({
        next: (data) => {
          if (data) {
            this.jsonContentStr.set(JSON.stringify(data, null, 2));
          } else {
            this.loadEditPageFromStatic(slug, '/navbar-content.json');
            return;
          }
          this.loading.set(false);
        },
        error: () => this.loadEditPageFromStatic(slug, '/navbar-content.json'),
      });
      return;
    }

    if (slug === 'services') {
      this.graphql.getServicesContent().subscribe({
        next: (data) => {
          if (data) {
            this.jsonContentStr.set(JSON.stringify(data, null, 2));
          } else {
            this.loadEditPageFromStatic(slug, '/services-content.json');
            return;
          }
          this.loading.set(false);
        },
        error: () => this.loadEditPageFromStatic(slug, '/services-content.json'),
      });
      return;
    }

    if (slug === 'resources') {
      this.graphql.getResourcesContent().subscribe({
        next: (data) => {
          if (data) {
            this.jsonContentStr.set(JSON.stringify(data, null, 2));
          } else {
            this.loadEditPageFromStatic(slug, '/resources-content.json');
            return;
          }
          this.loading.set(false);
        },
        error: () => this.loadEditPageFromStatic(slug, '/resources-content.json'),
      });
      return;
    }

    if (slug === 'structured-engagements') {
      this.graphql.getStructuredEngagementsContent().subscribe({
        next: (data) => {
          if (data) {
            this.jsonContentStr.set(JSON.stringify(data, null, 2));
          } else {
            this.loadEditPageFromStatic(slug, '/structured-engagement-section.json');
            return;
          }
          this.loading.set(false);
        },
        error: () => this.loadEditPageFromStatic(slug, '/structured-engagement-section.json'),
      });
      return;
    }

    if (slug === 'about') {
      this.graphql.getAboutContent().subscribe({
        next: (data) => {
          if (data) {
            this.jsonContentStr.set(JSON.stringify(data, null, 2));
          } else {
            this.loadEditPageFromStatic(slug, '/about-content.json');
            return;
          }
          this.loading.set(false);
        },
        error: () => this.loadEditPageFromStatic(slug, '/about-content.json'),
      });
      return;
    }

    this.graphql.getCmsPageBySlug(slug).subscribe({
      next: (data) => {
        if (data) {
          this.jsonContentStr.set(JSON.stringify(data, null, 2));
        } else {
          this.jsonError.set(`No se encontró contenido para ${slug}`);
          this.jsonContentStr.set('{}');
        }
        this.loading.set(false);
      },
      error: () => {
        this.jsonError.set(`No se pudo cargar el contenido de ${slug}`);
        this.jsonContentStr.set('{}');
        this.loading.set(false);
      },
    });
  }

  onJsonChange(value: string) {
    this.jsonContentStr.set(value);
    try {
      JSON.parse(value);
      this.jsonError.set(null);
    } catch (error) {
      this.jsonError.set(
        'JSON inválido: ' +
          (error instanceof Error ? error.message : 'Error desconocido')
      );
    }
  }

  private loadEditPageFromStatic(slug: string, url: string) {
    this.http.get(url).subscribe({
      next: (data) => {
        this.jsonContentStr.set(JSON.stringify(data, null, 2));
        this.loading.set(false);
      },
      error: () => {
        this.jsonError.set(`No se pudo cargar el contenido de ${slug}`);
        this.jsonContentStr.set('{}');
        this.loading.set(false);
      },
    });
  }

  copyToClipboard() {
    if (this.jsonError()) return;

    this.saving.set(true);
    this.saveSuccess.set(false);

    if (!isPlatformBrowser(this.platformId)) {
      this.saving.set(false);
      return;
    }

    navigator.clipboard
      .writeText(this.jsonContentStr())
      .then(
        () => {
          this.saveSuccess.set(true);
          setTimeout(() => this.saveSuccess.set(false), 3000);
        },
        () => alert('No se pudo copiar al portapapeles.')
      )
      .finally(() => this.saving.set(false));
  }
}
