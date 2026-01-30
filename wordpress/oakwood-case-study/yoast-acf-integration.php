<?php
/**
 * Integración Yoast SEO + ACF para Case Studies.
 * Hace que Yoast analice el contenido de los campos ACF (overview, business challenge, solution, etc.)
 * para mejorar: longitud del texto, densidad de keyphrase, introducción, etc.
 *
 * Requiere: Yoast SEO y Advanced Custom Fields activos.
 */

defined( 'ABSPATH' ) || exit;

/**
 * Añadir contenido ACF al texto que Yoast analiza (solo para case_study).
 * Mejora: Text length, Keyphrase density, Keyphrase in introduction/subheading.
 */
function oakwood_cs_yoast_content( $content, $post ) {
	if ( ! $post || $post->post_type !== 'case_study' ) {
		return $content;
	}

	$post_id = $post->ID;
	$acf_content = array();

	$overview = get_field( 'overview', $post_id );
	if ( is_string( $overview ) && $overview !== '' ) {
		$acf_content[] = $overview;
	}

	$business_challenge = get_field( 'business_challenge', $post_id );
	if ( is_string( $business_challenge ) && $business_challenge !== '' ) {
		$acf_content[] = $business_challenge;
	}

	$solution = get_field( 'solution', $post_id );
	if ( is_string( $solution ) && $solution !== '' ) {
		$acf_content[] = $solution;
	}

	$testimonial = get_field( 'testimonial', $post_id );
	if ( is_array( $testimonial ) && ! empty( $testimonial['testimonial_quote'] ) ) {
		$acf_content[] = $testimonial['testimonial_quote'];
	}

	$connected_services = get_field( 'connected_services', $post_id );
	if ( is_array( $connected_services ) ) {
		foreach ( $connected_services as $row ) {
			if ( ! empty( $row['service_title'] ) ) {
				$acf_content[] = $row['service_title'];
			}
			if ( ! empty( $row['service_description'] ) ) {
				$acf_content[] = $row['service_description'];
			}
		}
	}

	if ( empty( $acf_content ) ) {
		return $content;
	}

	return $content . "\n\n" . implode( "\n\n", $acf_content );
}
add_filter( 'wpseo_pre_analysis_post_content', 'oakwood_cs_yoast_content', 10, 2 );

/**
 * Meta description por defecto desde Overview (solo en single case_study y si Yoast no tiene una definida).
 */
function oakwood_cs_yoast_metadesc( $description ) {
	$post = get_queried_object();
	if ( ! $post || ! ( $post instanceof WP_Post ) || $post->post_type !== 'case_study' ) {
		return $description;
	}
	if ( is_string( $description ) && $description !== '' ) {
		return $description;
	}
	if ( ! function_exists( 'get_field' ) ) {
		return $description;
	}
	$overview = get_field( 'overview', $post->ID );
	if ( is_string( $overview ) && $overview !== '' ) {
		return wp_trim_words( wp_strip_all_tags( $overview ), 30 );
	}
	return $description;
}
add_filter( 'wpseo_metadesc', 'oakwood_cs_yoast_metadesc', 10, 1 );
