import { inject, Injectable, DOCUMENT, isDevMode } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

export interface SeoMetaConfig {
  /** Título de la página (para <title> y og:title) */
  title: string;
  /** Descripción meta (para description, og:description, twitter:description) */
  description: string;
  /** URL canónica de la página (ej: / o /services/data-and-ai) */
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
  /** Keyphrase principal para incluir en description si no está presente (ej. primaryTag) */
  keyphrase?: string;
}

const BASE_URL = 'https://staging.oakwoodsystemsgroup.com';
const DEFAULT_TITLE = 'Microsoft Solutions Partner | Azure Consulting | St. Louis, MO';
const DEFAULT_DESCRIPTION = 'As a Microsoft Solutions Partner specializing in Azure Cloud services, we drive business innovation and modernization for our clients.';
const DEFAULT_KEYWORDS = 'Microsoft Solutions Partner, Azure Consulting, Azure Cloud services, St. Louis, Kansas City, cloud migration, Data & AI, Microsoft 365, Power BI, Azure Synapse, digital transformation, managed IT services';
const DEFAULT_OG_IMAGE = 'https://oakwoodsys.com/wp-content/uploads/2023/06/msft_solutions_partner_yoast_seo.png';

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

/** Trunca description a ~155 chars (Google). Corte en palabra. Incluye keyphrase si no está. */
function normalizeMetaDescription(description: string, keyphrase?: string): string {
  let text = description.trim();
  if (keyphrase?.trim() && !text.toLowerCase().includes(keyphrase.toLowerCase())) {
    text = `${keyphrase.trim()}. ${text}`;
  }
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

  /**
   * Actualiza título, meta tags, Open Graph y Twitter Cards.
   * Usar en ngOnInit o cuando cambie el contenido de la página.
   */
  updateMeta(config: SeoMetaConfig): void {
    const title = config.title || DEFAULT_TITLE;
    const rawDescription = config.description || DEFAULT_DESCRIPTION;
    const description = normalizeMetaDescription(rawDescription, config.keyphrase);
    const keywords = config.keywords ?? DEFAULT_KEYWORDS;
    const canonicalPath = config.canonicalPath ?? '/';
    const canonicalUrl = canonicalPath.startsWith('http') ? canonicalPath : `${BASE_URL}${canonicalPath.startsWith('/') ? '' : '/'}${canonicalPath}`;
    const image = config.image ?? DEFAULT_OG_IMAGE;
    const imageAlt = config.imageAlt;
    const imageWidth = config.imageWidth ?? 1200;
    const imageHeight = config.imageHeight ?? 675;
    const imageType = config.imageType ?? getImageTypeFromUrl(image);
    const ogType = config.ogType ?? 'website';

    this.titleService.setTitle(title);

    // Meta básicos
    this.metaService.updateTag({ name: 'description', content: description });
    this.metaService.updateTag({ name: 'keywords', content: keywords });

    // Open Graph
    this.metaService.updateTag({ property: 'og:locale', content: 'en_US' });
    this.metaService.updateTag({ property: 'og:type', content: ogType });
    this.metaService.updateTag({ property: 'og:title', content: title });
    this.metaService.updateTag({ property: 'og:description', content: description });
    this.metaService.updateTag({ property: 'og:url', content: canonicalUrl });
    this.metaService.updateTag({ property: 'og:site_name', content: DEFAULT_TITLE });
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
      console.log('[SeoMeta] Actualizado:', { title, ogType, image, canonicalUrl, metaTags: metaObj });
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
  readonly baseUrl = BASE_URL;
  readonly defaultTitle = DEFAULT_TITLE;
  readonly defaultDescription = DEFAULT_DESCRIPTION;
  readonly defaultKeywords = DEFAULT_KEYWORDS;
}
