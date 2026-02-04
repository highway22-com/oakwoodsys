<?php
/**
 * Plugin Name: Oakwood People
 * Plugin URI: https://oakwoodsys.com
 * Description: Registra el CPT "People" (person) con ACF (name, position, firstName, email, picture, social links), integración con Gen Content como autor, SEO (Yoast) y GEO.
 * Version: 2.0.0
 * Author: Aetro
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: oakwood-people
 *
 * Requiere: Advanced Custom Fields (ACF). Opcional: Oakwood Bloq (gen_content), WPGraphQL, Yoast SEO.
 */

defined( 'ABSPATH' ) || exit;

require_once __DIR__ . '/acf-people-details.php';
require_once __DIR__ . '/geo-people.php';

add_action( 'plugins_loaded', function () {
	if ( defined( 'WPSEO_VERSION' ) && function_exists( 'get_field' ) ) {
		require_once __DIR__ . '/yoast-people.php';
	}
}, 20 );

require_once __DIR__ . '/graphql-people.php';

/**
 * Registrar Custom Post Type "People" (Person).
 */
function oakwood_people_register_post_type() {
	$labels = array(
		'name'                  => _x( 'People', 'post type general name', 'oakwood-people' ),
		'singular_name'         => _x( 'Person', 'post type singular name', 'oakwood-people' ),
		'menu_name'             => _x( 'People', 'admin menu', 'oakwood-people' ),
		'add_new'               => _x( 'Add New', 'person', 'oakwood-people' ),
		'add_new_item'          => __( 'Add New Person', 'oakwood-people' ),
		'edit_item'             => __( 'Edit Person', 'oakwood-people' ),
		'new_item'              => __( 'New Person', 'oakwood-people' ),
		'view_item'             => __( 'View Person', 'oakwood-people' ),
		'search_items'          => __( 'Search People', 'oakwood-people' ),
		'not_found'             => __( 'No people found', 'oakwood-people' ),
		'not_found_in_trash'    => __( 'No people found in trash', 'oakwood-people' ),
	);

	$args = array(
		'label'                 => __( 'Person', 'oakwood-people' ),
		'labels'                => $labels,
		'supports'              => array( 'title', 'thumbnail', 'custom-fields' ),
		'public'                => true,
		'show_ui'               => true,
		'show_in_menu'          => true,
		'menu_position'         => 7,
		'menu_icon'             => 'dashicons-groups',
		'show_in_admin_bar'     => true,
		'show_in_nav_menus'     => true,
		'can_export'            => true,
		'has_archive'           => true,
		'exclude_from_search'   => false,
		'publicly_queryable'    => true,
		'capability_type'       => 'post',
		'show_in_rest'          => true,
		'rewrite'               => array( 'slug' => 'people' ),
		'show_in_graphql'       => true,
		'graphql_single_name'   => 'Person',
		'graphql_plural_name'   => 'People',
	);

	register_post_type( 'person', $args );
}
add_action( 'init', 'oakwood_people_register_post_type' );

function oakwood_people_activate() {
	oakwood_people_register_post_type();
	flush_rewrite_rules();
}
register_activation_hook( __FILE__, 'oakwood_people_activate' );

function oakwood_people_deactivate() {
	flush_rewrite_rules();
}
register_deactivation_hook( __FILE__, 'oakwood_people_deactivate' );
