<?php
/**
 * Integración Yoast SEO + ACF para Gen Content.
 *
 * Objetivo: que Yoast analice también fields ACF (tags, primary_tag, type_content)
 * para mejorar señales como densidad de keyphrase, subheadings, longitud de texto, etc.
 *
 * Requiere: Yoast SEO y Advanced Custom Fields activos.
 */

defined( 'ABSPATH' ) || exit;

/**
 * Añadir contenido ACF al texto que Yoast analiza (solo para gen_content).
 */
function oakwood_gc_yoast_content( $content, $post ) {
	if ( ! $post || ! ( $post instanceof WP_Post ) || $post->post_type !== 'gen_content' ) {
		return $content;
	}

	$post_id = (int) $post->ID;
	$acf_content = array();

	$type_content = get_field( 'type_content', $post_id );
	if ( is_string( $type_content ) && $type_content !== '' ) {
		$acf_content[] = 'Type: ' . $type_content;
	}

	$primary_tag = get_field( 'primary_tag', $post_id );
	if ( is_string( $primary_tag ) && $primary_tag !== '' ) {
		$acf_content[] = 'Primary tag: ' . $primary_tag;
	}

	$tags = get_field( 'tags', $post_id );
	if ( is_array( $tags ) && ! empty( $tags ) ) {
		$tags = array_map(
			static function ( $t ) {
				return is_scalar( $t ) ? trim( (string) $t ) : '';
			},
			$tags
		);
		$tags = array_values( array_filter( $tags, static fn( $t ) => $t !== '' ) );
		if ( ! empty( $tags ) ) {
			$acf_content[] = 'Tags: ' . implode( ', ', $tags );
		}
	}

	if ( empty( $acf_content ) ) {
		return $content;
	}

	return $content . "\n\n" . implode( "\n\n", $acf_content );
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

