import {
  ChangeDetectionStrategy,
  Component,
  inject,
  NgZone,
  ViewChild,
  ElementRef,
  AfterViewInit,
  signal,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { VideoHero } from '../../shared/video-hero/video-hero';
import { SvgIcons } from '../../shared/service-icons/service-icons';
import { SeoMetaService } from '../../app/services/seo-meta.service';

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
  imports: [CommonModule, VideoHero, FormsModule],
  templateUrl: './microsoft-licensing.html',
  styleUrl: './microsoft-licensing.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MicrosoftLicensing implements AfterViewInit {
  private readonly seoMeta = inject(SeoMetaService);
  readonly sanitizer = inject(DomSanitizer);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);

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
      'Oakwood helps organizations buy, manage, and optimize Microsoft licensing through a service-led approach backed by the Cloud Solution Provider model.',
    ctaPrimary: {
      text: 'Talk to a Licensing Specialist',
      link: '/contact-us',
      backgroundColor: '#2A7EBF',
    },

    ctaSecondary: {
      text: 'Customer Licensing Portal',
      link: '/resources/case-studies',
    },
  };

 readonly focusSection: FocusSection = {
  bgImage: 'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/05/bg-our-focus.png',
  title: 'Microsoft Licensing has Become a Moving Target',
  description: 'Microsoft continues to evolve how its technologies are packaged and priced. What worked a year ago may not be the right fit today. Licensing decisions now impact more than procurement. They directly affect cost, security, and how effectively your teams operate.',
  focusCards: [
    {
      image: 'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/05/file-contract.png',
      title: 'Licensing Optimization',
      summary: 'Identify overlapping, underutilized, and misaligned Microsoft licensing investments.',
    },
    {
      image: 'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/05/chart-line.png',
      title: 'Azure Cost & Consumption',
      summary: 'Improve visibility into Azure usage and align infrastructure to operational demand.',
    },
    {
      image: 'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/05/shield-halved.png',
      title: 'Security & Compliance Alignment',
      summary: 'Ensure licensing decisions support security, governance, and compliance requirements.',
    },
    {
      image: 'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/05/Subtract.png',
      title: 'AI & Copilot Readiness',
      summary: 'Prepare for emerging AI and Copilot licensing models with proper infrastructure.',
    },
  ]
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
      subtitle: 'CSP Licensing · Support · Optimization · Services',
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
    imageSrc: 'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/05/microsoft-licensing.png',
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
      title: 'What is the CSP program?',
      description:
        'Delivered teams are trusted to own outcomes, not just complete tasks. Responsibility are clearly defined, and decisions are made close to the work. When challenges arise, they surface early and are addressed directly and transparently.',
    },
    {
      title: 'Is CSP more expensive than buying direct from Microsoft?',
      description:
        'CSP offers flexibility in billing and licensing models that can often result in cost savings compared to direct Microsoft purchases, depending on your organizational needs and usage patterns.',
    },
    {
      title: 'Can we move existing licenses into CSP?',
      description:
        'In most cases, yes. Oakwood can help assess your current licensing and develop a migration strategy that minimizes disruption while maximizing savings and flexibility.',
    },
    {
      title: 'How does billing work?',
      description:
        'CSP billing is typically monthly or annual, with flexibility to adjust licenses as your needs change. Oakwood provides transparent billing with detailed insights into your consumption and costs.',
    },
    {
      title: 'What kind of support is included?',
      description:
        'Oakwood provides direct support for your Microsoft licensing needs, including advisory, troubleshooting, and escalation management to ensure faster resolution of issues.',
    },
  ];

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

    const payload = {
      fullName: this.licensingFormModel.fullName,
      email: this.licensingFormModel.email,
      company: this.licensingFormModel.company,
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
