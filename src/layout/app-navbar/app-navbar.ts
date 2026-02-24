import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { Component, OnInit, OnDestroy, HostListener, inject, PLATFORM_ID, signal, computed, viewChild, ElementRef } from '@angular/core';
import { CommonModule, DOCUMENT, NgClass, NgIf, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MicrosoftServices } from "./microsoft-services/microsoft-services";
import { Industries } from "./industries/industries";
import { Resources } from "./resources/resources";
import { GraphQLContentService } from '../../app/services/graphql-content.service';
import { filter } from 'rxjs';
import type { CaseStudy, SearchResultItem } from '../../app/api/graphql';
import { MenuList } from './menu-list/menu-list';

interface Menu {
  slug: string;
  label: string;
  routerLink: string;
  index: number | null;
  hasDropdown: boolean;
}

interface Content {
  id: string;
  name: string;
  link: string;
  desc: string;
  details?: string;
  icon: string;
}

interface ContentMap {
  services: Content[];
  industries: Content[];
  resources: Content[];
}

interface NavbarContent {
  menu: Menu[];
  content: ContentMap;
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
  imports: [RouterLink, CommonModule, NgClass, MicrosoftServices, Industries, Resources, MenuList],
  templateUrl: './app-navbar.html',
  styleUrl: './app-navbar.css',
})
export class AppNavbar implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly http = inject(HttpClient);
  private readonly graphql = inject(GraphQLContentService);
  private readonly router = inject(Router);

  /** true cuando viewport < 768px (md breakpoint). Muestra hamburger + panel; si no, versión desktop. */
  isTabletOrMobile = false;
  isMobileMenuOpen = false;
  mobileExpandedIndex: number | null = null;
  isScrolled = false;
  isServicesDropdownOpen = false;
  isIndustriesDropdownOpen = false;
  isResourcesDropdownOpen = false;
  hoveredIndex = signal<number | null>(null);
  isOnContactSuccess = signal(false);
  isOnStructuredEngagement = signal(false);

  readonly menuItems = signal<Menu[]>([]);
  readonly content = signal<ContentMap | null>(null);
  readonly loading = signal(true);
  /** Dos case studies más recientes para el dropdown Industries (se cargan al iniciar para que estén listos). */
  readonly featuredCaseStudies = signal<CaseStudy[]>([]);
  /** Dos blogs más recientes para el dropdown Resources (genContent categoría blog). */
  readonly featuredBlogs = signal<FeaturedBlogItem[]>([]);

  /** Título de la sección Featured por dropdown (Services, Industries). */
  readonly featuredTitleServices = signal('FEATURED BLOGS');
  readonly featuredTitleIndustries = signal('FEATURED CASE STUDIES');

  /** Panel de búsqueda (click en ícono): abierto/cerrado. */
  readonly searchPanelOpen = signal(false);
  /** Texto del input de búsqueda (máx 100 caracteres). */
  readonly searchQuery = signal('');
  /** Lista completa de items buscables (blogs + case studies), cargada al abrir el panel. */
  readonly allSearchable = signal<SearchResultItem[]>([]);
  /** Cantidad de resultados visibles para lazy load (incrementa al hacer scroll). */
  readonly searchVisibleCount = signal(15);
  readonly searchLoading = signal(false);
  readonly SEARCH_PAGE_SIZE = 15;
  readonly SEARCH_MAX_LENGTH = 100;
  searchInputRef = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  /** Resultados filtrados por searchQuery (título o snippet). */
  readonly searchFilteredResults = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const all = this.allSearchable();
    if (!q) return all;
    return all.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.snippet.toLowerCase().includes(q)
    );
  });

  /** Resultados que se muestran en la lista (lazy: solo los primeros searchVisibleCount). */
  readonly searchResultsToShow = computed(() =>
    this.searchFilteredResults().slice(0, this.searchVisibleCount())
  );

  readonly searchHasMore = computed(
    () => this.searchFilteredResults().length > this.searchVisibleCount()
  );

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.updateTabletOrMobile();
      this.checkScrollPosition();
      // Check current route
      this.updateContactSuccessStatus();
      // Listen to route changes
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe(() => this.updateContactSuccessStatus());
      // Cargar case studies y blogs solo en el cliente (GraphQL puede no estar disponible en SSR)
      this.graphql.getCaseStudies().subscribe((list) => {
        const filtered = [...list].filter(n =>
          n.caseStudyCategories?.nodes?.find(c => c.slug === 'featured-case-study-menu')
        );
        const _list = filtered.length > 0 ? filtered : list;
        const sorted = [..._list].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        this.featuredCaseStudies.set(sorted.slice(0, 2));
      });
      this.graphql.getBlogs().subscribe((list) => {
        const filtered = [...list].filter(n => n.genContentCategories?.nodes?.find(c => c.slug === 'featured-blog-menu'));
        const _list = filtered.length > 0 ? filtered : list;
        const sorted = [..._list].sort(
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
        this.menuItems.set(data.menu);
        this.content.set(data.content ?? null);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading navbar content:', error);
        this.menuItems.set([]);
        this.content.set(null);
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

  sleepMoveout() {
    this.searchPanelOpen.set(false);
  }

  private readonly MOBILE_BREAKPOINT = 768;

  private updateTabletOrMobile() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.isTabletOrMobile = window.innerWidth < this.MOBILE_BREAKPOINT;
    if (!this.isTabletOrMobile) {
      this.isMobileMenuOpen = false;
      this.mobileExpandedIndex = null;
      this.updateBodyScrollLock();
    }
  }

  private checkScrollPosition() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const scrollPosition = window.scrollY || document.documentElement.scrollTop;
    const scrollThreshold = window.innerHeight; // 100vh
    this.isScrolled = scrollPosition > scrollThreshold;
    this.updateStructuredEngagementStatus();
  }

  private updateStructuredEngagementStatus(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.isOnStructuredEngagement.set(false);
      return;
    }

    const sectionEl = document.querySelector('app-structured-engagements');
    if (!sectionEl) {
      this.isOnStructuredEngagement.set(false);
      return;
    }

    const rect = sectionEl.getBoundingClientRect();
    const navProbeY = 110;
    const inViewAtNavbar = rect.top <= navProbeY && rect.bottom >= navProbeY;
    this.isOnStructuredEngagement.set(inViewAtNavbar);
  }
  private updateContactSuccessStatus(): void {
    this.isOnContactSuccess.set(this.router.url === '/contact-success' || this.router.url === '/contact-us');
  }
  /** true cuando la barra debe usar estilo "oscuro" (logo oscuro, texto oscuro): scroll o hover en un dropdown (índice !== 0) o en contact-success. */
  get isNavbarDark(): boolean {
    if (this.isOnStructuredEngagement()) {
      return false;
    }
    const hover = this.hoveredIndex();
    return this.isScrolled || (hover !== null) || this.searchPanelOpen() || this.isOnContactSuccess();
  }

  /** true cuando la barra debe mostrar fondo (blanco) o texto de enlaces oscuro: scroll o cualquier hover en menú o en contact-success. */
  get hasNavbarBackground(): boolean {
    if (this.isOnStructuredEngagement()) {
      return false;
    }
    return this.isScrolled || this.hoveredIndex() !== null || this.searchPanelOpen() || this.isOnContactSuccess();
  }



  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    if (!this.isMobileMenuOpen) this.mobileExpandedIndex = null;
    this.updateBodyScrollLock();
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
    this.mobileExpandedIndex = null;
    this.updateBodyScrollLock();
  }

  toggleMobileDropdown(index: number) {
    this.mobileExpandedIndex = this.mobileExpandedIndex === index ? null : index;
  }

  getMobileExpandedIndex(): number | null {
    return this.mobileExpandedIndex;
  }

  openSearchFromMobile() {
    this.closeMobileMenu();
    this.toggleSearchPanel();
  }

  private updateBodyScrollLock() {
    if (isPlatformBrowser(this.platformId)) {
      this.document.body.classList.toggle('mobile-menu-open', this.isMobileMenuOpen);
    }
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
  }

  public onNavMouseLeave(): void {
    this.hoveredIndex.set(null);
    // if (this.searchPanelOpen) {
    //   this.searchPanelOpen.set(false);
    // }
    // console.log('onNavMouseLeave', this.hoveredIndex());
  }

  public handleMouseEnter(item: { index: number | null; hasDropdown: boolean }): void {
    if (item.hasDropdown && item.index !== null) {
      this.hoveredIndex.set(item.index);
    }
  }

  toggleSearchPanel(): void {
    const next = !this.searchPanelOpen();
    this.searchPanelOpen.set(next);
    if (next) {
      this.hoveredIndex.set(null);
      this.loadSearchableContent();
      setTimeout(() => this.searchInputRef()?.nativeElement?.focus(), 120);
    } else {
      this.searchQuery.set('');
      this.searchVisibleCount.set(this.SEARCH_PAGE_SIZE);
    }
  }

  private loadSearchableContent(): void {
    if (this.allSearchable().length > 0) return;
    this.searchLoading.set(true);
    this.graphql.getSearchableContent().subscribe({
      next: (list) => {
        this.allSearchable.set(list);
        this.searchLoading.set(false);
      },
      error: () => this.searchLoading.set(false),
    });
  }

  closeSearchPanel(): void {
    this.searchPanelOpen.set(false);
    this.searchQuery.set('');
    this.searchVisibleCount.set(this.SEARCH_PAGE_SIZE);
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value.slice(0, this.SEARCH_MAX_LENGTH));
    this.searchVisibleCount.set(this.SEARCH_PAGE_SIZE);
  }

  onSearchScroll(event: Event): void {
    const el = event.target as HTMLElement;
    if (el.scrollHeight - el.scrollTop <= el.clientHeight + 80 && this.searchHasMore()) {
      this.searchVisibleCount.update((n) => n + this.SEARCH_PAGE_SIZE);
    }
  }

  /** Fragment (hash) con el texto buscado para que la página destino pueda hacer scroll a la posición. */
  getSearchFragment(): string | undefined {
    const q = this.searchQuery().trim();
    return q ? encodeURIComponent(q) : undefined;
  }

  ngOnDestroy() {
    // Cleanup if needed
  }
}
