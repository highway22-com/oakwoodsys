import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, OnDestroy, Output, PLATFORM_ID, QueryList, ViewChild, ViewChildren, effect, inject, input, signal, computed } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { ButtonPrimaryComponent } from "../../button-primary/button-primary.component";

export type OfferBorderColor = 'blue' | 'orange' | 'green' | 'purple';

export interface StructuredEngagementsOffer {
  id?: number;
  title?: string;
  description?: string;
  link?: string;
  linkText?: string;
  borderColor?: string;
  icon?: string;
  category?: string; // New: to filter by tab
  svgIcon?: string; // New: optional SVG markup
}

export interface StructuredEngagementsSection {
  label?: string;
  /** Título como string o como objeto con line1/line2 (compatible con CmsSection). */
  title?: string | { line1?: string; line2?: string };
  tabs?: string[];
  activeTab?: string;
  offers?: StructuredEngagementsOffer[];
  cta?: { text?: string; link?: string; backgroundColor?: string };
}

// Default fallback data
const DEFAULT_STRUCTURED_ENGAGEMENTS_DATA: StructuredEngagementsSection = {
  label: "HOW WE GET STARTED",
  title: "Structured engagements",
  tabs: [
    "Data and AI",
    "Cloud and Infrastructure",
    "Application Innovation",
    "High Performance Computing (HPC)"
  ],
  activeTab: "Data and AI",
  offers: [
    // Tab 1: Data and AI
    {
      title: "Sql server migration to Azure",
      description: "Modernize SQL Server workloads with a structured move to Azure SQL services, improving performance, scalability and long-term cost efficiency for your data estate.",
      icon: "database",
      borderColor: "blue",
      category: "Data and AI",
      link: "/structured-engagement/sql-server-migration-to-azure",
      linkText: "View offer"
    },
    {
      title: "Unified data estate migration",
      description: "Consolidate cloud data into a connected cloud architecture using Azure Synapse or Fabric, creating a modern foundation for BI and advanced analytics.",
      icon: "table",
      borderColor: "orange",
      category: "Data and AI",
      link: "/structured-engagement/unified-data-estate-migration",
      linkText: "View offer"
    },
    {
      title: "Microsoft fabric POC",
      description: "Stand up a working Fabric environment that connects your data sources and shows your team how to adopt OneLake, semantic models, and capabilities with hands-on guidance.",
      icon: "chart-simple",
      borderColor: "green",
      category: "Data and AI",
      link: "/structured-engagement/microsoft-fabric-poc",
      linkText: "View offer"
    },
    {
      title: "Data readiness assessment for AI",
      description: "Understand whether your data is clean, governed and governed well enough to power ML/AI effectively and get a roadmap to improve quality, structure, and readiness.",
      icon: "brain",
      borderColor: "purple",
      category: "Data and AI",
      link: "/structured-engagement/data-readiness-assessment-ai",
      linkText: "View offer"
    },
    // Tab 2: Cloud and Infrastructure
    {
      title: "Application migration to Azure",
      description: "Move applications to Microsoft Azure with a guided approach that improves resilience, reduces risk, and builds a strong foundation for future modernization.",
      icon: "cloud-arrow-up",
      borderColor: "blue",
      category: "Cloud and Infrastructure",
      link: "/structured-engagement/application-migration-azure",
      linkText: "View offer"
    },
    {
      title: "Vmware migrations",
      description: "Transition VMware workloads to Azure using a proven discovery, planning, and execution framework that simplifies complexity and delivers a stable cloud environment.",
      icon: "server",
      borderColor: "orange",
      category: "Cloud and Infrastructure",
      link: "/structured-engagement/vmware-migrations",
      linkText: "View offer"
    },
    {
      title: "Microsoft sentinel security essentials POC",
      description: "Evaluate Microsoft Sentinel in your environment with a structured POC that tests log-based SIEM and SOAR can improve threat detection and operational response.",
      icon: "shield-halved",
      borderColor: "green",
      category: "Cloud and Infrastructure",
      link: "/structured-engagement/microsoft-sentinel-poc",
      linkText: "View offer"
    },
    {
      title: "Teams voice in a box",
      description: "Test Microsoft Teams as a complete telephony solution through a focused proof of concept that explores calling, configuration, user experience, and cost.",
      icon: "phone",
      borderColor: "purple",
      category: "Cloud and Infrastructure",
      link: "/structured-engagement/teams-voice-box",
      linkText: "View offer"
    },
    // Tab 3: Application Innovation
    {
      title: "AI application modernization assessment",
      description: "Evaluate how AI and modern cloud services can enhance or modernize an existing application and get a prioritized, actionable roadmap for future development.",
      icon: "microchip",
      borderColor: "blue",
      category: "Application Innovation",
      link: "/structured-engagement/ai-application-modernization",
      linkText: "View offer"
    },
    {
      title: "Copilot extensibility workshop",
      description: "Learn how to extend Microsoft Copilot for M365 using Azure AI, Power Platform, and custom APIs, with practical guidance for connecting Copilot to your business data.",
      icon: "puzzle-piece",
      borderColor: "orange",
      category: "Application Innovation",
      link: "/structured-engagement/copilot-extensibility-workshop",
      linkText: "View offer"
    },
    {
      title: "Custom Copilot development",
      description: "Build tailored Copilot experiences that integrate business logic, domain knowledge, and data so tasks to create differentiated, context-specific AI experiences for your team.",
      icon: "code",
      borderColor: "green",
      category: "Application Innovation",
      link: "/structured-engagement/custom-copilot-development",
      linkText: "View offer"
    },
    {
      title: "AI agent in a day workshop",
      description: "Explore real-world use cases for AI agents and create an early prototype in a focused session that brings clarity to design, capability, and potential impact.",
      icon: "robot",
      borderColor: "purple",
      category: "Application Innovation",
      link: "/structured-engagement/ai-agent-workshop",
      linkText: "View offer"
    },
    // Tab 4: High Performance Computing (HPC)
    {
      title: "Azure HPC core POC",
      description: "A guided introduction to Azure HPC designed for lightweight workloads, helping teams experience cloud-based performance with validating early technical decisions.",
      icon: "layer-group",
      borderColor: "blue",
      category: "High Performance Computing (HPC)",
      link: "/structured-engagement/azure-hpc-core-poc",
      linkText: "View offer"
    },
    {
      title: "Copilot extensibility workshop",
      description: "A real-scale HPC proof of concept that introduces advanced scheduling, core configuration, and higher performance configurations for growing computational needs.",
      icon: "file-lines",
      borderColor: "orange",
      category: "High Performance Computing (HPC)",
      link: "/structured-engagement/copilot-extensibility-workshop-hpc",
      linkText: "View offer"
    },
    {
      title: "Azure HPC max POC",
      description: "A full scale Azure HPC proof of concept built for demanding workloads including virtualization, engineering, and AI to testing large-scale performance and efficiency.",
      icon: "chart-line",
      borderColor: "green",
      category: "High Performance Computing (HPC)",
      link: "/structured-engagement/azure-hpc-max-poc",
      linkText: "View offer"
    },
    {
      title: "Azure HPC migration assessment",
      description: "Evaluate your existing HPC environment and receive a tailored migration path that includes performance modeling, cost projections and a practical rollout timeline.",
      icon: "table-list",
      borderColor: "purple",
      category: "High Performance Computing (HPC)",
      link: "/structured-engagement/azure-hpc-migration-assessment",
      linkText: "View offer"
    }
  ],
  cta: {
    text: "View all offers",
    link: "/structured-engagement"
  }
};

@Component({
  selector: 'app-structured-engagements',
  standalone: true,
  imports: [CommonModule, ButtonPrimaryComponent],
  templateUrl: './structured-engagements.html',
  styleUrl: './structured-engagements.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('tabContent', [
      transition(':increment', [
        query(':enter', [
          style({ opacity: 0 }),
          stagger(80, [
            animate('300ms 100ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1 }))
          ])
        ], { optional: true }),
        query(':leave', [
          stagger(-80, [
            animate('200ms ease-out', style({ opacity: 0 }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class StructuredEngagementsSectionComponent implements AfterViewInit, OnDestroy {
  readonly section = input.required<StructuredEngagementsSection>();

  @ViewChild('tabList', { static: false }) tabList?: ElementRef<HTMLDivElement>;
  @ViewChildren('tabButton') tabButtons?: QueryList<ElementRef<HTMLButtonElement>>;

  private readonly platformId = inject(PLATFORM_ID);
  private viewReady = false;
  private userSelectedTab = false; // Track if user manually selected a tab

  readonly underlineLeft = signal(0);
  readonly underlineWidth = signal(0);
  readonly underlineVisible = signal(false);
  readonly activeTab = signal<string | null>(null);
  readonly animationKey = signal(0);
  
  // Computed property to filter offers by active tab
  readonly filteredOffers = computed(() => {
    const active = this.activeTab();
    const allOffers = DEFAULT_STRUCTURED_ENGAGEMENTS_DATA.offers ?? [];
    
    console.log('Active tab:', active);
    console.log('All offers:', allOffers.length);
    
    if (!active) {
      return allOffers.length > 0 ? allOffers : [];
    }
    
    // Filter offers by category matching the active tab (case-insensitive)
    const filtered = allOffers.filter(offer => {
      const match = offer.category?.trim().toLowerCase() === active.trim().toLowerCase();
      if (match) {
        console.log('Matched offer:', offer.title, 'category:', offer.category);
      }
      return match;
    });
    
    console.log('Filtered offers count:', filtered.length);
    
    // If no filtered results, show all offers as fallback
    return filtered.length > 0 ? filtered : allOffers;
  });

  @Output() readonly tabSelect = new EventEmitter<string>();
  @Output() readonly ctaClick = new EventEmitter<void>();

  constructor() {
    // Effect to handle initial tab setup and underline
    effect(() => {
      const incomingActive = this.section().activeTab ?? null;
      const tabs = this.section().tabs ?? [];
      const current = this.activeTab();
      
      // Only set from input if user hasn't manually selected a tab
      if (!this.userSelectedTab) {
        if (incomingActive && incomingActive !== current) {
          this.activeTab.set(incomingActive);
        } else if (!incomingActive && !current && tabs.length > 0) {
          this.activeTab.set(tabs[0] ?? null);
        }
      }
      
      if (this.viewReady) {
        queueMicrotask(() => this.updateUnderline());
      }
    });
  }

  ngAfterViewInit() {
    this.viewReady = true;
    if (isPlatformBrowser(this.platformId)) {
      this.updateUnderline();
      window.addEventListener('resize', this.updateUnderline, { passive: true });
    }

    if (this.tabButtons) {
      this.tabButtons.changes.subscribe(() => {
        queueMicrotask(() => this.updateUnderline());
      });
    }
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('resize', this.updateUnderline);
    }
  }

  private updateUnderline = () => {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    if (!this.tabList?.nativeElement || !this.tabButtons?.length) {
      return;
    }

    const activeTab = this.activeTab() ?? '';
    const activeButton = this.tabButtons.find(btn => {
      const btnTab = btn.nativeElement.getAttribute('data-tab') ?? '';
      return btnTab.trim().toLowerCase() === activeTab.trim().toLowerCase();
    });
    
    if (!activeButton) {
      this.underlineVisible.set(false);
      return;
    }

    const listRect = this.tabList.nativeElement.getBoundingClientRect();
    const btnRect = activeButton.nativeElement.getBoundingClientRect();
    this.underlineLeft.set(btnRect.left - listRect.left);
    this.underlineWidth.set(btnRect.width);
    this.underlineVisible.set(true);
  };

  /** Normaliza borderColor a minúsculas para que coincida aunque el CMS envíe "Blue", "Orange", etc. */
  normalizeBorderColor(borderColor?: string): string {
    return typeof borderColor === 'string' ? borderColor.trim().toLowerCase() : '';
  }

  getOfferCardClasses(borderColor?: string, index?: number): Record<string, boolean> {
    const c = this.normalizeBorderColor(borderColor);
    return {
      'hover:shadow-blue-500/30': c === 'blue',
      'hover:shadow-orange-500/30': c === 'orange',
      'hover:shadow-green-500/30': c === 'green',
      'hover:shadow-purple-500/30': c === 'purple',
      'lg:-translate-y-8': typeof index === 'number' ? index % 2 === 0 : false,
      'lg:translate-y-8': typeof index === 'number' ? index % 2 !== 0 : false,
    };
  }

  /** Gradiente del borde por índice:
   * 1) left top, 2) right bottom, 3) right middle, 4) right top. */
  getOfferBorderGradient(borderColor?: string, index?: number): string {
    const color = (() => {
      switch (this.normalizeBorderColor(borderColor)) {
        case 'blue': return '#1FB5DE';
        case 'orange': return '#C28842';
        case 'green': return '#3CC78B';
        case 'purple': return '#C333E0';
        default: return '#C333E0';
      }
    })();

    const softBorder = (() => {
      switch (this.normalizeBorderColor(borderColor)) {
        case 'blue': return 'rgba(31, 181, 222, 0.35)';
        case 'orange': return 'rgba(194, 136, 66, 0.35)';
        case 'green': return 'rgba(60, 199, 139, 0.35)';
        case 'purple': return 'rgba(195, 51, 224, 0.35)';
        default: return 'rgba(195, 51, 224, 0.35)';
      }
    })();

    const position = (() => {
      switch ((index ?? 0) % 4) {
        case 0: return 'left top';
        case 1: return 'right bottom';
        case 2: return 'right center';
        case 3: return 'right top';
        default: return 'left top';
      }
    })();

    return `linear-gradient(${softBorder}, ${softBorder}), radial-gradient(120% 120% at ${position}, ${color} 0%, rgba(33, 19, 55, 0) 45%)`;
  }

  /** Fondo interior de la tarjeta: gradiente oscuro que acompaña al borde. */
  getOfferBackground(borderColor?: string): string {
    return '#10192BB2';
  }

  getIconColor(borderColor?: string): string {
    switch (this.normalizeBorderColor(borderColor)) {
      case 'blue':
        return 'text-blue-400';
      case 'orange':
        return 'text-orange-400';
      case 'green':
        return 'text-green-400';
      case 'purple':
        return 'text-purple-400';
      default:
        return 'text-purple-400';
    }
  }

  /** Solo la clase de fondo del contenedor del icono (para combinar con w-[50px]      , etc.). */
  getOfferIconBgClass(borderColor?: string): string {
    switch (this.normalizeBorderColor(borderColor)) {
      case 'blue': return 'bg-blue-500/20';
      case 'orange': return 'bg-orange-500/20';
      case 'green': return 'bg-green-500/20';
      case 'purple': return 'bg-purple-500/20';
      default: return 'bg-purple-500/20';
    }
  }

  getOfferIconContainerClasses(borderColor?: string): Record<string, boolean> {
    const c = this.normalizeBorderColor(borderColor);
    return {
      'w-12 h-12 sm:w-14 sm:h-14 bg-blue-500/20    flex items-center justify-center': c === 'blue',
      'w-12 h-12 sm:w-14 sm:h-14 bg-orange-500/20    flex items-center justify-center': c === 'orange',
      'w-12 h-12 sm:w-14 sm:h-14 bg-green-500/20    flex items-center justify-center': c === 'green',
      'w-12 h-12 sm:w-14 sm:h-14 bg-purple-500/20    flex items-center justify-center': c === 'purple',
    };
  }

  getOfferIconSvgClasses(borderColor?: string): Record<string, boolean> {
    const c = this.normalizeBorderColor(borderColor);
    return {
      'w-6 h-6 sm:w-7 sm:h-7 text-blue-400': c === 'blue',
      'w-6 h-6 sm:w-7 sm:h-7 text-orange-400': c === 'orange',
      'w-6 h-6 sm:w-7 sm:h-7 text-green-400': c === 'green',
      'w-6 h-6 sm:w-7 sm:h-7 text-purple-400': c === 'purple',
    };
  }

  getTabClasses(tab: string, activeTab?: string): string {
    // Case-insensitive comparison for tab selection
    const isActive = tab?.trim().toLowerCase() === activeTab?.trim().toLowerCase();
    return isActive
      ? 'text-white pb-2 transition-colors duration-200'
      : 'text-white/70 pb-2 hover:text-white transition-colors duration-200';
  }

  onTabClick(tab: string) {
    this.userSelectedTab = true; // Mark that user has manually selected a tab
    this.activeTab.set(tab);
    this.animationKey.update(value => value + 1);
    this.tabSelect.emit(tab);
    // Trigger underline update after the tab is set
    if (this.viewReady) {
      queueMicrotask(() => this.updateUnderline());
    }
  }

  /** Título para mostrar (string o line1 + line2). */
  getTitle(section: StructuredEngagementsSection): string {
    const t = section?.title;
    if (typeof t === 'string') return t;
    if (t && typeof t === 'object') return [t.line1, t.line2].filter(Boolean).join(' ') || '';
    return '';
  }
}

