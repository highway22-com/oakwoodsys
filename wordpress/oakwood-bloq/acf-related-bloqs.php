<?php
/**
 * Registra el grupo de campos ACF para "Gen Content" (gen_content):
 *
 * Estructura JSON → ACF:
 * - showContactSection → show_contact_section (Boolean)
 * - typeContent → type_content (Select)
 * - relatedBloqs → related_bloqs (Relación múltiple a gen_content, filtrado por categoría blog)
 * - relatedCaseStudies → related_case_studies (Relación múltiple a gen_content, filtrado por categoría case-study)
 * - tags → tags (Checkbox)
 * - primaryTag → primary_tag (Radio)
 * - authorPerson → author_person (Post Object → person) — editable aquí.
 * Head (progresivo): oakwood_head_* (title, description, canonical) y oakwood_geo_* (region, placename, position) — para <head> en Headless (nombres propios para no chocar con Yoast/Rank Math).
 *
 * Nota: para compatibilidad con ACF Free, se usa `post_object` con selección múltiple.
 * author_person requiere que el CPT person (Oakwood People) exista.
 */

defined( 'ABSPATH' ) || exit;

function oakwood_bloq_get_tag_choices() {
	return array(
		'Case Study'                   => 'Case Study',
		'HPC'                          => 'HPC',
		'Featured'                    => 'Featured',
		'Application Innovation'       => 'Application Innovation',
		'Data & AI'                    => 'Data & AI',
		'Data Center'                  => 'Data Center',
		'Modern Work'                  => 'Modern Work',
		'Managed Services'             => 'Managed Services',
		'IoT'                          => 'IoT',
		'Healthcare'                  => 'Healthcare',
		'Data Governance'             => 'Data Governance',
		'Security Blog'                => 'Security Blog',
		'Application Modernization Blog' => 'Application Modernization Blog',
		'Cloud and Infrastructure Blog' => 'Cloud and Infrastructure Blog',
		'Data and AI Blog'             => 'Data and AI Blog',
		'Microsoft 365 Blog'          => 'Microsoft 365 Blog',
		'Modern Work Blog'            => 'Modern Work Blog',
		'Uncategorized'               => 'Uncategorized',
	);
}

function oakwood_bloq_register_acf_field_group() {
	if ( ! function_exists( 'acf_add_local_field_group' ) ) {
		return;
	}

	$tag_choices = oakwood_bloq_get_tag_choices();

	$fields = array(
		array(
			'key'           => 'field_oakwood_show_contact_section',
			'label'         => 'Show Contact Section',
			'name'          => 'show_contact_section',
			'type'          => 'true_false',
			'required'      => 0,
			'ui'            => 1,
			'default_value' => 0,
			'message'       => 'Mostrar sección de contacto en la página.',
		),
		array(
			'key'           => 'field_oakwood_type_content',
			'label'         => 'Type Content',
			'name'          => 'type_content',
			'type'          => 'select',
			'required'      => 0,
			'choices'       => array(
				'blog'       => 'Blog',
				'case_study' => 'Case Study',
				'other'      => 'Other',
			),
			'default_value' => 'blog',
			'ui'            => 1,
			'return_format' => 'value',
			'instructions'  => 'Tipo de contenido para esta entrada (blog, case study u otro).',
		),
		array(
			'key'           => 'field_oakwood_gen_content_tags',
			'label'         => 'Tags',
			'name'          => 'tags',
			'type'          => 'checkbox',
			'choices'       => $tag_choices,
			'return_format' => 'value',
			'layout'        => 'vertical',
		),
		array(
			'key'               => 'field_oakwood_gen_content_primary_tag',
			'label'             => 'Primary Tag',
			'name'              => 'primary_tag',
			'type'              => 'radio',
			'choices'           => $tag_choices,
			'return_format'     => 'value',
			'layout'            => 'vertical',
			'allow_null'        => 1,
			'other_choice'      => 0,
			'save_other_choice' => 0,
			'instructions'      => 'Selecciona una tag principal (debe estar incluida en Tags).',
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
			'instructions'  => 'Selecciona Gen Content de categoría Blog relacionados (solo se listan entradas con categoría blog).',
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
			'instructions'  => 'Selecciona Gen Content de categoría Case Study relacionados (solo se listan entradas con categoría case-study).',
		),
		// Head progresivo (fase 1): para <head> en Headless — nombres oakwood_* para no chocar con otros plugins SEO
		array(
			'key'           => 'field_oakwood_head_title',
			'label'         => 'Head Title',
			'name'          => 'oakwood_head_title',
			'type'          => 'text',
			'required'      => 0,
			'placeholder'   => 'Título para <title> (vacío = título del post)',
			'instructions'  => 'Opcional. Si está vacío se usará el título del post.',
		),
		array(
			'key'           => 'field_oakwood_head_description',
			'label'         => 'Head Description',
			'name'          => 'oakwood_head_description',
			'type'          => 'textarea',
			'required'      => 0,
			'rows'          => 3,
			'placeholder'   => 'Meta description (vacío = extracto del post)',
			'instructions'  => 'Opcional. Si está vacío se usará el extracto del post.',
		),
		array(
			'key'           => 'field_oakwood_head_canonical',
			'label'         => 'Head Canonical URL',
			'name'          => 'oakwood_head_canonical',
			'type'          => 'url',
			'required'      => 0,
			'placeholder'   => 'https://...',
			'instructions'  => 'Opcional. Si está vacío se usará la URL del post.',
		),
		// GEO (para meta geo y JSON-LD en Headless) — nombres oakwood_geo_*
		array(
			'key'           => 'field_oakwood_geo_region',
			'label'         => 'Geo Region',
			'name'          => 'oakwood_geo_region',
			'type'          => 'text',
			'required'      => 0,
			'placeholder'   => 'US-MO',
			'instructions'  => 'Región geográfica (ej: US-MO).',
		),
		array(
			'key'           => 'field_oakwood_geo_placename',
			'label'         => 'Geo Placename',
			'name'          => 'oakwood_geo_placename',
			'type'          => 'text',
			'required'      => 0,
			'placeholder'   => 'St. Louis',
			'instructions'  => 'Nombre del lugar (ej: St. Louis).',
		),
		array(
			'key'           => 'field_oakwood_geo_position',
			'label'         => 'Geo Position',
			'name'          => 'oakwood_geo_position',
			'type'          => 'text',
			'required'      => 0,
			'placeholder'   => '38.6270;-90.1994',
			'instructions'  => 'Coordenadas Lat;Long (separadas por punto y coma).',
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
			'instructions'  => 'Opcional: selecciona una persona como autor. Si está definido, se usará en lugar del autor de WordPress para mostrar y en GraphQL.',
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
}
add_action( 'acf/init', 'oakwood_bloq_register_acf_field_group' );

/**
 * Forzar que type_content muestre "Blog" en lugar de "Bloq" (sobrescribe si ACF carga versión antigua desde DB).
 */
add_filter( 'acf/load_field/key=field_oakwood_type_content', function ( $field ) {
	$field['choices'] = array(
		'blog'       => 'Blog',
		'case_study' => 'Case Study',
		'other'      => 'Other',
	);
	$field['default_value'] = 'blog';
	return $field;
} );

/**
 * Validación ACF: la tag principal debe estar dentro del arreglo de tags seleccionadas.
 */
function oakwood_bloq_validate_primary_tag( $valid, $value, $field, $input ) {
	if ( $valid !== true ) {
		return $valid;
	}

	if ( isset( $_POST['post_type'] ) && sanitize_text_field( wp_unslash( $_POST['post_type'] ) ) !== 'gen_content' ) {
		return $valid;
	}

	$primary = is_scalar( $value ) ? (string) $value : '';
	$primary = trim( $primary );
	if ( $primary === '' ) {
		return $valid;
	}

	$tags = array();
	if ( isset( $_POST['acf'] ) && is_array( $_POST['acf'] ) && isset( $_POST['acf']['field_oakwood_gen_content_tags'] ) ) {
		$tags = wp_unslash( $_POST['acf']['field_oakwood_gen_content_tags'] ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
	}

	if ( ! is_array( $tags ) ) {
		$tags = array();
	}

	$tags = array_map(
		static function ( $t ) {
			return is_scalar( $t ) ? trim( (string) $t ) : '';
		},
		$tags
	);
	$tags = array_values( array_filter( $tags, static fn( $t ) => $t !== '' ) );

	if ( empty( $tags ) || ! in_array( $primary, $tags, true ) ) {
		return 'La tag principal debe estar incluida en el campo "Tags".';
	}

	return $valid;
}
add_filter( 'acf/validate_value/key=field_oakwood_gen_content_primary_tag', 'oakwood_bloq_validate_primary_tag', 10, 4 );

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
