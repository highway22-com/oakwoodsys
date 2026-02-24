import { ChangeDetectionStrategy, Component, signal, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Apollo } from 'apollo-angular';
import { DomSanitizer } from '@angular/platform-browser';
import type { SafeHtml } from '@angular/platform-browser';
import { getAcfMediaUrl, getPrimaryTagName, GET_GEN_CONTENTS_BY_CATEGORY, GET_GEN_CONTENTS_BY_TAG_AND_CATEGORY, GET_CASE_STUDY_BY_SLUG } from '../../app/api/graphql';
import type {
  CaseStudyBy,
  CaseStudyByResponse,
  GenContentListNode,
  GenContentsByCategoryResponse,
  GenContentsByTagAndCategoryResponse,
} from '../../app/api/graphql';
import { VideoHero } from '../../shared/video-hero/video-hero';
import { FeaturedCaseStudyCardsSectionComponent } from '../../shared/sections/featured-case-study-cards/featured-case-study';
import { FeaturedCaseStudyCategory } from '../../shared/sections/featured-case-study/featured-case-study-category';
import { BlogCardComponent } from '../../shared/blog-card/blog-card.component';
import { CtaSectionComponent } from "../../shared/cta-section/cta-section.component";
import { SeoMetaService } from '../../app/services/seo-meta.service';
import { decodeHtmlEntities } from '../../app/utils/cast';

/** Contenido de la página Resources (resources-content.json). */
export interface ResourcesPageContent {
  page?: string;
  videoHero?: {
    videoUrls?: string[];
    title?: string;
    description?: string;
    ctaPrimary?: { text?: string; link?: string; backgroundColor?: string };
    ctaSecondary?: { text?: string; link?: string; borderColor?: string };
  };
  hero?: {
    title?: string;
    description?: string;
    backgroundImage?: string;
    ctaPrimary?: { text?: string; link?: string };
    ctaSecondary?: { text?: string; link?: string };
  };
  featuredCaseStudy?: { label?: string; readMoreText?: string };
  /** Slugs para app-featured-case-study-cards. */
  featuredCaseStudySlugs?: string[];
  /** Pestañas de filtro (displayCategory, value). */
  filters?: { displayCategory: string; value: string, iconSvg:any }[];
  filterAndSearch?: { searchPlaceholder?: string; emptyStateMessage?: string };
  resourcesGrid?: { loadMoreText?: string; readMoreText?: string };
  ctaSection?: {
    title?: string;
    description?: string;
    ctaPrimary?: { text?: string; link?: string };
    ctaSecondary?: { text?: string; link?: string };
  };
}

interface ResourceCard {
  id: string;
  image: string;
  category: string;
  date: string;
  title: string;
  description: string;
  link: string;
  slug: string;
  /** Etiquetas (como en blog). */
  tags?: string[];
  /** Etiqueta principal para el badge (como en blog). */
  primaryTag?: string | null;
}

interface FeaturedCaseStudy {
  id: string;
  image: string;
  title: string;
  description: string;
  link: string;
  currentIndex: number;
  total: number;
}

interface CaseStudyDetail {
  slug: string;
  title: string;
  heroImage: string;
  tags: string[];
  overview: string;
  businessChallenge: string;
  solution: string;
  solutionImage?: string;
  testimonial?: {
    company: string;
    companyLogo?: string;
    quote: string;
    author: string;
    role: string;
  };
  relatedCaseStudies: ResourceCard[];
  connectedServices: {
    id: string;
    icon: string;
    title: string;
    description: string;
    link: string;
    slug: string;
  }[];
}

@Component({
  selector: 'app-resources-wordpress',
  imports: [CommonModule, VideoHero, FeaturedCaseStudyCardsSectionComponent, BlogCardComponent, CtaSectionComponent],
  templateUrl: './resources.html',
  styleUrl: './resources.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Resources implements OnInit {
  readonly FeaturedCaseStudyCategory = FeaturedCaseStudyCategory;
    /** Returns sanitized iconSvg for filter icons */
    getSanitizediconSvg(iconSvg: string): SafeHtml {
      return this.sanitizer.bypassSecurityTrustHtml(iconSvg);
    }
  slug: string | null = null;
  selectedFilter = signal<string>('All');
  searchQuery = signal<string>('');
  private readonly apollo = inject(Apollo);
  private readonly http = inject(HttpClient);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly router = inject(Router);
  private readonly seoMeta = inject(SeoMetaService);
  private readonly platformId = inject(PLATFORM_ID);
   isOpen = false;




  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  /** Returns the display name for the selected filter */
  getSelectedFilterDisplayName(): string {
    const selected = this.selectedFilter();
    const filter = this.filters.find(f => f.value === selected);
    return filter?.displayCategory || 'Select the Filter';
  }

 

  /** Contenido estático de la página (hero, CTAs, textos, filtros) desde resources-content.json. */
  readonly pageContent = signal<ResourcesPageContent | null>(null);

  /** Categorías Gen Content (deben coincidir con gen_content_category en WordPress). value = slug para queries GraphQL. */
  private static readonly GEN_CONTENT_CATEGORIES: { name: string; slug: string, iconSvg:any }[] = [
    { name: 'High-Performance Computing (HPC)',
      
      
      iconSvg:`<iconSvg width="21" height="18" viewBox="0 0 21 18" fill="none" xmlns="http://www.w3.org/2000/iconSvg">
<path d="M0 0.84375C0 0.386719 0.351562 0 0.84375 0H3.375C3.76172 0 4.11328 0.316406 4.18359 0.703125L5.66016 8.4375H16.7695L18.2812 2.8125H16.5938C16.1016 2.8125 15.75 2.46094 15.75 1.96875C15.75 1.51172 16.1016 1.125 16.5938 1.125H19.4062C19.6523 1.125 19.8984 1.26562 20.0742 1.47656C20.2148 1.6875 20.2852 1.96875 20.2148 2.21484L18.2461 9.52734C18.1406 9.87891 17.7891 10.125 17.4375 10.125H5.97656L6.29297 11.8125H17.1562C17.6133 11.8125 18 12.1992 18 12.6562C18 13.1484 17.6133 13.5 17.1562 13.5H5.58984C5.20312 13.5 4.85156 13.2188 4.78125 12.832L2.67188 1.6875H0.84375C0.351562 1.6875 0 1.33594 0 0.84375ZM7.875 16.3125C7.875 17.2617 7.10156 18 6.1875 18C5.23828 18 4.5 17.2617 4.5 16.3125C4.5 15.3984 5.23828 14.625 6.1875 14.625C7.10156 14.625 7.875 15.3984 7.875 16.3125ZM14.625 16.3125C14.625 15.3984 15.3633 14.625 16.3125 14.625C17.2266 14.625 18 15.3984 18 16.3125C18 17.2617 17.2266 18 16.3125 18C15.3633 18 14.625 17.2617 14.625 16.3125ZM13.5 3.65625C13.957 3.65625 14.3438 4.04297 14.3438 4.5C14.3438 4.99219 13.957 5.34375 13.5 5.34375H9C8.50781 5.34375 8.15625 4.99219 8.15625 4.5C8.15625 4.04297 8.50781 3.65625 9 3.65625H13.5Z" fill="#454545"/>
</iconSvg>

`,
      slug: 'high-performance-computing-hpc' },
    { name: 'Data & AI Solutions',
            iconSvg:`<svg width="18" height="17" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M6.1875 11.25C5.87109 11.25 5.625 11.0039 5.625 10.6875V9.5625C5.625 9.28125 5.87109 9 6.1875 9H7.875V7.3125C7.875 7.03125 8.12109 6.75 8.4375 6.75H9.5625C9.84375 6.75 10.125 7.03125 10.125 7.3125V9H11.8125C12.0938 9 12.375 9.28125 12.375 9.5625V10.6875C12.375 11.0039 12.0938 11.25 11.8125 11.25H10.125V12.9375C10.125 13.2539 9.84375 13.5 9.5625 13.5H8.4375C8.12109 13.5 7.875 13.2539 7.875 12.9375V11.25H6.1875ZM15.75 3.375C16.9805 3.375 18 4.39453 18 5.625V14.625C18 15.8906 16.9805 16.875 15.75 16.875H2.25C0.984375 16.875 0 15.8906 0 14.625V5.625C0 4.39453 0.984375 3.375 2.25 3.375H4.5V2.25C4.5 1.01953 5.48438 0 6.75 0H11.25C12.4805 0 13.5 1.01953 13.5 2.25V3.375H15.75ZM6.1875 2.25V3.375H11.8125V2.25C11.8125 1.96875 11.5312 1.6875 11.25 1.6875H6.75C6.43359 1.6875 6.1875 1.96875 6.1875 2.25ZM2.8125 15.1875V5.0625H2.25C1.93359 5.0625 1.6875 5.34375 1.6875 5.625V14.625C1.6875 14.9414 1.93359 15.1875 2.25 15.1875H2.8125ZM13.5 15.1875V5.0625H4.5V15.1875H13.5ZM16.3125 14.625V5.625C16.3125 5.34375 16.0312 5.0625 15.75 5.0625H15.1875V15.1875H15.75C16.0312 15.1875 16.3125 14.9414 16.3125 14.625Z" fill="#454545"/>
</svg>


`, slug: 'data-ai-solutions' },
    { name: 'Cloud & Infrastructure', iconSvg: `<iconSvg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/iconSvg">
<path d="M9 2.8125C9.59766 2.8125 10.125 3.33984 10.125 3.9375C10.125 4.57031 9.59766 5.0625 9 5.0625C8.36719 5.0625 7.875 4.57031 7.875 3.9375C7.875 3.33984 8.36719 2.8125 9 2.8125ZM9 14.3438C7.91016 14.3438 7.03125 13.4648 7.03125 12.375C7.03125 11.3203 7.91016 10.4062 9 10.4062C9.35156 10.4062 9.66797 10.5117 9.98438 10.6875L13.8516 8.05078C14.2383 7.76953 14.7656 7.875 15.0117 8.26172C15.293 8.64844 15.1875 9.17578 14.8008 9.42188L10.9336 12.0938C10.9336 12.1992 10.9688 12.2695 10.9688 12.375C10.9688 13.4648 10.0547 14.3438 9 14.3438ZM12.375 4.5C12.9727 4.5 13.5 5.02734 13.5 5.625C13.5 6.25781 12.9727 6.75 12.375 6.75C11.7422 6.75 11.25 6.25781 11.25 5.625C11.25 5.02734 11.7422 4.5 12.375 4.5ZM3.9375 10.125C3.30469 10.125 2.8125 9.63281 2.8125 9C2.8125 8.40234 3.30469 7.875 3.9375 7.875C4.53516 7.875 5.0625 8.40234 5.0625 9C5.0625 9.63281 4.53516 10.125 3.9375 10.125ZM5.625 4.5C6.22266 4.5 6.75 5.02734 6.75 5.625C6.75 6.25781 6.22266 6.75 5.625 6.75C4.99219 6.75 4.5 6.25781 4.5 5.625C4.5 5.02734 4.99219 4.5 5.625 4.5ZM9 18C4.00781 18 0 13.9922 0 9C0 4.04297 4.00781 0 9 0C13.957 0 18 4.04297 18 9C18 13.9922 13.957 18 9 18ZM16.3125 9C16.3125 4.99219 13.0078 1.6875 9 1.6875C4.95703 1.6875 1.6875 4.99219 1.6875 9C1.6875 13.043 4.95703 16.3125 9 16.3125C13.0078 16.3125 16.3125 13.043 16.3125 9Z" fill="#454545"/>
</iconSvg>
`, slug: 'cloud-infrastructure' },
    { name: 'Application Innovation', iconSvg: `<iconSvg width="18" height="16" viewBox="0 0 18 16" fill="none" xmlns="http://www.w3.org/2000/iconSvg">
<path d="M16.0312 0C16.4883 0 16.875 0.386719 16.875 0.84375C16.875 1.33594 16.4883 1.6875 16.0312 1.6875H3.09375C2.28516 1.6875 1.6875 2.32031 1.6875 3.09375V12.6562C1.6875 13.4648 2.28516 14.0625 3.09375 14.0625H14.9062C15.6797 14.0625 16.3125 13.4648 16.3125 12.6562V6.46875C16.3125 5.69531 15.6797 5.0625 14.9062 5.0625H4.21875C3.72656 5.0625 3.375 4.71094 3.375 4.21875C3.375 3.76172 3.72656 3.375 4.21875 3.375H14.9062C16.5938 3.375 18 4.78125 18 6.46875V12.6562C18 14.3789 16.5938 15.75 14.9062 15.75H3.09375C1.37109 15.75 0 14.3789 0 12.6562V3.09375C0 1.40625 1.37109 0 3.09375 0H16.0312ZM12.375 9.5625C12.375 8.96484 12.8672 8.4375 13.5 8.4375C14.0977 8.4375 14.625 8.96484 14.625 9.5625C14.625 10.1953 14.0977 10.6875 13.5 10.6875C12.8672 10.6875 12.375 10.1953 12.375 9.5625Z" fill="#454545"/>
</iconSvg>
`, slug: 'application-innovation' },
    { name: 'Modern Work', iconSvg: `<iconSvg width="23" height="16" viewBox="0 0 23 16" fill="none" xmlns="http://www.w3.org/2000/iconSvg">
<path d="M21.9023 3.69141C22.2539 3.83203 22.5 4.14844 22.5 4.5C22.5 4.88672 22.2539 5.20312 21.9023 5.34375L11.9883 8.89453C11.7422 8.96484 11.4961 9 11.25 9C10.9688 9 10.7227 8.96484 10.4766 8.89453L3.79688 6.50391C3.375 6.96094 3.05859 7.52344 2.91797 8.15625C3.16406 8.33203 3.375 8.64844 3.375 9C3.375 9.35156 3.19922 9.66797 2.95312 9.87891L3.79688 15.1172C3.86719 15.4688 3.58594 15.75 3.26953 15.75H1.19531C0.878906 15.75 0.597656 15.4688 0.667969 15.1172L1.51172 9.87891C1.26562 9.66797 1.125 9.35156 1.125 9C1.125 8.54297 1.40625 8.15625 1.79297 7.98047C1.93359 7.27734 2.25 6.64453 2.67188 6.08203L0.5625 5.34375C0.210938 5.20312 0 4.88672 0 4.5C0 4.14844 0.210938 3.83203 0.5625 3.69141L10.4766 0.140625C10.7227 0.0703125 10.9688 0 11.25 0C11.4961 0 11.7422 0.0703125 11.9531 0.140625L21.9023 3.69141ZM11.4258 7.3125L19.1953 4.5L11.3906 1.72266C11.3203 1.72266 11.1797 1.6875 11.0391 1.72266L3.26953 4.5L4.39453 4.92188L11.0742 2.84766C11.3555 2.74219 11.6719 2.91797 11.7773 3.23438C11.8477 3.51562 11.707 3.83203 11.3906 3.9375L6.15234 5.55469L11.0742 7.3125C11.1094 7.3125 11.25 7.34766 11.4258 7.3125ZM15.8906 8.68359L17.5078 8.12109L17.9648 12.5508C18 14.6953 14.5898 15.75 11.25 15.75C7.875 15.75 4.5 14.6953 4.5 12.5508L4.95703 8.12109L6.57422 8.68359L6.1875 12.6211C6.1875 13.0078 7.91016 14.0625 11.25 14.0625C14.5547 14.0625 16.3125 13.0078 16.3125 12.6211L15.8906 8.68359Z" fill="#454545"/>
</iconSvg>
`, slug: 'modern-work' },
    { name: 'Managed Services', iconSvg: `<iconSvg width="23" height="18" viewBox="0 0 23 18" fill="none" xmlns="http://www.w3.org/2000/iconSvg">
<path d="M2.25 0C3.16406 0 3.97266 0.597656 4.32422 1.40625H11.3906C11.7422 0.597656 12.5508 0 13.5 0C14.7305 0 15.75 1.01953 15.75 2.25C15.75 3.19922 15.1523 4.00781 14.3438 4.35938V8.05078C15.1523 8.40234 15.75 9.21094 15.75 10.125C15.75 11.3906 14.7305 12.375 13.5 12.375C12.5508 12.375 11.7422 11.8125 11.3906 10.9688H4.32422C3.97266 11.8125 3.16406 12.375 2.25 12.375C0.984375 12.375 0 11.3906 0 10.125C0 9.21094 0.5625 8.40234 1.40625 8.05078V4.35938C0.5625 4.00781 0 3.19922 0 2.25C0 1.01953 0.984375 0 2.25 0ZM2.25 2.8125C2.53125 2.8125 2.8125 2.56641 2.8125 2.25C2.8125 2.00391 2.60156 1.75781 2.32031 1.72266C2.28516 1.72266 2.25 1.6875 2.25 1.6875C1.93359 1.6875 1.6875 1.96875 1.6875 2.25C1.6875 2.28516 1.6875 2.28516 1.6875 2.28516C1.6875 2.32031 1.6875 2.32031 1.6875 2.35547C1.72266 2.63672 1.96875 2.8125 2.25 2.8125ZM13.5 1.6875C13.4648 1.6875 13.4297 1.72266 13.3945 1.72266C13.1133 1.75781 12.9375 2.00391 12.9375 2.25C12.9375 2.56641 13.1836 2.8125 13.5 2.8125C13.7461 2.8125 13.9922 2.63672 14.0273 2.35547C14.0273 2.32031 14.0625 2.28516 14.0625 2.25C14.0625 1.96875 13.7812 1.6875 13.5 1.6875ZM11.3906 3.09375H4.32422C4.07812 3.65625 3.65625 4.11328 3.09375 4.35938V8.05078C3.65625 8.29688 4.07812 8.71875 4.32422 9.28125H11.3906C11.6367 8.71875 12.0586 8.29688 12.6562 8.05078V4.35938C12.0586 4.11328 11.6367 3.65625 11.3906 3.09375ZM14.0625 10.125C14.0625 10.125 14.0273 10.0898 14.0273 10.0547C13.9922 9.77344 13.7461 9.5625 13.5 9.5625C13.1836 9.5625 12.9375 9.84375 12.9375 10.125C12.9375 10.4062 13.1133 10.6523 13.3945 10.6875C13.4297 10.6875 13.4648 10.6875 13.5 10.6875C13.7812 10.6875 14.0625 10.4414 14.0625 10.125ZM2.25 9.5625C1.96875 9.5625 1.72266 9.77344 1.6875 10.0547C1.6875 10.0898 1.6875 10.125 1.6875 10.125C1.6875 10.4414 1.93359 10.6875 2.25 10.6875C2.28516 10.6875 2.28516 10.6875 2.32031 10.6875C2.60156 10.6523 2.8125 10.4062 2.8125 10.125C2.8125 9.84375 2.53125 9.5625 2.25 9.5625ZM16.5586 8.71875C16.3477 8.29688 16.0664 7.94531 15.75 7.62891V7.03125H18.1406C18.4922 6.22266 19.3008 5.625 20.25 5.625C21.4805 5.625 22.5 6.64453 22.5 7.875C22.5 8.82422 21.9023 9.63281 21.0938 9.98438V13.6758C21.9023 14.0273 22.5 14.8359 22.5 15.75C22.5 17.0156 21.4805 18 20.25 18C19.3008 18 18.4922 17.4375 18.1406 16.5938H11.0742C10.7227 17.4375 9.91406 18 9 18C7.73438 18 6.75 17.0156 6.75 15.75C6.75 14.8359 7.3125 14.0273 8.15625 13.6758V12.375H9.84375V13.6758C10.4062 13.9219 10.8281 14.3438 11.0742 14.9062H18.1406C18.3867 14.3438 18.8086 13.9219 19.4062 13.6758V9.98438C18.8086 9.73828 18.3867 9.28125 18.1406 8.71875H16.5586ZM20.8125 7.875C20.8125 7.59375 20.5312 7.3125 20.25 7.3125C20.2148 7.3125 20.1797 7.34766 20.1445 7.34766C19.8633 7.38281 19.6875 7.62891 19.6875 7.875C19.6875 8.19141 19.9336 8.4375 20.25 8.4375C20.4961 8.4375 20.7422 8.26172 20.7773 7.98047C20.7773 7.94531 20.8125 7.91016 20.8125 7.875ZM8.4375 15.75C8.4375 16.0664 8.68359 16.3125 9 16.3125C9 16.3125 9.03516 16.3125 9.07031 16.3125C9.35156 16.2773 9.5625 16.0312 9.5625 15.75C9.5625 15.4688 9.28125 15.1875 9 15.1875C8.71875 15.1875 8.47266 15.3984 8.4375 15.6797C8.4375 15.7148 8.4375 15.75 8.4375 15.75ZM20.1445 16.3125C20.1797 16.3125 20.2148 16.3125 20.25 16.3125C20.5312 16.3125 20.8125 16.0664 20.8125 15.75C20.8125 15.75 20.7773 15.7148 20.7773 15.6797C20.7422 15.3984 20.4961 15.1875 20.25 15.1875C19.9336 15.1875 19.6875 15.4688 19.6875 15.75C19.6875 16.0312 19.8633 16.2773 20.1445 16.3125Z" fill="#454545"/>
</iconSvg>
`, slug: 'managed-services' },
    { name: 'Microsoft Licensing', iconSvg: '', slug: 'microsoft-licensing' },
    { name: 'Manufacturing', iconSvg: '', slug: 'manufacturing' },
    { name: 'Healthcare', iconSvg: '', slug: 'healthcare' },
    { name: 'Financial Services', iconSvg: '', slug: 'financial-services' },
    { name: 'Retail', iconSvg: '', slug: 'retail' },
    { name: 'Education/Public Sector', iconSvg: '', slug: 'education-public-sector' },
    { name: 'Electronic Design Automation (EDA)', iconSvg: '', slug: 'electronic-design-automation-eda' },
    { name: 'Other', iconSvg: '', slug: 'other' },
  ];

  /** Filtros desde JSON; fallback con categorías por defecto. value = slug para queries GraphQL. */
  private static readonly DEFAULT_FILTERS: { displayCategory: string; value: string , iconSvg:any}[] = [
    { displayCategory: 'All', value: 'All', iconSvg: '' },
    ...Resources.GEN_CONTENT_CATEGORIES.map((cat) => ({ displayCategory: cat.name, value: cat.slug, iconSvg: cat.iconSvg })),
  ];

  get filters(): { displayCategory: string; value: string, iconSvg:any }[] {
    return this.pageContent()?.filters ?? Resources.DEFAULT_FILTERS;
  }

  readonly decodeHtmlEntities = decodeHtmlEntities;

  // Signals para datos de WordPress
  readonly resourceCards = signal<ResourceCard[]>([]);
  readonly featuredCaseStudy = signal<FeaturedCaseStudy | null>(null);
  readonly caseStudyDetail = signal<CaseStudyDetail | null>(null);
  readonly loading = signal(true);
  readonly error = signal<any>(null);
  readonly activeSection = signal<string>('overview');
  readonly tableOfContents = signal<{ id: string; text: string }[]>([]);

  filteredResources = signal<ResourceCard[]>([]);

 

  /** First 3 resource cards for the "Latest Insights" section (shared template). */
  get latestInsights(): ResourceCard[] {
    return this.resourceCards().slice(0, 3);
  }

  constructor(private route: ActivatedRoute) {
    // Listen to route parameter changes
    this.route.paramMap.subscribe(params => {
      const newSlug = params.get('slug');
      this.slug = newSlug;

      if (newSlug) {
        this.loadCaseStudyDetail(newSlug);
      } else {
        this.loadCaseStudiesList();
      }
    });
  }

  ngOnInit() {
    this.updateSeoMeta(null);
    this.loadPageContent();
    if (!this.slug) {
      this.loadCaseStudiesList();
    }
  }

  private loadPageContent() {
    this.http.get<ResourcesPageContent>('/resources-content.json').subscribe({
      next: (data) => {
        this.pageContent.set(data);
        this.updateSeoMeta(data);
      },
      error: () => this.pageContent.set(null),
    });
  }

  private updateSeoMeta(content: ResourcesPageContent | null): void {
    const isCaseStudies = this.router.url.includes('/case-studies');
    const canonicalPath = isCaseStudies ? '/resources/case-studies' : '/resources';
    const hero = content?.videoHero ?? content?.hero;
    const title = hero?.title ?? (isCaseStudies ? 'Case Studies | Oakwood Systems' : 'Resources | Oakwood Systems');
    const description = hero?.description ?? (isCaseStudies
      ? 'Explore case studies and success stories from Oakwood Systems Microsoft and Azure projects.'
      : 'Explore case studies, insights, and resources from Oakwood Systems on Microsoft solutions, Azure, and digital transformation.');
    this.seoMeta.updateMeta({
      title: title.includes('|') ? title : `${title} | Oakwood Systems`,
      description,
      canonicalPath,
    });
  }

  /** Video hero: valores por defecto si no hay JSON (tipos requeridos por app-video-hero). */
  videoHeroContent(): {
    videoUrls: string[];
    title: string;
    description: string;

  } {
    const c = this.pageContent()?.videoHero;
    return {
      videoUrls: c?.videoUrls?.length ? c.videoUrls : [
        'https://oakwoodsys.com/wp-content/uploads/2025/12/home.mp4',
        'https://oakwoodsys.com/wp-content/uploads/2025/12/1.mp4',
        'https://oakwoodsys.com/wp-content/uploads/2025/12/2.mp4',
        'https://oakwoodsys.com/wp-content/uploads/2025/12/4.mp4',
      ],
      title: c?.title ?? 'Turn Data and AI Into Real Business Outcomes',
      description: c?.description ?? 'Explore case studies and insights from projects built on Azure.',

    };
  }

  private static readonly DEFAULT_FEATURED_SLUGS: string[] = [
    'secure-azure-research-environment-architecture',
    'enterprise-reporting-and-data-roadmap-development',
  ];

  /** Slugs para app-featured-case-study-cards (desde resources-content.json). */
  getSlugsForFeaturedSection(): string[] {
    const slugs = this.pageContent()?.featuredCaseStudySlugs;
    return Array.isArray(slugs) && slugs.length > 0 ? slugs : Resources.DEFAULT_FEATURED_SLUGS;
  }

  /** Hero (sección con imagen de fondo): valores por defecto si no hay JSON. */
  heroContent() {
    const h = this.pageContent()?.hero;
    return {
      title: h?.title ?? 'Discover Our Impact Through Realized Projects',
      description: h?.description ?? 'Real solutions built on Azure AI that solve real problems, not theoretical ones.',
      backgroundImage: h?.backgroundImage ?? '/assets/resources/hero-background.jpg',
      ctaPrimary: h?.ctaPrimary ?? { text: 'Schedule a Consultation', link: '/contact-us' },
      ctaSecondary: h?.ctaSecondary ?? { text: 'View Resources', link: '/resources', borderColor: '#ffffff' },
    };
  }

  featuredCaseStudyLabel(): string {
    return this.pageContent()?.featuredCaseStudy?.label ?? 'FEATURED CASE STUDY';
  }

  featuredCaseStudyReadMore(): string {
    return this.pageContent()?.featuredCaseStudy?.readMoreText ?? 'Read More';
  }

  searchPlaceholder(): string {
    return this.pageContent()?.filterAndSearch?.searchPlaceholder ?? 'Search';
  }

  emptyStateMessage(): string {
    return this.pageContent()?.filterAndSearch?.emptyStateMessage ?? 'No resources found matching your criteria.';
  }

  loadMoreText(): string {
    return this.pageContent()?.resourcesGrid?.loadMoreText ?? 'Load More';
  }

  readMoreText(): string {
    return this.pageContent()?.resourcesGrid?.readMoreText ?? 'Read More';
  }

  /** Sanitiza HTML para pasarlo a app-blog-card (excerptHtml). */
  getSanitizedExcerpt(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html ?? '');
  }

  ctaSectionContent() {
    const c = this.pageContent()?.ctaSection;
    return {
      title: c?.title ?? "Let's move your vision forward",
      description: c?.description ?? 'Connect with a team committed to helping you modernize, innovate, and achieve meaningful results.',
      ctaPrimary: c?.ctaPrimary ?? { text: 'Talk to an expert', link: '/contact-us' },
      ctaSecondary: c?.ctaSecondary ?? { text: 'Schedule a call', link: '/contact-us' },
    };
  }

  get isDetailView(): boolean {
    return this.slug !== null && this.caseStudyDetail() !== null;
  }

  /** Slug de categoría case-study para listar todos los case studies. */
  private static readonly CASE_STUDY_CATEGORY_SLUG = 'case-study';

  /**
   * Carga lista de case studies. Usa slug para query GraphQL:
   * - "All": genContentCategory(case-study) — todos los case studies
   * - topic slug: genContentTag(slug) — case studies con ese tag, filtrados por categoría case-study
   */
  private loadCaseStudiesList(categoryOrTagSlug?: string) {
    this.loading.set(true);
    const isAll = categoryOrTagSlug === 'All' || !categoryOrTagSlug;

    if (isAll) {
      this.apollo
        .watchQuery<GenContentsByCategoryResponse>({
          query: GET_GEN_CONTENTS_BY_CATEGORY,
          variables: { categoryId: Resources.CASE_STUDY_CATEGORY_SLUG },
          fetchPolicy: 'network-only',
        })
        .valueChanges.subscribe({
          next: (result) => this.handleCaseStudiesResult(
            (result.data as GenContentsByCategoryResponse)?.genContentCategory?.genContents?.nodes ?? []
          ),
          error: (error) => this.handleCaseStudiesError(error),
        });
    } else {
      this.apollo
        .watchQuery<GenContentsByTagAndCategoryResponse>({
          query: GET_GEN_CONTENTS_BY_TAG_AND_CATEGORY,
          variables: {
            tagSlug: categoryOrTagSlug,
            categorySlug: Resources.CASE_STUDY_CATEGORY_SLUG,
          },
          fetchPolicy: 'network-only',
        })
        .valueChanges.subscribe({
          next: (result) => this.handleCaseStudiesResult(
            (result.data as GenContentsByTagAndCategoryResponse)?.genContents?.nodes ?? []
          ),
          error: (error) => this.handleCaseStudiesError(error),
        });
    }
  }

  private handleCaseStudiesResult(nodes: GenContentListNode[]) {
    if (nodes.length) {
      const cards = this.transformGenContentToResourceCards(nodes);
      this.resourceCards.set(cards);
      this.applyFilters();

      const featured =
        nodes.find((n) => n.tags?.includes('Featured')) ?? nodes[0];
      if (featured) {
        this.featuredCaseStudy.set(
          this.transformGenContentToFeaturedCaseStudy(featured, nodes.length)
        );
      }
    } else {
      this.resourceCards.set([]);
      this.filteredResources.set([]);
      this.featuredCaseStudy.set(null);
    }
    this.loading.set(false);
  }

  private handleCaseStudiesError(error: unknown) {
    console.error('Error loading case studies:', error);
    this.error.set(error);
    this.loading.set(false);
  }

  // Query GraphQL para detalle de caso de estudio (query centralizada en api/graphql.ts)
  private loadCaseStudyDetail(slug: string) {
    this.loading.set(true);

    this.apollo
      .watchQuery<CaseStudyByResponse>({
        query: GET_CASE_STUDY_BY_SLUG,
        variables: { slug },
        fetchPolicy: 'network-only',
      })
      .valueChanges.subscribe({
        next: (result) => {
          const data = result.data as CaseStudyByResponse | undefined;
          const caseStudy = data?.caseStudyBy ?? null;
          if (caseStudy) {
            this.caseStudyDetail.set(this.transformToCaseStudyDetail(caseStudy as CaseStudyBy));
            if (isPlatformBrowser(this.platformId)) {
              setTimeout(() => {
                this.setupScrollListener();
                this.extractTableOfContents();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }, 100);
            }
          } else {
            this.error.set('Case study not found');
          }
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading case study:', error);
          this.error.set(error);
          this.loading.set(false);
        },
      });
  }

  // Transformar Gen Content (categoría case-study) a ResourceCard
  private transformGenContentToResourceCards(nodes: GenContentListNode[]): ResourceCard[] {
    return nodes.map((node) => ({
      id: node.id,
      image: node.featuredImage?.node?.sourceUrl || '/assets/resources/default.jpg',
      category: node.genContentCategories?.nodes?.[0]?.name || 'Case Study',
      date: this.formatDate(node.date),
      title: node.title,
      description: this.cleanExcerpt(node.excerpt),
      link: `/resources/case-studies/${node.slug}`,
      slug: node.slug,
      tags: node.tags ?? undefined,
      primaryTag: getPrimaryTagName(node.primaryTagName) ?? null,
    }));
  }

  private transformGenContentToFeaturedCaseStudy(
    node: GenContentListNode,
    total: number
  ): FeaturedCaseStudy {
    return {
      id: node.id,
      image: node.featuredImage?.node?.sourceUrl || '/assets/case-studies/default.jpg',
      title: node.title,
      description: this.cleanExcerpt(node.excerpt),
      link: `/resources/case-studies/${node.slug}`,
      currentIndex: 1,
      total: Math.max(1, total),
    };
  }

  // Transformar a CaseStudyDetail
  private transformToCaseStudyDetail(node: CaseStudyBy): CaseStudyDetail {
    const acf = node.caseStudyDetails || {};

    // Transformar related case studies (imagen: hero ACF como en featured-case-study, luego featuredImage)
    const relatedCaseStudies: ResourceCard[] = (acf.relatedCaseStudies?.nodes || []).map((related: any) => {
      const categoryNodes = related.caseStudyCategories?.nodes ?? [];
      const categoryNames = categoryNodes.map((n: { name: string }) => n.name).filter(Boolean);
      return {
        id: related.id,
        image: getAcfMediaUrl(related.caseStudyDetails?.heroImage) || related.featuredImage?.node?.sourceUrl || '/assets/resources/default.jpg',
        category: categoryNames[0] || 'Uncategorized',
        date: this.formatDate(related.date),
        title: related.title,
        description: this.cleanExcerpt(related.excerpt),
        link: `/resources/case-studies/${related.slug}`,
        slug: related.slug,
        tags: categoryNames.length > 0 ? categoryNames : undefined,
        primaryTag: categoryNames[0] ?? null,
      };
    });

    // Transformar connected services
    const connectedServices = (acf.connectedServices || []).map((service: any, index: number) => ({
      id: String(index + 1),
      icon: service.serviceIcon || 'fa-circle',
      title: service.serviceTitle || '',
      description: service.serviceDescription || '',
      link: service.serviceLink || '#',
      slug: service.serviceSlug || ''
    }));

    return {
      slug: node.slug,
      title: node.title,
      heroImage: getAcfMediaUrl(acf.heroImage) || node.featuredImage?.node?.sourceUrl || '/assets/case-studies/default.jpg',
      tags: acf.tags || [],
      overview: acf.overview || '',
      businessChallenge: acf.businessChallenge || '',
      solution: acf.solution || '',
      solutionImage: getAcfMediaUrl(acf.solutionImage),
      testimonial: acf.testimonial?.testimonialQuote ? {
        company: acf.testimonial.testimonialCompany || '',
        companyLogo: getAcfMediaUrl(acf.testimonial.testimonialCompanyLogo as any),
        quote: acf.testimonial.testimonialQuote,
        author: acf.testimonial.testimonialAuthor || '',
        role: acf.testimonial.testimonialRole || ''
      } : undefined,
      relatedCaseStudies,
      connectedServices
    };
  }

  // Utilidades
  private cleanExcerpt(excerpt: string): string {
    if (!excerpt) return '';
    return excerpt.replace(/<[^>]*>/g, '').replace(/\[&hellip;\]/g, '...').trim();
  }

  private formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  /** filterValue = slug para topic, "All" para todos. Al cambiar filtro se recarga desde GraphQL. */
  selectFilter(filterValue: string) {
    this.selectedFilter.set(filterValue);
    
     this.isOpen = false;
    if (!this.slug) {
      this.loadCaseStudiesList(filterValue);
    } else {
      this.applyFilters();
    }
  }

  onSearchChange(query: string) {
    this.searchQuery.set(query);
    this.applyFilters();
  }

  /** Filtra por búsqueda (el filtro por categoría se hace en GraphQL con slug). */
  applyFilters() {
    let filtered = [...this.resourceCards()];

    // Búsqueda: por primaryTag, título o excerpt (description); también en tags si existen
    const query = this.searchQuery().trim().toLowerCase();
    if (query) {
      filtered = filtered.filter(card => {
        const tagLabel = (card.primaryTag ?? card.category).toLowerCase();
        const matchTitle = card.title.toLowerCase().includes(query);
        const matchExcerpt = card.description.toLowerCase().includes(query);
        const matchTag = tagLabel.includes(query);
        const matchTags = (card.tags ?? []).some(t => t.toLowerCase().includes(query));
        return matchTitle || matchExcerpt || matchTag || matchTags;
      });
    }

    this.filteredResources.set(filtered);
  }

  nextCaseStudy() {
    const featured = this.featuredCaseStudy();
    if (featured && featured.currentIndex < featured.total) {
      this.featuredCaseStudy.set({
        ...featured,
        currentIndex: featured.currentIndex + 1
      });
    }
  }

  prevCaseStudy() {
    const featured = this.featuredCaseStudy();
    if (featured && featured.currentIndex > 1) {
      this.featuredCaseStudy.set({
        ...featured,
        currentIndex: featured.currentIndex - 1
      });
    }
  }

  private extractTableOfContents(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    // Table of contents is already set in transformToCaseStudyDetail
    this.tableOfContents.set([
      { id: 'overview', text: 'Overview' },
      { id: 'business-challenge', text: 'Business Challenge' },
      { id: 'solution', text: 'Solution' },
      { id: 'testimonial', text: 'Testimonial' }
    ]);
  }

  private setupScrollListener(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const listener = () => {
      const toc = this.tableOfContents();
      if (toc.length === 0) return;

      const scrollPosition = window.scrollY + 200;

      for (let i = toc.length - 1; i >= 0; i--) {
        const element = document.getElementById(toc[i].id);
        if (element) {
          const elementTop = element.offsetTop;
          if (scrollPosition >= elementTop) {
            this.activeSection.set(toc[i].id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', listener, { passive: true });
  }

  scrollToSection(sectionId: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      this.activeSection.set(sectionId);
    }
  }
}
