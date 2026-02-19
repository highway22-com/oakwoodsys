import {
  GET_GEN_CONTENTS_FOR_SEARCH,
  GET_GEN_CONTENTS_BY_CATEGORY,
  GET_GEN_CONTENTS_BY_TAG_AND_CATEGORY,
  GET_GEN_CONTENTS_BY_CATEGORY_PAGINATED,
  GET_CASE_STUDIES,
  GET_GEN_CONTENT_BY_SLUG,
  GET_CASE_STUDY_DETAIL,
  GET_CASE_STUDY_BY_SLUG,
  GET_CMS_PAGE,
  getAcfMediaUrl,
  getPrimaryTagName,
  type GenContentListNode,
  type GenContentsByCategoryResponse,
  type CaseStudyByResponse,
  type GenContentBySlugResponse,
  type CaseStudyDetailResponse,
  type CmsPageResponse,
} from './graphql';
import type { DocumentNode } from 'graphql';

/** Extrae el nombre de la operación y las variables de un DocumentNode. */
function getOperationInfo(doc: DocumentNode): { name: string; variables: string[] } {
  const def = doc.definitions?.[0];
  if (!def || def.kind !== 'OperationDefinition') {
    return { name: '', variables: [] };
  }
  const op = def as { name?: { value: string }; variableDefinitions?: Array<{ variable: { name: { value: string } } }> };
  const name = op.name?.value ?? '';
  const variables = (op.variableDefinitions ?? []).map((v) => v.variable.name.value);
  return { name, variables };
}

describe('GraphQL API (graphql.ts)', () => {
  describe('query documents', () => {
    it('exports valid DocumentNode for GET_GEN_CONTENTS_FOR_SEARCH', () => {
      expect(GET_GEN_CONTENTS_FOR_SEARCH).toBeDefined();
      expect(GET_GEN_CONTENTS_FOR_SEARCH.kind).toBe('Document');
      const { name, variables } = getOperationInfo(GET_GEN_CONTENTS_FOR_SEARCH);
      expect(name).toBe('GetGenContentsForSearch');
      expect(variables).toContain('categoryId');
    });

    it('exports valid DocumentNode for GET_GEN_CONTENTS_BY_CATEGORY', () => {
      expect(GET_GEN_CONTENTS_BY_CATEGORY).toBeDefined();
      expect(GET_GEN_CONTENTS_BY_CATEGORY.kind).toBe('Document');
      const { name, variables } = getOperationInfo(GET_GEN_CONTENTS_BY_CATEGORY);
      expect(name).toBe('GetGenContentsByCategory');
      expect(variables).toContain('categoryId');
    });

    it('exports valid DocumentNode for GET_GEN_CONTENTS_BY_TAG_AND_CATEGORY', () => {
      expect(GET_GEN_CONTENTS_BY_TAG_AND_CATEGORY).toBeDefined();
      expect(GET_GEN_CONTENTS_BY_TAG_AND_CATEGORY.kind).toBe('Document');
      const { name, variables } = getOperationInfo(GET_GEN_CONTENTS_BY_TAG_AND_CATEGORY);
      expect(name).toBe('GetGenContentsByTagAndCategory');
      expect(variables).toContain('tagSlug');
      expect(variables).toContain('categorySlug');
    });

    it('exports valid DocumentNode for GET_GEN_CONTENTS_BY_CATEGORY_PAGINATED', () => {
      expect(GET_GEN_CONTENTS_BY_CATEGORY_PAGINATED).toBeDefined();
      expect(GET_GEN_CONTENTS_BY_CATEGORY_PAGINATED.kind).toBe('Document');
      const { name, variables } = getOperationInfo(GET_GEN_CONTENTS_BY_CATEGORY_PAGINATED);
      expect(name).toBe('GetGenContentsByCategoryPaginated');
      expect(variables).toContain('categoryId');
      expect(variables).toContain('first');
      expect(variables).toContain('after');
    });

    it('exports valid DocumentNode for GET_CASE_STUDIES', () => {
      expect(GET_CASE_STUDIES).toBeDefined();
      expect(GET_CASE_STUDIES.kind).toBe('Document');
      const { name, variables } = getOperationInfo(GET_CASE_STUDIES);
      expect(name).toBe('GetCaseStudies');
      expect(variables.length).toBe(0);
    });

    it('exports valid DocumentNode for GET_GEN_CONTENT_BY_SLUG', () => {
      expect(GET_GEN_CONTENT_BY_SLUG).toBeDefined();
      expect(GET_GEN_CONTENT_BY_SLUG.kind).toBe('Document');
      const { name, variables } = getOperationInfo(GET_GEN_CONTENT_BY_SLUG);
      expect(name).toBe('GetGenContentBySlug');
      expect(variables).toContain('id');
    });

    it('exports valid DocumentNode for GET_CASE_STUDY_DETAIL', () => {
      expect(GET_CASE_STUDY_DETAIL).toBeDefined();
      expect(GET_CASE_STUDY_DETAIL.kind).toBe('Document');
      const { name, variables } = getOperationInfo(GET_CASE_STUDY_DETAIL);
      expect(name).toBe('GetCaseStudyDetail');
      expect(variables).toContain('slug');
      expect(variables).toContain('id');
    });

    it('exports valid DocumentNode for GET_CASE_STUDY_BY_SLUG', () => {
      expect(GET_CASE_STUDY_BY_SLUG).toBeDefined();
      expect(GET_CASE_STUDY_BY_SLUG.kind).toBe('Document');
      const { name, variables } = getOperationInfo(GET_CASE_STUDY_BY_SLUG);
      expect(name).toBe('GetCaseStudyBySlug');
      expect(variables).toContain('slug');
    });

    it('exports valid DocumentNode for GET_CMS_PAGE', () => {
      expect(GET_CMS_PAGE).toBeDefined();
      expect(GET_CMS_PAGE.kind).toBe('Document');
      const { name, variables } = getOperationInfo(GET_CMS_PAGE);
      expect(name).toBe('GetCmsPage');
      expect(variables).toContain('slug');
    });
  });

  describe('getAcfMediaUrl', () => {
    it('returns undefined for undefined', () => {
      expect(getAcfMediaUrl(undefined)).toBeUndefined();
    });

    it('returns undefined for null', () => {
      expect(getAcfMediaUrl(null as never)).toBeUndefined();
    });

    it('returns the string when given a string', () => {
      expect(getAcfMediaUrl('https://example.com/img.jpg')).toBe('https://example.com/img.jpg');
    });

    it('returns node.sourceUrl when given AcfMediaNode with node', () => {
      expect(
        getAcfMediaUrl({
          node: { sourceUrl: 'https://example.com/hero.png', altText: 'Hero' },
        })
      ).toBe('https://example.com/hero.png');
    });

    it('returns undefined when given AcfMediaNode without node', () => {
      expect(getAcfMediaUrl({})).toBeUndefined();
    });

    it('returns undefined when given AcfMediaNode with node but no sourceUrl', () => {
      expect(getAcfMediaUrl({ node: {} })).toBeUndefined();
    });
  });

  describe('getPrimaryTagName', () => {
    it('returns null for null/undefined', () => {
      expect(getPrimaryTagName(null)).toBeNull();
      expect(getPrimaryTagName(undefined)).toBeNull();
    });
    it('returns string when primaryTag is string', () => {
      expect(getPrimaryTagName('Data & AI')).toBe('Data & AI');
    });
    it('returns name when value is object with name', () => {
      expect(getPrimaryTagName({ name: 'Cloud', slug: 'cloud' })).toBe('Cloud');
    });
    it('returns null when object has no name', () => {
      expect(getPrimaryTagName({ slug: 'cloud' })).toBeNull();
    });
  });

  describe('response types (structure)', () => {
    it('GenContentsByCategoryResponse accepts valid shape', () => {
      const res: GenContentsByCategoryResponse = {
        genContentCategory: {
          genContents: {
            nodes: [
              {
                id: '1',
                title: 'Test',
                excerpt: '',
                slug: 'test',
                date: '2026-01-01',
              } as GenContentListNode,
            ],
          },
        },
      };
      expect(res.genContentCategory?.genContents?.nodes?.length).toBe(1);
    });

    it('CaseStudyByResponse accepts null caseStudyBy', () => {
      const res: CaseStudyByResponse = { caseStudyBy: null };
      expect(res.caseStudyBy).toBeNull();
    });

    it('GenContentBySlugResponse accepts null genContent', () => {
      const res: GenContentBySlugResponse = { genContent: null };
      expect(res.genContent).toBeNull();
    });

    it('CaseStudyDetailResponse accepts both genContent and caseStudyBy', () => {
      const res: CaseStudyDetailResponse = {
        genContent: null,
        caseStudyBy: null,
      };
      expect(res.genContent).toBeNull();
      expect(res.caseStudyBy).toBeNull();
    });

    it('CmsPageResponse accepts content string', () => {
      const res: CmsPageResponse = {
        cmsPage: { content: '{"page":"home","sections":[]}' },
      };
      expect(res.cmsPage?.content).toContain('"page"');
    });
  });
});
