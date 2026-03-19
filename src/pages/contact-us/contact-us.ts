import { ChangeDetectionStrategy, Component, inject, NgZone, ViewChild, ElementRef, AfterViewInit, OnInit, signal, ChangeDetectorRef, input, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OfficeLocationsSectionComponent } from '../../shared/office-locations-section/office-locations-section.component';
import { CTA_GRADIENTS, CtaSectionComponent } from '../../shared/cta-section/cta-section.component';
import { SeoMetaService } from '../../app/services/seo-meta.service';
import {
  ContactPageContentService,
  type ContactUsPageCopy,
  type ContactStat,
  type ContactCta,
  type OfficeLocationsContent,
  DEFAULT_CONTACT_US_COPY,
  DEFAULT_CONTACT_STATS,
  DEFAULT_LICENSING_CTA,
  DEFAULT_CONTACT_US_SEO,
  DEFAULT_OFFICE_LOCATIONS,
} from '../../app/services/contact-page-content.service';
import { HttpClient } from '@angular/common/http';



@Component({
  selector: 'app-contact-us',
  imports: [FormsModule, OfficeLocationsSectionComponent, CtaSectionComponent],
  templateUrl: './contact-us.html',
  styleUrl: './contact-us.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactUs implements OnInit, AfterViewInit {
  readonly ctaGradients = CTA_GRADIENTS;
  readonly licensingGradient = CTA_GRADIENTS[4];
  @ViewChild('licensingSection') licensingSection!: ElementRef<HTMLElement>;
  @ViewChild('contactImageContainer') contactImageContainer!: ElementRef<HTMLElement>;
  @ViewChild('contactForm') contactForm!: ElementRef<HTMLElement>;
  @ViewChild('recaptchaHost') recaptchaHost?: ElementRef<HTMLElement>;
  private readonly ngZone = inject(NgZone);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly seoMeta = inject(SeoMetaService);
  private readonly http = inject(HttpClient);
  private readonly contactContent = inject(ContactPageContentService);
  /** For edit mode: override content if provided */
  readonly contentOverride = input<any>(null);
  showLicensingAnimation = signal(false);
  showContactImageAnimation = signal(false);
  showFormAnimation = signal(false);
  readonly copy = signal<ContactUsPageCopy>(DEFAULT_CONTACT_US_COPY);
  readonly stats = signal<ContactStat[]>(DEFAULT_CONTACT_STATS);
  readonly licensingCtaCopy = signal<ContactCta>(DEFAULT_LICENSING_CTA);
  readonly officeLocations = signal<OfficeLocationsContent>(DEFAULT_OFFICE_LOCATIONS);
  submitted = false;
  isSubmitting = false;
  private recaptchaWidgetId: number | null = null;
  readonly recaptchaEnabled = true;
  validationErrors = {
    fullName: false,
    email: false,
    company: false,
    message: false,
    recaptcha: false,
  };

  constructor() {
    // if (typeof window !== 'undefined') {
    //   (window as any)['onRecaptchaSuccess'] = (token: string) => {
    //     this.ngZone.run(() => this.onRecaptchaSuccess(token));
    //   };
    // }
    effect(() => {
      const override = this.contentOverride();
      const content = this.unwrapContactContent(override);

      if (content?.contactUs) {
        this.copy.set(content.contactUs as ContactUsPageCopy);
      }
      if (content?.shared?.stats?.length) {
        this.stats.set(content.shared.stats as ContactStat[]);
      }
      if (content?.shared?.licensingCta) {
        this.licensingCtaCopy.set(content.shared.licensingCta);
      }
      if (content?.shared?.officeLocations) {
        this.officeLocations.set(content.shared.officeLocations);
      }
      if (content?.seo?.contactUs) {
        this.seoMeta.updateMeta({
          title: content.seo.contactUs.title,
          description: content.seo.contactUs.description,
          canonicalPath: '/contact-us',
        });
      }
    });
  }

  ngOnInit() {
    // Skip loading if content is overridden (edit mode).
    if (!this.contentOverride()) {
      this.loadContent();

      const seo = DEFAULT_CONTACT_US_SEO;
      this.seoMeta.updateMeta({
        title: seo.title,
        description: seo.description,
        canonicalPath: '/contact-us',
      });
    }
  }

  private loadContent() {
    this.contactContent.getContent().subscribe({
      next: (data) => {
        // In edit previews, never overwrite editor-provided content.
        if (this.contentOverride()) return;

        if (!data) return;
        if (data.contactUs) {
          this.copy.set(data.contactUs as ContactUsPageCopy);
        }
        if (data.shared?.stats?.length) {
          this.stats.set(data.shared.stats as ContactStat[]);
        }
        if (data.shared?.licensingCta) {
          this.licensingCtaCopy.set(data.shared.licensingCta);
        }
        if (data.shared?.officeLocations) {
          this.officeLocations.set(data.shared.officeLocations);
        }
        const seo = data.seo?.contactUs ?? DEFAULT_CONTACT_US_SEO;
        this.seoMeta.updateMeta({
          title: seo.title,
          description: seo.description,
          canonicalPath: '/contact-us',
        });
        this.cdr.markForCheck();
      },
      error: () => {
        // Keep defaults when content file is unavailable.
      },
    });
  }

  private unwrapContactContent(data: any): any {
    if (data && typeof data === 'object' && data.content && typeof data.content === 'object') {
      return data.content;
    }
    return data;
  }

  ngAfterViewInit() {
    if (typeof window !== 'undefined' && this.recaptchaEnabled) {
      setTimeout(() => this.initRecaptcha(), 400);
    }

    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      if (this.licensingSection) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                this.ngZone.run(() => {
                  this.showLicensingAnimation.set(true);
                  this.cdr.markForCheck();
                });
              } else {
                this.ngZone.run(() => {
                  this.showLicensingAnimation.set(false);
                  this.cdr.markForCheck();
                });
              }
            });
          },
          { threshold: 0.2 }
        );
        observer.observe(this.licensingSection.nativeElement);
      }

      if (this.contactImageContainer) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                this.ngZone.run(() => {
                  this.showContactImageAnimation.set(true);
                  this.cdr.markForCheck();
                });
              } else {
                this.ngZone.run(() => {
                  this.showContactImageAnimation.set(false);
                  this.cdr.markForCheck();
                });
              }
            });
          },
          { threshold: 0.2 }
        );
        observer.observe(this.contactImageContainer.nativeElement);
      }

      if (this.contactForm) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                this.ngZone.run(() => {
                  this.showFormAnimation.set(true);
                  this.cdr.markForCheck();
                });
              } else {
                this.ngZone.run(() => {
                  this.showFormAnimation.set(false);
                  this.cdr.markForCheck();
                });
              }
            });
          },
          { threshold: 0.2 }
        );
        observer.observe(this.contactForm.nativeElement);
      }
    }
  }

  private initRecaptcha(): void {
    if (typeof window === 'undefined' || !this.recaptchaHost?.nativeElement) return;

    const render = () => {
      const grecaptcha = (window as any).grecaptcha;
      if (!grecaptcha?.render || this.recaptchaWidgetId !== null) return;

      this.recaptchaWidgetId = grecaptcha.render(this.recaptchaHost!.nativeElement, {
        sitekey: '6Lcp8XwsAAAAAIrdZHBdw74jtoxwPxDRZW4F-rwu',
        callback: (token: string) => {
          this.ngZone.run(() => {
            this.recaptchaToken = token;
            this.validationErrors = { ...this.validationErrors, recaptcha: false };
            this.cdr.markForCheck();
          });
        },
        'expired-callback': () => {
          this.ngZone.run(() => {
            this.recaptchaToken = null;
            this.cdr.markForCheck();
          });
        },
      });
    };

    render();
    if (this.recaptchaWidgetId === null) {
      setTimeout(render, 500);
      setTimeout(render, 1500);
    }
  }

  readonly heroTitle = "Let's move your vision forward";
  readonly heroDescription = "Your goals guide the work - our expertise makes theirs real.";

  readonly heroCtaPrimary = {
    text: 'Schedule Consultation',
    link: '/contact-us#form',
    backgroundColor: '#1D69AC',
  };
  readonly heroCtaSecondary = {
    text: 'View Resources',
    link: '/resources',
    borderColor: '#ffffff',
  };

  formModel = {
    fullName: '',
    email: '',
    company: '',
    message: '',
  };

  recaptchaToken: string | null = null;

  onSubmit() {
    this.submitted = true;

    this.validationErrors = {
      fullName: !this.formModel.fullName,
      email: !this.formModel.email,
      company: !this.formModel.company,
      message: !this.formModel.message,
      recaptcha: this.recaptchaEnabled && !this.recaptchaToken,
    };

    if (
      !this.formModel.fullName ||
      !this.formModel.email ||
      !this.formModel.company ||
      !this.formModel.message ||
      (this.recaptchaEnabled && !this.recaptchaToken)
    ) {
      return;
    }

    this.isSubmitting = true;

    const payload = {
      fullName: this.formModel.fullName,
      email: this.formModel.email,
      company: this.formModel.company || 'Not provided',
      message: this.formModel.message,
    };

    this.http.post<{ success: boolean }>('/api/contact', payload).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.cdr.markForCheck();
        if (res?.success) {
          this.resetForm();
          this.router.navigate(['/contact-success']);
        } else {
          alert(this.copy().errors.submitFailed);
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.cdr.markForCheck();
        console.error('Contact form error:', err);
        alert(this.copy().errors.submitFailed);
      },
    });
  }

  private resetForm() {
    this.formModel = {
      fullName: '',
      email: '',
      company: '',
      message: '',
    };

    this.submitted = false;
    this.validationErrors = {
      fullName: false,
      email: false,
      company: false,
      message: false,
      recaptcha: false,
    };
    this.recaptchaToken = null;
    if (typeof window !== 'undefined' && this.recaptchaWidgetId !== null && (window as any).grecaptcha?.reset) {
      (window as any).grecaptcha.reset(this.recaptchaWidgetId);
    }
  }

  // onRecaptchaSuccess(token: any) {
  //   if (typeof token === 'string') {
  //     this.recaptchaToken = token;
  //     this.validationErrors.recaptcha = false;
  //   }
  // }
}
