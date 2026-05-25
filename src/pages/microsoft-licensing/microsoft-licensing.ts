import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
  NgZone,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnInit,
  signal,
  ChangeDetectorRef,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { VideoHero } from '../../shared/video-hero/video-hero';
import { SvgIcons } from '../../shared/service-icons/service-icons';
import { SeoMetaService } from '../../app/services/seo-meta.service';
import { GraphQLContentService } from '../../app/services/graphql-content.service';
import {
  getPrimaryTagName,
  type GenContentListNode,
} from '../../app/api/graphql';
import { readingTimeMinutes } from '../../app/utils/reading-time.util';
import { CtaSectionComponent } from '../../shared/cta-section/cta-section.component';
import { ButtonPrimaryComponent } from '../../shared/button-primary/button-primary.component';
import { BlogCardComponent } from '../../shared/blog-card/blog-card.component';
type SimpleCard = {
  icon: string;
  title: string;
  description: string;
};

type FocusCard = {
  image: string;
  title: string;
  summary: string;
};

type FocusSection = {
  bgImage: string;
  title: string;
  description: string;
  description2?: string;
  focusCards: FocusCard[];
};

type ServiceAreaCard = {
  icon: string;
  title: string;
  features: string[];
};

type ProcessStep = {
  step: string;
  title: string;
  subtitle: string;
  icon: string;
};

type AccordionItem = {
  title: string;
  description: string;
};

@Component({
  selector: 'app-microsoft-licensing',
  imports: [
    CommonModule,
    VideoHero,
    FormsModule,
    CtaSectionComponent,
    ButtonPrimaryComponent,
    BlogCardComponent,
  ],
  templateUrl: './microsoft-licensing.html',
  styleUrl: './microsoft-licensing.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MicrosoftLicensing implements AfterViewInit, OnInit {
  private readonly seoMeta = inject(SeoMetaService);
  readonly sanitizer = inject(DomSanitizer);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly graphql = inject(GraphQLContentService);
  private readonly ngZone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('recaptchaHost') recaptchaHost?: ElementRef<HTMLElement>;

  selectedAccordionItem: any = null;

  // Form properties
  submitted = false;
  isSubmitting = false;
  private recaptchaWidgetId: number | null = null;
  readonly recaptchaEnabled = true;
  recaptchaToken: string | null = null;

  licensingFormModel = {
    fullName: '',
    email: '',
    company: '',
    numberOfUsers: '',
    primaryAreaOfInterest: 'Microsoft 365 Licensing',
    environmentDetails: '',
  };

  usersDropdownOpen = false;
  interestDropdownOpen = false;
  readonly numberOfUsersOptions = [
    { value: '1-100', label: '1-100' },
    { value: '501-1500', label: '501-1,500' },
    { value: '1500+', label: '1,500+' },
  ];
  readonly primaryAreaOptions = [
    { value: 'Microsoft 365 Licensing', label: 'Microsoft 365 Licensing' },
    { value: 'Azure Cost Optimization', label: 'Azure Cost Optimization' },
    { value: 'Copilot Readiness', label: 'Copilot Readiness' },
    { value: 'General Licensing Review', label: 'General Licensing Review' },
  ];

  validationErrors = {
    fullName: false,
    email: false,
    company: false,
    numberOfUsers: false,
    primaryAreaOfInterest: false,
    environmentDetails: false,
    recaptcha: false,
  };

  readonly hero = {
    videoUrls: [
      'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/05/Microsoft_Licensing.mp4',
    ],
    backgroundImage: '/assets/bg-blue-1.png',
    title: 'Microsoft Licensing Services',
    description:
      'Simplify Microsoft 365 and Azure licensing with clarity, flexibility, and cost control.',
    descriptionSecondary:
      'Oakwood helps organizations buy, manage, and optimize Microsoft licensing through a service-led approach backed by the Cloud Solution Provider (CSP) model.',
    ctaPrimary: {
      text: 'Talk to a Licensing Specialist',
      link: '/contact-us',
      backgroundColor: '#2A7EBF',
    },

    ctaSecondary: {
      text: 'Customer Licensing Portal',
      link: 'https://marketplace.oakwoodsys.com/',
    },
  };

  readonly focusSection: FocusSection = {
    bgImage:
      'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/05/bg-our-focus.png',
    title: 'Microsoft Licensing has Become a Moving Target',
    description:
      'Microsoft continues to evolve how its technologies are packaged and priced. What worked a year ago may not be the right fit today.',
    description2:
      'Licensing decisions now impact more than procurement. They directly affect cost, security, and how effectively your teams operate.',
    focusCards: [
      {
        image:
          'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/05/file-contract.png',
        title: 'Licensing Optimization',
        summary:
          'Identify overlapping, underutilized, and misaligned Microsoft licensing investments across Microsoft 365, Azure, and security platforms.',
      },
      {
        image:
          'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/05/chart-line.png',
        title: 'Azure Cost & Consumption',
        summary:
          'Improve visibility into Azure usage, forecast cloud consumption more effectively, and align infrastructure strategy to operational demand.',
      },
      {
        image:
          'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/05/shield-halved.png',
        title: 'Security & Compliance Alignment',
        summary:
          'Ensure Microsoft licensing decisions support evolving security, governance, compliance, and identity management requirements.',
      },
      {
        image:
          'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/05/Subtract.png',
        title: 'AI & Copilot Readiness',
        summary:
          'Prepare for emerging Microsoft AI, Copilot, and consumption-based licensing models while aligning infrastructure and data readiness.',
      },
    ],
  };

  readonly cspSteps = [
    {
      step: '01',
      title: 'Your Organization',
      subtitle: 'Users · Workloads · Licenses · Spend',
      icon: 'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/05/buildings.png',
    },
    {
      step: '02',
      title: 'Oakwood',
      subtitle: 'CSP Licensing · Support · Optimization Services',
      icon: 'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/05/Group-71.png',
    },
    {
      step: '03',
      title: 'Microsoft',
      subtitle: 'Microsoft 365 · Azure · Copilot · Security',
      icon: 'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/05/Group-72.png',
    },
  ];

  readonly cspBenefits: SimpleCard[] = [
    {
      icon: 'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/05/gauge-high.png',
      title: 'Flexible Billing',
      description: 'Monthly or annual options aligned to your needs.',
    },
    {
      icon: 'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/05/shield-check.png',
      title: 'Scale as Needed',
      description: 'Adjust licenses as users and workloads change.',
    },
    {
      icon: 'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/05/chart-line-1.png',
      title: 'Direct Support',
      description:
        'Work directly with Oakwood for guidance and issue resolution.',
    },
    {
      icon: 'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/05/rotate-left.png',
      title: 'Ongoing Advisory',
      description:
        'Align licensing to Azure, M365, security, and future investments.',
    },
  ];

  readonly whyOakwoodFeatures: SimpleCard[] = [
    {
      icon: 'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/05/Icon-Symbol-13.png',
      title: 'Licensing + Engineering Connected',
      description:
        'Licensing decisions are tied directly to architecture, security posture, and actual usage.',
    },
    {
      icon: 'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/05/Icon-Symbol-14.png',
      title: 'Built-In Cost Optimization',
      description:
        'Oakwood evaluates Azure consumption and Microsoft 365 usage to reduce waste.',
    },
    {
      icon: 'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/05/Icon-Symbol-15.png',
      title: 'Real Support from Engineers',
      description:
        'Get access to engineers who understand Microsoft environments and can respond quickly.',
    },
    {
      icon: 'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/05/Icon-Symbol-16.png',
      title: 'One Partner Across Microsoft',
      description:
        'Licensing, cloud infrastructure, security, and managed services are aligned under one partner.',
    },
  ];

  readonly serviceAreaCards: ServiceAreaCard[] = [
    {
      icon: 'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/05/clipboard-check-1.png',
      title: 'Licensing Strategy & Advisory',
      features: [
        'Microsoft 365 plan selection',
        'Azure consumption planning',
        'Copilot readiness strategy',
        'Renewal and contract guidance',
      ],
    },
    {
      icon: 'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/05/network-wired-1.png',
      title: 'Procurement & Management',
      features: [
        'Direct CSP license provisioning',
        'Flexible billing structures',
        'License scaling and adjustments',
        'Centralized license visibility',
      ],
    },
    {
      icon: 'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/05/gauge-high-1.png',
      title: 'Optimization & Cost Control',
      features: [
        'License usage analysis',
        'Azure cost optimization',
        'Unused license identification',
        'Cost governance planning',
      ],
    },
    {
      icon: 'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/05/life-ring-1.png',
      title: 'Support & Ongoing Guidance',
      features: [
        'Direct Oakwood support',
        'Escalation management',
        'Faster issue response',
        'Advisory as your environment evolves',
      ],
    },
  ];

  readonly outcomes = [
    'Predictable costs aligned to usage',
    'Clear visibility into licensing',
    'Faster support response',
    'Stronger IT and finance alignment',
    'Confidence in future investments',
  ];

  readonly managedServicesConnection = {
    tagline: 'Managed Services Connection',
    title: 'Where Licensing Meets Managed Services',
    description:
      'Licensing is only one part of the equation. The real value comes from how your environment is managed over time. Oakwood integrates Microsoft licensing into a broader managed services model focused on performance, security, and cost control.',
  };

  readonly managedServiceSteps: ProcessStep[] = [
    {
      step: '01',
      title: 'License',
      subtitle: 'Procure and align',
      icon: 'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/05/file-contract-1.png',
    },
    {
      step: '02',
      title: 'Manage',
      subtitle: 'Monitor, support, secure',
      icon: 'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/05/users-gear-1.png',
    },
    {
      step: '03',
      title: 'Optimize',
      subtitle: 'Reduce waste and improve value',
      icon: 'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/05/sack-dollar-1.png',
    },
  ];

  readonly managedServiceBenefits: SimpleCard[] = [
    {
      icon: 'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/05/gauge-high.png',
      title: 'Azure environment management and monitoring',
      description: '',
    },
    {
      icon: 'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/05/shield-check.png',
      title: 'Microsoft 365 security and compliance',
      description: '',
    },
    {
      icon: 'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/05/chart-line-1.png',
      title: 'Ongoing cost optimization and governance',
      description: '',
    },
    {
      icon: 'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/05/rotate-left.png',
      title: 'Backup and disaster recovery planning',
      description: '',
    },
  ];

  readonly selfDiagnosis = {
    tagline: 'Self-Diagnosis',
    title: 'When It Is Time to Rethink Your Microsoft Licensing',
    description:
      'Modernizing systems, enhancing security, and improving data access to deliver more accessible and efficient digital services.',
  };

  readonly selfDiagnosisCards: SimpleCard[] = [
    {
      icon: 'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/05/Icon-Symbol.png',
      title: 'Limited Visibility',
      description: 'You do not have clear insight into license usage or spend.',
    },
    {
      icon: 'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/05/Icon-Symbol-1.png',
      title: 'Rising Costs',
      description:
        'Your Microsoft costs continue to increase without explanation.',
    },
    {
      icon: 'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/05/Icon-Symbol-2.png',
      title: 'Slow Support',
      description:
        'Support through Microsoft is difficult to navigate or slow to respond.',
    },
    {
      icon: 'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/05/Icon-Symbol-3.png',
      title: 'Copilot Readiness',
      description: 'You are preparing for Copilot or broader AI adoption.',
    },
    {
      icon: 'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/05/Icon-Symbol-13-1.png',
      title: 'Too Many Vendors',
      description:
        'You want one partner across licensing, cloud, security, and services.',
    },
    {
      icon: 'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/05/Icon-Symbol-14-1.png',
      title: 'Renewal Pressure',
      description:
        'You have an upcoming renewal and want a more strategic approach.',
    },
  ];

  readonly licensingExpert = {
    tagline: 'Talk to a Licensing Expert',
    title: 'Schedule a Microsoft Licensing Review',
    description:
      'Get clarity on your Microsoft licensing, usage, and optimization opportunities.',
    impactTitle: 'Real-World Impact',
    impactHeadline:
      'One organization identified nearly $10,000/month in unnecessary Microsoft 365 licensing costs.',
    impactDescription:
      'Oakwood reviews your Microsoft 365 and Azure licensing environment to uncover cost savings, usage gaps, and optimization opportunities.',
    imageSrc:
      'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/05/microsoft-licensing.png',
  };

  readonly licensingExpertChecklist: string[] = [
    'A high-level review of your current licensing structure',
    'Identification of unused or redundant licenses',
    'Azure cost and consumption insights, if applicable',
    'Recommendations aligned to your environment and goals',
  ];

  readonly faqSection = {
    label: 'FREQUENTLY ASKED QUESTIONS',
    title: 'Microsoft Licensing FAQs',
    backgroundImage: '/bg-imgs/services-page-bg.jpg',
  };

  readonly faqItems: AccordionItem[] = [
    {
      title: 'What is Microsoft CSP (Cloud Solution Provider)?',
      description:
        'Microsoft CSP is a licensing program that allows organizations to purchase and manage Microsoft cloud services through a trusted partner instead of directly through Microsoft. Through CSP, Oakwood helps clients manage Microsoft 365, Azure, security, and Copilot licensing while also providing guidance, support, and ongoing optimization.',
    },
    {
      title: 'Why work with a Microsoft partner instead of buying direct?',
      description:
        'Working with a Microsoft partner provides an additional layer of strategy, support, and accountability. Beyond licensing procurement, Oakwood helps organizations navigate Microsoft changes, optimize costs, align technology investments, and connect licensing decisions to broader infrastructure, security, and AI initiatives.',
    },
    {
      title: 'Is CSP more expensive than buying directly from Microsoft?',
      description:
        'In most cases, pricing is very similar to buying direct from Microsoft. The difference is that CSP gives organizations access to a partner who can help manage licensing, billing, renewals, optimization, and support instead of navigating it alone.',
    },
    {
      title: 'Can we move our existing Microsoft licenses to CSP?',
      description:
        'Yes. Most Microsoft 365, Azure, and related subscriptions can be transitioned into the CSP model with minimal disruption. Oakwood helps coordinate the migration process and ensures licensing is aligned properly during the transition.',
    },
    {
      title: 'How does billing work under CSP?',
      description:
        'CSP simplifies Microsoft billing by consolidating services into a single, predictable invoice. Depending on the agreement, organizations can choose monthly or annual billing options for greater flexibility and budget planning.',
    },
        {
      title: 'What kind of support is included with CSP?',
      description:
        'Support varies by partner, but Oakwood provides direct access to engineers and licensing specialists who understand both the Microsoft platform and your environment. This includes assistance with licensing questions, subscription management, escalations, and ongoing optimization recommendations.',
    },
        {
      title: 'Can Oakwood help optimize our Microsoft licensing costs?',
      description:
        'Yes. Many organizations are overlicensed, underutilizing features, or carrying redundant subscriptions. Oakwood regularly helps clients identify opportunities to reduce unnecessary licensing spend while improving alignment to actual business needs.',
    },
        {
      title: 'Can CSP help with Microsoft Copilot licensing?',
      description:
        'Yes. As Microsoft continues evolving Copilot and AI-related licensing, CSP provides a more guided approach to understanding prerequisites, licensing requirements, security considerations, and adoption planning.',
    },
           {
      title: 'Do we have to move everything to CSP?',
      description:
        'No. Organizations can transition services over time depending on their licensing structure, agreements, and business goals. Oakwood can help evaluate the best approach for hybrid licensing environments.',
    },
  ];

  readonly relatedLicensingBlogs = signal<
    Array<{
      id: string;
      slug: string;
      title: string;
      imageUrl: string;
      imageAlt: string;
      primaryTag: string;
      readingTimeMinutes: number;
      date: string;
    }>
  >([]);
  readonly relatedBlogsLoading = signal<boolean>(true);

  constructor() {
    this.seoMeta.updateMeta({
      title: 'Microsoft Licensing | Oakwood Systems',
      description:
        'Optimize Microsoft licensing across Microsoft 365, Azure, security, and Copilot with Oakwood advisory and support.',
      canonicalPath: '/microsoft-licensing',
      image: '/assets/og-image.png',
      keywords:
        'microsoft licensing, csp, microsoft 365 licensing, azure optimization, copilot readiness',
    });
  }

  ngOnInit(): void {
    this.loadRelatedLicensingBlogs();
  }

  private loadRelatedLicensingBlogs(): void {
    this.relatedBlogsLoading.set(true);

    this.graphql
      .getGenContentsByTagAndCategory('microsoft-licensing', 'blog', 6)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((nodes) => {
        if (nodes.length > 0) {
          this.relatedLicensingBlogs.set(
            this.mapRelatedBlogCards(nodes).slice(0, 3),
          );
          this.relatedBlogsLoading.set(false);
          this.cdr.markForCheck();
          return;
        }

        // Fallback: derive from all blogs if the tag slug differs in WP.
        this.graphql
          .getBlogs()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((allBlogs) => {
            const filtered = allBlogs.filter((post) =>
              this.isMicrosoftLicensingPost(post),
            );
            this.relatedLicensingBlogs.set(
              this.mapRelatedBlogCards(filtered).slice(0, 3),
            );
            this.relatedBlogsLoading.set(false);
            this.cdr.markForCheck();
          });
      });
  }

  private mapRelatedBlogCards(nodes: GenContentListNode[]) {
    return nodes.map((post) => ({
      id: post.id ?? post.slug ?? '',
      slug: post.slug ?? '',
      title: post.title ?? 'Blog post',
      imageUrl:
        post.featuredImage?.node?.sourceUrl ??
        'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/05/default-blog-image.jpg',
      imageAlt:
        post.featuredImage?.node?.altText ??
        post.title ??
        'Microsoft Licensing insight',
      primaryTag:
        getPrimaryTagName(post.primaryTagName) ??
        post.tags?.[0] ??
        'Microsoft Licensing',
      readingTimeMinutes: readingTimeMinutes(
        (post.content ?? '') || (post.excerpt ?? ''),
      ),
      date: post.date ?? '',
    }));
  }

  private isMicrosoftLicensingPost(post: GenContentListNode): boolean {
    const normalizedTarget = 'microsoft-licensing';
    const norm = (value: string | null | undefined) =>
      (value ?? '').toLowerCase().trim().replace(/\s+/g, '-');

    const hasTagSlug =
      post.genContentTags?.nodes?.some(
        (tag) => norm(tag.slug) === normalizedTarget,
      ) ?? false;
    const hasTagName =
      post.genContentTags?.nodes?.some(
        (tag) => norm(tag.name) === normalizedTarget,
      ) ?? false;
    const hasLegacyTag =
      post.tags?.some((tag) => norm(tag) === normalizedTarget) ?? false;
    const hasPrimaryTag =
      norm(getPrimaryTagName(post.primaryTagName)) === normalizedTarget;

    return hasTagSlug || hasTagName || hasLegacyTag || hasPrimaryTag;
  }

  getIconSvg(iconKey: string) {
    const svg = SvgIcons[iconKey] || '';
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  getIconImageSrc(iconKey: string): string {
    const svg = SvgIcons[iconKey] || '';
    if (!svg) return '';
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  setSelectedAccordionItem(item: any) {
    this.selectedAccordionItem = item;
  }

  clearSelectedAccordionItem() {
    this.selectedAccordionItem = null;
  }

  ngAfterViewInit() {
    if (typeof window !== 'undefined' && this.recaptchaEnabled) {
      setTimeout(() => this.initRecaptcha(), 400);
    }
  }

  private initRecaptcha(): void {
    if (typeof window === 'undefined' || !this.recaptchaHost?.nativeElement)
      return;

    const render = () => {
      const grecaptcha = (window as any).grecaptcha;
      if (!grecaptcha?.render || this.recaptchaWidgetId !== null) return;

      this.recaptchaWidgetId = grecaptcha.render(
        this.recaptchaHost!.nativeElement,
        {
          sitekey: '6Lcp8XwsAAAAAIrdZHBdw74jtoxwPxDRZW4F-rwu',
          callback: (token: string) => {
            this.ngZone.run(() => {
              this.recaptchaToken = token;
              this.validationErrors = {
                ...this.validationErrors,
                recaptcha: false,
              };
              this.cdr.markForCheck();
            });
          },
          'expired-callback': () => {
            this.ngZone.run(() => {
              this.recaptchaToken = null;
              this.cdr.markForCheck();
            });
          },
        },
      );
    };

    render();
    if (this.recaptchaWidgetId === null) {
      setTimeout(render, 500);
      setTimeout(render, 1500);
    }
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  toggleUsersDropdown(event?: MouseEvent): void {
    event?.stopPropagation();
    this.interestDropdownOpen = false;
    this.usersDropdownOpen = !this.usersDropdownOpen;
  }

  closeUsersDropdown(): void {
    this.usersDropdownOpen = false;
  }

  selectUsersOption(value: string): void {
    this.licensingFormModel.numberOfUsers = value;
    this.validationErrors = {
      ...this.validationErrors,
      numberOfUsers: false,
    };
    this.usersDropdownOpen = false;
  }

  get selectedUsersLabel(): string {
    const selected = this.numberOfUsersOptions.find(
      (option) => option.value === this.licensingFormModel.numberOfUsers,
    );
    return selected?.label ?? 'Select number of users';
  }

  toggleInterestDropdown(event?: MouseEvent): void {
    event?.stopPropagation();
    this.usersDropdownOpen = false;
    this.interestDropdownOpen = !this.interestDropdownOpen;
  }

  selectInterestOption(value: string): void {
    this.licensingFormModel.primaryAreaOfInterest = value;
    this.validationErrors = {
      ...this.validationErrors,
      primaryAreaOfInterest: false,
    };
    this.interestDropdownOpen = false;
  }

  get selectedInterestLabel(): string {
    const selected = this.primaryAreaOptions.find(
      (option) =>
        option.value === this.licensingFormModel.primaryAreaOfInterest,
    );
    return selected?.label ?? 'Select primary area of interest';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    if (!target.closest('.ml-users-dropdown')) {
      this.usersDropdownOpen = false;
    }
    if (!target.closest('.ml-interest-dropdown')) {
      this.interestDropdownOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.usersDropdownOpen = false;
    this.interestDropdownOpen = false;
  }

  onLicensingReviewSubmit() {
    this.submitted = true;

    this.validationErrors = {
      fullName: !this.licensingFormModel.fullName,
      email:
        !this.licensingFormModel.email ||
        !this.validateEmail(this.licensingFormModel.email),
      company: !this.licensingFormModel.company,
      numberOfUsers: !this.licensingFormModel.numberOfUsers,
      primaryAreaOfInterest: !this.licensingFormModel.primaryAreaOfInterest,
      environmentDetails: !this.licensingFormModel.environmentDetails,
      recaptcha: this.recaptchaEnabled && !this.recaptchaToken,
    };

    if (
      !this.licensingFormModel.fullName ||
      !this.licensingFormModel.email ||
      !this.validateEmail(this.licensingFormModel.email) ||
      !this.licensingFormModel.company ||
      !this.licensingFormModel.numberOfUsers ||
      !this.licensingFormModel.primaryAreaOfInterest ||
      !this.licensingFormModel.environmentDetails ||
      (this.recaptchaEnabled && !this.recaptchaToken)
    ) {
      return;
    }

    this.isSubmitting = true;

    const message = [
      'Licensing review request details:',
      `Full Name: ${this.licensingFormModel.fullName}`,
      `Email: ${this.licensingFormModel.email}`,
      `Name of Company: ${this.licensingFormModel.company}`,
      `Number of users: ${this.licensingFormModel.numberOfUsers}`,
      `Primary area of interest: ${this.licensingFormModel.primaryAreaOfInterest}`,
      `Environment details: ${this.licensingFormModel.environmentDetails}`,
    ].join('\n');

    const payload = {
      fullName: this.licensingFormModel.fullName,
      email: this.licensingFormModel.email,
      company: this.licensingFormModel.company,
      message,
      numberOfUsers: this.licensingFormModel.numberOfUsers,
      primaryAreaOfInterest: this.licensingFormModel.primaryAreaOfInterest,
      environmentDetails: this.licensingFormModel.environmentDetails,
      formType: 'licensing-review',
    };

    this.http.post<{ success: boolean }>('/api/contact', payload).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.cdr.markForCheck();
        if (res?.success) {
          this.resetLicensingForm();
          this.router.navigate(['/contact-success']);
        } else {
          alert(
            'Failed to submit your licensing review request. Please try again.',
          );
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.cdr.markForCheck();
        console.error('Licensing form error:', err);
        alert('An error occurred. Please try again later.');
      },
    });
  }

  private resetLicensingForm() {
    this.licensingFormModel = {
      fullName: '',
      email: '',
      company: '',
      numberOfUsers: '',
      primaryAreaOfInterest: 'Microsoft 365 Licensing',
      environmentDetails: '',
    };

    this.submitted = false;
    this.validationErrors = {
      fullName: false,
      email: false,
      company: false,
      numberOfUsers: false,
      primaryAreaOfInterest: false,
      environmentDetails: false,
      recaptcha: false,
    };
    this.recaptchaToken = null;
    if (
      typeof window !== 'undefined' &&
      this.recaptchaWidgetId !== null &&
      (window as any).grecaptcha?.reset
    ) {
      (window as any).grecaptcha.reset(this.recaptchaWidgetId);
    }
  }
}
