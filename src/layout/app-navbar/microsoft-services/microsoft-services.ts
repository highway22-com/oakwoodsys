import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-microsoft-services',
  imports: [RouterLink, CommonModule],
  templateUrl: './microsoft-services.html',
})
export class MicrosoftServices {
  services = [
    {
      id: '01',
      name: 'Data & AI Solutions',
      link: '/services/data-ai-solutions',
      desc: 'Unify, govern, and activate your data estate',
      details: 'Deliver real AI outcomes by unifying, governing, and activating your data estate to power intelligent innovation.',
      icon: '/assets/graph.png'
    },
    {
      id: '02',
      name: 'Cloud & Infrastructure',
      link: '/services/cloud-and-infrastructure',
      desc: 'Modernize, secure, and optimize your cloud',
      details: 'Modernize, secure, and optimize your cloud estate with Oakwood and Microsoft Azure for scalable, reliable infrastructure.',
      icon: '/assets/cloud.png'
    },
    {
      id: '03',
      name: 'Application Innovation',
      link: '/services/application-innovation',
      desc: 'Ship faster, run safer, and scale efficiently',
      details: 'Ship faster, run safer, and scale efficiently with modern applications on Azure built for performance and reliability.',
      icon: '/assets/app-innovation.png'
    },
    {
      id: '04',
      name: 'High-Performance Computing (HPC)',
      link: '/services/high-performance-computing-hpc',
      desc: 'Scale simulations, AI training, and PLM workloads',
      details: 'Scale simulations, AI training, and PLM workloads with the power of Azure HPC for maximum computational performance.',
      icon: '/assets/hpc.png'
    },
    {
      id: '05',
      name: 'Modern Work',
      link: '/services/modern-work',
      desc: 'Boost productivity with Microsoft 365 and Copilot',
      details: 'Boost productivity, protect data, and improve employee experience with Microsoft 365 and Copilot for modern collaboration.',
      icon: '/assets/modern-work.png'
    },
    {
      id: '06',
      name: 'Managed Services',
      link: '/services/managed-services',
      desc: 'Keep your Microsoft cloud running fast and secure',
      details: 'Keep your Microsoft cloud running fast, secure, and cost effective with Oakwood managed services and expert support.',
      icon: '/assets/managed-services.png'
    }
  ];
}
