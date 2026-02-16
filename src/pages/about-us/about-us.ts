import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { VideoHero } from '../../shared/video-hero/video-hero';
import { SeoMetaService } from '../../app/services/seo-meta.service';
import { LatestInsightsSectionComponent, type LatestInsightsSection } from '../../shared/sections/latest-insights/latest-insights';
import { CtaSectionComponent } from "../../shared/cta-section/cta-section.component";

export interface AboutFeature {
  icon: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
}

export interface TeamMember {
  name: string;
  title: string;
  image?: string;
  linkedIn?: string;
}

export interface HowWeWorkItem {
  title: string;
}

export interface BlogCard {
  image: string;
  imageAlt: string;
  category: string;
  title: string;
  description: string;
  link: string;
}

export interface AboutContent {
  heroTitle: string;
  heroDescription: string;
  videoUrls: string[];
  heroCtaPrimary: { text: string; link: string; backgroundColor: string };
  heroCtaSecondary: { text: string; link: string; borderColor: string };
  aboutLabel: string;
  aboutTitle: string;
  aboutDescription: string;
  aboutFeatures: AboutFeature[];
  partnerLogos: { src: string; alt: string }[];
  videoSectionTitle: string;
  videoSectionDescription: string;
  videoSectionImage: string;
  teamLabel: string;
  teamTitle: string;
  teamDescription: string;
  teamMembers: TeamMember[];
  deliverBannerTitle: string;
  deliverBannerDescription: string;
  approachLabel: string;
  approachTitle: string;
  approachDescription: string;
  howWeWorkItems: HowWeWorkItem[];
  insightsLabel: string;
  insightsTitle: string;
  insightsDescription: string;
  insightCards: BlogCard[];
  ctaBannerTitle: string;
  ctaBannerDescription: string;
}

@Component({
  selector: 'app-about-us',
  imports: [VideoHero, LatestInsightsSectionComponent, CtaSectionComponent],
  templateUrl: './about-us.html',
  styleUrl: './about-us.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AboutUs implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly seoMeta = inject(SeoMetaService);

  readonly content = signal<AboutContent | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  /** Sección para app-latest-insights (mapeada desde content). */
  readonly insightsSection = computed<LatestInsightsSection | null>(() => {
    const c = this.content();
    if (!c) return null;
    return {
      label: c.insightsLabel,
      title: c.insightsTitle,
      subtitle: c.insightsDescription,
      articles: c.insightCards.map((card, i) => ({
        id: i,
        title: card.title,
        description: card.description,
        link: card.link,
        linkText: 'Read more',
        image: { url: card.image, alt: card.imageAlt },
        tags: [card.category],
      })),
      cta: { text: 'View all', link: '/blog' },
    };
  });

  ngOnInit() {
    this.seoMeta.updateMeta({
      title: 'About Us | Oakwood Systems',
      description: 'Learn about Oakwood Systems, a Microsoft Solutions Partner driving business innovation and modernization with Azure and cloud services.',
      canonicalPath: '/about-us',
    });
    this.http.get<AboutContent>('/about-content.json').subscribe({
      next: (data) => {
        this.content.set(data);
        this.seoMeta.updateMeta({
          title: `${data.heroTitle} | Oakwood Systems`,
          description: data.heroDescription,
          canonicalPath: '/about-us',
        });
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load about content');
        this.loading.set(false);
      },
    });
  }
}
