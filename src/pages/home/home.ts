
import { Router } from '@angular/router';


import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, PLATFORM_ID, signal, DOCUMENT } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, NgClass, isPlatformBrowser } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { VideoHero } from '../../shared/video-hero/video-hero';
import { FeaturedCaseStudySectionComponent } from '../../shared/sections/featured-case-study/featured-case-study';
import { FeaturedCaseStudyCategory } from '../../shared/sections/featured-case-study/featured-case-study-category';
import { GraphQLContentService } from '../../app/services/graphql-content.service';
import { SeoMetaService } from '../../app/services/seo-meta.service';
import type { CmsPageContent, CmsSection, HeroCtaItem } from '../../app/api/graphql';
import { TrustedBySectionComponent } from '../../shared/sections/trusted-by/trusted-by';
import { StructuredEngagementsSectionComponent } from '../../shared/sections/structured-engagements/structured-engagements';
import { LatestInsightsSectionComponent } from '../../shared/sections/latest-insights/latest-insights';
import { ButtonPrimaryComponent } from "../../shared/button-primary/button-primary.component";
import { ScrollAnimationComponent } from '../../shared/scroll-animation-component/scroll-animation.component';
import { SvgIcons } from '../../shared/service-icons/service-icons';
import type { SafeHtml } from '@angular/platform-browser';
const DEFAULT_TITLE = 'Microsoft Solutions Partner | Azure Consulting | St. Louis, MO';
const DEFAULT_DESCRIPTION = 'As a Microsoft Solutions Partner specializing in Azure Cloud services, we drive business innovation and modernization for our clients.';

export function splitTwoLinerTitle(title: string): [string, string] {
  if (!title) return [title, ''];
  const words = title?.split(' ');
  if (words.length < 2) return [title, ''];

  // Case 1: If the second word is '&', split after it
  if (words[1] === '&') {
    return [words.slice(0, 2).join(' '), words.slice(2).join(' ')];
  }

  // Case 2: If the second word is the last word, split after the first word
  if (words.length === 2) {
    return [words[0], words[1]];
  }

  // Default: split after the first word
  return [words[0], words.slice(1).join(' ')];
}

@Component({
  selector: 'app-home',
  imports: [CommonModule, NgClass, FormsModule, VideoHero, ScrollAnimationComponent, FeaturedCaseStudySectionComponent, TrustedBySectionComponent, StructuredEngagementsSectionComponent, LatestInsightsSectionComponent, ButtonPrimaryComponent],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Home implements OnInit {
    private readonly router = inject(Router);

    goToContactUs() {
      this.router.navigate(['/contact-us']);
    }
  readonly FeaturedCaseStudyCategory = FeaturedCaseStudyCategory;
  readonly content = signal<CmsPageContent | null>(null);
  readonly loading = signal(true);
  readonly videoUrls = signal<string[]>([]);

  splitTwoLinerTitle = splitTwoLinerTitle;

  private readonly graphql = inject(GraphQLContentService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly seoMeta = inject(SeoMetaService);
  private readonly document = inject(DOCUMENT);
  readonly sanitizer = inject(DomSanitizer);
  readonly posts = signal<any>(null);
  readonly error = signal<any>(null);
  readonly structuredData = signal<any>(null);
  readonly isAdmin = signal(false);
  readonly saving = signal(false);
  readonly saveSuccess = signal(false);
  readonly panelVisible = signal(false);
  scrollAnimationVisible = signal(false);
  scrollAnimationReverse = signal(false);
  jsonContent: string = '';
  readonly jsonError = signal<string | null>(null);

  constructor() { }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('admin_token');
      this.isAdmin.set(!!token);
    }

    // Contenido desde servicio (precargado en APP_INITIALIZER vía homePageContent$)
    this.graphql.homePageContent$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          console.log(JSON.stringify(data, null, 2),"data here");
          if (data) {
            this.applyContent(data);
          } else {
            this.loading.set(false);
          }
        },
        error: () => {
          this.loading.set(false);
        },
      });
    this.lastScrollVisible = false;
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', this.handleScrollAnimation.bind(this));
      setTimeout(() => this.handleScrollAnimation(), 100);
    }
  }

  lastScrollVisible = false;

  private applyContent(data: CmsPageContent) {
    this.content.set(data);
    const heroSection = data.sections?.find(s => s.type === 'hero') as { ctas?: HeroCtaItem[] } | undefined;
    const ctas = (data.ctas && data.ctas.length > 0) ? data.ctas : heroSection?.ctas;
    if (ctas && ctas.length > 0) {
      const urls = ctas.map((c: HeroCtaItem) => c.videoUrl).filter((url: string): url is string => typeof url === 'string' && url.trim().length > 0);
      if (urls.length > 0) {
        this.videoUrls.set(urls);
      }
    } else if (data.videoUrls && data.videoUrls.length > 0) {
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

   getIconSvg(iconKey: string) {
    // Map PNG paths to SVG icon keys
    const iconMap: { [key: string]: string } = {
      '/assets/graph.png': 'Data_AI_Service',
      '/assets/cloud.png': 'Cloud_Infrastructure_Service',
      '/assets/app-innovation.png': 'Application_Innovation_Service',
      '/assets/hpc.png': 'High_Performance_Computing_Service',
      '/assets/modern-work.png': 'Modern_Workplace_Service',
      '/assets/managed-services.png': 'Managed_Services',
    };
    const mappedKey = iconMap[iconKey] || iconKey;
    const svg = SvgIcons[mappedKey] || '';
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }
  getSection(type: string) {
    return this.content()?.sections.find(s => s.type === type);
  }
    getSafeSvgIcon(svg?: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svg ?? '');
  }

  /** ctas desde root o desde hero section (CMS puede guardarlos en uno u otro). */
  private getCtas(): HeroCtaItem[] | undefined {
    const data = this.content();
    if (!data) return undefined;
    const fromRoot = data.ctas;
    if (fromRoot && Array.isArray(fromRoot) && fromRoot.length > 0) return fromRoot;
    const hero = this.getSection('hero') as { ctas?: HeroCtaItem[] } | undefined;
    const fromHero = hero?.ctas;
    if (fromHero && Array.isArray(fromHero) && fromHero.length > 0) return fromHero;
    return undefined;
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

  /** Título del hero: desde ctas (array) o sección hero. */
  heroTitle(): string | string[] {
    const ctas = this.getCtas();
    if (ctas && ctas.length > 0) return ctas.map(c => c.title);
    const section = this.getSection('hero');
    const t = section?.title;
    if (typeof t === 'string') return t || '';
    if (Array.isArray(t)) return t.filter((s): s is string => typeof s === 'string');
    if (t && typeof t === 'object' && !Array.isArray(t)) return [t.line1, t.line2].filter(Boolean).join(' ') || '';
    return '';
  }

  /** Descripción del hero: desde ctas (array) o sección hero. */
  heroDescription(): string | string[] {
    const ctas = this.getCtas();
    if (ctas && ctas.length > 0) return ctas.map(c => c.description);
    const section = this.getSection('hero');
    const t = section?.description;
    if (typeof t === 'string') return t || '';
    if (Array.isArray(t)) return t.filter((s): s is string => typeof s === 'string');
    if (t && typeof t === 'object' && !Array.isArray(t)) return [t.line1, t.line2].filter(Boolean).join(' ') || '';
    return '';
  }

  /** CTA principal del hero: array (uno por video) desde ctas, o único desde sección hero. */
  heroCtaPrimary(): { text: string; link: string; backgroundColor?: string } | { text: string; link: string; backgroundColor?: string }[] | undefined {
    const ctas = this.getCtas();
    if (ctas && ctas.length > 0) {
      return ctas.map(c => ({
        text: c.btn.text,
        link: c.btn.link,
        backgroundColor: c.btn.backgroundColor ?? '#1A63C9',
      }));
    }
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
    const ctas = content.ctas ?? (content.sections?.find(s => s.type === 'hero') as { ctas?: HeroCtaItem[] })?.ctas;
    const heroSection = content.sections?.find(s => s.type === 'hero');
    const rawTitle = ctas?.length ? ctas[0]?.title : heroSection?.['title'];
    const heroTitle = typeof rawTitle === 'string' ? rawTitle
      : Array.isArray(rawTitle) ? (rawTitle[0] ?? '')
        : rawTitle && typeof rawTitle === 'object' ? [rawTitle.line1, rawTitle.line2].filter(Boolean).join(' ') ?? ''
          : '';
    const heroDesc = (ctas?.length ? ctas[0]?.description : heroSection?.['description'] ?? '') as string;
    const pageTitle = heroTitle ? `${heroTitle} | Oakwood Systems` : DEFAULT_TITLE;
    const description = heroDesc || DEFAULT_DESCRIPTION;

    this.seoMeta.updateMeta({
      title: pageTitle,
      description,
      canonicalPath: '/',
    });
  }

  private updateStructuredData(content: CmsPageContent) {
    const ctas = content.ctas ?? (content.sections?.find(s => s.type === 'hero') as { ctas?: HeroCtaItem[] })?.ctas;
    const heroSection = content.sections?.find(s => s.type === 'hero');
    const heroDesc = (ctas?.length ? ctas[0]?.description : heroSection?.['description'] ?? '') as string;
    const heroTitle = ctas?.length ? ctas[0]?.title
      : typeof heroSection?.['title'] === 'string' ? heroSection.title
        : Array.isArray(heroSection?.['title']) ? (heroSection.title[0] ?? '')
          : heroSection?.title && typeof heroSection.title === 'object'
            ? [heroSection.title.line1, heroSection.title.line2].filter(Boolean).join(' ') ?? ''
            : DEFAULT_TITLE;

    const baseUrl = this.seoMeta.baseUrl;
    const structuredDataObj = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': `${baseUrl}/#webpage`,
          url: `${baseUrl}/`,
          name: heroTitle,
          isPartOf: { '@id': `${baseUrl}/#website` },
          about: { '@id': `${baseUrl}/#organization` },
          description: heroDesc || DEFAULT_DESCRIPTION,
          breadcrumb: { '@id': `${baseUrl}/#breadcrumb` },
          inLanguage: 'en-US',
          potentialAction: [{ '@type': 'ReadAction', target: [`${baseUrl}/`] }]
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${baseUrl}/#breadcrumb`,
          itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home' }]
        },
        {
          '@type': 'WebSite',
          '@id': `${baseUrl}/#website`,
          url: `${baseUrl}/`,
          name: DEFAULT_TITLE,
          description: 'Microsoft Solutions Partner in St. Louis and Kansas City',
          publisher: { '@id': `${baseUrl}/#organization` },
          alternateName: 'Microsoft Solutions Partner - Oakwood',
          inLanguage: 'en-US'
        },
        {
          '@type': 'Organization',
          '@id': `${baseUrl}/#organization`,
          name: 'Microsoft Solutions Partner - St. Louis and Kansas City',
          alternateName: 'Oakwood Systems Group, Inc.',
          url: `${baseUrl}/`,
          logo: {
            '@type': 'ImageObject',
            url: 'https://oakwoodsys.com/wp-content/uploads/2018/06/cropped-logo2-2.png',
            width: 1270,
            height: 185
          },
          sameAs: [
            'https://www.facebook.com/OakwoodSys/',
            'https://x.com/OakwoodInsights',
            'https://www.linkedin.com/company/oakwood-systems-group',
            'https://www.youtube.com/user/oakwoodinnovates'
          ],
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'Customer Service',
            url: `${baseUrl}/contact-us`
          }
        }
      ]
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

      // Update video URLs: desde ctas o videoUrls
      if (parsed.ctas && Array.isArray(parsed.ctas) && parsed.ctas.length > 0) {
        const urls = parsed.ctas.map((c: { videoUrl?: string }) => c.videoUrl).filter((url: unknown): url is string => typeof url === 'string' && url.trim().length > 0);
        if (urls.length > 0) this.videoUrls.set(urls);
      } else if (parsed.videoUrls && Array.isArray(parsed.videoUrls) && parsed.videoUrls.length > 0) {
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

  handleScrollAnimation() {
    const el = document.querySelector('.scroll-animation-section');
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const visible = rect.top < windowHeight * 0.7 && rect.bottom > windowHeight * 0.3;
    this.scrollAnimationReverse.set(this.lastScrollVisible && !visible);
    this.scrollAnimationVisible.set(visible);
    this.lastScrollVisible = visible;
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
