<?php

defined( 'ABSPATH' ) || exit;

function oakwood_events_register_graphql() {
	if ( ! function_exists( 'register_graphql_field' ) || ! function_exists( 'register_graphql_object_type' ) ) {
		return;
	}

	$type_registry = class_exists( '\WPGraphQL' ) ? \WPGraphQL::get_type_registry() : null;
	if ( $type_registry && $type_registry->get_type( 'OakwoodEventsContent' ) ) {
		// Avoid duplicate type registration if plugin loaded twice.
		return;
	}

	register_graphql_object_type(
		'OakwoodEventsContent',
		array(
			'description' => __( 'Events JSON content for the Events page. The content field contains the complete JSON.', 'oakwood-events' ),
			'fields'      => array(
				'content' => array(
					'type'        => 'String',
					'description' => __( 'Complete events JSON (hero, sections, events).', 'oakwood-events' ),
				),
			),
		)
	);

	register_graphql_field(
		'RootQuery',
		'eventsContent',
		array(
			'description' => __( 'Events JSON content (same structure as events-content.json).', 'oakwood-events' ),
			'type'        => 'OakwoodEventsContent',
			'resolve'     => function () {
				$data = oakwood_events_build_events_content_array();
				return array(
					'content' => wp_json_encode( $data ),
				);
			},
		)
	);
}
add_action( 'graphql_register_types', 'oakwood_events_register_graphql', 20 );

