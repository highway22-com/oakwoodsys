import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  Output,
  PLATFORM_ID,
  QueryList,
  ViewChild,
  ViewChildren,
  effect,
  inject,
  input,
  signal,
  computed,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  animate,
  query,
  stagger,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ButtonPrimaryComponent } from '../../button-primary/button-primary.component';

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
  label: 'HOW WE GET STARTED',
  title: 'Structured engagements',
  tabs: [
    'Data and AI',
    'Cloud and Infrastructure',
    'Application Innovation',
    'High Performance Computing (HPC)',
  ],
  activeTab: 'Data and AI',
  offers: [
    // Tab 1: Data and AI
    {
      title: 'Sql server migration to Azure',
      description:
        'Modernize SQL Server workloads with a structured move to Azure SQL services, improving performance, scalability and long-term cost efficiency for your data estate.',
      svgIcon: `<svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="70" height="70" rx="10.6667" fill="#1FB5DE" fill-opacity="0.1"/><path d="M47 21C49.1875 21 51 22.8125 51 25V29C51 31.25 49.1875 33 47 33H23C20.75 33 19 31.25 19 29V25C19 22.8125 20.75 21 23 21H47ZM48 29V25C48 24.5 47.5 24 47 24H23C22.4375 24 22 24.5 22 25V29C22 29.5625 22.4375 30 23 30H47C47.5 30 48 29.5625 48 29ZM47 37C49.1875 37 51 38.8125 51 41V45C51 47.25 49.1875 49 47 49H23C20.75 49 19 47.25 19 45V41C19 38.8125 20.75 37 23 37H47ZM48 45V41C48 40.5 47.5 40 47 40H23C22.4375 40 22 40.5 22 41V45C22 45.5625 22.4375 46 23 46H47C47.5 46 48 45.5625 48 45ZM41 25.5C41.8125 25.5 42.5 26.1875 42.5 27C42.5 27.875 41.8125 28.5 41 28.5C40.125 28.5 39.5 27.875 39.5 27C39.5 26.1875 40.125 25.5 41 25.5ZM45 25.5C45.8125 25.5 46.5 26.1875 46.5 27C46.5 27.875 45.8125 28.5 45 28.5C44.125 28.5 43.5 27.875 43.5 27C43.5 26.1875 44.125 25.5 45 25.5ZM41 41.5C41.8125 41.5 42.5 42.1875 42.5 43C42.5 43.875 41.8125 44.5 41 44.5C40.125 44.5 39.5 43.875 39.5 43C39.5 42.1875 40.125 41.5 41 41.5ZM45 41.5C45.8125 41.5 46.5 42.1875 46.5 43C46.5 43.875 45.8125 44.5 45 44.5C44.125 44.5 43.5 43.875 43.5 43C43.5 42.1875 44.125 41.5 45 41.5Z" fill="#1FB5DE"/></svg>`,
      borderColor: 'blue',
      category: 'Data and AI',
      link: '/structured-engagement/sql-server-migration-to-azure',
      linkText: 'View offer',
    },
    {
      title: 'Unified data estate migration',
      description:
        'Consolidate cloud data into a connected cloud architecture using Azure Synapse or Fabric, creating a modern foundation for BI and advanced analytics.',
      svgIcon: `<svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
       <rect width="70" height="70" rx="10.6667" fill="#EDA956" fill-opacity="0.1"/>
          <path d="M35 51C27.25 51 21 48.8125 21 46V24C21 21.25 27.25 19 35 19C42.6875 19 49 21.25 49 24V46C49 48.8125 42.6875 51 35 51ZM46 24.4375L45.9375 24.375C45.625 24.125 44.9375 23.6875 43.875 23.3125C41.75 22.5625 38.5625 22 35 22C31.375 22 28.1875 22.5625 26.0625 23.3125C25 23.6875 24.3125 24.125 24 24.375V24.4375V29.9375C24.8125 30.375 25.9375 30.8125 27.375 31.1875C29.5 31.6875 32.125 32 35 32C37.8125 32 40.4375 31.6875 42.5625 31.1875C44 30.8125 45.125 30.375 46 29.9375V24.4375ZM46 33.25C45.125 33.5625 44.25 33.875 43.25 34.125C40.875 34.6875 38 35 35 35C31.9375 35 29.0625 34.6875 26.6875 34.125C25.6875 33.875 24.8125 33.5625 24 33.25V37.9375C24.8125 38.375 25.9375 38.8125 27.375 39.1875C29.5 39.6875 32.125 40 35 40C37.8125 40 40.4375 39.6875 42.5625 39.1875C44 38.8125 45.125 38.375 46 37.9375V33.25ZM24 45.6875C24.3125 45.9375 25 46.375 26.0625 46.75C28.1875 47.5 31.375 48 34.9375 48C38.5625 48 41.75 47.5 43.875 46.75C44.9375 46.375 45.625 45.9375 45.9375 45.6875L46 45.625V41.25C45.125 41.5625 44.25 41.875 43.25 42.125C40.875 42.6875 38 43 34.9375 43C31.9375 43 29.0625 42.6875 26.6875 42.125C25.6875 41.875 24.8125 41.5625 23.9375 41.25V45.625L24 45.6875ZM46.125 45.5L46.0625 45.5625C46.125 45.5 46.125 45.5 46.125 45.5ZM23.875 45.5625C23.875 45.5 23.8125 45.5 23.8125 45.5L23.875 45.5625ZM23.875 24.5C23.8125 24.5625 23.8125 24.5625 23.8125 24.5625L23.875 24.5ZM46.125 24.5625C46.125 24.5625 46.125 24.5625 46.0625 24.5L46.125 24.5625Z" fill="#EDA956"/>
        </svg>
`,
      borderColor: 'orange',
      category: 'Data and AI',
      link: '/structured-engagement/unified-data-estate-migration',
      linkText: 'View offer',
    },
    {
      title: 'Microsoft fabric POC',
      description:
        'Stand up a working Fabric environment that connects your data sources and shows your team how to adopt OneLake, semantic models, and capabilities with hands-on guidance.',
      svgIcon: `<svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="70" height="70" rx="10.6667" fill="#46DE9C" fill-opacity="0.16"/>
<path d="M33 23C33 24.0625 32.5625 25.0625 31.875 25.75L33.5625 29.375C34.3125 29.125 35.125 29 36 29C38.375 29 40.625 30 42.25 31.5625L47.0625 28C47 27.6875 47 27.375 47 27C47 24.8125 48.75 23 51 23C53.1875 23 55 24.8125 55 27C55 29.25 53.1875 31 51 31C50.1875 31 49.5 30.8125 48.875 30.4375L44 34C44.625 35.1875 45 36.5625 45 38C45 39.1875 44.75 40.3125 44.375 41.3125L48.5625 43.8125C49.25 43.3125 50.0625 43 51 43C53.1875 43 55 44.8125 55 47C55 49.25 53.1875 51 51 51C48.75 51 47 49.25 47 47C47 46.8125 47 46.625 47 46.4375L42.8125 43.875C41.125 45.8125 38.6875 47 36 47C31.5 47 27.8125 43.8125 27.0625 39.5H22.6875C22.0625 41 20.625 42 19 42C16.75 42 15 40.25 15 38C15 35.8125 16.75 34 19 34C20.625 34 22.0625 35.0625 22.6875 36.5H27.0625C27.5 34.0625 28.875 32 30.875 30.625L29.1875 27C29.125 27 29.0625 27 29 27C26.75 27 25 25.25 25 23C25 20.8125 26.75 19 29 19C31.1875 19 33 20.8125 33 23ZM36 44C39.3125 44 42 41.3125 42 38C42 34.6875 39.3125 32 36 32C32.625 32 30 34.6875 30 38C30 41.3125 32.625 44 36 44Z" fill="#46DE9C"/>
</svg>
`,
      borderColor: 'green',
      category: 'Data and AI',
      link: '/structured-engagement/microsoft-fabric-poc',
      linkText: 'View offer',
    },
    {
      title: 'Data readiness assessment for AI',
      description:
        'Understand whether your data is clean, governed and governed well enough to power ML/AI effectively and get a roadmap to improve quality, structure, and readiness.',
      svgIcon: `<svg width="64" height="70" viewBox="0 0 64 70" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="64" height="70" rx="10.6667" fill="#C333E0" fill-opacity="0.16"/>
<path d="M39.3125 41.625C40.875 42.4375 42 44.125 42 46C42 48.8125 39.75 51 37 51C34.1875 51 31.9375 48.8125 31.9375 46C31.9375 45.3125 32.125 44.625 32.375 44L23.5625 36.3125C22.8125 36.75 21.9375 37 21 37C18.1875 37 16 34.8125 16 32C16 29.25 18.1875 27 21 27C22.5 27 23.9375 27.75 24.8125 28.875L36 24.4375C36 24.3125 36 24.1875 36 24C36 21.25 38.1875 19 41 19C43.75 19 46 21.25 46 24C46 26.5625 44.0625 28.6875 41.5625 29L39.3125 41.625ZM41 22C39.875 22 39 22.9375 39 24C39 25.125 39.875 26 41 26C42.0625 26 43 25.125 43 24C43 22.9375 42.0625 22 41 22ZM25.9375 31.625C25.9375 31.75 25.9375 31.875 25.9375 32C25.9375 32.75 25.8125 33.4375 25.5625 34.0625L34.375 41.75C34.9375 41.375 35.625 41.125 36.375 41.0625L38.625 28.4375C38.0625 28.125 37.5 27.6875 37.125 27.1875L25.9375 31.625ZM37 44C35.875 44 35 44.9375 35 46C35 47.125 35.875 48 37 48C38.0625 48 39 47.125 39 46C39 44.9375 38.0625 44 37 44ZM20.9375 34C22.0625 34 22.9375 33.125 22.9375 32C22.9375 30.9375 22.0625 30 20.9375 30C19.875 30 18.9375 30.9375 18.9375 32C18.9375 33.125 19.875 34 20.9375 34Z" fill="#C333E0"/>
</svg>
`,
      borderColor: 'purple',
      category: 'Data and AI',
      link: '/structured-engagement/data-readiness-assessment-for-ai',
      linkText: 'View offer',
    },
    // Tab 2: Cloud and Infrastructure
    {
      title: 'Application migration to Azure',
      description:
        'Move applications to Microsoft Azure with a guided approach that improves resilience, reduces risk, and builds a strong foundation for future modernization.',
      svgIcon: `<svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="70" height="70" rx="10.6667" fill="#1FB5DE" fill-opacity="0.1"/>
<path d="M35.5 42C36.3125 42 37 42.6875 37 43.5C37 44.375 36.3125 45 35.5 45H23C22.125 45 21.5 44.375 21.5 43.5V28.125L17.5 32.0625C16.9375 32.6875 16 32.6875 15.4375 32.0625C14.8125 31.5 14.8125 30.5625 15.4375 30L21.9375 23.5C22.5 22.875 23.4375 22.875 24 23.5L30.5 30C31.125 30.5625 31.125 31.5 30.5 32.0625C30.25 32.375 29.875 32.5 29.5 32.5C29.0625 32.5 28.6875 32.375 28.4375 32.0625L24.5 28.125V42H35.5ZM54.5 37.9375C55.125 38.5625 55.125 39.5 54.5 40.0625L48 46.5625C47.4375 47.1875 46.5 47.1875 45.9375 46.5625L39.4375 40.0625C38.8125 39.5 38.8125 38.5625 39.4375 38C39.6875 37.6875 40.0625 37.5 40.5 37.5C40.875 37.5 41.25 37.6875 41.5 38L45.5 41.9375V28H34.5C33.625 28 33 27.375 33 26.5C33 25.6875 33.625 25 34.5 25H47C47.8125 25 48.5 25.6875 48.5 26.5V41.9375L52.375 37.9375C52.9375 37.375 53.875 37.375 54.5 37.9375Z" fill="#1FB5DE"/>
</svg>
`,
      borderColor: 'blue',
      category: 'Cloud and Infrastructure',
      link: '/structured-engagement/application-migration-to-azure',
      linkText: 'View offer',
    },
    {
      title: 'Vmware migrations',
      description:
        'Transition VMware workloads to Azure using a proven discovery, planning, and execution framework that simplifies complexity and delivers a stable cloud environment.',
      svgIcon: `<svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="70" height="70" rx="10.6667" fill="#EDA956" fill-opacity="0.1"/>
<path d="M38.75 29.125C37.6875 28.4375 36.375 28 35 28C31.125 28 28 31.1875 28 35C28 38.875 31.125 42 35 42C38.8125 42 42 38.875 42 35H45C45 39.9375 41.4375 44 36.8125 44.875C36.375 44.375 35.6875 44 35 44C34.25 44 33.5625 44.375 33.125 44.875C29.0625 44.125 25.875 40.9375 25.125 36.875C25.625 36.4375 26 35.75 26 35C26 34.3125 25.625 33.625 25.125 33.1875C26 28.5625 30.0625 25 35 25C37.1875 25 39.25 25.75 40.875 27L43.0625 24.8125C40.8125 23.0625 38 22 35 22C28.5 22 23.125 26.75 22.125 32.9375C21.4375 33.375 21 34.125 21 35C21 35.9375 21.4375 36.6875 22.125 37.125C23.0625 42.625 27.375 46.9375 32.875 47.875C33.3125 48.5625 34.0625 49 35 49C35.875 49 36.625 48.5625 37.0625 47.875C43.25 46.875 48 41.5 48 35H51C51 43.875 43.8125 51 35 51C26.125 51 19 43.875 19 35C19 26.1875 26.125 19 35 19C38.875 19 42.375 20.4375 45.1875 22.6875L47.9375 19.9375C48.5 19.375 49.4375 19.375 50 19.9375C50.625 20.5625 50.625 21.5 50 22.0625L38.625 33.4375C38.875 33.9375 39 34.4375 39 35C39 37.25 37.1875 39 35 39C32.75 39 31 37.25 31 35C31 32.8125 32.75 31 35 31C35.5 31 36.0625 31.125 36.5625 31.3125L38.75 29.125Z" fill="#EDA956"/>
</svg>
`,
      borderColor: 'orange',
      category: 'Cloud and Infrastructure',
      link: '/structured-engagement/vmware-migrations',
      linkText: 'View offer',
    },
    {
      title: 'Microsoft sentinel security essentials POC',
      description:
        'Evaluate Microsoft Sentinel in your environment with a structured POC that tests log-based SIEM and SOAR can improve threat detection and operational response.',
      svgIcon: `<svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="70" height="70" rx="10.6667" fill="#46DE9C" fill-opacity="0.16"/>
<path d="M35 22.125L23.5625 26.9375C23.1875 27.125 22.9375 27.4375 23 27.75C23 33.5 25.375 43.375 34.625 47.75C34.875 47.875 35.125 47.875 35.3125 47.75C44.5625 43.3125 46.9375 33.5 47 27.75C47 27.4375 46.75 27.125 46.4375 26.9375L35 22.125ZM35.8125 19.1875L47.5625 24.1875C48.9375 24.8125 50 26.125 50 27.75C49.9375 34 47.375 45.3125 36.625 50.5C35.5625 51 34.375 51 33.3125 50.5C22.5625 45.3125 20 34 20 27.75C19.9375 26.125 21 24.8125 22.375 24.1875L34.125 19.1875C34.375 19.0625 34.6875 19 35 19C35.25 19 35.5625 19.0625 35.8125 19.1875Z" fill="#46DE9C"/>
</svg>
`,
      borderColor: 'green',
      category: 'Cloud and Infrastructure',
      link: '/structured-engagement/semisol-security-essentials-poc',
      linkText: 'View offer',
    },
    {
      title: 'Teams voice in a box',
      description:
        'Test Microsoft Teams as a complete telephony solution through a focused proof of concept that explores calling, configuration, user experience, and cost.',
      svgIcon: `<svg width="72" height="70" viewBox="0 0 72 70" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="72" height="70" rx="10.6667" fill="#C333E0" fill-opacity="0.16"/>
<path d="M19.5 33C18.625 33 18 32.375 18 31.5V22.5C18 20.625 19.5625 19 21.5 19H50.5C52.375 19 54 20.625 54 22.5V31.5C54 32.375 53.3125 33 52.5 33C51.625 33 51 32.375 51 31.5V22.5C51 22.25 50.75 22 50.5 22H21.5C21.1875 22 21 22.25 21 22.5V31.5C21 32.375 20.3125 33 19.5 33ZM50 35C52.1875 35.0625 53.9375 36.8125 53.9375 39C53.9375 41.25 52.1875 43 50 43C47.75 43 46 41.25 46 39C46 36.8125 47.75 35.0625 50 35ZM50 40C50.5 40 50.9375 39.5625 50.9375 39C50.9375 38.5 50.5 38.0625 50 38.0625C49.4375 38.0625 49 38.5 49 39C49 39.5625 49.4375 40 50 40ZM37.4375 45C39.9375 45 42 47.125 42 49.6875C42 50.4375 41.375 51 40.6875 51H31.25C30.5625 51 30 50.4375 30 49.6875C30 47.125 32 45 34.5 45H37.4375ZM51.4375 45C53.9375 45 56 47.125 56 49.6875C56 50.4375 55.375 51 54.6875 51H45.25C44.5625 51 44 50.4375 44 49.6875C44 47.125 46 45 48.5 45H51.4375ZM32 39C32 36.8125 33.75 35.0625 36 35C38.1875 35.0625 39.9375 36.8125 39.9375 39C39.9375 41.25 38.1875 43 35.9375 43C33.75 43 32 41.25 32 39ZM36.9375 39C36.9375 38.5 36.5 38.0625 36 38.0625C35.4375 38.0625 35 38.5 35 39C35 39.5625 35.4375 40 36 40C36.5 40 36.9375 39.5625 36.9375 39ZM23.4375 45C25.9375 45 28 47.125 28 49.6875C28 50.4375 27.375 51 26.6875 51H17.25C16.5625 51 16 50.4375 16 49.6875C16 47.125 18 45 20.5 45H23.4375ZM18 39C18 36.8125 19.75 35.0625 22 35C24.1875 35.0625 25.9375 36.8125 25.9375 39C25.9375 41.25 24.1875 43 22 43C19.75 43 18 41.25 18 39ZM22.9375 39C22.9375 38.5 22.5 38.0625 22 38.0625C21.4375 38.0625 21 38.5 21 39C21 39.5625 21.4375 40 22 40C22.5 40 22.9375 39.5625 22.9375 39Z" fill="#C333E0"/>
</svg>
`,
      borderColor: 'purple',
      category: 'Cloud and Infrastructure',
      link: '/structured-engagement/teams-voice-in-a-box',
      linkText: 'View offer',
    },
    // Tab 3: Application Innovation
    {
      title: 'AI application modernization assessment',
      description:
        'Evaluate how AI and modern cloud services can enhance or modernize an existing application and get a prioritized, actionable roadmap for future development.',
      svgIcon: `<svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="70" height="70" rx="10.6667" fill="#1FB5DE" fill-opacity="0.1"/>
<path d="M32.5 19.3125C32.5625 19.125 32.75 19 33 19C33.1875 19 33.375 19.125 33.4375 19.3125L34.3125 21.6875L36.6875 22.5625C36.875 22.625 37 22.8125 37 23C37 23.25 36.875 23.4375 36.6875 23.5L34.3125 24.375L33.4375 26.6875C33.375 26.875 33.1875 27 33 27C32.75 27 32.5625 26.875 32.5 26.6875L31.625 24.375L29.25 23.5C29.0625 23.4375 29 23.25 29 23C29 22.8125 29.0625 22.625 29.25 22.5625L31.625 21.6875L32.5 19.3125ZM47.9375 19.9375L50.0625 22.0625C51.25 23.25 51.25 25.125 50.0625 26.3125L26.25 50.125C25.0625 51.3125 23.1875 51.3125 22 50.125L19.875 48C18.6875 46.8125 18.6875 44.9375 19.875 43.75L43.6875 19.9375C44.875 18.75 46.75 18.75 47.9375 19.9375ZM45.8125 22L38.9375 28.875L41.125 31.0625L47.9375 24.1875L45.8125 22ZM24.125 48L39 33.1875L36.8125 31L22 45.875L24.125 48ZM17.4375 26.375L21 25L22.3125 21.5C22.375 21.1875 22.6875 21 23 21C23.25 21 23.5625 21.1875 23.625 21.5L25 25L28.5 26.375C28.8125 26.4375 29 26.75 29 27C29 27.3125 28.8125 27.625 28.5 27.6875L25 29L23.625 32.5625C23.5625 32.8125 23.25 33 23 33C22.6875 33 22.375 32.8125 22.3125 32.5625L21 29L17.4375 27.6875C17.125 27.625 17 27.3125 17 27C17 26.75 17.125 26.4375 17.4375 26.375ZM39.4375 42.375L43 41L44.3125 37.5C44.375 37.1875 44.6875 37 45 37C45.25 37 45.5625 37.1875 45.625 37.5L47 41L50.5 42.375C50.8125 42.4375 51 42.75 51 43C51 43.3125 50.8125 43.625 50.5 43.6875L47 45L45.625 48.5625C45.5625 48.8125 45.25 49 45 49C44.6875 49 44.375 48.8125 44.3125 48.5625L43 45L39.4375 43.6875C39.125 43.625 39 43.3125 39 43C39 42.75 39.125 42.4375 39.4375 42.375Z" fill="#1FB5DE"/>
</svg>
`,
      borderColor: 'blue',
      category: 'Application Innovation',
      link: '/structured-engagement/ai-application-modernization-assessment',
      linkText: 'View offer',
    },
    {
      title: 'Copilot extensibility workshop',
      description:
        'Learn how to extend Microsoft Copilot for M365 using Azure AI, Power Platform, and custom APIs, with practical guidance for connecting Copilot to your business data.',
      svgIcon: `<svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="70" height="70" rx="10.6667" fill="#EDA956" fill-opacity="0.1"/>
<path d="M18.5 33C17.625 33 17 32.375 17 31.5V22.5C17 20.625 18.5625 19 20.5 19H49.5C51.375 19 53 20.625 53 22.5V31.5C53 32.375 52.3125 33 51.5 33C50.625 33 50 32.375 50 31.5V22.5C50 22.25 49.75 22 49.5 22H20.5C20.1875 22 20 22.25 20 22.5V31.5C20 32.375 19.3125 33 18.5 33ZM49 35C51.1875 35.0625 52.9375 36.8125 52.9375 39C52.9375 41.25 51.1875 43 49 43C46.75 43 45 41.25 45 39C45 36.8125 46.75 35.0625 49 35ZM49 40C49.5 40 49.9375 39.5625 49.9375 39C49.9375 38.5 49.5 38.0625 49 38.0625C48.4375 38.0625 48 38.5 48 39C48 39.5625 48.4375 40 49 40ZM36.4375 45C38.9375 45 41 47.125 41 49.6875C41 50.4375 40.375 51 39.6875 51H30.25C29.5625 51 29 50.4375 29 49.6875C29 47.125 31 45 33.5 45H36.4375ZM50.4375 45C52.9375 45 55 47.125 55 49.6875C55 50.4375 54.375 51 53.6875 51H44.25C43.5625 51 43 50.4375 43 49.6875C43 47.125 45 45 47.5 45H50.4375ZM31 39C31 36.8125 32.75 35.0625 35 35C37.1875 35.0625 38.9375 36.8125 38.9375 39C38.9375 41.25 37.1875 43 34.9375 43C32.75 43 31 41.25 31 39ZM35.9375 39C35.9375 38.5 35.5 38.0625 35 38.0625C34.4375 38.0625 34 38.5 34 39C34 39.5625 34.4375 40 35 40C35.5 40 35.9375 39.5625 35.9375 39ZM22.4375 45C24.9375 45 27 47.125 27 49.6875C27 50.4375 26.375 51 25.6875 51H16.25C15.5625 51 15 50.4375 15 49.6875C15 47.125 17 45 19.5 45H22.4375ZM17 39C17 36.8125 18.75 35.0625 21 35C23.1875 35.0625 24.9375 36.8125 24.9375 39C24.9375 41.25 23.1875 43 21 43C18.75 43 17 41.25 17 39ZM21.9375 39C21.9375 38.5 21.5 38.0625 21 38.0625C20.4375 38.0625 20 38.5 20 39C20 39.5625 20.4375 40 21 40C21.5 40 21.9375 39.5625 21.9375 39Z" fill="#EDA956"/>
</svg>
`,
      borderColor: 'orange',
      category: 'Application Innovation',
      link: '/structured-engagement/copilot-extensibility-workshop',
      linkText: 'View offer',
    },
    {
      title: 'Custom Copilot development',
      description:
        'Build tailored Copilot experiences that integrate business logic, domain knowledge, and data so tasks to create differentiated, context-specific AI experiences for your team.',
      svgIcon: `<svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="70" height="70" rx="10.6667" fill="#46DE9C" fill-opacity="0.16"/>
<path d="M19 45C19 44.1875 19.625 43.5 20.5 43.5H24.1875C24.8125 41.5 26.75 40 29 40C31.1875 40 33.125 41.5 33.75 43.5H49.5C50.3125 43.5 51 44.1875 51 45C51 45.875 50.3125 46.5 49.5 46.5H33.75C33.125 48.5625 31.1875 50 29 50C26.75 50 24.8125 48.5625 24.1875 46.5H20.5C19.625 46.5 19 45.875 19 45ZM31 45C31 43.9375 30.0625 43 29 43C27.875 43 27 43.9375 27 45C27 46.125 27.875 47 29 47C30.0625 47 31 46.125 31 45ZM41 30C43.1875 30 45.125 31.5 45.75 33.5H49.5C50.3125 33.5 51 34.1875 51 35C51 35.875 50.3125 36.5 49.5 36.5H45.75C45.125 38.5625 43.1875 40 41 40C38.75 40 36.8125 38.5625 36.1875 36.5H20.5C19.625 36.5 19 35.875 19 35C19 34.1875 19.625 33.5 20.5 33.5H36.1875C36.8125 31.5 38.75 30 41 30ZM43 35C43 33.9375 42.0625 33 41 33C39.875 33 39 33.9375 39 35C39 36.125 39.875 37 41 37C42.0625 37 43 36.125 43 35ZM49.5 23.5C50.3125 23.5 51 24.1875 51 25C51 25.875 50.3125 26.5 49.5 26.5H35.75C35.125 28.5625 33.1875 30 31 30C28.75 30 26.8125 28.5625 26.1875 26.5H20.5C19.625 26.5 19 25.875 19 25C19 24.1875 19.625 23.5 20.5 23.5H26.1875C26.8125 21.5 28.75 20 31 20C33.1875 20 35.125 21.5 35.75 23.5H49.5ZM29 25C29 26.125 29.875 27 31 27C32.0625 27 33 26.125 33 25C33 23.9375 32.0625 23 31 23C29.875 23 29 23.9375 29 25Z" fill="#46DE9C"/>
</svg>
`,
      borderColor: 'green',
      category: 'Application Innovation',
      link: '/structured-engagement/custom-copilot-development',
      linkText: 'View offer',
    },
    {
      title: 'AI agent in a day workshop',
      description:
        'Explore real-world use cases for AI agents and create an early prototype in a focused session that brings clarity to design, capability, and potential impact.',
      svgIcon: `<svg width="33" height="32" viewBox="0 0 33 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M32 17.1875C32.5625 18.5625 31.625 20 30 20H28.0625V24.0625C28.0625 26.25 26.3125 28 24.125 28H22.125V30.5625C22.125 31.375 21.5 32 20.625 32C19.8125 32 19.125 31.375 19.125 30.5V25H24.125C24.6875 25 25.125 24.5625 25.125 24V17H28.6875C28.3125 16 27.875 14.875 27.5 13.625C26.625 11.375 25.6875 8.25 24.9375 7.25C23.125 4.625 20 3 16.8125 3H14.6875V6.1875C17.8125 6.875 20.1875 9.6875 20.1875 13C20.1875 16.875 16.9375 20 13.125 20C9.25 20 6.125 16.875 6.125 13C6.125 9.6875 8.5 6.875 11.6875 6.1875V3.0625C8.5 3.375 5.5625 5.125 4.125 7.9375C2.25 11.75 3.25 16.0625 6.1875 18.75L7.125 19.625V30.5625C7.125 31.375 6.5 32 5.6875 32C4.8125 32 4.1875 31.375 4.1875 30.5V20.9375C1.625 18.6875 0 15.3125 0.1875 11.5625C0.4375 5.0625 6.125 0 12.6875 0H16.8125C21.0625 0 25 2.125 27.4375 5.5625C28.9375 7.75 30.6875 14.25 32 17.1875ZM17.1875 13C17.1875 10.8125 15.375 9 13.1875 9C10.9375 9 9.1875 10.8125 9.1875 13C9.1875 15.25 10.9375 17 13.1875 17C15.375 17 17.1875 15.25 17.1875 13ZM11.125 13C11.125 11.9375 12 11 13.125 11C14.1875 11 15.125 11.9375 15.125 13C15.125 14.125 14.1875 15 13.125 15C12 15 11.125 14.125 11.125 13Z" fill="#C333E0"/>
</svg>

`,
      borderColor: 'purple',
      category: 'Application Innovation',
      link: '/structured-engagement/ai-agent-in-a-day-workshop',
      linkText: 'View offer',
    },
    // Tab 4: High Performance Computing (HPC)
    {
      title: 'Azure HPC core POC',
      description:
        'A guided introduction to Azure HPC designed for lightweight workloads, helping teams experience cloud-based performance with validating early technical decisions.',
      svgIcon: `<svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="70" height="70" rx="10.6667" fill="#1FB5DE" fill-opacity="0.1"/>
<path d="M33.4375 19.375C33.9375 19.125 34.4375 19 35 19C35.5 19 36 19.125 36.5 19.375L49.625 24.9375C50.4375 25.3125 51 26.125 51 27C51 27.9375 50.4375 28.75 49.625 29.125L36.5 34.6875C36 34.9375 35.5 35 35 35C34.4375 35 33.9375 34.9375 33.4375 34.6875L20.3125 29.125C19.5 28.75 19 27.9375 19 27C19 26.125 19.5 25.3125 20.3125 24.9375L33.4375 19.375ZM35 22C34.8125 22 34.6875 22.0625 34.625 22.125L23.125 27L34.625 31.9375C34.6875 32 34.8125 32 35 32C35.125 32 35.25 32 35.3125 31.9375L46.8125 27L35.3125 22.125C35.25 22.0625 35.125 22 35 22ZM34.625 39.9375C34.6875 40 34.8125 40 35 40C35.125 40 35.25 40 35.3125 39.9375L47.25 34.875C46.9375 34.4375 46.875 33.875 47.125 33.375C47.5 32.625 48.375 32.3125 49.125 32.6875L49.6875 33C50.5 33.375 51 34.125 51 35C51 35.9375 50.4375 36.75 49.5625 37.125L36.5 42.6875C36 42.9375 35.5 43 35 43C34.4375 43 33.9375 42.9375 33.4375 42.6875L20.375 37.125C19.5 36.75 19 35.9375 19 34.9375C19 34.1875 19.3125 33.5 19.9375 33.0625L20.625 32.5625C21.25 32.125 22.1875 32.25 22.6875 32.9375C23.125 33.5 23.0625 34.3125 22.5625 34.8125L34.625 39.9375ZM22.6875 40.9375C23.125 41.5 23.0625 42.3125 22.5625 42.8125L34.625 47.9375C34.6875 48 34.8125 48 35 48C35.125 48 35.25 48 35.3125 47.9375L47.25 42.875C46.9375 42.4375 46.875 41.875 47.125 41.375C47.5 40.625 48.375 40.3125 49.125 40.6875L49.6875 41C50.5 41.375 51 42.125 51 43C51 43.9375 50.4375 44.75 49.5625 45.125L36.5 50.6875C36 50.9375 35.5 51 35 51C34.4375 51 33.9375 50.9375 33.4375 50.6875L20.375 45.125C19.5 44.75 19 43.9375 19 42.9375C19 42.1875 19.3125 41.5 19.9375 41.0625L20.625 40.5625C21.25 40.125 22.1875 40.25 22.6875 40.9375Z" fill="#1FB5DE"/>
</svg>
`,
      borderColor: 'blue',
      category: 'High Performance Computing (HPC)',
      link: '/structured-engagement/azure-hpc-core-poc',
      linkText: 'View offer',
    },
    {
      title: 'Copilot extensibility workshop',
      description:
        'A real-scale HPC proof of concept that introduces advanced scheduling, core configuration, and higher performance configurations for growing computational needs.',
      svgIcon: `<svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="70" height="70" rx="10.6667" fill="#EDA956" fill-opacity="0.1"/>
<path d="M45 19C47.1875 19 49 20.8125 49 23V47C49 49.25 47.1875 51 45 51H25C22.75 51 21 49.25 21 47V23C21 20.8125 22.75 19 25 19H45ZM45 48C45.5 48 46 47.5625 46 47V36.5H24V47C24 47.5625 24.4375 48 25 48H45ZM46 33.5V23C46 22.5 45.5 22 45 22H25C24.4375 22 24 22.5 24 23V33.5H46ZM29 29.5C28.4375 29.5 28 29.0625 28 28.5V27C28 25.9375 28.875 25 30 25H40C41.0625 25 42 25.9375 42 27V28.5C42 29.0625 41.5 29.5 41 29.5H40C39.4375 29.5 39 29.0625 39 28.5V28H31V28.5C31 29.0625 30.5 29.5 30 29.5H29ZM29 44.5C28.4375 44.5 28 44.0625 28 43.5V42C28 40.9375 28.875 40 30 40H40C41.0625 40 42 40.9375 42 42V43.5C42 44.0625 41.5 44.5 41 44.5H40C39.4375 44.5 39 44.0625 39 43.5V43H31V43.5C31 44.0625 30.5 44.5 30 44.5H29Z" fill="#EDA956"/>
</svg>
`,
      borderColor: 'orange',
      category: 'High Performance Computing (HPC)',
      link: '/structured-engagement/azure-hpc-pro-poc',
      linkText: 'View offer',
    },
    {
      title: 'Azure HPC max POC',
      description:
        'A full scale Azure HPC proof of concept built for demanding workloads including virtualization, engineering, and AI to testing large-scale performance and efficiency.',
      svgIcon: `<svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="70" height="70" rx="10.6667" fill="#46DE9C" fill-opacity="0.16"/>
<path d="M26.5 19H35.5C36.3125 19 37 19.6875 37 20.5V29.5C37 30.375 36.3125 31 35.5 31C34.625 31 34 30.375 34 29.5V24.125L19.5 38.5625C18.9375 39.1875 18 39.1875 17.4375 38.5625C16.8125 38 16.8125 37.0625 17.4375 36.4375L31.875 22H26.5C25.625 22 25 21.375 25 20.5C25 19.6875 25.625 19 26.5 19ZM53 24C53 25.6875 51.625 27 50 27C48.3125 27 47 25.6875 47 24C47 22.375 48.3125 21 50 21C51.625 21 53 22.375 53 24ZM45 32C45 33.6875 43.625 35 42 35C40.3125 35 39 33.6875 39 32C39 30.375 40.3125 29 42 29C43.625 29 45 30.375 45 32ZM39 40C39 38.375 40.3125 37 42 37C43.625 37 45 38.375 45 40C45 41.6875 43.625 43 42 43C40.3125 43 39 41.6875 39 40ZM45 48C45 49.6875 43.625 51 42 51C40.3125 51 39 49.6875 39 48C39 46.375 40.3125 45 42 45C43.625 45 45 46.375 45 48ZM53 48C53 49.6875 51.625 51 50 51C48.3125 51 47 49.6875 47 48C47 46.375 48.3125 45 50 45C51.625 45 53 46.375 53 48ZM31 40C31 38.375 32.3125 37 34 37C35.625 37 37 38.375 37 40C37 41.6875 35.625 43 34 43C32.3125 43 31 41.6875 31 40ZM37 48C37 49.6875 35.625 51 34 51C32.3125 51 31 49.6875 31 48C31 46.375 32.3125 45 34 45C35.625 45 37 46.375 37 48ZM23 48C23 46.375 24.3125 45 26 45C27.625 45 29 46.375 29 48C29 49.6875 27.625 51 26 51C24.3125 51 23 49.6875 23 48ZM53 40C53 41.6875 51.625 43 50 43C48.3125 43 47 41.6875 47 40C47 38.375 48.3125 37 50 37C51.625 37 53 38.375 53 40ZM47 32C47 30.375 48.3125 29 50 29C51.625 29 53 30.375 53 32C53 33.6875 51.625 35 50 35C48.3125 35 47 33.6875 47 32Z" fill="#46DE9C"/>
</svg>
`,
      borderColor: 'green',
      category: 'High Performance Computing (HPC)',
      link: '/structured-engagement/azure-hpc-max-poc',
      linkText: 'View offer',
    },
    {
      title: 'Azure HPC migration assessment',
      description:
        'Evaluate your existing HPC environment and receive a tailored migration path that includes performance modeling, cost projections and a practical rollout timeline.',
      svgIcon: `<svg width="72" height="70" viewBox="0 0 72 70" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="72" height="70" rx="10.6667" fill="#C333E0" fill-opacity="0.16"/>
<path d="M19.5 33C18.625 33 18 32.375 18 31.5V22.5C18 20.625 19.5625 19 21.5 19H50.5C52.375 19 54 20.625 54 22.5V31.5C54 32.375 53.3125 33 52.5 33C51.625 33 51 32.375 51 31.5V22.5C51 22.25 50.75 22 50.5 22H21.5C21.1875 22 21 22.25 21 22.5V31.5C21 32.375 20.3125 33 19.5 33ZM50 35C52.1875 35.0625 53.9375 36.8125 53.9375 39C53.9375 41.25 52.1875 43 50 43C47.75 43 46 41.25 46 39C46 36.8125 47.75 35.0625 50 35ZM50 40C50.5 40 50.9375 39.5625 50.9375 39C50.9375 38.5 50.5 38.0625 50 38.0625C49.4375 38.0625 49 38.5 49 39C49 39.5625 49.4375 40 50 40ZM37.4375 45C39.9375 45 42 47.125 42 49.6875C42 50.4375 41.375 51 40.6875 51H31.25C30.5625 51 30 50.4375 30 49.6875C30 47.125 32 45 34.5 45H37.4375ZM51.4375 45C53.9375 45 56 47.125 56 49.6875C56 50.4375 55.375 51 54.6875 51H45.25C44.5625 51 44 50.4375 44 49.6875C44 47.125 46 45 48.5 45H51.4375ZM32 39C32 36.8125 33.75 35.0625 36 35C38.1875 35.0625 39.9375 36.8125 39.9375 39C39.9375 41.25 38.1875 43 35.9375 43C33.75 43 32 41.25 32 39ZM36.9375 39C36.9375 38.5 36.5 38.0625 36 38.0625C35.4375 38.0625 35 38.5 35 39C35 39.5625 35.4375 40 36 40C36.5 40 36.9375 39.5625 36.9375 39ZM23.4375 45C25.9375 45 28 47.125 28 49.6875C28 50.4375 27.375 51 26.6875 51H17.25C16.5625 51 16 50.4375 16 49.6875C16 47.125 18 45 20.5 45H23.4375ZM18 39C18 36.8125 19.75 35.0625 22 35C24.1875 35.0625 25.9375 36.8125 25.9375 39C25.9375 41.25 24.1875 43 22 43C19.75 43 18 41.25 18 39ZM22.9375 39C22.9375 38.5 22.5 38.0625 22 38.0625C21.4375 38.0625 21 38.5 21 39C21 39.5625 21.4375 40 22 40C22.5 40 22.9375 39.5625 22.9375 39Z" fill="#C333E0"/>
</svg>
`,
      borderColor: 'purple',
      category: 'High Performance Computing (HPC)',
      link: '/structured-engagement/azure-hpc-migration-assessment',
      linkText: 'View offer',
    },
  ],
  cta: {
    text: 'View all offers',
    link: '/structured-engagement',
  },
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
      transition('* => *', [
        query(
          ':leave',
          [
            stagger(35, [
              animate(
                '160ms ease-out',
                style({ opacity: 0, transform: 'translateY(-4px)' }),
              ),
            ]),
          ],
          { optional: true },
        ),
        query(
          ':enter',
          [
            style({ opacity: 0, transform: 'translateY(6px)' }),
            stagger(45, [
              animate(
                '220ms cubic-bezier(0.4, 0, 0.2, 1)',
                style({ opacity: 1, transform: 'translateY(0)' }),
              ),
            ]),
          ],
          { optional: true },
        ),
      ]),
    ]),
  ],
})
export class StructuredEngagementsSectionComponent
  implements AfterViewInit, OnDestroy {
  readonly section = input.required<StructuredEngagementsSection>();

  @ViewChild('tabList', { static: false }) tabList?: ElementRef<HTMLDivElement>;
  @ViewChildren('tabButton') tabButtons?: QueryList<
    ElementRef<HTMLButtonElement>
  >;

  private readonly platformId = inject(PLATFORM_ID);
  private readonly sanitizer = inject(DomSanitizer);
  private viewReady = false;
  private userSelectedTab = false; // Track if user manually selected a tab
  private tabSwitchTimeout?: ReturnType<typeof setTimeout>;

  readonly underlineLeft = signal(0);
  readonly underlineWidth = signal(0);
  readonly underlineVisible = signal(false);
  readonly activeTab = signal<string | null>(null);
  readonly displayedTab = signal<string | null>(null);
  readonly cardsVisible = signal(true);
  readonly animationKey = signal(0);

  // Computed property to filter offers by active tab
  readonly filteredOffers = computed(() => {
    const active = this.displayedTab();
    const allOffers = DEFAULT_STRUCTURED_ENGAGEMENTS_DATA.offers ?? [];

    console.log('Active tab:', active);
    console.log('All offers:', allOffers.length);

    if (!active) {
      return allOffers.length > 0 ? allOffers : [];
    }

    // Filter offers by category matching the active tab (case-insensitive)
    const filtered = allOffers.filter((offer) => {
      const match =
        offer.category?.trim().toLowerCase() === active.trim().toLowerCase();
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

      console.log(this.section(),"this.section()")

      // Only set from input if user hasn't manually selected a tab
      if (!this.userSelectedTab) {
        if (incomingActive && incomingActive !== current) {
          this.activeTab.set(incomingActive);
          this.displayedTab.set(incomingActive);
        } else if (!incomingActive && !current && tabs.length > 0) {
          const firstTab = tabs[0] ?? null;
          this.activeTab.set(firstTab);
          this.displayedTab.set(firstTab);
        }
      }

      if (this.viewReady) {
        queueMicrotask(() => this.updateUnderline());
      }
    });
  }

  ngAfterViewInit() {
    this.viewReady = true;
    console.log(this.section(),"section")
    if (isPlatformBrowser(this.platformId)) {
      this.updateUnderline();
      window.addEventListener('resize', this.updateUnderline, {
        passive: true,
      });
    }

    if (this.tabButtons) {
      this.tabButtons.changes.subscribe(() => {
        queueMicrotask(() => this.updateUnderline());
      });
    }
  }

  ngOnDestroy() {
    if (this.tabSwitchTimeout) {
      clearTimeout(this.tabSwitchTimeout);
    }
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
    const activeButton = this.tabButtons.find((btn) => {
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
    return typeof borderColor === 'string'
      ? borderColor.trim().toLowerCase()
      : '';
  }

  getOfferCardClasses(
    borderColor?: string,
    index?: number,
  ): Record<string, boolean> {
    const c = this.normalizeBorderColor(borderColor);
    const cardPosition = typeof index === 'number' ? index % 4 : -1;
    return {
      'hover:shadow-blue-500/30': c === 'blue',
      'hover:shadow-orange-500/30': c === 'orange',
      'hover:shadow-green-500/30': c === 'green',
      'hover:shadow-purple-500/30': c === 'purple',
      'lg:-translate-y-8': typeof index === 'number' ? index % 2 === 0 : false,
      'lg:translate-y-8': typeof index === 'number' ? index % 2 !== 0 : false,
      'structured-engagements__card--pos-1': cardPosition === 0,
      'structured-engagements__card--pos-2': cardPosition === 1,
      'structured-engagements__card--pos-3': cardPosition === 2,
      'structured-engagements__card--pos-4': cardPosition === 3,
    };
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

  getSafeSvgIcon(svg?: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svg ?? '');
  }

  /** Solo la clase de fondo del contenedor del icono (para combinar con w-[50px]      , etc.). */
  getOfferIconBgClass(borderColor?: string): string {
    switch (this.normalizeBorderColor(borderColor)) {
      case 'blue':
        return 'bg-blue-500/20';
      case 'orange':
        return 'bg-orange-500/20';
      case 'green':
        return 'bg-green-500/20';
      case 'purple':
        return 'bg-purple-500/20';
      default:
        return 'bg-purple-500/20';
    }
  }

  getTabClasses(tab: string, activeTab?: string): string {
    // Case-insensitive comparison for tab selection
    const isActive =
      tab?.trim().toLowerCase() === activeTab?.trim().toLowerCase();
    return isActive
      ? 'text-[#32A3FA] pb-2 transition-colors duration-200'
      : 'text-white/70 pb-2 hover:text-white transition-colors duration-200';
  }

  onTabClick(tab: string) {
    if (
      tab?.trim().toLowerCase() ===
      (this.activeTab() ?? '').trim().toLowerCase()
    ) {
      return;
    }

    this.userSelectedTab = true; // Mark that user has manually selected a tab
    this.activeTab.set(tab);
    this.tabSelect.emit(tab);

    if (!isPlatformBrowser(this.platformId)) {
      this.displayedTab.set(tab);
      return;
    }

    this.cardsVisible.set(false);
    if (this.tabSwitchTimeout) {
      clearTimeout(this.tabSwitchTimeout);
    }

    this.tabSwitchTimeout = setTimeout(() => {
      this.displayedTab.set(tab);
      this.animationKey.update((value) => value + 1);
      this.cardsVisible.set(true);
      this.tabSwitchTimeout = undefined;
    }, 180);

    if (this.viewReady) {
      queueMicrotask(() => this.updateUnderline());
    }
  }

  /** Título para mostrar (string o line1 + line2). */
  getTitle(section: StructuredEngagementsSection): string {
    const t = section?.title;
    if (typeof t === 'string') return t;
    if (t && typeof t === 'object')
      return [t.line1, t.line2].filter(Boolean).join(' ') || '';
    return '';
  }
}
