import { ChangeDetectionStrategy, Component, inject, OnInit, PLATFORM_ID, signal, DOCUMENT } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule, NgClass, isPlatformBrowser } from '@angular/common';
import { Title, Meta, DomSanitizer } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { VideoHero } from '../../shared/video-hero/video-hero';
import { FeaturedCaseStudySectionComponent } from '../../shared/sections/featured-case-study/featured-case-study';
import { GraphQLContentService } from '../../app/services/graphql-content.service';
import type { CmsPageContent, CmsSection } from '../../app/api/graphql';
import { TrustedBySectionComponent } from '../../shared/sections/trusted-by/trusted-by';
import { StructuredEngagementsSectionComponent } from '../../shared/sections/structured-engagements/structured-engagements';
import { LatestInsightsSectionComponent } from '../../shared/sections/latest-insights/latest-insights';

@Component({
  selector: 'app-home',
  imports: [CommonModule, NgClass, FormsModule, VideoHero, FeaturedCaseStudySectionComponent, TrustedBySectionComponent, StructuredEngagementsSectionComponent, LatestInsightsSectionComponent],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home implements OnInit {
  readonly content = signal<CmsPageContent | null>(null);
  readonly loading = signal(true);
  readonly videoUrls = signal<string[]>([]);

  private readonly graphql = inject(GraphQLContentService);
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly document = inject(DOCUMENT);
  readonly sanitizer = inject(DomSanitizer);
  readonly posts = signal<any>(null);
  readonly error = signal<any>(null);
  readonly structuredData = signal<any>(null);
  readonly isAdmin = signal(false);
  readonly saving = signal(false);
  readonly saveSuccess = signal(false);
  readonly panelVisible = signal(false);
  jsonContent: string = '';
  readonly jsonError = signal<string | null>(null);

  constructor() { }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('admin_token');
      this.isAdmin.set(!!token);
    }

    // Cargar contenido desde GraphQL (Oakwood CMS: cmsPage(slug: "home"))
    this.graphql.getCmsPageBySlug('home').subscribe({
      next: (data) => {
        console.log('Data from GraphQL:', data);
        if (data) {
          console.log('[Home] Content loaded from GraphQL (cmsPage home)');
          this.applyContent(data);
        }
      },
      error: () => {
        console.log('Error al cargar el contenido desde GraphQL');
        this.fallbackToHomeContentApi();
      }
    });
  }

  private applyContent(data: CmsPageContent) {
    this.content.set(data);
    if (data.videoUrls && data.videoUrls.length > 0) {
      const links = data.videoUrls.filter((url): url is string => typeof url === 'string' && url.trim().length > 0);
      if (links.length > 0) {
        this.videoUrls.set(links);
      }
    }
    if (this.isAdmin()) {
      this.jsonContent = JSON.stringify(data, null, 2);
    }
    this.updateMetadata(data);
    this.updateStructuredData(data);
    this.loading.set(false);
  }

  private fallbackToHomeContentApi() {
    console.warn('[Home] GraphQL returned nothing, falling back to /api/home-content');
    const token = isPlatformBrowser(this.platformId) ? localStorage.getItem('admin_token') : null;
    const headers: { [key: string]: string } = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    this.http.get<CmsPageContent>('/api/home-content', { headers }).subscribe({
      next: (data) => {
        console.log('[Home] Content loaded from /api/home-content');
        this.applyContent(data);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  getSection(type: string) {
    return this.content()?.sections.find(s => s.type === type);
  }

  /** Título de una sección como string (CMS puede devolver title como string o { line1, line2 }). */
  getSectionTitle(section: CmsSection): string {
    const t = section?.title;
    if (typeof t === 'string') return t;
    if (t && typeof t === 'object') return [t.line1, t.line2].filter(Boolean).join(' ') || '';
    return '';
  }

  /** Misma referencia siempre para evitar que el hijo recargue en cada change detection. */
  private readonly defaultFeaturedSlugs: string[] = [
    'secure-azure-research-environment-architecture',
    'enterprise-reporting-and-data-roadmap-development',
  ];

  /** Slugs para app-featured-case-study (desde la sección del bucle o por defecto). */
  getSlugsForFeaturedSection(section: CmsSection): string[] {
    const slugs = section?.['slugsFeaturedCaseStudies'];
    if (Array.isArray(slugs) && slugs.length > 0) return slugs;
    return this.defaultFeaturedSlugs;
  }

  /** Título del hero (desde sección hero o vacío). */
  heroTitle(): string {
    const section = this.getSection('hero');
    const t = section?.title;
    return (typeof t === 'string' ? t : '') || '';
  }

  /** Descripción del hero (desde sección hero o vacío). */
  heroDescription(): string {
    const section = this.getSection('hero');
    const d = section?.description;
    return (typeof d === 'string' ? d : '') || '';
  }

  /** CTA principal del hero (desde sección hero). */
  heroCtaPrimary(): { text: string; link: string; backgroundColor: string } | undefined {
    const section = this.getSection('hero');
    return section ? this.getCtaPrimary(section) : undefined;
  }

  /** CTA secundario del hero (desde sección hero). */
  heroCtaSecondary(): { text: string; link: string; borderColor: string } | undefined {
    const section = this.getSection('hero');
    return section ? this.getCtaSecondary(section) : undefined;
  }

  /** Normaliza ctaPrimary para app-video-hero (text, link, backgroundColor requeridos). */
  getCtaPrimary(section: CmsSection): { text: string; link: string; backgroundColor: string } | undefined {
    const cta = section.cta;
    if (!cta) return undefined;
    return {
      text: (cta.text ?? ''),
      link: (cta.link ?? '/contact-us'),
      backgroundColor: (cta.backgroundColor ?? ''),
    };
  }

  /** Normaliza ctaSecondary para app-video-hero (text, link, borderColor requeridos). */
  getCtaSecondary(section: CmsSection): { text: string; link: string; borderColor: string } | undefined {
    const cta = section.ctaSecondary;
    if (!cta) return undefined;
    return {
      text: (cta.text ?? ''),
      link: (cta.link ?? '#'),
      borderColor: (cta.borderColor ?? ''),
    };
  }

  private updateMetadata(content: CmsPageContent) {
    const heroSection = content.sections?.find(s => s.type === 'hero');
    const heroTitle = (heroSection?.['title'] ?? '') as string;
    const heroDesc = (heroSection?.['description'] ?? '') as string;
    const pageTitle = heroTitle ? `${heroTitle} | Oakwood Systems` : 'Oakwood Systems - Microsoft Solutions Partner';

    this.titleService.setTitle(pageTitle);

    const description = heroDesc ||
      'Oakwood Systems is a certified Microsoft Solutions Partner specializing in Data & AI, Cloud Infrastructure, Application Innovation, and Modern Work solutions.';
    this.metaService.updateTag({ name: 'description', content: description });

    this.metaService.updateTag({ property: 'og:title', content: heroTitle || 'Oakwood Systems' });
    this.metaService.updateTag({ property: 'og:description', content: description });
    this.metaService.updateTag({ property: 'og:type', content: 'website' });
    this.metaService.updateTag({ property: 'og:url', content: 'https://oakwoodsys.com' });
    if (content.videoUrls && content.videoUrls.length > 0) {
      this.metaService.updateTag({ property: 'og:image', content: 'https://oakwoodsys.com/og-image.jpg' });
    }

    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:title', content: heroTitle || 'Oakwood Systems' });
    this.metaService.updateTag({ name: 'twitter:description', content: description });

    const head = this.document.getElementsByTagName('head')[0];
    if (head) {
      let linkEl = this.document.querySelector('link[rel="canonical"]');
      if (!linkEl) {
        linkEl = this.document.createElement('link');
        linkEl.setAttribute('rel', 'canonical');
        head.appendChild(linkEl);
      }
      linkEl.setAttribute('href', 'https://oakwoodsys.com/');
    }
  }

  private updateStructuredData(content: CmsPageContent) {
    const heroSection = content.sections?.find(s => s.type === 'hero');
    const heroDesc = (heroSection?.['description'] ?? '') as string;

    const structuredDataObj = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      'name': 'Oakwood Systems',
      'url': 'https://oakwoodsys.com',
      'description': heroDesc || 'Microsoft Solutions Partner',
      'logo': 'https://oakwoodsys.com/logo.png',
      'sameAs': [
        // Add social media links if available
      ],
      'contactPoint': {
        '@type': 'ContactPoint',
        'contactType': 'Customer Service',
        'url': 'https://oakwoodsys.com/contact-us'
      }
    };

    this.structuredData.set(structuredDataObj);
  }

  getStructuredDataJson(): string {
    const data = this.structuredData();
    return data ? JSON.stringify(data) : '';
  }

  togglePanel() {
    this.panelVisible.set(!this.panelVisible());
  }

  onJsonChange(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.jsonContent = target.value;

    try {
      const parsed = JSON.parse(this.jsonContent);
      this.jsonError.set(null);

      // Update content in real-time
      this.content.set(parsed);

      // Update video URLs if present (solo enlaces válidos no vacíos)
      if (parsed.videoUrls && Array.isArray(parsed.videoUrls) && parsed.videoUrls.length > 0) {
        const links = parsed.videoUrls.filter((url: unknown): url is string => typeof url === 'string' && url.trim().length > 0);
        this.videoUrls.set(links);
      }

      // Update metadata and structured data
      this.updateMetadata(parsed);
      this.updateStructuredData(parsed);
    } catch (error) {
      this.jsonError.set('JSON inválido: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  }

  /** Copia el contenido JSON del editor al portapapeles. */
  copyToClipboard() {
    if (!this.content() || this.jsonError()) return;

    this.saving.set(true);
    this.saveSuccess.set(false);

    if (!isPlatformBrowser(this.platformId)) {
      this.saving.set(false);
      return;
    }

    navigator.clipboard.writeText(this.jsonContent).then(
      () => {
        this.saveSuccess.set(true);
        setTimeout(() => this.saveSuccess.set(false), 3000);
      },
      () => {
        alert('No se pudo copiar al portapapeles.');
      }
    ).finally(() => {
      this.saving.set(false);
    });
  }
}
