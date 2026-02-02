import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { VideoHero } from '../../shared/video-hero/video-hero';

const PLACEHOLDER_VIDEO_URLS = [
  'https://oakwoodsys.com/wp-content/uploads/2025/12/home.mp4',
  'https://oakwoodsys.com/wp-content/uploads/2025/12/1.mp4',
];

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

@Component({
  selector: 'app-about-us',
  imports: [RouterLink, VideoHero],
  templateUrl: './about-us.html',
  styleUrl: './about-us.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutUs {
  readonly heroTitle = 'Trusted Technology Solutions for 40+ Years';
  readonly heroDescription =
    'Oakwood brings deep expertise, a collaborative mindset and a relentless focus on delivering real business value.';
  readonly videoUrls = PLACEHOLDER_VIDEO_URLS;
  readonly heroCtaPrimary = {
    text: "LET'S TALK",
    link: '/contact-us',
    backgroundColor: '#1D69AC',
  };
  readonly heroCtaSecondary = {
    text: 'LEARN MORE',
    link: '/resources',
    borderColor: '#ffffff',
  };

  readonly aboutLabel = 'ABOUT US';
  readonly aboutTitle = 'Oakwood bring deep expertise, a collaborative mindset';
  readonly aboutDescription =
    'Founded in 1981, Oakwood provides expert counsel and comprehensive solutions in the areas of modern work, application innovation, data & AI, cloud, and managed services.';

  readonly aboutFeatures: AboutFeature[] = [
    {
      icon: 'people',
      title: 'Our People',
      description:
        'Our team combines deep technical expertise with a collaborative culture focused on understanding your business and delivering outcomes that matter.',
      image: '/assets/managed-services.png',
      imageAlt: 'Our people at Oakwood',
    },
    {
      icon: 'process',
      title: 'Our Process',
      description:
        'We follow a proven methodology that balances agility with discipline, ensuring transparency, accountability, and continuous alignment with your goals.',
      image: '/assets/s-daa-h.jpg',
      imageAlt: 'Our process and methodology',
    },
    {
      icon: 'technology',
      title: 'Our Technology',
      description:
        'We leverage leading platforms and modern architectures to build solutions that scale, integrate, and evolve with your organization.',
      image: '/assets/cloud.png',
      imageAlt: 'Our technology stack',
    },
  ];

  readonly partnerLogos = [
    { src: '/assets/logos/microsoft.png', alt: 'Microsoft' },
    { src: '/assets/logos/arco.png', alt: 'ARCO' },
    { src: '/assets/logos/bjc-healthcare.png', alt: 'BJC Healthcare' },
    { src: '/assets/logos/clarios.png', alt: 'Clarios' },
    { src: '/assets/logos/onsemi.png', alt: 'Onsemi' },
    { src: '/assets/logos/duke-university.png', alt: 'Duke University' },
    { src: '/assets/logos/applied-materials.png', alt: 'Applied Materials' },
  ];

  readonly videoSectionTitle = 'About Oakwood';
  readonly videoSectionDescription =
    'Learn about Oakwood, who we are, where we came from, and what drives us.';
  readonly videoSectionImage = '/assets/s-daa-h.jpg';

  readonly teamLabel = 'OUR TEAM';
  readonly teamTitle = 'Leadership that turns vision into action and strategy into results.';
  readonly teamDescription =
    "Oakwood's leadership team brings decades of experience, expertise, and a passion for technology to help our clients achieve their goals.";

  readonly teamMembers: TeamMember[] = [
    { name: 'Charles Ruecker', title: 'CEO' },
    { name: 'Jeff Rudden', title: 'COO' },
    { name: 'Erica Allen', title: 'VP, Strategic Business Services' },
    { name: 'Michael Caylor', title: 'VP, Architecture & Engineering' },
    { name: 'Barry Goodman', title: 'VP, Software Development & Innovation' },
    { name: 'John Tovar', title: 'Director of App & Analytical Dev' },
    { name: 'Tom Washatka', title: 'Service Director' },
    { name: 'Leadership', title: 'Oakwood Leadership' },
  ];

  readonly deliverBannerTitle =
    'Deliver technology solutions with integrity, collaboration, and a relentless focus on real business outcomes.';
  readonly deliverBannerDescription =
    'We partner with our clients to understand their challenges, design the right solutions, and execute with precision and care.';

  readonly approachLabel = 'OUR APPROACH';
  readonly approachTitle = 'How we work at Oakwood';
  readonly approachDescription =
    'Our approach is built on transparency, collaboration, and a commitment to long-term partnerships. We align our processes with your goals and adapt as your needs evolve.';

  readonly howWeWorkItems: HowWeWorkItem[] = [
    { title: 'Relationship and Accountability' },
    { title: 'Continuous Innovation' },
    { title: 'Learning Cycle at the core' },
    { title: 'Proactive Leadership and Execution' },
    { title: 'Building for long-term partnership' },
  ];

  readonly insightsLabel = 'FROM THE BLOG';
  readonly insightsTitle = 'Latest insights from Oakwood';
  readonly insightsDescription = 'Explore our blog for news, thought leadership, and expert advice.';

  readonly insightCards: BlogCard[] = [
    {
      image: '/assets/cloud.png',
      imageAlt: 'Cloud solutions',
      category: 'Cloud • Webinar',
      title: 'Modernizing your infrastructure',
      description: 'Best practices for migrating and optimizing your cloud environment.',
      link: '/blog',
    },
    {
      image: '/assets/s-daa-h.jpg',
      imageAlt: 'Data and AI',
      category: 'AI • Article',
      title: 'Data and AI in the enterprise',
      description: 'How leading organizations are leveraging data and AI for business impact.',
      link: '/blog',
    },
    {
      image: '/assets/app-innovation.png',
      imageAlt: 'Application innovation',
      category: 'Innovation • Case Study',
      title: 'Building for the future',
      description: 'Stories from the field on application innovation and digital transformation.',
      link: '/blog',
    },
  ];

  readonly ctaBannerTitle = "Let's move your vision forward";
  readonly ctaBannerDescription = 'Contact us today to start a conversation with our team.';
}
