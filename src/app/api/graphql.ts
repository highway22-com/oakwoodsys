import { gql } from 'apollo-angular';

/**
 * Modelos y queries GraphQL para oakwoodsys.com/graphql (WPGraphQL + ACF).
 * Bloqs y Case Studies (lista): misma lógica genContentCategory(id: $categoryId, idType: SLUG) — filtro "blog" o "case-study".
 * Case Studies (detalle): caseStudyBy(slug).
 * Oakwood CMS: cmsPage(slug) devuelve el JSON de la página (home, services, about-us, blog, industries).
 */

/** Nodo Gen Content en lista por categoría (blog o case-study). Incluye SEO/GEO para Headless. */
export interface GenContentListNode {
  id: string;
  title: string;
  content?: string;
  excerpt: string;
  slug: string;
  date: string;
  tags?: string[] | null;
  primaryTag?: string | null;
  featuredImage?: {
    node: { sourceUrl: string; altText?: string | null };
  } | null;
  author?: {
    node: { email?: string; firstName?: string; id: string };
  };
  authorPerson?: {
    id: string;
    name?: string | null;
    firstName?: string | null;
    position?: string | null;
    picture?: string | null;
    socialLinks?: Array<{ platform: string; url: string }>;
  } | null;
  genContentCategories?: {
    nodes: Array<{ name: string; slug: string }>;
  };
  /** Head (Gen Content ACF oakwood_* — no chocar con otros plugins SEO). */
  headTitle?: string | null;
  headDescription?: string | null;
  headCanonicalUrl?: string | null;
  /** GEO (oakwood_geo_*). */
  headGeoRegion?: string | null;
  headGeoPlacename?: string | null;
  headGeoPosition?: string | null;
  /** JSON-LD listo para <head>. */
  headJsonLdData?: string | null;
}

export interface GenContentsByCategoryResponse {
  genContentCategory?: {
    genContents?: { nodes: GenContentListNode[] };
  } | null;
}

/** Sección de una página CMS (propiedades comunes para el template; el resto es dinámico). */
export interface CmsSection {
  type: string;
  /** Título como string o como objeto con line1/line2 (ej. sección microsoftPartner). */
  title?: string | { line1?: string; line2?: string };
  description?: string | { line1?: string; line2?: string };
  label?: string;
  /** Subtítulo (ej. sección latestInsights). */
  subtitle?: string;
  /** CTA único (plano) o con primary/secondary según la sección. */
  cta?: {
    text?: string;
    link?: string;
    backgroundColor?: string;
    primary?: { text?: string; link?: string; backgroundColor?: string };
    secondary?: { text?: string; link?: string; backgroundColor?: string };
  };
  ctaSecondary?: { text?: string; link?: string; borderColor?: string };
  services?: Array<{ id?: number; title?: string; description?: string; link?: string; linkText?: string; icon?: string }>;
  image?: { url?: string; alt?: string };
  /** Logos/empresas en la sección "Trusted by" (trustedBy). */
  companies?: Array<{ name?: string; type?: string; subtitle?: string; tagline?: string; logo?: string; trademark?: string }>;
  /** Pestañas y ofertas en la sección "Structured engagements" (structuredEngagements). */
  tabs?: string[];
  activeTab?: string;
  offers?: Array<{ id?: number; title?: string; description?: string; link?: string; linkText?: string; borderColor?: string; icon?: string }>;
  /** Insignias en la sección "Microsoft Partner" (microsoftPartner). */
  badges?: Array<{ id?: number; title?: string; subtitle?: string }>;
  /** Artículos en la sección "Latest Insights" (latestInsights). */
  articles?: Array<{ id?: number; title?: string; link?: string; linkText?: string; readingTime?: string; image?: { url?: string; alt?: string }; tags?: string[] }>;
  [key: string]: unknown;
}

/** Contenido de una página CMS (Oakwood CMS, archivos JSON en WordPress). */
export interface CmsPageContent {
  page: string;
  videoUrls?: string[];
  sections: CmsSection[];
}

export interface CmsPageResponse {
  cmsPage?: { content: string | null } | null;
}

export interface FeaturedImageNode {
  node: {
    sourceUrl: string;
    altText?: string;
  };
}

export interface CaseStudyCategoryNode {
  name: string;
  slug: string;
}

/** Media ACF: conexión con node (sourceUrl, altText). */
export interface AcfMediaNode {
  node?: {
    sourceUrl?: string;
    altText?: string;
  };
}

/** Extrae la URL de un campo ACF media (string o AcfMediaNode). */
export function getAcfMediaUrl(value: string | AcfMediaNode | undefined): string | undefined {
  if (value == null) return undefined;
  if (typeof value === 'string') return value;
  return value?.node?.sourceUrl;
}

export interface CaseStudyTestimonial {
  testimonialCompany?: string;
  testimonialCompanyLogo?: string | AcfMediaNode;
  testimonialQuote?: string;
  testimonialAuthor?: string;
  testimonialRole?: string;
}

export interface RelatedCaseStudyNode {
  id: string;
  title: string;
  slug: string;
  date: string;
  excerpt: string;
  featuredImage?: {
    node: { sourceUrl: string };
  };
  caseStudyCategories?: {
    nodes: Array<{ name: string }>;
  };
}

export interface ConnectedServiceItem {
  serviceIcon?: string;
  serviceTitle?: string;
  serviceDescription?: string;
  serviceLink?: string;
  serviceSlug?: string;
}

/** Campos ACF expuestos por WPGraphQL como caseStudyDetails. Media fields use AcfMediaItemConnectionEdge (sub-selection). */
export interface CaseStudyDetails {
  heroImage?: string | AcfMediaNode;
  tags?: string[];
  overview?: string;
  businessChallenge?: string;
  solution?: string;
  solutionImage?: string | AcfMediaNode;
  /** HTML para tarjetas/listados (card_description en ACF). */
  cardDescription?: string;
  testimonial?: CaseStudyTestimonial;
  relatedCaseStudies?: {
    nodes: RelatedCaseStudyNode[];
  };
  connectedServices?: ConnectedServiceItem[];
}

/** Nodo de case study en la lista (GetCaseStudies o Gen Content category case-study). */
export interface CaseStudy {
  id: string;
  title: string;
  slug: string;
  date: string;
  excerpt: string;
  featuredImage?: FeaturedImageNode;
  caseStudyCategories?: {
    nodes: CaseStudyCategoryNode[];
  };
  caseStudyDetails?: CaseStudyDetails;
  /** Head cuando la lista viene de Gen Content (GET_GEN_CONTENTS_BY_CATEGORY). */
  headTitle?: string | null;
  headDescription?: string | null;
  headCanonicalUrl?: string | null;
  headGeoRegion?: string | null;
  headGeoPlacename?: string | null;
  headGeoPosition?: string | null;
  headJsonLdData?: string | null;
}

/** Case study con contenido completo (GetCaseStudyBySlug). */
export interface CaseStudyBy extends CaseStudy {
  content?: string;
  caseStudyDetails?: CaseStudyDetails & {
    relatedCaseStudies?: { nodes: RelatedCaseStudyNode[] };
    connectedServices?: ConnectedServiceItem[];
  };
}

export interface CaseStudiesResponse {
  caseStudies?: {
    nodes: CaseStudy[];
  };
}

export interface CaseStudyByResponse {
  caseStudyBy?: CaseStudyBy | null;
}

/** Versión ligera para búsqueda en navbar: solo id, title, excerpt, slug, imagen. Sin content ni autor. */
export const GET_GEN_CONTENTS_FOR_SEARCH = gql`
  query GetGenContentsForSearch($categoryId: ID!) {
    genContentCategory(id: $categoryId, idType: SLUG) {
      genContents(first: 100) {
        nodes {
          id
          title
          excerpt
          slug
          featuredImage {
            node {
              sourceUrl
              altText
            }
          }
        }
      }
    }
  }
`;

const GEN_CONTENTS_FIELDS = `
  id
  title
  content
  excerpt
  slug
  date
  tags
  primaryTag
  featuredImage {
    node {
      sourceUrl
      altText
    }
  }
  author {
    node {
      email
      firstName
      id
    }
  }
  authorPerson {
    id
    name
    firstName
    position
    picture
    socialLinks {
      platform
      url
    }
  }
  genContentCategories {
    nodes {
      name
      slug
    }
  }
  headTitle
  headDescription
  headCanonicalUrl
  headGeoRegion
  headGeoPlacename
  headGeoPosition
  headJsonLdData
`;

/** Lista por categoría Gen Content: mismo patrón para blog (categoryId: "blog") y case study (categoryId: "case-study"). id espera ID! en WPGraphQL. */
export const GET_GEN_CONTENTS_BY_CATEGORY = gql`
  query GetGenContentsByCategory($categoryId: ID!) {
    genContentCategory(id: $categoryId, idType: SLUG) {
      genContents(first: 500) {
        nodes {
          ${GEN_CONTENTS_FIELDS}
        }
      }
    }
  }
`;

/** Lista paginada por categoría (scroll infinito): first + after, pageInfo. */
export const GET_GEN_CONTENTS_BY_CATEGORY_PAGINATED = gql`
  query GetGenContentsByCategoryPaginated($categoryId: ID!, $first: Int!, $after: String) {
    genContentCategory(id: $categoryId, idType: SLUG) {
      genContents(first: $first, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          ${GEN_CONTENTS_FIELDS}
        }
      }
    }
  }
`;

/** Lista de case studies (legacy: preferir GET_GEN_CONTENTS_BY_CATEGORY con categoryId: "case-study"). */
export const GET_CASE_STUDIES = gql`
  query GetCaseStudies {
    caseStudies(first: 100) {
      nodes {
        id
        title
        slug
        date
        excerpt
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        caseStudyCategories {
          nodes {
            name
            slug
          }
        }
        caseStudyDetails {
          heroImage {
            node {
              sourceUrl
              altText
            }
          }
          tags
          cardDescription
        }
      }
    }
  }
`;

/** Varios Gen Content por slugs (para relatedBloqs: pedir datos por slugs sin list_of GenContent). */
export const GET_GEN_CONTENTS_BY_SLUGS = gql`
  query GetGenContentsBySlugs($slugs: [String]) {
    genContents(where: { nameIn: $slugs }, first: 20) {
      nodes {
        id
        title
        slug
        excerpt
        primaryTag
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
      }
    }
  }
`;

/** Un Gen Content por slug (para case studies que viven en Gen Content categoría case-study). Mismo patrón que GetBlogOrPost: id con idType SLUG. */
export const GET_GEN_CONTENT_BY_SLUG = gql`
  query GetGenContentBySlug($id: ID!) {
    genContent(id: $id, idType: SLUG) {
      id
      title
      slug
      date
      content
      excerpt
      tags
      primaryTag
      featuredImage {
        node {
          sourceUrl
          altText
        }
      }
      genContentCategories {
        nodes {
          name
          slug
        }
      }
      relatedCaseStudies {
        id
        title
        slug
        date
        excerpt
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        genContentCategories {
          nodes {
            name
          }
        }
      }
    }
  }
`;

/** Una sola petición: genContent + caseStudyBy (mismo patrón que GetBlogOrPost: $slug + $id). Prioridad genContent. */
export const GET_CASE_STUDY_DETAIL = gql`
  query GetCaseStudyDetail($slug: String!, $id: ID!) {
    genContent(id: $id, idType: SLUG) {
      id
      title
      content
      excerpt
      slug
      date
      tags
      primaryTag
      showContactSection
      featuredImage {
        node {
          sourceUrl
          altText
        }
      }
      author {
        node {
          email
          firstName
          id
        }
      }
      authorPerson {
        id
        name
        firstName
        position
        picture
      }
      headTitle
      headDescription
      headCanonicalUrl
      headGeoRegion
      headGeoPlacename
      headGeoPosition
      headJsonLdData
      genContentCategories {
        nodes {
          name
          slug
        }
      }
      relatedCaseStudies {
        id
        title
        slug
        date
        excerpt
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        genContentCategories {
          nodes {
            name
          }
        }
      }
    }
    caseStudyBy(slug: $slug) {
      id
      title
      slug
      date
      content
      excerpt
      featuredImage {
        node {
          sourceUrl
          altText
        }
      }
      caseStudyCategories {
        nodes {
          name
          slug
        }
      }
      caseStudyDetails {
        heroImage {
          node {
            sourceUrl
            altText
          }
        }
        tags
        cardDescription
        overview
        businessChallenge
        solution
        solutionImage {
          node {
            sourceUrl
            altText
          }
        }
        testimonial {
          testimonialCompany
          testimonialCompanyLogo {
            node {
              sourceUrl
              altText
            }
          }
          testimonialQuote
          testimonialAuthor
          testimonialRole
        }
        relatedCaseStudies {
          nodes {
            ... on CaseStudy {
              id
              title
              slug
              date
              excerpt
              featuredImage {
                node {
                  sourceUrl
                }
              }
              caseStudyCategories {
                nodes {
                  name
                }
              }
            }
          }
        }
        connectedServices {
          serviceIcon
          serviceTitle
          serviceDescription
          serviceLink
          serviceSlug
        }
      }
    }
  }
`;

export interface CaseStudyDetailResponse {
  genContent?: GenContentDetailNode | null;
  caseStudyBy?: CaseStudyBy | null;
}

/** Gen Content con relatedCaseStudies (para detalle por slug). */
export interface GenContentDetailNode extends GenContentListNode {
  relatedCaseStudies?: Array<{
    id: string;
    title: string;
    slug: string;
    date: string;
    excerpt: string;
    featuredImage?: { node: { sourceUrl: string; altText?: string | null } } | null;
    genContentCategories?: { nodes: Array<{ name: string }> };
  }> | null;
}

export interface GenContentBySlugResponse {
  genContent?: GenContentDetailNode | null;
}

/** Detalle de un case study por slug. */
export const GET_CASE_STUDY_BY_SLUG = gql`
  query GetCaseStudyBySlug($slug: String!) {
    caseStudyBy(slug: $slug) {
      id
      title
      slug
      date
      content
      excerpt
      featuredImage {
        node {
          sourceUrl
          altText
        }
      }
      caseStudyCategories {
        nodes {
          name
          slug
        }
      }
      caseStudyDetails {
        heroImage {
          node {
            sourceUrl
            altText
          }
        }
        tags
        cardDescription
        overview
        businessChallenge
        solution
        solutionImage {
          node {
            sourceUrl
            altText
          }
        }
        testimonial {
          testimonialCompany
          testimonialCompanyLogo {
            node {
              sourceUrl
              altText
            }
          }
          testimonialQuote
          testimonialAuthor
          testimonialRole
        }
        relatedCaseStudies {
          nodes {
            ... on CaseStudy {
              id
              title
              slug
              date
              excerpt
              featuredImage {
                node {
                  sourceUrl
                }
              }
              caseStudyCategories {
                nodes {
                  name
                }
              }
            }
          }
        }
        connectedServices {
          serviceIcon
          serviceTitle
          serviceDescription
          serviceLink
          serviceSlug
        }
      }
    }
  }
`;

/** Contenido de una página CMS por slug (Oakwood CMS: home.json, services.json, etc.). */
export const GET_CMS_PAGE = gql`
  query GetCmsPage($slug: String!) {
    cmsPage(slug: $slug) {
      content
    }
  }
`;

/** Item unificado para búsqueda (blog o case study): link, snippet, imagen. Búsqueda solo en título y excerpt. */
export interface SearchResultItem {
  type: 'blog' | 'case-study';
  id: string;
  title: string;
  slug: string;
  link: string;
  snippet: string;
  image: string;
}
