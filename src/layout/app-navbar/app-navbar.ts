import { Component, OnInit, OnDestroy, HostListener, inject, PLATFORM_ID, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, NgClass, NgIf, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MicrosoftServices } from "./microsoft-services/microsoft-services";
import { Industries } from "./industries/industries";
import { Resources } from "./resources/resources";

interface MenuItem {
  label: string;
  routerLink: string;
  index: number | null;
  hasDropdown: boolean;
}

interface Service {
  title: string;
  description: string;
  route: string;
  icon: string;
}

interface NavbarContent {
  menuItems: MenuItem[];
  services: Service[];
}

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, CommonModule, NgClass, MicrosoftServices, Industries, Resources],
  templateUrl: './app-navbar.html',
  styleUrl: './app-navbar.css',
})
export class AppNavbar implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClient);

  isMobileMenuOpen = false;
  isScrolled = false;
  isServicesDropdownOpen = false;
  isIndustriesDropdownOpen = false;
  isResourcesDropdownOpen = false;
  hoveredIndex = signal<number | null>(null);

  readonly menuItems = signal<MenuItem[]>([]);
  readonly services = signal<Service[]>([]);
  readonly loading = signal(true);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.checkScrollPosition();
    }
    this.loadNavbarContent();
  }

  private loadNavbarContent() {
    this.loading.set(true);
    this.http.get<NavbarContent>('/navbar-content.json').subscribe({
      next: (data) => {
        this.menuItems.set(data.menuItems);
        this.services.set(data.services);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading navbar content:', error);
        // Fallback to empty arrays on error
        this.menuItems.set([]);
        this.services.set([]);
        this.loading.set(false);
      }
    });
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

  public handleClickEvent(): void {
    this.hoveredIndex.set(null);
  }

  public onMouseEnter(index: number): void {
    this.hoveredIndex.set(index);
    console.log('onMouseEnter', this.hoveredIndex());
  }

  public onNavMouseLeave(): void {
    // Only hide the menu when leaving the entire nav area
    this.hoveredIndex.set(null);
    console.log('onNavMouseLeave', this.hoveredIndex());
  }

  public handleMouseEnter(item: { index: number | null; hasDropdown: boolean }): void {
    if (item.hasDropdown && item.index !== null) {
      this.onMouseEnter(item.index + 1);
    }
  }

  ngOnDestroy() {
    // Cleanup if needed
  }
}
