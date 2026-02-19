<?php
/**
 * GEO (Generative Engine Optimization) para Gen Content.
 *
 * - Inyecta JSON-LD Schema.org para ayudar a motores generativos a entender el contenido.
 * - Inyecta meta keywords + article:tag/section desde taxonomía gen_content_tag.
 * - Schema type (BlogPosting/CaseStudy) desde gen_content_category (blog/case-study).
 *
 * Nota: Esto complementa a Yoast; no intenta reemplazar su schema.
 */

defined( 'ABSPATH' ) || exit;

/**
 * Determinar el tipo Schema.org según la categoría del post (gen_content_category: blog/case-study).
 */
function oakwood_gc_schema_type_for_post( $post_id ) {
	$terms = get_the_terms( $post_id, 'gen_content_category' );
	if ( ! is_array( $terms ) ) {
		return 'Article';
	}
	foreach ( $terms as $term ) {
		if ( $term && ! is_wp_error( $term ) && isset( $term->slug ) ) {
			if ( $term->slug === 'case-study' ) {
				return 'CaseStudy';
			}
			if ( $term->slug === 'blog' ) {
				return 'BlogPosting';
			}
		}
	}
	return 'Article';
}

/**
 * Obtener nombres de términos de gen_content_tag para keywords/tags (display).
 */
function oakwood_gc_get_tag_terms_for_post( $post_id ) {
	$terms = get_the_terms( $post_id, 'gen_content_tag' );
	if ( ! is_array( $terms ) ) {
		return array();
	}
	$names = array();
	foreach ( $terms as $term ) {
		if ( $term && ! is_wp_error( $term ) && isset( $term->name ) && trim( $term->name ) !== '' ) {
			$names[] = trim( $term->name );
		}
	}
	return array_values( array_unique( $names ) );
}

/**
 * Obtener el primary tag para un post.
 * Prioridad: ACF oakwood_primary_tag > Yoast primary term > primer tag.
 */
function oakwood_gc_get_primary_tag_for_post( $post_id ) {
	$tags = oakwood_gc_get_tag_terms_for_post( $post_id );
	if ( empty( $tags ) ) {
		return null;
	}
	// 1) ACF (dropdown en panel Primary Tag)
	$primary_id = function_exists( 'get_field' ) ? get_field( 'oakwood_primary_tag', $post_id ) : get_post_meta( $post_id, 'oakwood_primary_tag', true );
	if ( ! empty( $primary_id ) ) {
		$term = get_term( (int) $primary_id, 'gen_content_tag' );
		if ( $term && ! is_wp_error( $term ) && isset( $term->name ) && trim( $term->name ) !== '' ) {
			return trim( $term->name );
		}
	}
	// 2) Yoast primary term
	if ( function_exists( 'yoast_get_primary_term_id' ) ) {
		$primary_id = yoast_get_primary_term_id( 'gen_content_tag', $post_id );
		if ( ! empty( $primary_id ) ) {
			$term = get_term( (int) $primary_id, 'gen_content_tag' );
			if ( $term && ! is_wp_error( $term ) && isset( $term->name ) && trim( $term->name ) !== '' ) {
				return trim( $term->name );
			}
		}
	}
	return $tags[0];
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

	$tags         = oakwood_gc_get_tag_terms_for_post( $post_id );
	$primary_tag  = oakwood_gc_get_primary_tag_for_post( $post_id ) ?? '';

	// 1) Metadatos simples (útiles para parsers/LLMs)
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
	$schema_type = oakwood_gc_schema_type_for_post( $post_id );

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

