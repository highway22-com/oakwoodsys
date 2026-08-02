import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, afterNextRender, computed, inject, input, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

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

@Component({
  selector: 'app-office-locations-section',
  standalone: true,
  templateUrl: './office-locations-section.component.html',
  styleUrl: './office-locations-section.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfficeLocationsSectionComponent implements OnDestroy {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private observer?: IntersectionObserver;
  private readonly officeImageByName: Record<string, string> = {
    'St. Louis Office': 'Louis_Office.png',
    'Kansas City Office': 'Kansas_City_Office.png',
  };

  readonly dataOverride = input<OfficeLocationsContent | null>(null);

  private readonly defaultContent: OfficeLocationsContent = {
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
      },
      {
        name: 'Kansas City Office',
        address: '10000 Marshall Drive, Suite 27, Lenexa, KS 66215',
        email: 'marketing@oakwoodsys.com',
        phone: '(913) 892-9025',
        mapEmbedUrl:
          'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3100.0!2d-94.8!3d38.95!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzjCsDU3JzAwLjAiTiA5NMKwNDgnMDAuMCJX!5e0!3m2!1sen!2sus!4v1',
      },
    ],
  };

  readonly content = computed(() => this.dataOverride() ?? this.defaultContent);

  // Maps load once this section nears the viewport, via IntersectionObserver rather
  // than a scroll listener — IntersectionObserver reports asynchronously off the
  // compositor thread instead of forcing a synchronous layout read on every scroll frame.
  readonly sectionVisible = signal(false);

  constructor() {
    afterNextRender(() => {
      if (typeof IntersectionObserver === 'undefined') {
        this.sectionVisible.set(true);
        return;
      }
      this.observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            this.sectionVisible.set(true);
            this.observer?.disconnect();
            this.observer = undefined;
          }
        },
        { rootMargin: '200px 0px' }
      );
      this.observer.observe(this.elementRef.nativeElement);
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  getMapUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  getOfficeImage(office: OfficeLocation): string {
    if (office.image) {
      return office.image;
    }
    const name = office.name;
    const fileName = this.officeImageByName[name] ?? 'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/07/contact-us-new-pic-scaled-1.webp';
    return `assets/${fileName}`;
  }
}
