import { Component, input } from '@angular/core';
import { CaseStudy } from '../../../app/api/graphql';
import { ArticleCardArticle } from '../../../shared/article-card/article-card.component';
import { RouterLink } from '@angular/router';
import type { FeaturedBlogItem } from '../app-navbar';
import { PrefetchBlogsDirective } from '../../../app/directives/prefetch-blogs.directive';

export interface MenuItem {
  id: string;
  name: string;
  link: string;
  desc: string;
  details?: string;
  icon: string;
  iconSize?: string;
}

@Component({
  selector: 'app-menu-list',
  imports: [RouterLink, PrefetchBlogsDirective],
  templateUrl: './menu-list.html',
})
export class MenuList {
  /** Case studies para "Featured" (inyectados desde el navbar para no depender del ciclo de vida del dropdown). */
  readonly caseStudies = input<CaseStudy[]>([]);
  /** Blogs destacados (2 últimos desde GraphQL, como en app-resources). */
  readonly featuredBlogs = input<FeaturedBlogItem[]>([]);

  get featuredCaseStudiesArticles(): ArticleCardArticle[] {
    return this.caseStudies().map((c) => this.toArticleCard(c));
  }

  content = input<MenuItem[]>([]);

  featuredTitle = input<string>('FEATURED CASE STUDIES');

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
