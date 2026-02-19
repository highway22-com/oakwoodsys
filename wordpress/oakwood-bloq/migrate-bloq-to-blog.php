<?php
/**
 * Migración bloq → blog: actualiza datos existentes sin pérdida.
 *
 * Se ejecuta una sola vez al detectar que la migración no se ha aplicado.
 * - Taxonomía gen_content_category: term slug 'bloq' → 'blog'
 *
 * @package Oakwood_Bloq
 */

defined( 'ABSPATH' ) || exit;

const OAKWOOD_BLOQ_MIGRATION_BLOQ_TO_BLOG_DONE = 'oakwood_bloq_migrated_bloq_to_blog';

/**
 * Migra datos de bloq a blog (taxonomía).
 * Prioridad 99: después de que el CPT y la taxonomía estén registrados (init 10).
 */
function oakwood_bloq_migrate_bloq_to_blog() {
	if ( get_option( OAKWOOD_BLOQ_MIGRATION_BLOQ_TO_BLOG_DONE, false ) ) {
		return;
	}

	global $wpdb;

	// Taxonomía: actualizar term slug 'bloq' → 'blog' en gen_content_category
	$term_bloq = get_term_by( 'slug', 'bloq', 'gen_content_category' );
	$term_blog = get_term_by( 'slug', 'blog', 'gen_content_category' );

	if ( $term_bloq && ! is_wp_error( $term_bloq ) && ! $term_blog ) {
		wp_update_term(
			$term_bloq->term_id,
			'gen_content_category',
			array(
				'slug' => 'blog',
				'name' => 'Blog',
			)
		);
	}
	// Fallback: actualizar directo en DB (por si get_term_by falla o taxonomía no está lista)
	$wpdb->query(
		$wpdb->prepare(
			"UPDATE {$wpdb->terms} t
			INNER JOIN {$wpdb->term_taxonomy} tt ON t.term_id = tt.term_id
			SET t.slug = 'blog', t.name = 'Blog'
			WHERE tt.taxonomy = 'gen_content_category' AND t.slug = %s",
			'bloq'
		)
	);

	update_option( OAKWOOD_BLOQ_MIGRATION_BLOQ_TO_BLOG_DONE, true );
}

add_action( 'init', 'oakwood_bloq_migrate_bloq_to_blog', 99 );

/**
 * Resetear la migración desde el navegador (solo admins).
 * Visitar: /wp-admin/?oakwood_reset_migration=1
 */
add_action( 'admin_init', function () {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	if ( empty( $_GET['oakwood_reset_migration'] ) ) {
		return;
	}

	delete_option( OAKWOOD_BLOQ_MIGRATION_BLOQ_TO_BLOG_DONE );

	wp_safe_redirect( add_query_arg( 'oakwood_migration_reset', '1', admin_url() ) );
	exit;
} );

add_action( 'admin_notices', function () {
	if ( ! current_user_can( 'manage_options' ) || empty( $_GET['oakwood_migration_reset'] ) ) {
		return;
	}
	echo '<div class="notice notice-success is-dismissible"><p><strong>Migration reset.</strong> The next page load will run the bloq→blog migration again.</p></div>';
} );
