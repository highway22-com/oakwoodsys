<?php

defined( 'ABSPATH' ) || exit;

/**
 * Display label for JSON `tag` (primary event tag term name).
 */
function oakwood_events_get_primary_tag_label_for_post( $post_id ) {
	$terms = wp_get_post_terms( (int) $post_id, OAKWOOD_EVENTS_TAG_TAXONOMY );
	if ( is_wp_error( $terms ) || empty( $terms ) ) {
		return '';
	}
	$name = isset( $terms[0]->name ) ? (string) $terms[0]->name : '';
	return $name;
}

function oakwood_events_primary_tag_meta_box( \WP_Post $post ) {
	$selected = 0;
	$terms    = wp_get_post_terms( $post->ID, OAKWOOD_EVENTS_TAG_TAXONOMY );
	if ( ! is_wp_error( $terms ) && ! empty( $terms ) ) {
		$selected = (int) $terms[0]->term_id;
	}

	echo '<p class="description">' . esc_html__(
		'Shown as the display badge on the site. Manage tag names under Events → Event tags.',
		'oakwood-events'
	) . '</p>';

	wp_dropdown_categories(
		array(
			'taxonomy'          => OAKWOOD_EVENTS_TAG_TAXONOMY,
			'name'              => 'oakwood_events_primary_tag',
			'id'                => 'oakwood_events_primary_tag',
			'orderby'           => 'name',
			'order'             => 'ASC',
			'show_option_none'  => __( '— None —', 'oakwood-events' ),
			'option_none_value' => '0',
			'hide_empty'        => false,
			'hierarchical'      => false,
			'selected'          => $selected,
			'class'             => 'widefat',
		)
	);
}

function oakwood_events_add_primary_tag_meta_box() {
	add_meta_box(
		'oakwood_events_primary_tag',
		__( 'Primary tag', 'oakwood-events' ),
		'oakwood_events_primary_tag_meta_box',
		OAKWOOD_EVENTS_POST_TYPE,
		'side',
		'default'
	);
}
add_action( 'add_meta_boxes', 'oakwood_events_add_primary_tag_meta_box' );
