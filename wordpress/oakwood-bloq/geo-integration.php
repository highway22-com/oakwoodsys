<?php
/**
 * GEO (Generative Engine Optimization) para Gen Content.
 *
 * - Inyecta JSON-LD Schema.org para ayudar a motores generativos a entender el contenido.
 * - Inyecta meta keywords + article:tag/section desde ACF (tags/primary_tag).
 *
 * Nota: Esto complementa a Yoast; no intenta reemplazar su schema.
 */

defined( 'ABSPATH' ) || exit;

/**
 * Determinar el tipo Schema.org según type_content.
 */
function oakwood_gc_schema_type( $type_content ) {
	$type_content = is_scalar( $type_content ) ? (string) $type_content : '';
	$type_content = trim( $type_content );

	return match ( $type_content ) {
		'case_study' => 'CaseStudy',
		'bloq'       => 'BlogPosting',
		default      => 'Article',
	};
}

function oakwood_gc_get_acf_tags_for_post( $post_id ) {
	$tags = array();
	if ( function_exists( 'get_field' ) ) {
		$tags = get_field( 'tags', $post_id );
	}
	if ( ! is_array( $tags ) ) {
		return array();
	}
	$tags = array_map(
		static function ( $t ) {
			return is_scalar( $t ) ? trim( (string) $t ) : '';
		},
		$tags
	);
	return array_values( array_unique( array_filter( $tags, static fn( $t ) => $t !== '' ) ) );
}

/**
 * Output GEO meta + JSON-LD solo en single gen_content.
 */
function oakwood_gc_output_geo() {
	if ( ! is_singular( 'gen_content' ) ) {
		return;
	}

	$post = get_queried_object();
	if ( ! $post || ! ( $post instanceof WP_Post ) ) {
		return;
	}

	$post_id = (int) $post->ID;

	$type_content = function_exists( 'get_field' ) ? get_field( 'type_content', $post_id ) : '';
	$primary_tag  = function_exists( 'get_field' ) ? get_field( 'primary_tag', $post_id ) : '';
	$tags         = oakwood_gc_get_acf_tags_for_post( $post_id );

	$primary_tag = is_scalar( $primary_tag ) ? trim( (string) $primary_tag ) : '';
	if ( $primary_tag !== '' ) {
		// Asegurar que primary_tag esté primero en keywords/tags.
		$tags = array_values( array_unique( array_merge( array( $primary_tag ), $tags ) ) );
	}

	// 1) Metadatos simples (útiles para parsers/LLMs aunque keywords sea "legacy")
	if ( ! empty( $tags ) ) {
		echo "\n" . '<meta name="keywords" content="' . esc_attr( implode( ', ', $tags ) ) . '">' . "\n";
		foreach ( $tags as $t ) {
			echo '<meta property="article:tag" content="' . esc_attr( $t ) . '">' . "\n";
		}
	}
	if ( $primary_tag !== '' ) {
		echo '<meta property="article:section" content="' . esc_attr( $primary_tag ) . '">' . "\n";
	}

	// 2) JSON-LD Schema.org
	$permalink = get_permalink( $post );
	$site_name = get_bloginfo( 'name' );
	$schema_type = oakwood_gc_schema_type( $type_content );

	$description = has_excerpt( $post ) ? $post->post_excerpt : '';
	$description = is_string( $description ) && $description !== '' ? $description : wp_trim_words( wp_strip_all_tags( $post->post_content ), 30 );

	$image = get_the_post_thumbnail_url( $post, 'full' );
	$image = is_string( $image ) && $image !== '' ? $image : null;

	$author_name = '';
	$author = get_userdata( (int) $post->post_author );
	if ( $author ) {
		$author_name = (string) $author->display_name;
	}

	$data = array(
		'@context'        => 'https://schema.org',
		'@type'           => $schema_type,
		'@id'             => is_string( $permalink ) ? ( $permalink . '#oakwood-gen-content' ) : null,
		'url'             => $permalink,
		'headline'        => get_the_title( $post ),
		'description'     => $description,
		'datePublished'   => get_the_date( DATE_W3C, $post ),
		'dateModified'    => get_the_modified_date( DATE_W3C, $post ),
		'inLanguage'      => get_bloginfo( 'language' ),
		'keywords'        => ! empty( $tags ) ? $tags : null, // array es válido en Schema.org
		'about'           => $primary_tag !== '' ? array( '@type' => 'Thing', 'name' => $primary_tag ) : null,
		'image'           => $image ? array( $image ) : null,
		'author'          => $author_name !== '' ? array( '@type' => 'Person', 'name' => $author_name ) : null,
		'publisher'       => $site_name !== '' ? array( '@type' => 'Organization', 'name' => $site_name ) : null,
		'mainEntityOfPage'=> $permalink ? array( '@type' => 'WebPage', '@id' => $permalink ) : null,
	);

	// Limpiar nulls para que el JSON sea más legible.
	$data = array_filter(
		$data,
		static function ( $v ) {
			return $v !== null && $v !== '';
		}
	);

	echo '<script type="application/ld+json">' . wp_json_encode( $data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) . '</script>' . "\n";
}
add_action( 'wp_head', 'oakwood_gc_output_geo', 25 );

