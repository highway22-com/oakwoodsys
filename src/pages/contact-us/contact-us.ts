import { ChangeDetectionStrategy, Component, inject, NgZone, ViewChild, ElementRef, AfterViewInit, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OfficeLocationsSectionComponent } from '../../shared/office-locations-section/office-locations-section.component';
import { CTA_GRADIENTS, CtaSectionComponent } from '../../shared/cta-section/cta-section.component';
import { SeoMetaService } from '../../app/services/seo-meta.service';
import emailjs from '@emailjs/browser';



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
  showLicensingAnimation = signal(false);
  showContactImageAnimation = signal(false);
  showFormAnimation = signal(false);
  submitted = false;
  isSubmitting = false;
  private recaptchaWidgetId: number | null = null;
  validationErrors = {
    fullName: false,
    email: false,
    company: false,
    message: false,
    recaptcha: false,
  };

  constructor() {
    // Initialize EmailJS
    emailjs.init('Xw-Lh8d6dJzqqA08R');

    if (typeof window !== 'undefined') {
      (window as any)['onRecaptchaSuccess'] = (token: string) => {
        this.ngZone.run(() => this.onRecaptchaSuccess(token));
      };
    }
  }

  ngOnInit() {
    this.seoMeta.updateMeta({
      title: 'Contact Us | Oakwood Systems',
      description: "Let's move your vision forward. Get in touch with Oakwood Systems for Microsoft solutions, Azure consulting, and digital transformation.",
      canonicalPath: '/contact-us',
    });
  }

  ngAfterViewInit() {
    this.initRecaptcha();

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
    if (typeof window === 'undefined' || !this.recaptchaHost?.nativeElement) {
      return;
    }

    const render = () => {
      const grecaptcha = (window as any).grecaptcha;
      if (!grecaptcha?.render || this.recaptchaWidgetId !== null) {
        return;
      }

      this.recaptchaWidgetId = grecaptcha.render(this.recaptchaHost!.nativeElement, {
        sitekey: '6Lcxz20sAAAAADeQNIyXPS7BCqu30dGRazhNwn8W',
        callback: (token: string) => {
          this.ngZone.run(() => {
            this.recaptchaToken = token;
            this.validationErrors.recaptcha = false;
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
      setTimeout(render, 300);
      setTimeout(render, 1000);
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

    // Reset validation errors
    this.validationErrors = {
      fullName: !this.formModel.fullName,
      email: !this.formModel.email,
      company: !this.formModel.company,
      message: !this.formModel.message,
      recaptcha: !this.recaptchaToken,
    };

    if (!this.formModel.fullName || !this.formModel.email || !this.formModel.company || !this.formModel.message || !this.recaptchaToken) {
      return;
    }

    this.isSubmitting = true;
// to_email: 'marketing@oakwoodsys.com', // Recipient email
    const emailParams = {
      to_email: this.formModel.email,
      from_name: this.formModel.fullName,
      from_email: this.formModel.email,
      company: this.formModel.company || 'Not provided',
      message: this.formModel.message,
    };

    emailjs
      .send('service_xelw36u', 'template_s238tmd', emailParams)
      .then(() => {
        this.isSubmitting = false;
        this.resetForm();
        this.router.navigate(['/contact-success']);
      })
      .catch((error: unknown) => {
        this.isSubmitting = false;
        console.error('Email sending failed:', error);
        alert('Failed to send message. Please try again later.');
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

  onRecaptchaSuccess(token: any) {
    if (typeof token === 'string') {
      this.recaptchaToken = token;
      this.validationErrors.recaptcha = false;
    }
  }
}
