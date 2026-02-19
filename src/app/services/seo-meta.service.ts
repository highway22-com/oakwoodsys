import { inject, Injectable, DOCUMENT } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

export interface SeoMetaConfig {
  /** Título de la página (para <title> y og:title) */
  title: string;
  /** Descripción meta (para description, og:description, twitter:description) */
  description: string;
  /** URL canónica de la página (ej: / o /services/data-and-ai) */
  canonicalPath?: string;
  /** Imagen OG (por defecto: msft_solutions_partner) */
  image?: string;
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
}

const BASE_URL = 'https://oakwoodsystemsgroup.com';
const DEFAULT_TITLE = 'Microsoft Solutions Partner | Azure Consulting | St. Louis, MO';
const DEFAULT_DESCRIPTION = 'As a Microsoft Solutions Partner specializing in Azure Cloud services, we drive business innovation and modernization for our clients.';
const DEFAULT_KEYWORDS = 'Microsoft Solutions Partner, Azure Consulting, Azure Cloud services, St. Louis, Kansas City, cloud migration, Data & AI, Microsoft 365, Power BI, Azure Synapse, digital transformation, managed IT services';
const DEFAULT_OG_IMAGE = 'https://oakwoodsys.com/wp-content/uploads/2023/06/msft_solutions_partner_yoast_seo.png';

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
    const description = config.description || DEFAULT_DESCRIPTION;
    const keywords = config.keywords ?? DEFAULT_KEYWORDS;
    const canonicalPath = config.canonicalPath ?? '/';
    const canonicalUrl = canonicalPath.startsWith('http') ? canonicalPath : `${BASE_URL}${canonicalPath.startsWith('/') ? '' : '/'}${canonicalPath}`;
    const image = config.image ?? DEFAULT_OG_IMAGE;
    const imageWidth = config.imageWidth ?? 1200;
    const imageHeight = config.imageHeight ?? 675;
    const imageType = config.imageType ?? 'image/png';
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

    // Twitter
    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:site', content: '@OakwoodInsights' });
    this.metaService.updateTag({ name: 'twitter:title', content: title });
    this.metaService.updateTag({ name: 'twitter:description', content: description });

    // Canonical
    this.setCanonical(canonicalUrl);
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
