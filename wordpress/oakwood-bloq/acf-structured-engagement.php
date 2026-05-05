<?php
/**
 * Structured Engagement: ACF field group + WPGraphQL exposure.
 *
 * Estructura:
 * - Categoría dedicada `structured-engagement` (registrada en oakwood-bloq.php junto con blog y case-study).
 * - Grupo ACF `group_oakwood_structured_engagement` con tres campos:
 *     * duration  → text   (e.g. "4 weeks")
 *     * delivery  → select (Remote | Hybrid | Remote or Hybrid | On-site)
 *     * pricing   → text   (e.g. "Custom", "$10,000")
 * - Solo se muestra cuando la categoría del Gen Content es `structured-engagement`.
 * - Expone en GraphQL: GenContent.structuredEngagementDetails { duration, delivery, pricing }.
 *
 * Mismo patrón que acf-related-bloqs.php + register_graphql_field en oakwood-bloq.php.
 */

defined( 'ABSPATH' ) || exit;

/**
 * Registrar el grupo ACF (duration / delivery / pricing) condicionado a
 * gen_content + taxonomía gen_content_category con término structured-engagement.
 */
function oakwood_structured_engagement_register_acf() {
	if ( ! function_exists( 'acf_add_local_field_group' ) ) {
		return;
	}

	$fields = array(
		array(
			'key'           => 'field_oakwood_se_duration',
			'label'         => 'Duration',
			'name'          => 'duration',
			'type'          => 'text',
			'required'      => 0,
			'placeholder'   => '4 weeks',
			'instructions'  => 'Tiempo estimado del engagement (ej. "4 weeks", "2-6 weeks").',
		),
		array(
			'key'           => 'field_oakwood_se_delivery',
			'label'         => 'Delivery',
			'name'          => 'delivery',
			'type'          => 'select',
			'required'      => 0,
			'choices'       => array(
				'Remote'           => 'Remote',
				'Hybrid'           => 'Hybrid',
				'Remote or Hybrid' => 'Remote or Hybrid',
				'On-site'          => 'On-site',
			),
			'default_value' => 'Remote or Hybrid',
			'allow_null'    => 0,
			'multiple'      => 0,
			'ui'            => 1,
			'return_format' => 'value',
			'instructions'  => 'Modalidad de entrega del engagement.',
		),
		array(
			'key'           => 'field_oakwood_se_pricing',
			'label'         => 'Pricing',
			'name'          => 'pricing',
			'type'          => 'text',
			'required'      => 0,
			'placeholder'   => 'Custom',
			'instructions'  => 'Precio o etiqueta de pricing (ej. "Custom", "$10,000", "Starting at $25k").',
		),
	);

	acf_add_local_field_group(
		array(
			'key'      => 'group_oakwood_structured_engagement',
			'title'    => 'Structured Engagement Details',
			'fields'   => $fields,
			'location' => array(
				array(
					array(
						'param'    => 'post_type',
						'operator' => '==',
						'value'    => 'gen_content',
					),
					array(
						'param'    => 'post_taxonomy',
						'operator' => '==',
						'value'    => 'gen_content_category:structured-engagement',
					),
				),
			),
			'position' => 'normal',
			'style'    => 'default',
		)
	);
}
add_action( 'acf/init', 'oakwood_structured_engagement_register_acf' );

/**
 * Helper: leer un campo ACF como string limpio o null.
 */
function oakwood_structured_engagement_get_field( $post_id, $name ) {
	if ( ! $post_id ) {
		return null;
	}
	$value = function_exists( 'get_field' )
		? get_field( $name, $post_id )
		: get_post_meta( $post_id, $name, true );
	if ( $value === null || $value === '' ) {
		return null;
	}
	if ( ! is_scalar( $value ) ) {
		return null;
	}
	return trim( (string) $value );
}

/**
 * Resolver: dado el $source que pasa WPGraphQL al campo en GenContent, devuelve el database ID.
 */
function oakwood_structured_engagement_resolve_post_id( $source ) {
	if ( is_object( $source ) && isset( $source->ID ) ) {
		return (int) $source->ID;
	}
	if ( is_object( $source ) && isset( $source->databaseId ) ) {
		return (int) $source->databaseId;
	}
	if ( is_array( $source ) && isset( $source['databaseId'] ) ) {
		return (int) $source['databaseId'];
	}
	if ( is_array( $source ) && isset( $source['ID'] ) ) {
		return (int) $source['ID'];
	}
	return 0;
}

/**
 * Registrar tipo StructuredEngagementDetails y campo structuredEngagementDetails en GenContent.
 *
 * Permite consultar:
 * genContent(id: "...") {
 *   structuredEngagementDetails { duration delivery pricing }
 * }
 */
function oakwood_structured_engagement_register_graphql() {
	if ( ! function_exists( 'register_graphql_object_type' ) || ! function_exists( 'register_graphql_field' ) ) {
		return;
	}

	register_graphql_object_type(
		'StructuredEngagementDetails',
		array(
			'description' => __( 'Structured Engagement details (ACF: duration, delivery, pricing).', 'oakwood-blog' ),
			'fields'      => array(
				'duration' => array(
					'type'        => 'String',
					'description' => __( 'Engagement duration (e.g. "4 weeks").', 'oakwood-blog' ),
				),
				'delivery' => array(
					'type'        => 'String',
					'description' => __( 'Delivery mode (Remote, Hybrid, Remote or Hybrid, On-site).', 'oakwood-blog' ),
				),
				'pricing'  => array(
					'type'        => 'String',
					'description' => __( 'Pricing label (e.g. "Custom", "$10,000").', 'oakwood-blog' ),
				),
			),
		)
	);

	register_graphql_field(
		'GenContent',
		'structuredEngagementDetails',
		array(
			'type'        => 'StructuredEngagementDetails',
			'description' => __( 'Structured Engagement ACF fields. Null when category != structured-engagement or fields are empty.', 'oakwood-blog' ),
			'resolve'     => function ( $source ) {
				$post_id = oakwood_structured_engagement_resolve_post_id( $source );
				if ( ! $post_id ) {
					return null;
				}

				$duration = oakwood_structured_engagement_get_field( $post_id, 'duration' );
				$delivery = oakwood_structured_engagement_get_field( $post_id, 'delivery' );
				$pricing  = oakwood_structured_engagement_get_field( $post_id, 'pricing' );

				if ( $duration === null && $delivery === null && $pricing === null ) {
					return null;
				}

				return array(
					'duration' => $duration,
					'delivery' => $delivery,
					'pricing'  => $pricing,
				);
			},
		)
	);
}
add_action( 'graphql_register_types', 'oakwood_structured_engagement_register_graphql' );
