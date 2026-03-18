import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, signal, inject, computed, PLATFORM_ID, input, effect } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Subscription, catchError, of, take } from 'rxjs';
import { VideoHero } from '../../shared/video-hero/video-hero';
import { FeaturedCaseStudySectionComponent } from '../../shared/sections/featured-case-study/featured-case-study';
import { FeaturedCaseStudyCategory } from '../../shared/sections/featured-case-study/featured-case-study-category';
import { CtaSectionComponent } from '../../shared/cta-section/cta-section.component';
import { GraphQLContentService } from '../../app/services/graphql-content.service';
import { SeoMetaService } from '../../app/services/seo-meta.service';

interface StructuredOfferSection {
  id: string;
  title: string;
  body?: string;
  bullets?: string[];
  image?: {
    src: string;
    alt: string;
    caption?: string;
  };
}

export interface StructuredOfferContent {
  title: string;
  summary: string;
  duration?: string;      // e.g., "4 Weeks"
  delivery?: string;      // e.g., "Remote or Hybrid"
  category?: string;      // e.g., "Data&AI"
  sections: StructuredOfferSection[];
}

interface StructuredOfferCta {
  text: string;
  link: string;
  backgroundColor?: string;
}

interface StructuredOfferContactSection {
  id: string;
  backgroundImage: string;
  sideImage: {
    src: string;
    alt: string;
  };
  sideTitle: string;
  sideDescription: string;
  title: string;
  description: string;
  fields: {
    fullNameLabel: string;
    fullNamePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    messageLabel: string;
    messagePlaceholder: string;
  };
  errors: {
    fullNameRequired: string;
    emailRequired: string;
    messageRequired: string;
  };
  submitButton: {
    idle: string;
    loading: string;
  };
}

export interface StructuredOfferPageConfig {
  heroVideoUrls: string[];
  heroCtaPrimary: StructuredOfferCta;
  heroCtaSecondary?: StructuredOfferCta;
  contactSection: StructuredOfferContactSection;
  featuredCaseStudySlugs: string[];
  ctaSection: {
    title: string;
    description: string;
    primaryText: string;
    primaryLink: string;
  };
  offers: Record<string, StructuredOfferContent>;
}

const DEFAULT_HERO_VIDEO_URLS = [
  'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/02/Services-Data-Ai.mp4'
];

const DEFAULT_HERO_CTA_PRIMARY: StructuredOfferCta = {
  text: 'Contact Oakwood',
  link: '/contact-us',
  backgroundColor: '#2A7EBF'
};

const DEFAULT_HERO_CTA_SECONDARY: StructuredOfferCta = {
  text: 'Request Offer Details',
  link: '/contact-us'
};

const DEFAULT_CONTACT_SECTION: StructuredOfferContactSection = {
  id: 'form',
  backgroundImage: '/assets/bg-blue.png',
  sideImage: {
    src: '/assets/contact-offers.png',
    alt: 'Team member ready to help'
  },
  sideTitle: 'Pricing',
  sideDescription: 'This engagement may be eligible for Microsoft funding depending on your profile.',
  title: 'Contact us to get started',
  description: 'Custom pricing based on scope and number of SQL workloads in scope.',
  fields: {
    fullNameLabel: 'Name',
    fullNamePlaceholder: 'Your name',
    emailLabel: 'Work email address',
    emailPlaceholder: 'email@example.com',
    messageLabel: 'Message',
    messagePlaceholder: "Describe what you need help with or what you're planning next"
  },
  errors: {
    fullNameRequired: 'Full name is required',
    emailRequired: 'Email is required',
    messageRequired: 'Message is required'
  },
  submitButton: {
    idle: 'Send Message',
    loading: 'Sending...'
  }
};

const DEFAULT_CTA_SECTION = {
  title: 'Need Microsoft licensing help?',
  description: 'As a Tier-1 CSP, Oakwood can simplify, manage, and support your M365 and Azure licensing.',
  primaryText: 'Speak to a licensing expert',
  primaryLink: '/contact-us'
};

const DEFAULT_FEATURED_CASE_STUDY_SLUGS = ['data-ai-solutions'];

const STRUCTURED_OFFER_CONTENT: Record<string, StructuredOfferContent> = {};



@Component({
  selector: 'app-structured-offer',
  standalone: true,
  imports: [CommonModule, RouterLink, VideoHero, FormsModule, FeaturedCaseStudySectionComponent, CtaSectionComponent],
  templateUrl: './structured-offer.html',
  styleUrl: './structured-offer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StructuredOffer implements OnInit, OnDestroy {
  readonly FeaturedCaseStudyCategory = FeaturedCaseStudyCategory;
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly graphql = inject(GraphQLContentService);
  private readonly seoMeta = inject(SeoMetaService);
  private readonly platformId = inject(PLATFORM_ID);
  private routeSubscription?: Subscription;
  private scrollListener?: () => void;

  readonly slug = signal<string | null>(null);
  /** When provided (edit preview), skip CMS/route loading and use this data directly. */
  readonly contentOverride = input<StructuredOfferPageConfig | null>(null);
  /** Offer slug to render when contentOverride is active. */
  readonly slugOverride = input<string | null>(null);
  readonly pageConfig = signal<StructuredOfferPageConfig | null>(null);
  readonly pageConfigLoaded = signal(false);
  readonly pageConfigFailed = signal(false);
  readonly content = signal<StructuredOfferContent | null>(null);
  readonly error = signal<string | null>(null);
  readonly activeSection = signal<string>('overview');

  // Form properties
  readonly formModel = signal({
    fullName: '',
    email: '',
    message: ''
  });
  readonly submitted = signal(false);
  readonly showFormAnimation = signal(true);
  readonly validationErrors = signal<Record<string, boolean>>({
    fullName: false,
    email: false,
    message: false
  });
  readonly isSubmitting = signal(false);

  readonly heroVideoUrls = computed(() => this.pageConfig()?.heroVideoUrls ?? DEFAULT_HERO_VIDEO_URLS);
  readonly heroCtaPrimary = computed(() => this.pageConfig()?.heroCtaPrimary ?? DEFAULT_HERO_CTA_PRIMARY);
  readonly heroCtaSecondary = computed(() => this.pageConfig()?.heroCtaSecondary ?? DEFAULT_HERO_CTA_SECONDARY);
  readonly contactSection = computed(() => this.pageConfig()?.contactSection ?? DEFAULT_CONTACT_SECTION);
  readonly ctaSection = computed(() => this.pageConfig()?.ctaSection ?? DEFAULT_CTA_SECTION);
  readonly featuredCaseStudySlugs = computed(() => this.pageConfig()?.featuredCaseStudySlugs ?? DEFAULT_FEATURED_CASE_STUDY_SLUGS);

  readonly offerDetails = computed(() => {
    const data = this.content();
    if (!data) return [];
    return [
      { offer: 'Duration', offervalue: data.duration ?? 'TBD', icon: 'duration' },
      { offer: 'Delivery', offervalue: data.delivery ?? 'TBD', icon: 'delivery' },
      { offer: 'Category', offervalue: data.category ?? 'TBD', icon: 'category' }
    ];
  });

  constructor() {
    effect(() => {
      const override = this.contentOverride();
      if (!override) return;

      this.pageConfig.set(override);
      this.pageConfigLoaded.set(true);
      this.pageConfigFailed.set(false);

      const requestedSlug = this.slugOverride();
      const availableSlugs = Object.entries(override.offers ?? {})
        .filter(([, value]) => Boolean(value))
        .map(([key]) => key);
      const resolvedSlug = requestedSlug && availableSlugs.includes(requestedSlug)
        ? requestedSlug
        : (availableSlugs[0] ?? null);

      this.slug.set(resolvedSlug);
      this.loadContent();
    });
  }

  ngOnInit() {
    if (this.contentOverride()) {
      return;
    }

    this.loadPageConfig();

    this.routeSubscription = this.route.paramMap.subscribe(params => {
      if (this.contentOverride()) {
        return;
      }
      const slugParam = params.get('slug');
      this.slug.set(slugParam);
      this.loadContent();
    });

    if (isPlatformBrowser(this.platformId)) {
      this.scrollListener = () => this.updateActiveSection();
      window.addEventListener('scroll', this.scrollListener, { passive: true });
    }
  }

  ngOnDestroy() {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
    if (isPlatformBrowser(this.platformId) && this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener);
    }
  }

  private loadContent() {
    if (!this.pageConfigLoaded()) {
      return;
    }

    this.error.set(null);
    this.activeSection.set('overview');
    let slugValue = this.slug();
    const offers = this.pageConfig()?.offers ?? STRUCTURED_OFFER_CONTENT;

    if (!slugValue || !offers[slugValue]) {
      const fallbackSlug = Object.keys(offers).find((key) => Boolean(offers[key]));
      if (fallbackSlug) {
        this.slug.set(fallbackSlug);
        slugValue = fallbackSlug;
      }
    }

    if (slugValue && offers[slugValue]) {
      const offer = offers[slugValue];
      this.content.set(offer);
      this.error.set(null);
      this.seoMeta.updateMeta({
        title: `${offer.title} | Oakwood Systems`,
        description: offer.summary,
        canonicalPath: `/structured-engagement/${slugValue}`,
      });
      return;
    }

    this.content.set(null);
    this.error.set(this.pageConfigFailed() ? 'Unable to load offer content.' : 'Offer not found.');
    this.seoMeta.updateMeta({
      title: 'Structured Engagements | Oakwood Systems',
      description: 'Drive efficiency and innovation with tailored, strategic engagements designed to align technology solutions with your unique business goals.',
      canonicalPath: '/structured-engagement',
    });
  }

  private loadPageConfig() {
    if (this.contentOverride()) {
      return;
    }

    this.graphql.getStructuredEngagementOfferPageContent()
      .pipe(
        take(1),
        catchError(() => of(null))
      )
      .subscribe((cmsData) => {
        if (this.contentOverride()) {
          return;
        }

        const parsed = this.asStructuredOfferPageConfig(cmsData);
        if (parsed) {
          this.pageConfig.set(parsed);
          this.pageConfigFailed.set(false);
          this.pageConfigLoaded.set(true);
          this.loadContent();
          return;
        }

        this.http.get<StructuredOfferPageConfig>('/structured-offer-content.json')
          .pipe(
            take(1),
            catchError(() => of(null))
          )
          .subscribe((jsonData) => {
            if (this.contentOverride()) {
              return;
            }

            if (jsonData?.offers && typeof jsonData.offers === 'object') {
              this.pageConfig.set(jsonData);
              this.pageConfigFailed.set(false);
            } else {
              this.pageConfig.set(null);
              this.pageConfigFailed.set(true);
            }

            this.pageConfigLoaded.set(true);
            this.loadContent();
          });
      });
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

  onSubmit() {
    this.submitted.set(true);
    const form = this.formModel();
    const errors: Record<string, boolean> = {
      fullName: !form.fullName?.trim(),
      email: !form.email?.trim() || !this.isValidEmail(form.email),
      message: !form.message?.trim()
    };

    this.validationErrors.set(errors);

    // Check if there are any errors
    if (Object.values(errors).some(error => error)) {
      return;
    }

    this.isSubmitting.set(true);
    // TODO: Add your form submission logic here
    // For now, just simulate a submit
    setTimeout(() => {
      console.log('Form submitted:', this.formModel());
      this.resetForm();
      this.isSubmitting.set(false);
    }, 1500);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private resetForm() {
    this.formModel.set({
      fullName: '',
      email: '',
      message: ''
    });
    this.submitted.set(false);
    this.validationErrors.set({
      fullName: false,
      email: false,
      message: false
    });
  }

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      const offsetTop = element.getBoundingClientRect().top + window.scrollY - 120; // 120px offset for navbar
      window.scrollTo({ top: offsetTop, behavior: 'smooth' });
      this.activeSection.set(sectionId);
    }
  }

  private updateActiveSection() {
    const sections = ['overview', ...(this.content()?.sections.map(s => s.id) ?? [])];

    for (const sectionId of sections) {
      const element = document.getElementById(sectionId);
      if (element) {
        const rect = element.getBoundingClientRect();
        if (rect.top <= window.innerHeight / 2) {
          this.activeSection.set(sectionId);
        }
      }
    }
  }

  /** Slugs para app-featured-case-study (from the current category or default to data-ai-solutions) */
  getSlugsForFeaturedSection(): string[] {
    return this.featuredCaseStudySlugs();
  }
}


