<?php
/**
 * Plugin Name: Oakwood Case Study
 * Plugin URI: https://github.com/oakwood/oakwood-case-study
 * Description: Registra el Custom Post Type "Case Study", la taxonomía "Case Study Categories" y el grupo de campos ACF según case-studies-import-data.json.
 * Version: 1.0.4
 * Author: Aetro
 * Author URI: https://torre.ai/luisnoejasso?r=7zLtySsb
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: oakwood-case-study
 *
 * Requiere: Advanced Custom Fields (ACF). Para "Connected Services" (Repeater) se recomienda ACF Pro.
 */

defined( 'ABSPATH' ) || exit;

// Cargar definición del grupo ACF (estructura según case-studies-import-data.json)
require_once __DIR__ . '/acf-case-study-details.php';

// Integración Yoast SEO: que analice los campos ACF (solo si Yoast está activo)
add_action( 'plugins_loaded', function () {
	if ( defined( 'WPSEO_VERSION' ) && function_exists( 'get_field' ) ) {
		require_once __DIR__ . '/yoast-acf-integration.php';
	}
}, 20 );

/**
 * Registrar Custom Post Type "Case Study"
 */
function oakwood_cs_register_post_type() {
	$labels = array(
		'name'                  => _x( 'Case Studies', 'post type general name', 'oakwood-case-study' ),
		'singular_name'         => _x( 'Case Study', 'post type singular name', 'oakwood-case-study' ),
		'menu_name'             => _x( 'Case Studies', 'admin menu', 'oakwood-case-study' ),
		'add_new'               => _x( 'Add New', 'case study', 'oakwood-case-study' ),
		'add_new_item'          => __( 'Add New Case Study', 'oakwood-case-study' ),
		'edit_item'             => __( 'Edit Case Study', 'oakwood-case-study' ),
		'new_item'              => __( 'New Case Study', 'oakwood-case-study' ),
		'view_item'             => __( 'View Case Study', 'oakwood-case-study' ),
		'search_items'          => __( 'Search Case Studies', 'oakwood-case-study' ),
		'not_found'             => __( 'No case studies found', 'oakwood-case-study' ),
		'not_found_in_trash'    => __( 'No case studies found in trash', 'oakwood-case-study' ),
	);

	$args = array(
		'label'                 => __( 'Case Study', 'oakwood-case-study' ),
		'labels'                => $labels,
		'supports'              => array( 'title', 'editor', 'thumbnail', 'excerpt', 'custom-fields' ),
		'public'                => true,
		'show_ui'               => true,
		'show_in_menu'          => true,
		'menu_position'         => 5,
		'menu_icon'             => 'dashicons-portfolio',
		'show_in_admin_bar'     => true,
		'show_in_nav_menus'     => true,
		'can_export'            => true,
		'has_archive'           => true,
		'exclude_from_search'   => false,
		'publicly_queryable'    => true,
		'capability_type'       => 'post',
		'show_in_rest'          => true,
		'rewrite'               => array( 'slug' => 'resources/case-studies' ),
		// WPGraphQL: expone "caseStudy" / "caseStudies" en el schema (requiere plugin WPGraphQL).
		'show_in_graphql'       => true,
		'graphql_single_name'   => 'CaseStudy',
		'graphql_plural_name'   => 'CaseStudies',
	);

	register_post_type( 'case_study', $args );
}
add_action( 'init', 'oakwood_cs_register_post_type' );

/**
 * Registrar taxonomía "Case Study Categories"
 */
function oakwood_cs_register_taxonomy() {
	$labels = array(
		'name'              => _x( 'Case Study Categories', 'taxonomy general name', 'oakwood-case-study' ),
		'singular_name'     => _x( 'Category', 'taxonomy singular name', 'oakwood-case-study' ),
		'search_items'      => __( 'Search Categories', 'oakwood-case-study' ),
		'all_items'         => __( 'All Categories', 'oakwood-case-study' ),
		'edit_item'         => __( 'Edit Category', 'oakwood-case-study' ),
		'update_item'       => __( 'Update Category', 'oakwood-case-study' ),
		'add_new_item'      => __( 'Add New Category', 'oakwood-case-study' ),
		'new_item_name'     => __( 'New Category Name', 'oakwood-case-study' ),
		'menu_name'         => __( 'Categories', 'oakwood-case-study' ),
	);

	$args = array(
		'hierarchical'      => true,
		'labels'            => $labels,
		'show_ui'           => true,
		'show_admin_column' => true,
		'query_var'         => true,
		'rewrite'           => array( 'slug' => 'case-study-category' ),
		'show_in_rest'      => true,
		// WPGraphQL: expone "caseStudyCategory" en el schema (requiere plugin WPGraphQL).
		'show_in_graphql'       => true,
		'graphql_single_name'  => 'CaseStudyCategory',
		'graphql_plural_name'   => 'CaseStudyCategories',
	);

	register_taxonomy( 'case_study_category', array( 'case_study' ), $args );
}
add_action( 'init', 'oakwood_cs_register_taxonomy' );

/**
 * Flush rewrite rules al activar el plugin
 */
function oakwood_cs_activate() {
	oakwood_cs_register_post_type();
	oakwood_cs_register_taxonomy();
	flush_rewrite_rules();
}
register_activation_hook( __FILE__, 'oakwood_cs_activate' );

/**
 * Flush rewrite rules al desactivar el plugin
 */
function oakwood_cs_deactivate() {
	flush_rewrite_rules();
}
register_deactivation_hook( __FILE__, 'oakwood_cs_deactivate' );
