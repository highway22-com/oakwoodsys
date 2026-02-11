<?php
/**
 * Migración bloq → blog: actualiza datos existentes sin pérdida.
 *
 * Se ejecuta una sola vez al detectar que la migración no se ha aplicado.
 * - Taxonomía gen_content_category: term slug 'bloq' → 'blog'
 * - Post meta type_content: valor 'bloq' → 'blog'
 *
 * @package Oakwood_Bloq
 */

defined( 'ABSPATH' ) || exit;

const OAKWOOD_BLOQ_MIGRATION_BLOQ_TO_BLOG_DONE = 'oakwood_bloq_migrated_bloq_to_blog';

/**
 * Migra datos de bloq a blog (taxonomía + post meta).
 * Prioridad 99: después de que el CPT y la taxonomía estén registrados (init 10).
 */
function oakwood_bloq_migrate_bloq_to_blog() {
	if ( get_option( OAKWOOD_BLOQ_MIGRATION_BLOQ_TO_BLOG_DONE, false ) ) {
		return;
	}

	global $wpdb;

	// 1) Taxonomía: actualizar term slug 'bloq' → 'blog' en gen_content_category
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

	// 2) Post meta: type_content 'bloq' → 'blog' (ACF guarda en wp_postmeta)
	$wpdb->query(
		$wpdb->prepare(
			"UPDATE {$wpdb->postmeta} SET meta_value = 'blog' WHERE meta_key = %s AND meta_value = %s",
			'type_content',
			'bloq'
		)
	);

	// 3) ACF serializado: algunos campos guardan valor serializado; actualizar si existe
	$rows = $wpdb->get_results(
		$wpdb->prepare(
			"SELECT meta_id, meta_value FROM {$wpdb->postmeta} WHERE meta_key = %s AND meta_value LIKE %s",
			'type_content',
			'%bloq%'
		),
		ARRAY_A
	);
	foreach ( $rows as $row ) {
		$new_value = str_replace( 'bloq', 'blog', $row['meta_value'] );
		$wpdb->update( $wpdb->postmeta, array( 'meta_value' => $new_value ), array( 'meta_id' => $row['meta_id'] ) );
	}

	update_option( OAKWOOD_BLOQ_MIGRATION_BLOQ_TO_BLOG_DONE, true );
}

/**
 * Actualizar definición del campo type_content en ACF (dropdown "Blog" no "Bloq").
 * Se ejecuta cuando ACF está cargado.
 */
function oakwood_bloq_migrate_acf_type_content_field() {
	if ( get_option( 'oakwood_bloq_acf_type_content_updated', false ) ) {
		return;
	}
	if ( ! function_exists( 'acf_get_field' ) || ! function_exists( 'acf_update_field' ) ) {
		return;
	}
	$field = acf_get_field( 'field_oakwood_type_content' );
	if ( ! $field || ! is_array( $field ) ) {
		return;
	}
	$correct = array( 'blog' => 'Blog', 'case_study' => 'Case Study', 'other' => 'Other' );
	if ( ( $field['choices'] ?? [] ) === $correct ) {
		update_option( 'oakwood_bloq_acf_type_content_updated', true );
		return;
	}
	$field['choices']      = $correct;
	$field['default_value'] = 'blog';
	acf_update_field( $field );
	update_option( 'oakwood_bloq_acf_type_content_updated', true );
}

add_action( 'init', 'oakwood_bloq_migrate_bloq_to_blog', 99 );
add_action( 'acf/init', 'oakwood_bloq_migrate_acf_type_content_field', 20 );

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
	delete_option( 'oakwood_bloq_acf_type_content_updated' );

	wp_safe_redirect( add_query_arg( 'oakwood_migration_reset', '1', admin_url() ) );
	exit;
} );

add_action( 'admin_notices', function () {
	if ( ! current_user_can( 'manage_options' ) || empty( $_GET['oakwood_migration_reset'] ) ) {
		return;
	}
	echo '<div class="notice notice-success is-dismissible"><p><strong>Migration reset.</strong> The next page load will run the bloq→blog migration again.</p></div>';
} );
