import { Component, OnInit, OnDestroy, HostListener, inject, PLATFORM_ID } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, NgClass, NgIf, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, CommonModule, NgClass],
  templateUrl: './app-navbar.html',
})
export class AppNavbar implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  isMobileMenuOpen = false;
  isScrolled = false;
  isServicesDropdownOpen = false;
  isIndustriesDropdownOpen = false;
  isResourcesDropdownOpen = false;

  services = [
    {
      title: 'Data & AI Solutions',
      description: 'Unify, govern, and activate your data estate to deliver real AI outcomes.',
      route: '/services/data-and-ai',
      icon: 'data-ai'
    },
    {
      title: 'Cloud & Infrastructure',
      description: 'Modernize, secure, and optimize your cloud estate with Oakwood and Microsoft Azure',
      route: '/services/cloud-and-infrastructure',
      icon: 'cloud'
    },
    {
      title: 'Application Innovation',
      description: 'Ship faster, run safer, and scale efficiently with modern applications on Azure.',
      route: '/services/application-innovation',
      icon: 'app-innovation'
    },
    {
      title: 'High-Performance Computing (HPC)',
      description: 'Scale simulations, AI training, and PLM workloads with the power of Azure HPC.',
      route: '/services/high-performance-computing',
      icon: 'hpc'
    },
    {
      title: 'Modern Work',
      description: 'Boost productivity, protect data, and improve employee experience with Microsoft 365 and Copilot.',
      route: '/services/modern-work',
      icon: 'modern-work'
    },
    {
      title: 'Managed Services',
      description: 'Keep your Microsoft cloud running fast, secure, and cost effective with Oakwood.',
      route: '/services/managed-services',
      icon: 'managed-services'
    }
  ];

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.checkScrollPosition();
    }
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    if (isPlatformBrowser(this.platformId)) {
      this.checkScrollPosition();
    }
  }

  @HostListener('window:resize')
  onWindowResize() {
    if (isPlatformBrowser(this.platformId)) {
      this.checkScrollPosition();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-container')) {
      this.isServicesDropdownOpen = false;
      this.isIndustriesDropdownOpen = false;
      this.isResourcesDropdownOpen = false;
    }
  }

  private checkScrollPosition() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const scrollPosition = window.scrollY || document.documentElement.scrollTop;
    const scrollThreshold = window.innerHeight; // 100vh
    this.isScrolled = scrollPosition > scrollThreshold;
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  toggleServicesDropdown(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.isServicesDropdownOpen = !this.isServicesDropdownOpen;
    this.isIndustriesDropdownOpen = false;
    this.isResourcesDropdownOpen = false;
  }

  toggleIndustriesDropdown(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.isIndustriesDropdownOpen = !this.isIndustriesDropdownOpen;
    this.isServicesDropdownOpen = false;
    this.isResourcesDropdownOpen = false;
  }

  toggleResourcesDropdown(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.isResourcesDropdownOpen = !this.isResourcesDropdownOpen;
    this.isServicesDropdownOpen = false;
    this.isIndustriesDropdownOpen = false;
  }

  closeAllDropdowns() {
    this.isServicesDropdownOpen = false;
    this.isIndustriesDropdownOpen = false;
    this.isResourcesDropdownOpen = false;
  }

  ngOnDestroy() {
    // Cleanup if needed
  }
}
