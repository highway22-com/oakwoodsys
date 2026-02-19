<?php
/**
 * Integración Yoast SEO + ACF para Gen Content.
 *
 * Objetivo: que Yoast analice también categorías de taxonomía gen_content_category
 * para mejorar señales como densidad de keyphrase, subheadings, longitud de texto, etc.
 *
 * Primary Tag: gen_content_tag en primary term taxonomies → dropdown "Select the primary tag".
 * Requiere: Yoast SEO y Advanced Custom Fields activos.
 */

defined( 'ABSPATH' ) || exit;

/**
 * Añadir gen_content_tag a primary term taxonomies de Yoast.
 * Muestra el dropdown "Select the primary tag" en el panel Tags.
 */
function oakwood_gc_yoast_primary_term_taxonomies( $taxonomies, $post_type, $all_taxonomies ) {
	if ( $post_type !== 'gen_content' ) {
		return $taxonomies;
	}
	if ( isset( $all_taxonomies['gen_content_tag'] ) ) {
		$taxonomies['gen_content_tag'] = $all_taxonomies['gen_content_tag'];
	}
	return $taxonomies;
}
add_filter( 'wpseo_primary_term_taxonomies', 'oakwood_gc_yoast_primary_term_taxonomies', 10, 3 );

/**
 * Añadir categorías de taxonomía al texto que Yoast analiza (solo para gen_content).
 */
function oakwood_gc_yoast_content( $content, $post ) {
	if ( ! $post || ! ( $post instanceof WP_Post ) || $post->post_type !== 'gen_content' ) {
		return $content;
	}

	$post_id = (int) $post->ID;
	$tags = function_exists( 'oakwood_gc_get_tag_terms_for_post' ) ? oakwood_gc_get_tag_terms_for_post( $post_id ) : array();

	if ( empty( $tags ) ) {
		return $content;
	}

	return $content . "\n\n" . 'Categories: ' . implode( ', ', $tags );
}
add_filter( 'wpseo_pre_analysis_post_content', 'oakwood_gc_yoast_content', 10, 2 );

/**
 * Meta description por defecto (solo en single gen_content y si Yoast no tiene una definida).
 * Usa excerpt primero; si no existe, usa el contenido del post.
 */
function oakwood_gc_yoast_metadesc( $description ) {
	$post = get_queried_object();
	if ( ! $post || ! ( $post instanceof WP_Post ) || $post->post_type !== 'gen_content' ) {
		return $description;
	}
	if ( is_string( $description ) && $description !== '' ) {
		return $description;
	}

	$excerpt = has_excerpt( $post ) ? $post->post_excerpt : '';
	if ( is_string( $excerpt ) && $excerpt !== '' ) {
		return wp_trim_words( wp_strip_all_tags( $excerpt ), 30 );
	}

	$content = $post->post_content;
	if ( is_string( $content ) && $content !== '' ) {
		return wp_trim_words( wp_strip_all_tags( $content ), 30 );
	}

	return $description;
}
add_filter( 'wpseo_metadesc', 'oakwood_gc_yoast_metadesc', 10, 1 );

