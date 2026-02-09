import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { VideoHero } from '../../shared/video-hero/video-hero';
import { CtaSectionComponent } from "../../shared/cta-section/cta-section.component";

interface IndustryChallengeCard {
  id: string;
  image: string;
  title: string;
  description: string;
}

interface IndustryImproveCard {
  icon: string;
  title: string;
  description: string;
}

interface IndustryContent {
  slug: string;
  title: string;
  description: string;
  backgroundImage?: string;
  videoUrls?: string[];
  cta?: {
    primary?: { text: string; link: string; backgroundColor?: string };
    secondary?: { text: string; link: string; borderColor?: string };
  };
  trustedLeaders?: { title: string; partners: { name: string; logo: string; alt: string }[] };
  industryChallenges?: {
    sectionTitle: string;
    mainHeading: string;
    subDescription: string;
    cards: IndustryChallengeCard[];
  };
  howWeImprove?: {
    sectionTitle: string;
    mainHeading: string;
    subDescription: string;
    cards: IndustryImproveCard[];
    cta?: { text: string; link: string };
  };
  featuredCaseStudy?: {
    sectionTitle: string;
    subHeading: string;
    title: string;
    description: string;
    image: string;
    ctaPrimary?: { text: string; link: string };
    ctaSecondary?: { text: string; link: string };
  };
  ctaSection?: {
    heading: string;
    description: string;
    primaryCta?: { text: string; link: string };
    secondaryCta?: { text: string; link: string };
  };
}

interface IndustriesContent {
  industries: { [key: string]: IndustryContent };
}

@Component({
  selector: 'app-industries',
  imports: [CommonModule, RouterLink, VideoHero, CtaSectionComponent],
  templateUrl: './industries.html',
  styleUrl: './industries.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Industries implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private routeSub?: Subscription;

  readonly slug = signal<string | null>(null);
  readonly content = signal<IndustryContent | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit() {
    this.routeSub = this.route.paramMap.subscribe(params => {
      const slugParam = params.get('slug');
      this.slug.set(slugParam);
      this.loadContent();
    });
  }

  ngOnDestroy() {
    this.routeSub?.unsubscribe();
  }

  /** ctaPrimary en formato requerido por app-video-hero (backgroundColor obligatorio). */
  getCtaPrimary(c: IndustryContent): { text: string; link: string; backgroundColor: string } | undefined {
    const p = c.cta?.primary;
    if (!p) return undefined;
    return { text: p.text, link: p.link, backgroundColor: p.backgroundColor ?? '#1D69AC' };
  }

  private loadContent() {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<IndustriesContent>('/industries-content.json').subscribe({
      next: (data) => {
        const slugValue = this.slug();
        if (slugValue && data.industries[slugValue]) {
          this.content.set(data.industries[slugValue]);
        } else {
          this.error.set(slugValue ? `Industry "${slugValue}" not found` : null);
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load content');
        this.loading.set(false);
      },
    });
  }
}
