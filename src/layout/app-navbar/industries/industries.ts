import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import type { CaseStudy } from '../../../app/api/graphql';
import type { ArticleCardArticle } from '../../../shared/article-card/article-card.component';

@Component({
  selector: 'app-industries',
  imports: [RouterLink, CommonModule],
  templateUrl: './industries.html',
})
export class Industries {
  /** Case studies para "Featured" (inyectados desde el navbar para no depender del ciclo de vida del dropdown). */
  readonly caseStudies = input<CaseStudy[]>([]);

  get featuredCaseStudiesArticles(): ArticleCardArticle[] {
    return this.caseStudies().map((c) => this.toArticleCard(c));
  }

  industries = [
    {
      id: '01',
      name: 'Manufacturing',
      link: '/industries/manufacturing',
      desc: 'Unlock innovation, optimize operations, empower workers, and enhance the customer experience.',
      icon: '/assets/manu.png'
    },
    {
      id: '02',
      name: 'Healthcare',
      link: '/industries/healthcare',
      desc: 'We create connected healthcare ecosystems by coordinating data, people, and processes.',
      icon: '/assets/heal.png'
    },
    {
      id: '03',
      name: 'Financial Services',
      link: '/industries/financial-services',
      desc: 'Unlock the full potential of your banking data in the era of AI.',
      icon: '/assets/fina.png'
    },
    {
      id: '04',
      name: 'Retail',
      link: '/industries/retail',
      desc: 'Helping retailers outperform their competition',
      icon: '/assets/reta.png'
    },
    {
      id: '05',
      name: 'Education / Public Sector',
      link: '/industries/education-public-sector',
      desc: 'Unlock innovation, optimize operations, empower workers, and enhance the customer experience.',
      icon: '/assets/educ.png'
    },
    {
      id: '06',
      name: 'Electronic Design Automation (EDA)',
      link: '/industries/electronic-design-automation-eda',
      desc: 'Explore exciting opportunities to learn and connect with industry experts through our engaging webinars and conferences!',
      icon: '/assets/elec.png'
    }
  ];

  private toArticleCard(c: CaseStudy): ArticleCardArticle {
    return {
      id: parseInt(c.id, 10) || undefined,
      title: c.title,
      description: c.caseStudyDetails?.cardDescription ?? c.excerpt ?? undefined,
      link: `/resources/case-studies/${c.slug}`,
      linkText: 'Read more',
      image: {
        url: c.featuredImage?.node?.sourceUrl,
        alt: c.featuredImage?.node?.altText ?? c.title,
      },
      tags: c.caseStudyDetails?.tags?.length
        ? c.caseStudyDetails.tags
        : c.caseStudyCategories?.nodes?.[0]?.name
          ? [c.caseStudyCategories.nodes[0].name]
          : [],
    };
  }
}
