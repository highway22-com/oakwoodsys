<?php
/**
 * GEO (Generative Engine Optimization) para People (Person).
 *
 * - Inyecta JSON-LD Schema.org Person en single person.
 * - Meta keywords desde name, position para parsers/LLMs.
 *
 * Nota: Complementa a Yoast; no reemplaza su schema.
 */

defined( 'ABSPATH' ) || exit;

/**
 * Output GEO meta + JSON-LD solo en single person.
 */
function oakwood_people_output_geo() {
	if ( ! is_singular( 'person' ) ) {
		return;
	}

	$post = get_queried_object();
	if ( ! $post || ! ( $post instanceof WP_Post ) ) {
		return;
	}

	$post_id = (int) $post->ID;

	$name     = function_exists( 'get_field' ) ? get_field( 'name', $post_id ) : '';
	$position = function_exists( 'get_field' ) ? get_field( 'position', $post_id ) : '';
	$email    = function_exists( 'get_field' ) ? get_field( 'email', $post_id ) : '';
	$picture  = function_exists( 'get_field' ) ? get_field( 'picture', $post_id ) : '';

	$name     = is_scalar( $name ) ? trim( (string) $name ) : '';
	$position = is_scalar( $position ) ? trim( (string) $position ) : '';
	$email    = is_scalar( $email ) ? trim( (string) $email ) : '';
	$picture  = is_string( $picture ) ? $picture : ( is_array( $picture ) && isset( $picture['url'] ) ? $picture['url'] : '' );

	if ( $name === '' ) {
		$name = get_the_title( $post );
	}

	// 1) Meta keywords (name + position)
	$keywords = array_filter( array( $name, $position ), static fn( $s ) => $s !== '' );
	if ( ! empty( $keywords ) ) {
		echo "\n" . '<meta name="keywords" content="' . esc_attr( implode( ', ', $keywords ) ) . '">' . "\n";
	}

	// 2) JSON-LD Schema.org Person
	$permalink = get_permalink( $post );

	$data = array(
		'@context'  => 'https://schema.org',
		'@type'     => 'Person',
		'@id'       => is_string( $permalink ) ? ( $permalink . '#person' ) : null,
		'url'       => $permalink,
		'name'      => $name !== '' ? $name : null,
		'jobTitle'  => $position !== '' ? $position : null,
		'email'     => $email !== '' ? $email : null,
		'image'     => $picture !== '' ? $picture : null,
	);

	$data = array_filter(
		$data,
		static function ( $v ) {
			return $v !== null && $v !== '';
		}
	);

	echo '<script type="application/ld+json">' . wp_json_encode( $data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) . '</script>' . "\n";
}
add_action( 'wp_head', 'oakwood_people_output_geo', 25 );
