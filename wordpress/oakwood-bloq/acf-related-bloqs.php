<?php
/**
 * Registra el grupo de campos ACF para "Gen Content" (gen_content):
 *
 * Estructura JSON → ACF:
 * - showContactSection → show_contact_section (Boolean)
 * - relatedBloqs → related_bloqs (Relación múltiple a gen_content, filtrado por categoría blog)
 * - relatedCaseStudies → related_case_studies (Relación múltiple a gen_content, filtrado por categoría case-study)
 * - authorPerson → author_person (Post Object → person) — editable aquí.
 * Head (progresivo): oakwood_head_* (title, description, canonical) y oakwood_geo_* (region, placename, position) — para <head> en Headless (nombres propios para no chocar con Yoast/Rank Math).
 *
 * Nota: para compatibilidad con ACF Free, se usa `post_object` con selección múltiple.
 * author_person requiere que el CPT person (Oakwood People) exista.
 */

defined( 'ABSPATH' ) || exit;

function oakwood_bloq_register_acf_field_group() {
	if ( ! function_exists( 'acf_add_local_field_group' ) ) {
		return;
	}

	$fields = array(
		array(
			'key'           => 'field_oakwood_show_contact_section',
			'label'         => 'Show Contact Section',
			'name'          => 'show_contact_section',
			'type'          => 'true_false',
			'required'      => 0,
			'ui'            => 1,
			'default_value' => 0,
			'message'       => 'Show contact section on the page.',
		),
		array(
			'key'           => 'field_oakwood_related_bloqs',
			'label'         => 'Related Bloqs',
			'name'          => 'related_bloqs',
			'type'          => 'post_object',
			'required'      => 0,
			'post_type'     => array( 'gen_content' ),
			'return_format' => 'id',
			'multiple'      => 1,
			'allow_null'    => 0,
			'ui'            => 1,
			'instructions'  => 'Select related Gen Content with Blog category (only entries with blog category are listed).',
		),
		array(
			'key'           => 'field_oakwood_related_case_studies',
			'label'         => 'Related Case Studies',
			'name'          => 'related_case_studies',
			'type'          => 'post_object',
			'required'      => 0,
			'post_type'     => array( 'gen_content' ),
			'return_format' => 'id',
			'multiple'      => 1,
			'allow_null'    => 0,
			'ui'            => 1,
			'instructions'  => 'Select related Gen Content with Case Study category (only entries with case-study category are listed).',
		),
		// Head progresivo (fase 1): para <head> en Headless — nombres oakwood_* para no chocar con otros plugins SEO
		array(
			'key'           => 'field_oakwood_head_title',
			'label'         => 'Head Title',
			'name'          => 'oakwood_head_title',
			'type'          => 'text',
			'required'      => 0,
			'placeholder'   => 'Title for <title> (empty = post title)',
			'instructions'  => 'Optional. If empty, the post title will be used.',
		),
		array(
			'key'           => 'field_oakwood_head_description',
			'label'         => 'Head Description',
			'name'          => 'oakwood_head_description',
			'type'          => 'textarea',
			'required'      => 0,
			'rows'          => 3,
			'placeholder'   => 'Meta description (empty = post excerpt)',
			'instructions'  => 'Optional. If empty, the post excerpt will be used.',
		),
		array(
			'key'           => 'field_oakwood_head_canonical',
			'label'         => 'Head Canonical URL',
			'name'          => 'oakwood_head_canonical',
			'type'          => 'url',
			'required'      => 0,
			'placeholder'   => 'https://...',
			'instructions'  => 'Optional. If empty, the post URL will be used.',
		),
		// GEO (para meta geo y JSON-LD en Headless) — nombres oakwood_geo_*
		array(
			'key'           => 'field_oakwood_geo_region',
			'label'         => 'Geo Region',
			'name'          => 'oakwood_geo_region',
			'type'          => 'text',
			'required'      => 0,
			'placeholder'   => 'US-MO',
			'instructions'  => 'Geographic region (e.g. US-MO).',
		),
		array(
			'key'           => 'field_oakwood_geo_placename',
			'label'         => 'Geo Placename',
			'name'          => 'oakwood_geo_placename',
			'type'          => 'text',
			'required'      => 0,
			'placeholder'   => 'St. Louis',
			'instructions'  => 'Place name (e.g. St. Louis).',
		),
		array(
			'key'           => 'field_oakwood_geo_position',
			'label'         => 'Geo Position',
			'name'          => 'oakwood_geo_position',
			'type'          => 'text',
			'required'      => 0,
			'placeholder'   => '38.6270;-90.1994',
			'instructions'  => 'Lat;Long coordinates (separated by semicolon).',
		),
	);

	// Author Person: solo si existe el CPT person (Oakwood People).
	if ( post_type_exists( 'person' ) ) {
		$fields[] = array(
			'key'           => 'field_oakwood_gen_content_author_person',
			'label'         => 'Author Person',
			'name'          => 'author_person',
			'type'          => 'post_object',
			'post_type'     => array( 'person' ),
			'return_format' => 'object',
			'multiple'      => 0,
			'allow_null'    => 1,
			'ui'            => 1,
			'instructions'  => 'Optional: select a person as author. If set, it will be used instead of the WordPress author for display and in GraphQL.',
		);
	}

	acf_add_local_field_group(
		array(
			'key'      => 'group_oakwood_bloq_related',
			'title'    => 'Gen Content Settings',
			'fields'   => $fields,
			'location' => array(
				array(
					array(
						'param'    => 'post_type',
						'operator' => '==',
						'value'    => 'gen_content',
					),
				),
			),
			'position' => 'normal',
			'style'    => 'default',
		)
	);

	// Primary Tag: dropdown en sidebar (alternativa cuando Yoast no muestra el selector en block editor).
	acf_add_local_field_group(
		array(
			'key'      => 'group_oakwood_primary_tag',
			'title'    => 'Primary Tag',
			'fields'   => array(
				array(
					'key'           => 'field_oakwood_primary_tag',
					'label'         => 'Select the primary tag',
					'name'          => 'oakwood_primary_tag',
					'type'          => 'taxonomy',
					'taxonomy'      => 'gen_content_tag',
					'field_type'    => 'select',
					'return_format' => 'id',
					'multiple'      => 0,
					'allow_null'    => 1,
					'add_term'      => 0,
					'save_terms'    => 0,
					'load_terms'    => 0,
					'instructions'  => 'Choose which tag is primary for display (badge, SEO).',
				),
			),
			'location' => array(
				array(
					array(
						'param'    => 'post_type',
						'operator' => '==',
						'value'    => 'gen_content',
					),
				),
			),
			'position' => 'side',
			'style'    => 'default',
		)
	);
}
add_action( 'acf/init', 'oakwood_bloq_register_acf_field_group' );

/**
 * Filtra el selector de Related Bloqs: solo Gen Content con categoría "blog".
 */
function oakwood_bloq_filter_related_bloqs_query( $args, $field, $post_id ) {
	if ( ( $field['key'] ?? '' ) !== 'field_oakwood_related_bloqs' ) {
		return $args;
	}
	$args['tax_query'] = array(
		array(
			'taxonomy' => 'gen_content_category',
			'field'    => 'slug',
			'terms'    => 'blog',
		),
	);
	return $args;
}
add_filter( 'acf/fields/post_object/query/key=field_oakwood_related_bloqs', 'oakwood_bloq_filter_related_bloqs_query', 10, 3 );

/**
 * Filtra el selector de Related Case Studies: solo Gen Content con categoría "case-study".
 */
function oakwood_bloq_filter_related_case_studies_query( $args, $field, $post_id ) {
	if ( ( $field['key'] ?? '' ) !== 'field_oakwood_related_case_studies' ) {
		return $args;
	}
	$args['tax_query'] = array(
		array(
			'taxonomy' => 'gen_content_category',
			'field'    => 'slug',
			'terms'    => 'case-study',
		),
	);
	return $args;
}
add_filter( 'acf/fields/post_object/query/key=field_oakwood_related_case_studies', 'oakwood_bloq_filter_related_case_studies_query', 10, 3 );
