import { RouterLink, Router, NavigationEnd } from '@angular/router';
import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  inject,
  PLATFORM_ID,
  signal,
  computed,
  viewChild,
  ElementRef,
  input,
  effect,
  NgZone,
  DestroyRef,
} from '@angular/core';
import {
  CommonModule,
  DOCUMENT,
  NgClass,
  NgIf,
  isPlatformBrowser,
} from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';
import { GraphQLContentService } from '../../app/services/graphql-content.service';
import { filter } from 'rxjs';
import { logError } from '../../app/utils/logger';
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

interface SolutionItem {
  name: string;
  slug: string;
  link?: string;
  icon?: string;
}

interface SolutionsContent {
  ai: SolutionItem[];
  dataAndAnalytics: SolutionItem[];
  cloud: SolutionItem[];
  modernWork: SolutionItem[];
  security: SolutionItem[];
  applications: SolutionItem[];
}

type SolutionCategoryKey = keyof SolutionsContent;

interface ContentMap {
  services: Content[];
  solutions?: SolutionsContent;
  industries: Content[];
  resources: Content[];
}

export interface NavbarContent {
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
  imports: [RouterLink, CommonModule, NgClass, MenuList],
  templateUrl: './app-navbar.html',
  styleUrl: './app-navbar.css',
})
export class AppNavbar implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly http = inject(HttpClient);
  private readonly graphql = inject(GraphQLContentService);
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private menuUpdatedFromBe = false;
  private scrollRafId: number | null = null;
  private structuredEngagementEl: Element | null = null;
  private removeScrollListeners?: () => void;

  isMobileMenuOpen = false;
  mobileExpandedIndex: number | null = null;
  isScrolled = signal(false);
  isServicesDropdownOpen = false;
  isIndustriesDropdownOpen = false;
  isResourcesDropdownOpen = false;
  hoveredIndex = signal<number | null>(null);
  isOnContactSuccess = signal(false);
  isOnStructuredEngagement = signal(false);

  /** Cuando se proporciona, se usa en lugar de cargar desde JSON (para preview en edit) */
  readonly contentOverride = input<NavbarContent | null>(null);
  /** En preview (edit page), usa position relative en lugar de fixed */
  readonly previewMode = input<boolean>(false);

  readonly menuItems = signal<Menu[]>([]);
  readonly content = signal<ContentMap | null>(null);
  readonly loading = signal(true);
  /** Dos case studies más recientes para el dropdown Industries (se cargan al iniciar para que estén listos). */
  readonly featuredCaseStudies = signal<CaseStudy[]>([]);
  readonly featuredBlogs = signal<FeaturedBlogItem[]>([]);
  private featuredBlogsRequested = false;

  /** Título de la sección Featured por dropdown (Services, Industries). */
  readonly featuredTitleServices = signal('FEATURED BLOGS');
  readonly featuredTitleIndustries = signal('FEATURED CASE STUDIES');
  readonly featuredTitleSolutions = signal('FEATURED CASE STUDIES');

  readonly solutionTabs: ReadonlyArray<{ key: SolutionCategoryKey; label: string }> = [
    { key: 'ai', label: 'AI' },
    { key: 'cloud', label: 'Cloud' },
    { key: 'dataAndAnalytics', label: 'Data & Analytics' },
    { key: 'applications', label: 'Applications' },
    { key: 'security', label: 'Security' },
    { key: 'modernWork', label: 'Modern Work' },
  ];
  readonly activeSolutionCategory = signal<SolutionCategoryKey>('ai');
  readonly mobileOpenSolutionCategory = signal<SolutionCategoryKey>('ai');

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

  private route = inject(ActivatedRoute);

  readonly section = toSignal(
    this.route.queryParamMap.pipe(map((p) => p.get('section'))),
    { initialValue: null },
  );
  constructor() {
    effect(() => {
      const override = this.contentOverride();
      if (override) {
        this.menuItems.set(override.menu ?? []);
        this.content.set(override.content ?? null);
        this.loading.set(false);
      }
    });
  }

  /** Resultados filtrados por searchQuery (título o snippet). */
  readonly searchFilteredResults = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const all = this.allSearchable();
    if (!q) return all;
    return all.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.snippet.toLowerCase().includes(q),
    );
  });

  /** Resultados que se muestran en la lista (lazy: solo los primeros searchVisibleCount). */
  readonly searchResultsToShow = computed(() =>
    this.searchFilteredResults().slice(0, this.searchVisibleCount()),
  );

  readonly searchHasMore = computed(
    () => this.searchFilteredResults().length > this.searchVisibleCount(),
  );

  readonly activeSolutionItems = computed<SolutionItem[]>(() => {
    const solutions = this.content()?.solutions;
    if (!solutions) return [];
    return solutions[this.activeSolutionCategory()] ?? [];
  });

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.resolveStructuredEngagementEl();
      this.checkScrollPosition();
      // Check current route
      this.updateContactSuccessStatus();
      // Listen to route changes
      this.router.events
        .pipe(
          filter((event) => event instanceof NavigationEnd),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe(() => {
          this.updateContactSuccessStatus();
          // The navbar is a singleton that outlives navigation; app-structured-engagements
          // lives inside route content and gets destroyed/recreated on every route change.
          // Re-resolve it here instead of caching once, or we'd hold a detached node whose
          // getBoundingClientRect() silently returns all zeros after the first navigation.
          this.resolveStructuredEngagementEl();
          this.checkScrollPosition();
        });

      // This app runs zoneless (provideZonelessChangeDetection), so raw addEventListener
      // callbacks never trigger change detection on their own regardless of zone wrapping —
      // only the signal writes inside checkScrollPosition() do. runOutsideAngular is kept
      // here mainly so this stays correct if zone.js is ever reintroduced.
      this.ngZone.runOutsideAngular(() => {
        const onScrollOrResize = () => this.scheduleScrollCheck();
        window.addEventListener('scroll', onScrollOrResize, { passive: true });
        window.addEventListener('resize', onScrollOrResize, { passive: true });
        this.removeScrollListeners = () => {
          window.removeEventListener('scroll', onScrollOrResize);
          window.removeEventListener('resize', onScrollOrResize);
        };
      });

      // Cargar case studies y blogs solo en el cliente (GraphQL puede no estar disponible en SSR)
      this.graphql.getCaseStudies().subscribe((list) => {
        const filtered = [...list].filter((n) =>
          n.caseStudyCategories?.nodes?.find(
            (c) => c.slug === 'featured-case-study-menu',
          ),
        );
        const _list = filtered.length > 0 ? filtered : list;
        const sorted = [..._list].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
        this.featuredCaseStudies.set(sorted.slice(0, 1));
      });
    }
    if (!this.contentOverride()) {
      this.loadNavbarContent();
    } else {
      this.loading.set(false);
    }
  }

  private loadNavbarContent() {
    this.loading.set(true);
    this.menuUpdatedFromBe = false;

    // Always prefer WordPress/BE data first; fallback to static JSON only if BE fails.
    this.loadMenuFromGraphQL(() => this.loadNavbarFromStaticFile(true));
  }

  private loadMenuFromGraphQL(onFallback?: () => void) {
    this.graphql.getMenuContent().subscribe({
      next: (data) => {
        if (data?.menu) {
          this.menuUpdatedFromBe = true;
          this.menuItems.set(data.menu as NavbarContent['menu']);
          this.content.set(
            (data.content ?? null) as unknown as NavbarContent['content'],
          );
          this.loading.set(false);
          return;
        }
        onFallback?.();
      },
      error: () => onFallback?.(),
    });
  }

  private loadNavbarFromStaticFile(finishLoading = true) {
    this.http.get<NavbarContent>('/navbar-content.json').subscribe({
      next: (data) => {
        if (this.menuUpdatedFromBe) {
          if (finishLoading) this.loading.set(false);
          return;
        }
        this.menuItems.set(data.menu);
        this.content.set(data.content ?? null);
        this.loading.set(false);
      },
      error: (error) => {
        logError('Error loading navbar content:', error);
        this.menuItems.set([]);
        this.content.set(null);
        if (finishLoading) this.loading.set(false);
      },
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const navbarRoot = this.document.querySelector('app-navbar');
    if (!navbarRoot?.contains(target)) {
      this.isServicesDropdownOpen = false;
      this.isIndustriesDropdownOpen = false;
      this.isResourcesDropdownOpen = false;
      this.hoveredIndex.set(null);
    }
  }

  sleepMoveout() {
    this.searchPanelOpen.set(false);
  }

  /** Coalesces scroll/resize events into at most one geometry read per animation frame. */
  private scheduleScrollCheck(): void {
    if (this.scrollRafId !== null) return;
    this.scrollRafId = requestAnimationFrame(() => {
      this.scrollRafId = null;
      this.checkScrollPosition();
    });
  }

  private resolveStructuredEngagementEl(): void {
    this.structuredEngagementEl = this.document.querySelector(
      'app-structured-engagements',
    );
  }

  private computeStructuredEngagementStatus(): boolean {
    if (!this.structuredEngagementEl) {
      return false;
    }
    const rect = this.structuredEngagementEl.getBoundingClientRect();
    const navProbeY = 110;
    return rect.top <= navProbeY && rect.bottom >= navProbeY;
  }

  private checkScrollPosition() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const scrollPosition = window.scrollY || document.documentElement.scrollTop;
    const scrollThreshold = window.innerHeight; // 100vh

    // Both are signals, so .set() is a no-op notification-wise when the value
    // is unchanged — no manual diffing needed, and it's correct under both
    // zone-based and zoneless change detection (this app runs zoneless; a
    // plain property write here would never reach the view).
    this.isScrolled.set(scrollPosition > scrollThreshold);
    this.isOnStructuredEngagement.set(this.computeStructuredEngagementStatus());
  }

  private updateContactSuccessStatus(): void {
    this.isOnContactSuccess.set(
      this.router.url === '/contact-success' ||
        this.router.url === '/contact-us',
    );
  }

  get isNavbarDark(): boolean {
    if (this.isOnStructuredEngagement()) return false;
    const hover = this.hoveredIndex();
    return (
      this.isScrolled() ||
      hover !== null ||
      this.searchPanelOpen() ||
      this.isOnContactSuccess() ||
      this.section() === 'past_event'
    ); // 👈 add this
  }

  get hasNavbarBackground(): boolean {
    if (this.isOnStructuredEngagement()) return false;

    if (this.section() === 'past_event') return true; // 👈 add this
    return (
      this.isScrolled() ||
      this.hoveredIndex() !== null ||
      this.searchPanelOpen() ||
      this.isOnContactSuccess()
    );
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    if (!this.isMobileMenuOpen) {
      this.mobileExpandedIndex = null;
      this.mobileOpenSolutionCategory.set('ai');
    }
    this.updateBodyScrollLock();
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
    this.mobileExpandedIndex = null;
    this.mobileOpenSolutionCategory.set('ai');
    this.updateBodyScrollLock();
  }

  toggleMobileDropdown(index: number, slug?: string) {
    const next = this.mobileExpandedIndex === index ? null : index;
    this.mobileExpandedIndex = next;
    if (next === 0) {
      this.ensureFeaturedBlogsLoaded();
    }
    if (next !== null && slug === 'solutions') {
      this.mobileOpenSolutionCategory.set('ai');
    }
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
      this.document.body.classList.toggle(
        'mobile-menu-open',
        this.isMobileMenuOpen,
      );
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

  private getDropdownIndex(slug: string): number | null {
    const dropdownIndexBySlug: Record<string, number> = {
      services: 0,
      solutions: 1,
      industries: 2,
      resources: 3,
    };
    return dropdownIndexBySlug[slug] ?? null;
  }

  public toggleDesktopDropdown(
    item: { slug: string; hasDropdown: boolean },
    event: MouseEvent,
  ): void {
    if (!item.hasDropdown) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const dropdownIndex = this.getDropdownIndex(item.slug);
    if (dropdownIndex === null) {
      return;
    }

    const isOpen = this.hoveredIndex() === dropdownIndex;
    this.hoveredIndex.set(isOpen ? null : dropdownIndex);

    if (isOpen) {
      this.closeAllDropdowns();
      return;
    }

    this.isServicesDropdownOpen = item.slug === 'services';
    this.isIndustriesDropdownOpen = item.slug === 'industries';
    this.isResourcesDropdownOpen = item.slug === 'resources';

    if (item.slug === 'services') {
      this.ensureFeaturedBlogsLoaded();
    }
    if (item.slug === 'solutions') {
      this.activeSolutionCategory.set('ai');
    }
  }

  public onNavMouseLeave(): void {
    this.hoveredIndex.set(null);
    // if (this.searchPanelOpen) {
    //   this.searchPanelOpen.set(false);
    // }
    // console.log('onNavMouseLeave', this.hoveredIndex());
  }

  public handleMouseEnter(
    item: { slug: string; index: number | null; hasDropdown: boolean },
    templateIndex: number,
  ): void {
    if (item.hasDropdown) {
      const dropdownIndexBySlug: Record<string, number> = {
        services: 0,
        solutions: 1,
        industries: 2,
        resources: 3,
      };
      const resolvedIndex = dropdownIndexBySlug[item.slug] ?? templateIndex;
      this.hoveredIndex.set(resolvedIndex);
      if (item.slug === 'services') {
        this.ensureFeaturedBlogsLoaded();
      }
      if (item.slug === 'solutions') {
        this.activeSolutionCategory.set('ai');
      }
      return;
    }

    // Non-dropdown items (e.g. Microsoft Licensing) should still trigger
    // the light navbar mode on hover.
    this.hoveredIndex.set(-1);
  }

  public handleTopLinkMouseLeave(item: {
    hasDropdown: boolean;
  }): void {
    // For non-dropdown links, clear hover state when pointer leaves the link.
    if (!item.hasDropdown) {
      this.hoveredIndex.set(null);
    }
  }

  /** Carga blogs para el mega menú de Services (GetGenContentsByCategory); solo bajo demanda. */
  ensureFeaturedBlogsLoaded(): void {
    if (!isPlatformBrowser(this.platformId) || this.featuredBlogsRequested) {
      return;
    }
    this.featuredBlogsRequested = true;
    this.graphql.getBlogs().subscribe((list) => {
      const filtered = [...list].filter((n) =>
        n.genContentCategories?.nodes?.find(
          (c) => c.slug === 'featured-blog-menu',
        ),
      );
      const _list = filtered.length > 0 ? filtered : list;
      const sorted = [..._list].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      this.featuredBlogs.set(
        sorted.slice(0, 1).map((n) => ({
          id: n.id,
          title: n.title,
          link: `/blog/${n.slug}`,
          image: n.featuredImage?.node?.sourceUrl ?? '',
        })),
      );
    });
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
    if (
      el.scrollHeight - el.scrollTop <= el.clientHeight + 80 &&
      this.searchHasMore()
    ) {
      this.searchVisibleCount.update((n) => n + this.SEARCH_PAGE_SIZE);
    }
  }

  /** Fragment (hash) con el texto buscado para que la página destino pueda hacer scroll a la posición. */
  getSearchFragment(): string | undefined {
    const q = this.searchQuery().trim();
    return q ? encodeURIComponent(q) : undefined;
  }

  setActiveSolutionCategory(key: SolutionCategoryKey): void {
    this.activeSolutionCategory.set(key);
  }

  toggleMobileSolutionCategory(key: SolutionCategoryKey): void {
    if (this.mobileOpenSolutionCategory() === key) {
      return;
    }
    this.mobileOpenSolutionCategory.set(key);
  }

  isMobileSolutionCategoryOpen(key: SolutionCategoryKey): boolean {
    return this.mobileOpenSolutionCategory() === key;
  }

  private getSolutionCategoryRouteSegment(category: SolutionCategoryKey): string {
    return category === 'dataAndAnalytics' ? 'data-analytics' : category;
  }

  getSolutionHref(category: SolutionCategoryKey, item: SolutionItem): string {
    const categorySegment = this.getSolutionCategoryRouteSegment(category);
    const rawValue = (item.link ?? item.slug ?? '').trim();
    const normalized = rawValue.replace(/^\/+/g, '').replace(/\/+$/g, '');

    if (!normalized) {
      return `/solutions/${categorySegment}`;
    }

    const segments = normalized.split('/').filter(Boolean);
    const linkSegment = segments[segments.length - 1] ?? normalized;
    return `/solutions/${categorySegment}/${linkSegment}`;
  }

  get featuredSolutionCaseStudy(): CaseStudy | null {
    return this.featuredCaseStudies().length > 0
      ? this.featuredCaseStudies()[0]
      : null;
  }

  getFeaturedCaseStudyLink(caseStudy: CaseStudy): string {
    return `/resources/case-studies/${caseStudy.slug}`;
  }

  ngOnDestroy() {
    if (this.scrollRafId !== null) {
      cancelAnimationFrame(this.scrollRafId);
    }
    this.removeScrollListeners?.();
  }
}
