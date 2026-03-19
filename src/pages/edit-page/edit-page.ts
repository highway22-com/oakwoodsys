import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
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
import { combineLatest } from 'rxjs';
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
import { Structured, StructuredPageContent } from '../structured/structured';
import { StructuredOffer, StructuredOfferPageConfig } from '../structured-offer/structured-offer';
import Home from '../home/home';
import AboutUs, { type AboutContent } from '../about-us/about-us';
import { ContactUs } from '../contact-us/contact-us';
import type { CmsPageContent } from '../../app/api/graphql';
import { EditorComponent } from 'ngx-monaco-editor-v2';

@Component({
  selector: 'app-edit-page',
  imports: [CommonModule, RouterLink, FormsModule, Footer, AppNavbar, Industries, Services, StructuredEngagementsSectionComponent, Structured, StructuredOffer, Home, AboutUs, ContactUs, EditorComponent],
  templateUrl: './edit-page.html',
  styleUrl: './edit-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class EditPage implements OnInit {
  readonly router = inject(Router);
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

  readonly monacoEditorOptions = {
    theme: 'vs',
    language: 'json',
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    formatOnPaste: true,
    formatOnType: true,
  };
  readonly saving = signal(false);
  readonly saveSuccess = signal(false);
  readonly panelVisible = signal(false);
  readonly panelWidthPercent = signal(50);
  private isResizingPanel = false;

  readonly panelWidthStyle = computed(() => `${this.panelWidthPercent()}vw`);

  togglePanel() {
    this.panelVisible.set(!this.panelVisible());
  }

  startPanelResize(event: MouseEvent) {
    event.preventDefault();
    this.isResizingPanel = true;
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'o') {
      event.preventDefault();
      this.togglePanel();
    }
  }

  @HostListener('document:mousemove', ['$event'])
  onDocumentMouseMove(event: MouseEvent) {
    if (!this.isResizingPanel || !isPlatformBrowser(this.platformId)) return;
    const viewportWidth = window.innerWidth || 1;
    const panelWidth = viewportWidth - event.clientX;
    const percent = (panelWidth / viewportWidth) * 100;
    this.panelWidthPercent.set(Math.max(25, Math.min(75, Math.round(percent))));
  }

  @HostListener('document:mouseup')
  onDocumentMouseUp() {
    this.isResizingPanel = false;
  }

  onServiceSelect(serviceSlug: string) {
    this.selectedServiceSlug.set(serviceSlug);
    this.router.navigate(['/edit', 'services'], {
      queryParams: { edit: 'true', service: serviceSlug },
    });
    // Cargar el JSON del servicio seleccionado directamente para que el panel se actualice
    this.loadServiceContent(serviceSlug);
  }

  onIndustrySelect(industrySlug: string) {
    this.selectedIndustrySlug.set(industrySlug);
    this.router.navigate(['/edit', 'industries'], {
      queryParams: { edit: 'true', industry: industrySlug },
    });
  }

  onStructuredOfferSelect(offerSlug: string) {
    this.selectedStructuredOfferSlug.set(offerSlug);
    this.router.navigate(['/edit', 'structured-engagement-offer-page'], {
      queryParams: { edit: 'true', offer: offerSlug },
    });
  }

  /** Carga el contenido de un servicio: primero GraphQL (último del CMS), si falla usa el archivo estático */
  private loadServiceContent(serviceSlug: string) {
    this.loading.set(true);
    this.jsonError.set(null);
    this.graphql.getServicesContent().subscribe({
      next: (data) => {
        if (data?.services && serviceSlug in data.services) {
          const singleService = { services: { [serviceSlug]: data.services[serviceSlug] } };
          this.jsonContentStr.set(JSON.stringify(singleService, null, 2));
        } else {
          this.loadServiceFromStatic(serviceSlug);
          return;
        }
        this.loading.set(false);
      },
      error: () => this.loadServiceFromStatic(serviceSlug),
    });
  }

  private loadServiceFromStatic(serviceSlug: string) {
    this.http.get<ServicesContent>(`/service-${serviceSlug}.json`).subscribe({
      next: (content) => {
        this.jsonContentStr.set(JSON.stringify(content, null, 2));
        this.loading.set(false);
      },
      error: () => {
        this.jsonError.set('No se pudo cargar el contenido del servicio');
        this.loading.set(false);
      },
    });
  }

  /** Carga una industria específica: primero CMS por slug (industries-{slug}), fallback a contenido agregado. */
  private loadIndustryContent(industrySlug: string) {
    this.loading.set(true);
    this.jsonError.set(null);

    this.graphql.getIndustryByCMSSlug(industrySlug).subscribe({
      next: (data) => {
        if (data) {
          this.jsonContentStr.set(JSON.stringify(data, null, 2));
          this.loading.set(false);
          return;
        }

        this.graphql.getIndustriesContent().subscribe({
          next: (allData) => {
            if (allData) {
              this.jsonContentStr.set(JSON.stringify(allData, null, 2));
            } else {
              this.loadEditPageFromStatic('industries', '/industries-content.json');
              return;
            }
            this.loading.set(false);
          },
          error: () => this.loadEditPageFromStatic('industries', '/industries-content.json'),
        });
      },
      error: () => {
        this.graphql.getIndustriesContent().subscribe({
          next: (allData) => {
            if (allData) {
              this.jsonContentStr.set(JSON.stringify(allData, null, 2));
            } else {
              this.loadEditPageFromStatic('industries', '/industries-content.json');
              return;
            }
            this.loading.set(false);
          },
          error: () => this.loadEditPageFromStatic('industries', '/industries-content.json'),
        });
      },
    });
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

  /** Slug del servicio seleccionado para editar (desde query param o del contenido cargado) */
  readonly selectedServiceSlug = signal<string>('data-ai-solutions');
  /** Slug de la industria seleccionada para editar (desde query param o menú). */
  readonly selectedIndustrySlug = signal<string>('healthcare');
  /** Slugs de industrias para el selector en /edit/industries (se obtienen desde menu). */
  readonly industrySlugs = signal<string[]>(['healthcare']);
  /** Offer slug selected for structured-offer preview. */
  readonly selectedStructuredOfferSlug = signal<string>('sql-server-migration-to-azure');

  /** Slug a usar en la vista previa de services (el seleccionado si existe en los datos) */
  readonly servicesSlugForPreview = computed(() => {
    const data = this.parsedServicesData();
    const selected = this.selectedServiceSlug();
    if (data?.services && selected in data.services) return selected;
    return this.servicesPreviewSlug();
  });

  /** Slug a usar en la vista previa de industries (el seleccionado si existe en los datos). */
  readonly industriesSlugForPreview = computed(() => {
    const data = this.parsedIndustriesData();
    const selected = this.selectedIndustrySlug();
    if (data?.industries && selected in data.industries) return selected;
    return this.industriesPreviewSlug();
  });

  readonly parsedStructuredEngagementsData = computed(() => {
    if (this.slug() !== 'structured-engagements') return null;
    try {
      return JSON.parse(this.jsonContentStr() || '{}');
    } catch {
      return null;
    }
  });

  readonly parsedHomeData = computed(() => {
    if (this.slug() !== 'home') return null;
    try {
      return JSON.parse(this.jsonContentStr() || '{}') as CmsPageContent;
    } catch {
      return null;
    }
  });

  readonly parsedStructuredPageData = computed(() => {
    if (this.slug() !== 'structured-engagement-page') return null;
    try {
      return JSON.parse(this.jsonContentStr() || '{}') as StructuredPageContent;
    } catch {
      return null;
    }
  });

  readonly parsedStructuredOfferPageData = computed(() => {
    if (this.slug() !== 'structured-engagement-offer-page') return null;
    try {
      const parsed = JSON.parse(this.jsonContentStr() || '{}') as Record<string, unknown>;
      return this.asStructuredOfferPageConfig(parsed);
    } catch {
      return null;
    }
  });

  readonly parsedAboutData = computed(() => {
    if (this.slug() !== 'about') return null;
    try {
      return JSON.parse(this.jsonContentStr() || '{}') as AboutContent;
    } catch {
      return null;
    }
  });

  readonly parsedContactUsData = computed(() => {
    if (this.slug() !== 'contact-us') return null;
    try {
      const parsed = JSON.parse(this.jsonContentStr() || '{}') as Record<string, unknown>;
      const wrapped = parsed['content'];
      if (wrapped && typeof wrapped === 'object') {
        return wrapped;
      }
      return parsed;
    } catch {
      return null;
    }
  });

  readonly structuredOfferSlugs = computed(() => {
    const cfg = this.parsedStructuredOfferPageData();
    return Object.entries(cfg?.offers ?? {})
      .filter(([, value]) => Boolean(value))
      .map(([key]) => key);
  });

  readonly structuredOfferSlugForPreview = computed(() => {
    const available = this.structuredOfferSlugs();
    const selected = this.selectedStructuredOfferSlug();
    if (available.includes(selected)) return selected;
    return available[0] ?? 'sql-server-migration-to-azure';
  });

  readonly structuredOfferPageDataForPreview = computed(() => {
    const cfg = this.parsedStructuredOfferPageData();
    if (!cfg) return null;

    const selectedSlug = this.structuredOfferSlugForPreview();
    const selectedOffer = cfg.offers?.[selectedSlug];
    if (!selectedOffer) return cfg;

    return {
      ...cfg,
      offers: {
        [selectedSlug]: selectedOffer,
      },
    } as StructuredOfferPageConfig;
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
    'structured-engagement-page': 'Structured Page',
    'structured-engagement-offer-page': 'Structured Offer Page',
    about: 'About',
    'contact-us': 'Contact Us',
  };

  /** Slugs de servicios para el selector en /edit/services */
  readonly serviceSlugs = [
    'data-ai-solutions',
    'cloud-and-infrastructure',
    'application-innovation',
    'high-performance-computing-hpc',
    'modern-work',
    'managed-services',
  ] as const;

  ngOnInit() {
    this.loadIndustrySlugsFromMenu();

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

    combineLatest([this.route.paramMap, this.route.queryParams])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([params, queryParams]) => {
        const s = params.get('slug') ?? '';
        this.slug.set(s);
        this.label.set(this.slugLabels[s] ?? s);
        this.loadContent(s, queryParams);
      });
  }

  private loadContent(slug: string, queryParams: Record<string, string | string[] | undefined> = {}) {
    if (!slug) {
      this.loading.set(false);
      return;
    }

    // All structured-offer offers come from a single API slug, so once the page
    // config is in memory an offer switch only needs to update the signal.
    // This must run BEFORE loading=true to avoid unmount/remount flicker.
    if (slug === 'structured-engagement-offer-page' && this.parsedStructuredOfferPageData() !== null) {
      const offerSlug = this.readOfferQueryParam(queryParams['offer']) ?? this.selectedStructuredOfferSlug();
      const available = this.structuredOfferSlugs();
      const resolved = available.includes(offerSlug) ? offerSlug : (available[0] ?? offerSlug);
      this.selectedStructuredOfferSlug.set(resolved);
      return;
    }

    this.loading.set(true);
    this.jsonError.set(null);

    if (slug === 'home') {
      this.graphql.getCmsPageBySlug('home').subscribe({
        next: (data) => {
          if (data) {
            this.jsonContentStr.set(JSON.stringify(data, null, 2));
          } else {
            this.loadEditPageFromStatic(slug, '/home-content.json');
            return;
          }
          this.loading.set(false);
        },
        error: () => this.loadEditPageFromStatic(slug, '/home-content.json'),
      });
      return;
    }

    if (slug === 'industries') {
      const industryParam = queryParams['industry'];
      const industrySlug = (typeof industryParam === 'string' ? industryParam : null) ?? this.selectedIndustrySlug();
      this.selectedIndustrySlug.set(industrySlug);

      this.loadIndustryContent(industrySlug);
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
      const serviceParam = queryParams['service'];
      const serviceSlug = (typeof serviceParam === 'string' ? serviceParam : null) ?? 'data-ai-solutions';
      this.selectedServiceSlug.set(serviceSlug);
      this.graphql.getServicesContent().subscribe({
        next: (data) => {
          if (data?.services && serviceSlug in data.services) {
            const singleService = { services: { [serviceSlug]: data.services[serviceSlug] } };
            this.jsonContentStr.set(JSON.stringify(singleService, null, 2));
          } else if (data) {
            this.jsonContentStr.set(JSON.stringify(data, null, 2));
          } else {
            this.loadEditPageFromStatic(slug, `/service-${serviceSlug}.json`);
            return;
          }
          this.loading.set(false);
        },
        error: () => this.loadEditPageFromStatic(slug, `/service-${serviceSlug}.json`),
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

    if (slug === 'contact-us') {
      this.loadEditPageFromStatic(slug, '/contact-us-content.json');
      return;
    }

    if (slug === 'structured-engagement-offer-page') {
      const offerParam = this.readOfferQueryParam(queryParams['offer']);
      const offerSlug = offerParam ?? this.selectedStructuredOfferSlug();
      this.selectedStructuredOfferSlug.set(offerSlug);

      this.graphql.getStructuredEngagementOfferPageContent().subscribe({
        next: (data) => {
          const parsed = this.asStructuredOfferPageConfig(data as Record<string, unknown> | null);
          if (parsed) {
            this.jsonContentStr.set(JSON.stringify(parsed, null, 2));
            const keys = Object.entries(parsed.offers ?? {})
              .filter(([, value]) => Boolean(value))
              .map(([key]) => key);
            if (keys.length > 0) {
              // Re-read the param so we always honour the URL value, not a stale signal.
              const currentOffer = this.selectedStructuredOfferSlug();
              const resolved = keys.includes(currentOffer) ? currentOffer : keys[0];
              this.selectedStructuredOfferSlug.set(resolved);
              // Only navigate if this was an initial load with no offer in the URL.
              if (!offerParam) {
                this.router.navigate(['/edit', 'structured-engagement-offer-page'], {
                  queryParams: { edit: 'true', offer: resolved },
                  replaceUrl: true,
                });
              }
            }
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

  private readOfferQueryParam(value: string | string[] | undefined): string | null {
    const raw = Array.isArray(value) ? value[0] : value;
    if (typeof raw !== 'string') return null;

    const decoded = decodeURIComponent(raw).trim();
    if (!decoded) return null;

    // Handle malformed values like "http://.../edit?...&offer=slug".
    const marker = 'offer=';
    const markerIndex = decoded.lastIndexOf(marker);
    if (markerIndex >= 0) {
      const extracted = decoded.slice(markerIndex + marker.length).split('&')[0].trim();
      return extracted || null;
    }

    return decoded;
  }

  private loadIndustrySlugsFromMenu() {
    this.graphql.getMenuContent().subscribe({
      next: (data) => {
        const slugs = this.extractIndustrySlugsFromMenu(data as { content?: { industries?: Array<{ link?: string }> } });
        if (slugs.length > 0) {
          this.industrySlugs.set(slugs);
          if (!slugs.includes(this.selectedIndustrySlug())) {
            this.selectedIndustrySlug.set(slugs[0]);
          }
          return;
        }
        this.loadIndustrySlugsFromStaticMenu();
      },
      error: () => this.loadIndustrySlugsFromStaticMenu(),
    });
  }

  private loadIndustrySlugsFromStaticMenu() {
    this.http.get<NavbarContent>('/navbar-content.json').subscribe({
      next: (data) => {
        const slugs = this.extractIndustrySlugsFromMenu(data as { content?: { industries?: Array<{ link?: string }> } });
        if (slugs.length > 0) {
          this.industrySlugs.set(slugs);
          if (!slugs.includes(this.selectedIndustrySlug())) {
            this.selectedIndustrySlug.set(slugs[0]);
          }
        }
      },
      error: () => {
        // Keep default fallback slug when menu is unavailable.
      },
    });
  }

  private extractIndustrySlugsFromMenu(data: { content?: { industries?: Array<{ link?: string }> } } | null): string[] {
    const links = data?.content?.industries ?? [];
    const slugs = links
      .map((item) => item.link ?? '')
      .map((link) => {
        const match = link.match(/\/industries\/([^/?#]+)/i);
        return match?.[1] ?? '';
      })
      .filter((slug) => Boolean(slug));

    return Array.from(new Set(slugs));
  }

  private asStructuredOfferPageConfig(data: Record<string, unknown> | null): StructuredOfferPageConfig | null {
    if (!data || typeof data !== 'object') return null;

    const candidate = data as Partial<StructuredOfferPageConfig>;
    if (candidate.offers && typeof candidate.offers === 'object') {
      return candidate as StructuredOfferPageConfig;
    }

    const wrapped = data as { content?: Partial<StructuredOfferPageConfig>; page?: string };
    if (wrapped.content?.offers && typeof wrapped.content.offers === 'object') {
      return wrapped.content as StructuredOfferPageConfig;
    }

    return null;
  }

  onJsonChange(value: string) {
    this.jsonContentStr.set(value);
    this.validateJson(value);
  }

  private validateJson(value: string) {
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
