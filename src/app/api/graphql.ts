import { gql } from 'apollo-angular';

/**
 * Modelos y queries GraphQL para oakwoodsys.com/graphql (WPGraphQL + ACF).
 * Bloqs y Case Studies (lista): misma lógica genContentCategory(id: $categoryId, idType: SLUG) — filtro "bloq" o "case-study".
 * Case Studies (detalle): caseStudyBy(slug).
 * Oakwood CMS: cmsPage(slug) devuelve el JSON de la página (home, services, about-us, bloq, industries).
 */

/** Nodo Gen Content en lista por categoría (bloq o case-study). Incluye SEO/GEO para Headless. */
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
  description?: string;
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

/** Lista por categoría Gen Content: mismo patrón para bloq (categoryId: "bloq") y case study (categoryId: "case-study"). id espera ID! en WPGraphQL. */
export const GET_GEN_CONTENTS_BY_CATEGORY = gql`
  query GetGenContentsByCategory($categoryId: ID!) {
    genContentCategory(id: $categoryId, idType: SLUG) {
      genContents(first: 100) {
        nodes {
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
