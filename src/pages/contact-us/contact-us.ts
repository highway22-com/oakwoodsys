import { ChangeDetectionStrategy, Component, inject, NgZone, ViewChild, ElementRef, AfterViewInit, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { VideoHero } from '../../shared/video-hero/video-hero';
import { Footer } from '../../shared/footer/footer';
import { SeoMetaService } from '../../app/services/seo-meta.service';
import emailjs from '@emailjs/browser';

const PLACEHOLDER_VIDEO_URLS = [
  'https://oakwoodsys.com/wp-content/uploads/2026/02/Contact-Us-1.mp4',
];

export interface OfficeLocation {
  name: string;
  address: string;
  email: string;
  phone: string;
  mapEmbedUrl: string;
  mapLink: string;
}

@Component({
  selector: 'app-contact-us',
  imports: [FormsModule, RouterLink, VideoHero, Footer],
  templateUrl: './contact-us.html',
  styleUrl: './contact-us.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactUs implements OnInit, AfterViewInit {
  @ViewChild('licensingSection') licensingSection!: ElementRef<HTMLElement>;
  @ViewChild('contactImageContainer') contactImageContainer!: ElementRef<HTMLElement>;
  @ViewChild('contactForm') contactForm!: ElementRef<HTMLElement>;
  private readonly ngZone = inject(NgZone);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly seoMeta = inject(SeoMetaService);
  showLicensingAnimation = signal(false);
  showContactImageAnimation = signal(false);
  showFormAnimation = signal(false);
  submitted = false;
  isSubmitting = false;
  validationErrors = {
    fullName: false,
    email: false,
    company: false,
    message: false,
  };

  constructor() {
    // Initialize EmailJS
    emailjs.init('Xw-Lh8d6dJzqqA08R');

    // Expose callback to window for reCAPTCHA
    // (window as any)['onRecaptchaSuccess'] = (token: string) => {
    //   this.ngZone.run(() => this.onRecaptchaSuccess(token));
    // };
  }

  ngOnInit() {
    this.seoMeta.updateMeta({
      title: 'Contact Us | Oakwood Systems',
      description: "Let's move your vision forward. Get in touch with Oakwood Systems for Microsoft solutions, Azure consulting, and digital transformation.",
      canonicalPath: '/contact-us',
    });
  }

  ngAfterViewInit() {
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

  readonly heroTitle = "Let's move your vision forward";
  readonly heroDescription = "Your goals guide the work - our expertise makes theirs real.";
  readonly videoUrls = PLACEHOLDER_VIDEO_URLS;
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

  readonly offices: OfficeLocation[] = [
    {
      name: 'St. Louis Office',
      address: '1001 Craig Road, Suite 305, St. Louis, MO 63146',
      email: 'marketing@oakwoodsys.com',
      phone: '(330) 648-3700',
      mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3182.817682893!2d-90.4434!3d38.6270!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzjCsDM3JzM3LjIiTiA5MMKwMjYnMzYuMiJX!5e0!3m2!1sen!2sus!4v1',
      mapLink: 'https://www.google.com/maps/search/1001+Craig+Road+Suite+305+St+Louis+MO+63146',
    },
    {
      name: 'Kansas City Office',
      address: '10000 Marshall Drive, Suite 27, Lenexa, KS 66215',
      email: 'marketing@oakwoodsys.com',
      phone: '(913) 892-9025',
      mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3100.0!2d-94.8!3d38.95!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzjCsDU3JzAwLjAiTiA5NMKwNDgnMDAuMCJX!5e0!3m2!1sen!2sus!4v1',
      mapLink: 'https://www.google.com/maps/search/10000+Marshall+Drive+Suite+27+Lenexa+KS+66215',
    },
  ];

  formModel = {
    fullName: '',
    email: '',
    company: '',
    message: '',
  };

  recaptchaToken: string | null = null;

  private readonly sanitizer = inject(DomSanitizer);

  getMapUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  onSubmit() {
    this.submitted = true;

    // Reset validation errors
    this.validationErrors = {
      fullName: !this.formModel.fullName,
      email: !this.formModel.email,
      company: !this.formModel.company,
      message: !this.formModel.message,
    };

    if (!this.formModel.fullName || !this.formModel.email || !this.formModel.company || !this.formModel.message) {
      return;
    }

    this.isSubmitting = true;

    const emailParams = {
      to_email: 'marketing@oakwoodsys.com', // Recipient email
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
    };
    // Reset reCAPTCHA
    // if ((window as any).grecaptcha) {
    //   (window as any).grecaptcha.reset();
    // }
  }

  // onRecaptchaSuccess(token: any) {
  //   if (typeof token === 'string') {
  //     this.recaptchaToken = token;
  //   }
  // }
}
