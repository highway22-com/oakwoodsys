import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface OfficeLocation {
  name: string;
  address: string;
  email: string;
  phone: string;
  mapEmbedUrl: string;
}

@Component({
  selector: 'app-office-locations-section',
  standalone: true,
  templateUrl: './office-locations-section.component.html',
  styleUrl: './office-locations-section.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfficeLocationsSectionComponent {
  private readonly sanitizer = inject(DomSanitizer);

  readonly offices: OfficeLocation[] = [
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
  ];

  getMapUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
