import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, DOCUMENT, isDevMode, PLATFORM_ID } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

import { serverSitePublicUrl } from '../config/site-public.config';
import { decodeHtmlEntities } from '../utils/cast';

export interface SeoMetaConfig {
  /** Título de la página (para <title> y og:title) */
  title: string;
  /** Descripción meta (para description, og:description, twitter:description) */
  description: string;
  /** URL canónica de la página (ej: / o /services/data-ai-solutions) */
  canonicalPath?: string;
  /** Imagen OG (por defecto: msft_solutions_partner). Debe ser URL absoluta. */
  image?: string;
  /** Alt de la imagen OG (og:image:alt, twitter:image:alt) */
  imageAlt?: string;
  /** Ancho de la imagen OG (default: 1200) */
  imageWidth?: number;
  /** Alto de la imagen OG (default: 675) */
  imageHeight?: number;
  /** Tipo de imagen OG (default: image/png) */
  imageType?: string;
  /** Tipo de contenido (default: website) */
  ogType?: 'website' | 'article';
  /** Keywords (opcional, usa default si no se pasa) */
  keywords?: string;
  /** true → emits <meta name="robots" content="noindex, nofollow">, overriding index.html's
   *  default "index, follow". Per-page opt-out (e.g. partner-only pages), not a sitewide flag. */
  noindex?: boolean;
}

const DEFAULT_TITLE = 'Microsoft Solutions Partner | Azure Consulting | St. Louis, MO';
const DEFAULT_DESCRIPTION = 'As a Microsoft Solutions Partner specializing in Azure Cloud services, we drive business innovation and modernization for our clients.';
const DEFAULT_KEYWORDS = 'Microsoft Solutions Partner, Azure Consulting, Azure Cloud services, St. Louis, Kansas City, cloud migration, Data & AI, Microsoft 365, Power BI, Azure Synapse, digital transformation, managed IT services';

/** Longitud recomendada para meta description (Google ~155 chars). */
const META_DESCRIPTION_MAX_LENGTH = 155;

function getImageTypeFromUrl(url: string): string {
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
  const mime: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    gif: 'image/gif',
    svg: 'image/svg+xml',
  };
  return mime[ext] ?? 'image/png';
}

/** Decodifica entidades HTML y elimina tags; trunca a ~155 chars (Google). */
function normalizeMetaDescription(description: string): string {
  let text = decodeHtmlEntities(description)
    .replace(/<[^>]*>/g, '')
    .trim();
  if (text.length <= META_DESCRIPTION_MAX_LENGTH) return text;
  const max = META_DESCRIPTION_MAX_LENGTH - 3;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  const end = lastSpace >= 80 ? lastSpace : max;
  return text.slice(0, end).trim() + '...';
}

@Injectable({ providedIn: 'root' })
export class SeoMetaService {
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  /** URL pública del sitio (og:url, canonical, compartir). Browser: `location.origin`. SSR: opcional `SITE_PUBLIC_URL` en Netlify. */
  private resolvePublicBaseUrl(): string {
    if (isPlatformBrowser(this.platformId)) {
      const origin = this.document.defaultView?.location?.origin?.replace(/\/$/, '');
      if (origin && /^https?:\/\//i.test(origin)) return origin;
    }
    return serverSitePublicUrl();
  }

  get baseUrl(): string {
    return this.resolvePublicBaseUrl();
  }

  /**
   * Actualiza título, meta tags, Open Graph y Twitter Cards.
   * Usar en ngOnInit o cuando cambie el contenido de la página.
   */
  updateMeta(config: SeoMetaConfig): void {
    const publicBase = this.resolvePublicBaseUrl();
    const title = config.title || DEFAULT_TITLE;
    const rawDescription = config.description || DEFAULT_DESCRIPTION;
    const description = normalizeMetaDescription(rawDescription);
    const keywords = config.keywords ?? DEFAULT_KEYWORDS;
    const canonicalPath = config.canonicalPath ?? '/';
    const canonicalUrl = canonicalPath.startsWith('http')
      ? canonicalPath
      : `${publicBase}${canonicalPath.startsWith('/') ? '' : '/'}${canonicalPath}`;
    const defaultOgImage = `${publicBase}/assets/og-image.png`;
    const image = config.image ?? defaultOgImage;
    const imageAlt = config.imageAlt;
    const imageWidth = config.imageWidth ?? 1200;
    const imageHeight = config.imageHeight ?? 675;
    const imageType = config.imageType ?? getImageTypeFromUrl(image);
    const ogType = config.ogType ?? 'website';

    this.titleService.setTitle(title);

    // Meta básicos
    this.metaService.updateTag({ name: 'description', content: description });
    this.metaService.updateTag({ name: 'keywords', content: keywords });

    // Robots: most pages should stay at index.html's default ("index, follow"), so an
    // explicit reset is needed here too — otherwise a noindex page followed by a client-side
    // navigation to a normal page would leave the tag stuck on noindex.
    this.metaService.updateTag({
      name: 'robots',
      content: config.noindex ? 'noindex, nofollow' : 'index, follow',
    });

    // Open Graph
    this.metaService.updateTag({ property: 'og:locale', content: 'en_US' });
    this.metaService.updateTag({ property: 'og:type', content: ogType });
    this.metaService.updateTag({ property: 'og:title', content: title });
    this.metaService.updateTag({ property: 'og:description', content: description });
    this.metaService.updateTag({ property: 'og:url', content: canonicalUrl });
    this.metaService.updateTag({ property: 'og:site_name', content: 'Oakwood Systems Group' });
    this.metaService.updateTag({ property: 'article:publisher', content: 'https://www.facebook.com/OakwoodSys/' });
    this.metaService.updateTag({ property: 'og:image', content: image });
    this.metaService.updateTag({ property: 'og:image:width', content: String(imageWidth) });
    this.metaService.updateTag({ property: 'og:image:height', content: String(imageHeight) });
    this.metaService.updateTag({ property: 'og:image:type', content: imageType });
    if (imageAlt) {
      this.metaService.updateTag({ property: 'og:image:alt', content: imageAlt });
    }

    // Twitter (summary_large_image requiere twitter:image para mostrar la imagen)
    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:site', content: '@OakwoodInsights' });
    this.metaService.updateTag({ name: 'twitter:title', content: title });
    this.metaService.updateTag({ name: 'twitter:description', content: description });
    this.metaService.updateTag({ name: 'twitter:image', content: image });
    if (imageAlt) {
      this.metaService.updateTag({ name: 'twitter:image:alt', content: imageAlt });
    }

    // Canonical
    this.setCanonical(canonicalUrl);

    // Debug: ver metadata actual en consola (solo en desarrollo)
    if (isDevMode()) {
      const metas = this.document.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"], meta[name="description"], meta[name="keywords"]');
      const metaObj: Record<string, string> = {};
      metas.forEach((m) => {
        const attr = m.getAttribute('property') ?? m.getAttribute('name') ?? 'unknown';
        metaObj[attr] = m.getAttribute('content') ?? '';
      });
    }
  }

  private setCanonical(url: string): void {
    const doc = this.document as Document;
    const head = doc.getElementsByTagName('head')[0];
    if (!head) return;

    let linkEl = doc.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!linkEl) {
      linkEl = doc.createElement('link');
      linkEl.setAttribute('rel', 'canonical');
      head.appendChild(linkEl);
    }
    linkEl.setAttribute('href', url);
  }

  /** Constantes para usar en otros componentes */
  readonly defaultTitle = DEFAULT_TITLE;
  readonly defaultDescription = DEFAULT_DESCRIPTION;
  readonly defaultKeywords = DEFAULT_KEYWORDS;
}
