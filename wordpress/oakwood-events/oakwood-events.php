<?php
/**
 * Plugin Name: Oakwood Events
 * Plugin URI: https://oakwoodsys.com
 * Description: Custom Post Type "Events" with Speakers taxonomy. Provides REST and GraphQL endpoints to serve events JSON compatible with the frontend.
 * Version: 1.0.23
 * Author: Oakwood Systems
 * License: GPL v2 or later
 * Text Domain: oakwood-events
 */

defined( 'ABSPATH' ) || exit;

define( 'OAKWOOD_EVENTS_POST_TYPE', 'oak_event' );
define( 'OAKWOOD_EVENTS_SPEAKER_TAXONOMY', 'oak_speaker' );
define( 'OAKWOOD_EVENTS_TAG_TAXONOMY', 'oak_event_tag' );
define( 'OAKWOOD_EVENTS_GLOBAL_OPTION', 'oakwood_events_global_content' );
define( 'OAKWOOD_EVENTS_TIMEZONE_OPTION', 'oakwood_events_timezone' );
define( 'OAKWOOD_EVENTS_NONCE_ACTION', 'oakwood_events_save_meta' );
define( 'OAKWOOD_EVENTS_NONCE_NAME', 'oakwood_events_nonce' );

require_once __DIR__ . '/includes/meta.php';
require_once __DIR__ . '/includes/hero-sync.php';
require_once __DIR__ . '/includes/settings.php';
require_once __DIR__ . '/includes/speakers.php';
require_once __DIR__ . '/includes/event-tag.php';
require_once __DIR__ . '/includes/builder.php';
require_once __DIR__ . '/includes/rest.php';
require_once __DIR__ . '/includes/graphql.php';

function oakwood_events_register_post_type_and_taxonomy() {
	$labels = array(
		'name'               => _x( 'Events', 'post type general name', 'oakwood-events' ),
		'singular_name'      => _x( 'Event', 'post type singular name', 'oakwood-events' ),
		'menu_name'          => _x( 'Events', 'admin menu', 'oakwood-events' ),
		'add_new'            => _x( 'Add New', 'event', 'oakwood-events' ),
		'add_new_item'       => __( 'Add New Event', 'oakwood-events' ),
		'edit_item'          => __( 'Edit Event', 'oakwood-events' ),
		'new_item'           => __( 'New Event', 'oakwood-events' ),
		'view_item'          => __( 'View Event', 'oakwood-events' ),
		'search_items'       => __( 'Search Events', 'oakwood-events' ),
		'not_found'          => __( 'No events found', 'oakwood-events' ),
		'not_found_in_trash' => __( 'No events found in trash', 'oakwood-events' ),
	);

	$args = array(
		'label'               => __( 'Event', 'oakwood-events' ),
		'labels'              => $labels,
		'supports'            => array( 'title', 'editor', 'excerpt', 'thumbnail', 'revisions' ),
		'public'              => true,
		'publicly_queryable'  => true,
		'show_ui'             => true,
		'show_in_menu'        => true,
		'menu_position'       => 8,
		'menu_icon'           => 'dashicons-calendar-alt',
		'show_in_admin_bar'   => true,
		'show_in_nav_menus'   => true,
		'can_export'          => true,
		'has_archive'         => false,
		'exclude_from_search' => false,
		'capability_type'     => 'post',
		'show_in_rest'        => true,
		'rewrite'             => array( 'slug' => 'events' ),
	);

	register_post_type( OAKWOOD_EVENTS_POST_TYPE, $args );

	$tax_labels = array(
		'name'              => _x( 'Speakers', 'taxonomy general name', 'oakwood-events' ),
		'singular_name'     => _x( 'Speaker', 'taxonomy singular name', 'oakwood-events' ),
		'search_items'      => __( 'Search Speakers', 'oakwood-events' ),
		'all_items'         => __( 'All Speakers', 'oakwood-events' ),
		'edit_item'         => __( 'Edit Speaker', 'oakwood-events' ),
		'update_item'       => __( 'Update Speaker', 'oakwood-events' ),
		'add_new_item'      => __( 'Add New Speaker', 'oakwood-events' ),
		'new_item_name'     => __( 'New Speaker Name', 'oakwood-events' ),
		'menu_name'         => __( 'Speakers', 'oakwood-events' ),
	);

	$tax_args = array(
		'hierarchical'      => true,
		'labels'            => $tax_labels,
		'show_ui'           => true,
		'show_admin_column' => true,
		'show_in_rest'      => true,
		'public'            => true,
		'rewrite'           => array( 'slug' => 'speaker' ),
	);

	register_taxonomy( OAKWOOD_EVENTS_SPEAKER_TAXONOMY, array( OAKWOOD_EVENTS_POST_TYPE ), $tax_args );

	$tag_labels = array(
		'name'              => _x( 'Event tags', 'taxonomy general name', 'oakwood-events' ),
		'singular_name'     => _x( 'Event tag', 'taxonomy singular name', 'oakwood-events' ),
		'search_items'      => __( 'Search event tags', 'oakwood-events' ),
		'all_items'         => __( 'All event tags', 'oakwood-events' ),
		'edit_item'         => __( 'Edit event tag', 'oakwood-events' ),
		'update_item'       => __( 'Update event tag', 'oakwood-events' ),
		'add_new_item'      => __( 'Add new event tag', 'oakwood-events' ),
		'new_item_name'     => __( 'New event tag name', 'oakwood-events' ),
		'menu_name'         => __( 'Event tags', 'oakwood-events' ),
	);

	$tag_args = array(
		'hierarchical'      => false,
		'labels'            => $tag_labels,
		'show_ui'           => true,
		'show_admin_column' => false,
		'show_in_rest'      => true,
		'public'            => true,
		'rewrite'           => array( 'slug' => 'event-tag' ),
		'meta_box_cb'       => false,
	);

	register_taxonomy( OAKWOOD_EVENTS_TAG_TAXONOMY, array( OAKWOOD_EVENTS_POST_TYPE ), $tag_args );
}
add_action( 'init', 'oakwood_events_register_post_type_and_taxonomy' );

function oakwood_events_activate() {
	oakwood_events_register_post_type_and_taxonomy();
	add_option( OAKWOOD_EVENTS_TIMEZONE_OPTION, 'America/Chicago', '', false );
	flush_rewrite_rules();
}
register_activation_hook( __FILE__, 'oakwood_events_activate' );

function oakwood_events_deactivate() {
	flush_rewrite_rules();
}
register_deactivation_hook( __FILE__, 'oakwood_events_deactivate' );

