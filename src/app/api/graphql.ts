import { gql } from 'apollo-angular';

/**
 * Modelos y queries GraphQL para oakwoodsys.com/graphql (WPGraphQL + ACF).
 * Case Studies: caseStudies (lista), caseStudyBy(slug) (detalle).
 */

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
  testimonial?: CaseStudyTestimonial;
  relatedCaseStudies?: {
    nodes: RelatedCaseStudyNode[];
  };
  connectedServices?: ConnectedServiceItem[];
}

/** Nodo de case study en la lista (GetCaseStudies). */
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

/** Lista de case studies (para recursos / featured). */
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
