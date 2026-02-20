<?php
/**
 * GraphQL: Root queries para listar categorías y tags de Gen Content.
 * Expone genContentCategories y genContentTags para filtros, sidebars, etc.
 *
 * Formato: { nodes: [{ id, name, slug }] } para compatibilidad con el frontend.
 */

defined( 'ABSPATH' ) || exit;

/**
 * Registrar root queries para listar todas las categorías y tags de Gen Content.
 */
function oakwood_bloq_register_taxonomy_root_queries() {
	if ( ! function_exists( 'register_graphql_field' ) || ! function_exists( 'register_graphql_object_type' ) ) {
		return;
	}

	$term_type_config = array(
		'name'        => 'GenContentTaxonomyTerm',
		'description' => __( 'Término de taxonomía Gen Content (categoría o tag).', 'oakwood-blog' ),
		'fields'      => array(
			'id'   => array(
				'type'        => 'ID',
				'description' => __( 'Global ID del término.', 'oakwood-blog' ),
				'resolve'     => function ( $term ) {
					return $term ? ( 'term_' . $term->term_id ) : null;
				},
			),
			'name' => array(
				'type'        => 'String',
				'description' => __( 'Nombre del término.', 'oakwood-blog' ),
				'resolve'     => function ( $term ) {
					return $term ? $term->name : null;
				},
			),
			'slug' => array(
				'type'        => 'String',
				'description' => __( 'Slug del término.', 'oakwood-blog' ),
				'resolve'     => function ( $term ) {
					return $term ? $term->slug : null;
				},
			),
		),
	);

	$type_registry = \WPGraphQL::get_type_registry();
	if ( ! $type_registry->get_type( 'GenContentTaxonomyTerm' ) ) {
		register_graphql_object_type( 'GenContentTaxonomyTerm', $term_type_config );
	}

	$connection_config = array(
		'name'        => 'GenContentTaxonomyTermConnection',
		'description' => __( 'Conexión de términos de taxonomía Gen Content.', 'oakwood-blog' ),
		'fields'      => array(
			'nodes' => array(
				'type'        => array( 'list_of' => 'GenContentTaxonomyTerm' ),
				'description' => __( 'Lista de términos.', 'oakwood-blog' ),
				'resolve'     => function ( $source ) {
					return $source['nodes'] ?? array();
				},
			),
		),
	);

	if ( ! $type_registry->get_type( 'GenContentTaxonomyTermConnection' ) ) {
		register_graphql_object_type( 'GenContentTaxonomyTermConnection', $connection_config );
	}

	$fetch_categories = function ( $args ) {
		$terms = get_terms(
			array(
				'taxonomy'   => 'gen_content_category',
				'hide_empty' => false,
				'number'     => isset( $args['first'] ) ? (int) $args['first'] : 100,
				'orderby'    => 'name',
				'order'      => 'ASC',
			)
		);
		return is_wp_error( $terms ) ? array() : $terms;
	};

	$fetch_tags = function ( $args ) {
		$terms = get_terms(
			array(
				'taxonomy'   => 'gen_content_tag',
				'hide_empty' => false,
				'number'     => isset( $args['first'] ) ? (int) $args['first'] : 100,
				'orderby'    => 'name',
				'order'      => 'ASC',
			)
		);
		return is_wp_error( $terms ) ? array() : $terms;
	};

	// Nombres custom para evitar conflicto con queries que WPGraphQL pueda registrar automáticamente.
	register_graphql_field(
		'RootQuery',
		'genContentCategoriesList',
		array(
			'type'        => 'GenContentTaxonomyTermConnection',
			'description' => __( 'Lista de categorías de Gen Content (blog, case-study, etc.).', 'oakwood-blog' ),
			'args'        => array(
				'first' => array(
					'type'         => 'Int',
					'description' => __( 'Número máximo de términos a devolver.', 'oakwood-blog' ),
					'defaultValue' => 100,
				),
			),
			'resolve'     => function ( $source, $args ) use ( $fetch_categories ) {
				return array( 'nodes' => $fetch_categories( $args ) );
			},
		)
	);

	register_graphql_field(
		'RootQuery',
		'genContentTagsList',
		array(
			'type'        => 'GenContentTaxonomyTermConnection',
			'description' => __( 'Lista de tags de Gen Content (topic/industry).', 'oakwood-blog' ),
			'args'        => array(
				'first' => array(
					'type'         => 'Int',
					'description' => __( 'Número máximo de términos a devolver.', 'oakwood-blog' ),
					'defaultValue' => 100,
				),
			),
			'resolve'     => function ( $source, $args ) use ( $fetch_tags ) {
				return array( 'nodes' => $fetch_tags( $args ) );
			},
		)
	);
}
add_action( 'graphql_register_types', 'oakwood_bloq_register_taxonomy_root_queries', 20 );
