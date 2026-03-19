import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, finalize, map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { GraphQLContentService } from './graphql-content.service';

export interface ContactSeoEntry {
  title: string;
  description: string;
}

export interface ContactStat {
  value: string;
  label: string;
  icon?: string;
}

export interface ContactCta {
  title: string;
  description: string;
  primaryText: string;
  primaryLink: string;
}

export interface OfficeLocation {
  name: string;
  address: string;
  email: string;
  phone: string;
  mapEmbedUrl: string;
  image?: string;
}

export interface OfficeLocationsContent {
  label: string;
  title: string;
  description: string;
  offices: OfficeLocation[];
}

export interface ContactUsPageCopy {
  formLabel: string;
  formTitle: string;
  formDescription: string;
  fields: {
    fullNameLabel: string;
    fullNamePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    companyLabel: string;
    companyPlaceholder: string;
    messageLabel: string;
    messagePlaceholder: string;
  };
  errors: {
    fullNameRequired: string;
    emailRequired: string;
    companyRequired: string;
    messageRequired: string;
    recaptchaRequired: string;
    submitFailed: string;
  };
  submitButton: {
    idle: string;
    loading: string;
  };
  image: {
    src: string;
    alt: string;
  };
}

export interface ContactSuccessCopy {
  titleLine1: string;
  titleLine2: string;
  description: string;
  image: {
    src: string;
    alt: string;
  };
}

export interface ContactPageContentResponse {
  seo?: {
    contactUs?: ContactSeoEntry;
    contactSuccess?: ContactSeoEntry;
  };
  shared?: {
    stats?: ContactStat[];
    licensingCta?: ContactCta;
    officeLocations?: OfficeLocationsContent;
  };
  contactUs?: ContactUsPageCopy;
  contactSuccess?: ContactSuccessCopy;
}

export const DEFAULT_CONTACT_US_SEO: ContactSeoEntry = {
  title: 'Contact Us | Oakwood Systems',
  description: "Let's move your vision forward. Get in touch with Oakwood Systems for Microsoft solutions, Azure consulting, and digital transformation.",
};

export const DEFAULT_CONTACT_SUCCESS_SEO: ContactSeoEntry = {
  title: 'Contact Success | Oakwood Systems',
  description: "Thank you for contacting Oakwood Systems. We've received your message and our team will be in touch soon.",
};

export const DEFAULT_CONTACT_US_COPY: ContactUsPageCopy = {
  formLabel: 'Contact US',
  formTitle: 'Start the conversation',
  formDescription: "Tell us a bit about your project and we'll reach out to help you make it a reality.",
  fields: {
    fullNameLabel: 'Your full name',
    fullNamePlaceholder: 'Your name',
    emailLabel: 'Work email address',
    emailPlaceholder: 'email@example.com',
    companyLabel: 'Company name',
    companyPlaceholder: 'Your company',
    messageLabel: 'Message',
    messagePlaceholder: "Describe what you need help with or what you're planning next",
  },
  errors: {
    fullNameRequired: 'Full name is required',
    emailRequired: 'Email is required',
    companyRequired: 'Company is required',
    messageRequired: 'Message is required',
    recaptchaRequired: 'Please verify that you are not a robot',
    submitFailed: 'Failed to send message. Please try again later.',
  },
  submitButton: {
    idle: 'Submit',
    loading: 'Sending...',
  },
  image: {
    src: '/assets/contact-us-new-pic.png',
    alt: 'Data center',
  },
};

export const DEFAULT_CONTACT_SUCCESS_COPY: ContactSuccessCopy = {
  titleLine1: 'Thanks for reaching out.',
  titleLine2: "We'll be in touch soon",
  description: "We've received your message and our team will review it shortly.",
  image: {
    src: '/assets/contact-us-new-pic.png',
    alt: '',
  },
};

export const DEFAULT_CONTACT_STATS: ContactStat[] = [
  {
    value: '40%',
    label: 'Faster time to value',
    icon: 'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/03/arrow-trend-up.png',
  },
  {
    value: '98%',
    label: 'Client satisfaction',
    icon: 'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/03/thumbs-up.png',
  },
  {
    value: 'Microsoft',
    label: 'Certified experts',
    icon: 'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/03/badge-check.png',
  },
];

export const DEFAULT_LICENSING_CTA: ContactCta = {
  title: 'Need Microsoft licensing help?',
  description: 'As a Tier-1 CSP, Oakwood can simplify, manage, and support your M365 and Azure licensing.',
  primaryText: 'Speak to a licensing expert',
  primaryLink: '/contact-us',
};

export const DEFAULT_OFFICE_LOCATIONS: OfficeLocationsContent = {
  label: 'Locations',
  title: 'Find an Oakwood office',
  description: 'Find our office locations and direct contact details for regional support and inquiries.',
  offices: [
    {
      name: 'St. Louis Office',
      address: '1001 Craig Road, Suite 305, St. Louis, MO 63146',
      email: 'marketing@oakwoodsys.com',
      phone: '(330) 648-3700',
      mapEmbedUrl:
        'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3182.817682893!2d-90.4434!3d38.6270!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzjCsDM3JzM3LjIiTiA5MMKwMjYnMzYuMiJX!5e0!3m2!1sen!2sus!4v1',
      image: '/assets/Louis_Office.png',
    },
    {
      name: 'Kansas City Office',
      address: '10000 Marshall Drive, Suite 27, Lenexa, KS 66215',
      email: 'marketing@oakwoodsys.com',
      phone: '(913) 892-9025',
      mapEmbedUrl:
        'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3100.0!2d-94.8!3d38.95!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzjCsDU3JzAwLjAiTiA5NMKwNDgnMDAuMCJX!5e0!3m2!1sen!2sus!4v1',
      image: '/assets/Kansas_City_Office.png',
    },
  ],
};

@Injectable({
  providedIn: 'root',
})
export class ContactPageContentService {
  private readonly http = inject(HttpClient);
  private readonly graphql = inject(GraphQLContentService);

  private readonly staticFallbackUrl = '/contact-us-content.json';

  private cache: ContactPageContentResponse | null = null;
  private inFlight$: Observable<ContactPageContentResponse | null> | null = null;

  getContent(): Observable<ContactPageContentResponse | null> {
    if (this.cache) {
      return of(this.cache);
    }

    if (this.inFlight$) {
      return this.inFlight$;
    }

    this.inFlight$ = this.graphql.getCmsPageBySlug('contact-us', { fetchPolicy: 'network-only' }).pipe(
      map((data) => data as ContactPageContentResponse | null),
      switchMap((cmsData) => {
        if (cmsData) {
          return of(cmsData);
        }
        return this.http.get<ContactPageContentResponse>(this.staticFallbackUrl).pipe(
          catchError(() => of(null))
        );
      }),
      tap((data) => {
        this.cache = data ?? null;
      }),
      catchError(() => of(null)),
      finalize(() => {
        this.inFlight$ = null;
      }),
      shareReplay(1)
    );

    return this.inFlight$;
  }

  clearCache() {
    this.cache = null;
  }
}
