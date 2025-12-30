import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-industries',
  imports: [RouterLink, CommonModule],
  templateUrl: './industries.html',
})
export class Industries {
  industries = [
    {
      id: '01',
      name: 'Manufacturing',
      link: '/industries/manufacturing',
      desc: 'Unlock innovation, optimize operations, empower workers, and enhance the customer experience.',
      icon: '/assets/industries/manufacturing.png'
    },
    {
      id: '02',
      name: 'Healthcare',
      link: '/industries/healthcare',
      desc: 'We create connected healthcare ecosystems by coordinating data, people, and processes.',
      icon: '/assets/industries/healthcare.png'
    },
    {
      id: '03',
      name: 'Financial Services',
      link: '/industries/financial-services',
      desc: 'Unlock the full potential of your banking data in the era of AI.',
      icon: '/assets/industries/financial-services.png'
    },
    {
      id: '04',
      name: 'Retail',
      link: '/industries/retail',
      desc: 'Helping retailers outperform their competition',
      icon: '/assets/industries/retail.png'
    },
    {
      id: '05',
      name: 'Education / Public Sector',
      link: '/industries/education-public-sector',
      desc: 'Unlock innovation, optimize operations, empower workers, and enhance the customer experience.',
      icon: '/assets/industries/education.png'
    },
    {
      id: '06',
      name: 'Electronic Design Automation (EDA)',
      link: '/industries/eda',
      desc: 'Explore exciting opportunities to learn and connect with industry experts through our engaging webinars and conferences!',
      icon: '/assets/industries/eda.png'
    }
  ];

  featuredCaseStudies = [
    {
      id: '01',
      title: 'Recent work: Clarios accelerates Innovation with AMD-powered HPC',
      link: '/resources/case-studies/clarios-hpc',
      image: '/assets/case-studies/clarios-hpc.jpg'
    },
    {
      id: '02',
      title: 'Seamless data center migration',
      link: '/resources/case-studies/data-center-migration',
      image: '/assets/case-studies/data-center-migration.jpg'
    }
  ];
}
