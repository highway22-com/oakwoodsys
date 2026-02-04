import { Component, OnInit, OnDestroy, HostListener, inject, PLATFORM_ID, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, NgClass, NgIf, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MicrosoftServices } from "./microsoft-services/microsoft-services";
import { Industries } from "./industries/industries";
import { Resources } from "./resources/resources";
import { GraphQLContentService } from '../../app/services/graphql-content.service';
import type { CaseStudy } from '../../app/api/graphql';

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

/** Item de blog para el dropdown Resources (2 últimos desde GraphQL). */
export interface FeaturedBlogItem {
  id: string;
  title: string;
  link: string;
  image: string;
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
  private readonly graphql = inject(GraphQLContentService);

  isMobileMenuOpen = false;
  isScrolled = false;
  isServicesDropdownOpen = false;
  isIndustriesDropdownOpen = false;
  isResourcesDropdownOpen = false;
  hoveredIndex = signal<number | null>(null);

  readonly menuItems = signal<MenuItem[]>([]);
  readonly services = signal<Service[]>([]);
  readonly loading = signal(true);
  /** Dos case studies más recientes para el dropdown Industries (se cargan al iniciar para que estén listos). */
  readonly featuredCaseStudies = signal<CaseStudy[]>([]);
  /** Dos blogs más recientes para el dropdown Resources (genContent categoría bloq). */
  readonly featuredBlogs = signal<FeaturedBlogItem[]>([]);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.checkScrollPosition();
      // Cargar case studies y blogs solo en el cliente (GraphQL puede no estar disponible en SSR)
      this.graphql.getCaseStudies().subscribe((list) => {
        const sorted = [...list].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        this.featuredCaseStudies.set(sorted.slice(0, 2));
      });
      this.graphql.getBlogs().subscribe((list) => {
        const sorted = [...list].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        this.featuredBlogs.set(
          sorted.slice(0, 2).map((n) => ({
            id: n.id,
            title: n.title,
            link: `/blog/${n.slug}`,
            image: n.featuredImage?.node?.sourceUrl ?? '',
          }))
        );
      });
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

  /** true cuando la barra debe usar estilo “oscuro” (logo oscuro, texto oscuro): scroll o hover en un dropdown (índice !== 0). */
  get isNavbarDark(): boolean {
    const hover = this.hoveredIndex();
    return this.isScrolled || (hover !== null && hover !== 0);
  }

  /** true cuando la barra debe mostrar fondo (blanco) o texto de enlaces oscuro: scroll o cualquier hover en menú. */
  get hasNavbarBackground(): boolean {
    return this.isScrolled || this.hoveredIndex() !== null;
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
