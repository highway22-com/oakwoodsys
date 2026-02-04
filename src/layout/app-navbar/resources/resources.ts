import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import type { FeaturedBlogItem } from '../app-navbar';

@Component({
  selector: 'app-resources',
  imports: [RouterLink, CommonModule],
  templateUrl: './resources.html',
})
export class Resources {
  /** Dos últimos blogs (desde GraphQL, inyectados desde el navbar). */
  readonly featuredBlogs = input<FeaturedBlogItem[]>([]);

  resourceCategories = [
    {
      id: '01',
      name: 'IT Blog',
      link: '/bloq',
      desc: 'Insights and perspectives on business and innovation.',
      icon: '/assets/manu.png'
    },
    {
      id: '02',
      name: 'Partners',
      link: '/partners',
      desc: 'In-depth examples of how Oakwood solutions are applied in real-world scenarios.',
      icon: '/assets/parn.png'
    },
    {
      id: '03',
      name: 'Case Studies',
      link: '/resources/case-studies',
      desc: 'Discover our impact through realized projects',
      icon: '/assets/fina.png'

    }
  ];

  featuredWhitepapers = [
    {
      id: '01',
      title: 'How Greentech is shaping sustainable urban development',
      link: '/resources/whitepapers/greentech-urban-development',
      image: '/assets/whitepapers/greentech.jpg'
    },
    // {
    //   id: '02',
    //   title: 'Innovative strategies: Exploring the future of renewable energy solutions',
    //   link: '/resources/whitepapers/renewable-energy',
    //   image: '/assets/whitepapers/renewable-energy.jpg'
    // }
  ];
}
