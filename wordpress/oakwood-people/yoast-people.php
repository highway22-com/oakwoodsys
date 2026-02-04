<?php
/**
 * Integración Yoast SEO + ACF para People (Person).
 *
 * Añade nombre, posición, email al contenido que Yoast analiza para mejorar keyphrase/SEO.
 * Meta description por defecto desde name + position.
 *
 * Requiere: Yoast SEO y Advanced Custom Fields activos.
 */

defined( 'ABSPATH' ) || exit;

/**
 * Añadir contenido ACF al texto que Yoast analiza (solo para person).
 */
function oakwood_people_yoast_content( $content, $post ) {
	if ( ! $post || ! ( $post instanceof WP_Post ) || $post->post_type !== 'person' ) {
		return $content;
	}

	$post_id = (int) $post->ID;
	$acf_content = array();

	$name = get_field( 'name', $post_id );
	if ( is_string( $name ) && $name !== '' ) {
		$acf_content[] = $name;
	}

	$first_name = get_field( 'first_name', $post_id );
	if ( is_string( $first_name ) && $first_name !== '' ) {
		$acf_content[] = $first_name;
	}

	$position = get_field( 'position', $post_id );
	if ( is_string( $position ) && $position !== '' ) {
		$acf_content[] = 'Position: ' . $position;
	}

	$email = get_field( 'email', $post_id );
	if ( is_string( $email ) && $email !== '' ) {
		$acf_content[] = $email;
	}

	if ( empty( $acf_content ) ) {
		return $content;
	}

	return $content . "\n\n" . implode( "\n\n", $acf_content );
}
add_filter( 'wpseo_pre_analysis_post_content', 'oakwood_people_yoast_content', 10, 2 );

/**
 * Meta description por defecto (solo en single person y si Yoast no tiene una definida).
 * Usa name + position.
 */
function oakwood_people_yoast_metadesc( $description ) {
	$post = get_queried_object();
	if ( ! $post || ! ( $post instanceof WP_Post ) || $post->post_type !== 'person' ) {
		return $description;
	}
	if ( is_string( $description ) && $description !== '' ) {
		return $description;
	}

	if ( ! function_exists( 'get_field' ) ) {
		return $description;
	}

	$post_id = (int) $post->ID;
	$name     = get_field( 'name', $post_id );
	$position = get_field( 'position', $post_id );

	$name     = is_string( $name ) ? trim( $name ) : '';
	$position = is_string( $position ) ? trim( $position ) : '';

	$parts = array_filter( array( $name, $position ), static fn( $s ) => $s !== '' );
	if ( empty( $parts ) ) {
		$parts = array( get_the_title( $post ) );
	}

	return wp_trim_words( implode( ' – ', $parts ), 20 );
}
add_filter( 'wpseo_metadesc', 'oakwood_people_yoast_metadesc', 10, 1 );
