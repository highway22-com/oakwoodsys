import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { VideoHero } from '../../shared/video-hero/video-hero';
import { LatestInsightsSectionComponent, type LatestInsightsSection } from '../../shared/sections/latest-insights/latest-insights';
import { CtaSectionComponent } from "../../shared/cta-section/cta-section.component";
import { ButtonPrimaryComponent } from "../../shared/button-primary/button-primary.component";
import { ScrollAnimationComponent } from '../../shared/scroll-animation-component/scroll-animation.component';

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
  description:string
  icon:string;
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
  imports: [VideoHero, LatestInsightsSectionComponent, CtaSectionComponent, ButtonPrimaryComponent, ScrollAnimationComponent],
  templateUrl: './about-us.html',
  styleUrl: './about-us.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AboutUs implements OnInit {
  private readonly http = inject(HttpClient);

  readonly content = signal<AboutContent | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  selectedHowWeWorkItem: any = null;

  scrollAnimationVisible = signal(false);
  scrollAnimationReverse = signal(false);

  setSelectedItem(item: any) {
    this.selectedHowWeWorkItem = item;
  }

  clearSelectedItem() {
    this.selectedHowWeWorkItem = null;
  }

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
    this.http.get<AboutContent>('/about-content.json').subscribe({
      next: (data) => {
        this.content.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load about content');
        this.loading.set(false);
      },
    });

    this.lastScrollVisible = false;
    window.addEventListener('scroll', this.handleScrollAnimation.bind(this));
    setTimeout(() => this.handleScrollAnimation(), 100);
  }

  lastScrollVisible = false;

  handleScrollAnimation() {
    const el = document.querySelector('.scroll-animation-section');
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const visible = rect.top < windowHeight * 0.7 && rect.bottom > windowHeight * 0.3;
    this.scrollAnimationReverse.set(this.lastScrollVisible && !visible);
    this.scrollAnimationVisible.set(visible);
    this.lastScrollVisible = visible;
  }
}
