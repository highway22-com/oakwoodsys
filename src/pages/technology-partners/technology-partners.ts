import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { take, catchError, of } from 'rxjs';
import { VideoHero } from '../../shared/video-hero/video-hero';
import { SeoMetaService } from '../../app/services/seo-meta.service';
import { ButtonPrimaryComponent } from '../../shared/button-primary/button-primary.component';
export interface TechPartner {
  name: string;
  logoUrl: string;
  description: string;
  website: string;
  category: string;
}

export interface TechPartnersContent {
  hero: {
    title: string;
    description: string;
    heroVideoUrls: string[];
    heroImage?: string;
  };
  intro: string;
  partners: TechPartner[];
}

@Component({
  selector: 'app-technology-partners',
  standalone: true,
  imports: [CommonModule, VideoHero, ButtonPrimaryComponent],
  templateUrl: './technology-partners.html',
  styleUrl: './technology-partners.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TechnologyPartnersComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly seoMeta = inject(SeoMetaService);

  readonly loading = signal(true);
  readonly content = signal<TechPartnersContent | null>(null);

  ngOnInit() {
    this.seoMeta.updateMeta({
      title: 'Technology Partners | Oakwood Systems',
      description:
        'At Oakwood, our team leverages our industry knowledge and leadership in technology to align our partner innovations with your specific business needs.',
      canonicalPath: '/technology-partners',
    });

    this.http
      .get<TechPartnersContent>('/technology-partners-content.json')
      .pipe(
        take(1),
        catchError(() => of(null)),
      )
      .subscribe((data) => {
        this.content.set(data);
        this.loading.set(false);
      });
  }

  getPartnerRows(partners: TechPartner[]): TechPartner[][] {
    const rows: TechPartner[][] = [];
    for (let i = 0; i < partners.length; i += 3) {
      rows.push(partners.slice(i, i + 3));
    }
    return rows;
  }
}