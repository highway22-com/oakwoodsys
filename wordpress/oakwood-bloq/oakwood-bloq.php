<?php
/**
 * Plugin Name: Oakwood Bloq
 * Plugin URI: https://oakwoodsys.com
 * Description: Registra el CPT "Gen Content" (gen_content) + taxonomía, agrega campos ACF (show_contact_section, related_bloqs) y los expone en WPGraphQL.
 * Version: 4.0.0
 * Author: Aetro
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: oakwood-bloq
 *
 * Requiere: Advanced Custom Fields (ACF). Para GraphQL: WPGraphQL.
 */

defined( 'ABSPATH' ) || exit;

// Definición del grupo ACF (Related Bloqs).
require_once __DIR__ . '/acf-related-bloqs.php';

// GEO: schema + meta desde ACF (frontend).
require_once __DIR__ . '/geo-integration.php';

// Integración Yoast SEO: que analice campos ACF (solo si Yoast + ACF están activos)
add_action( 'plugins_loaded', function () {
	if ( defined( 'WPSEO_VERSION' ) && function_exists( 'get_field' ) ) {
		require_once __DIR__ . '/yoast-acf-integration.php';
	}
}, 20 );

/**
 * Template HTML por defecto para el contenido de Gen Content (Overview, Business Challenge, Solution, Testimonial).
 * Se usa como placeholder cuando el contenido está vacío (nuevo post o Classic Editor).
 *
 * @return string
 */
function oakwood_bloq_get_default_content_template() {
	return "<!-- wp:heading {\"level\":2} -->\n<h2 class=\"wp-block-heading\">Overview</h2>\n<!-- /wp:heading -->\n\n<!-- wp:paragraph -->\n<p></p>\n<!-- /wp:paragraph -->\n\n<!-- wp:heading {\"level\":2} -->\n<h2 class=\"wp-block-heading\">Business Challenge</h2>\n<!-- /wp:heading -->\n\n<!-- wp:paragraph -->\n<p></p>\n<!-- /wp:paragraph -->\n\n<!-- wp:heading {\"level\":2} -->\n<h2 class=\"wp-block-heading\">Solution</h2>\n<!-- /wp:heading -->\n\n<!-- wp:paragraph -->\n<p></p>\n<!-- /wp:paragraph -->\n\n<!-- wp:heading {\"level\":2} -->\n<h2 class=\"wp-block-heading\">Testimonial</h2>\n<!-- /wp:heading -->\n\n<!-- wp:paragraph -->\n<p></p>\n<!-- /wp:paragraph -->";
}

/**
 * Registrar Custom Post Type "Gen Content"
 *
 * WPGraphQL: expone "genContent" / "genContents" en el schema (requiere plugin WPGraphQL).
 * Template por defecto: h2 Overview, Business Challenge, Solution, Testimonial (Block Editor y contenido vacío).
 */
function oakwood_bloq_register_post_type() {
	$labels = array(
		'name'                  => _x( 'Gen Contents', 'post type general name', 'oakwood-bloq' ),
		'singular_name'         => _x( 'Gen Content', 'post type singular name', 'oakwood-bloq' ),
		'menu_name'             => _x( 'Gen Content', 'admin menu', 'oakwood-bloq' ),
		'add_new'               => _x( 'Add New', 'gen content', 'oakwood-bloq' ),
		'add_new_item'          => __( 'Add New Gen Content', 'oakwood-bloq' ),
		'edit_item'             => __( 'Edit Gen Content', 'oakwood-bloq' ),
		'new_item'              => __( 'New Gen Content', 'oakwood-bloq' ),
		'view_item'             => __( 'View Gen Content', 'oakwood-bloq' ),
		'search_items'          => __( 'Search Gen Contents', 'oakwood-bloq' ),
		'not_found'             => __( 'No gen content found', 'oakwood-bloq' ),
		'not_found_in_trash'    => __( 'No gen content found in trash', 'oakwood-bloq' ),
	);

	$args = array(
		'label'                 => __( 'Gen Content', 'oakwood-bloq' ),
		'labels'                => $labels,
		// Incluir 'author' para poder asignar autor y exponerlo en WPGraphQL.
		'supports'              => array( 'title', 'editor', 'thumbnail', 'excerpt', 'custom-fields', 'author' ),
		'public'                => true,
		'show_ui'               => true,
		'show_in_menu'          => true,
		'menu_position'         => 6,
		'menu_icon'             => 'dashicons-media-document',
		'show_in_admin_bar'     => true,
		'show_in_nav_menus'     => true,
		'can_export'            => true,
		'has_archive'           => true,
		'exclude_from_search'   => false,
		'publicly_queryable'    => true,
		'capability_type'       => 'post',
		'show_in_rest'          => true,
		'rewrite'               => array( 'slug' => 'gen-content' ),
		'show_in_graphql'       => true,
		'graphql_single_name'   => 'GenContent',
		'graphql_plural_name'   => 'GenContents',
		// Template por defecto en Block Editor: h2 Overview, Business Challenge, Solution, Testimonial.
		'template'              => array(
			array( 'core/heading', array( 'level' => 2, 'content' => 'Overview' ) ),
			array( 'core/paragraph', array( 'content' => '' ) ),
			array( 'core/heading', array( 'level' => 2, 'content' => 'Business Challenge' ) ),
			array( 'core/paragraph', array( 'content' => '' ) ),
			array( 'core/heading', array( 'level' => 2, 'content' => 'Solution' ) ),
			array( 'core/paragraph', array( 'content' => '' ) ),
			array( 'core/heading', array( 'level' => 2, 'content' => 'Testimonial' ) ),
			array( 'core/paragraph', array( 'content' => '' ) ),
		),
	);

	register_post_type( 'gen_content', $args );
}
add_action( 'init', 'oakwood_bloq_register_post_type' );

/**
 * Al crear o guardar un Gen Content con contenido vacío, usar el template por defecto (Overview, Business Challenge, Solution, Testimonial).
 */
function oakwood_bloq_default_content_on_save( $data, $postarr ) {
	if ( ( $data['post_type'] ?? '' ) !== 'gen_content' ) {
		return $data;
	}
	$content = isset( $data['post_content'] ) ? trim( $data['post_content'] ) : '';
	if ( $content !== '' ) {
		return $data;
	}
	$data['post_content'] = oakwood_bloq_get_default_content_template();
	return $data;
}
add_filter( 'wp_insert_post_data', 'oakwood_bloq_default_content_on_save', 10, 2 );

/**
 * Registrar taxonomía para Gen Content.
 */
function oakwood_bloq_register_taxonomy() {
	$labels = array(
		'name'              => _x( 'Gen Content Categories', 'taxonomy general name', 'oakwood-bloq' ),
		'singular_name'     => _x( 'Gen Content Category', 'taxonomy singular name', 'oakwood-bloq' ),
		'search_items'      => __( 'Search Categories', 'oakwood-bloq' ),
		'all_items'         => __( 'All Categories', 'oakwood-bloq' ),
		'edit_item'         => __( 'Edit Category', 'oakwood-bloq' ),
		'update_item'       => __( 'Update Category', 'oakwood-bloq' ),
		'add_new_item'      => __( 'Add New Category', 'oakwood-bloq' ),
		'new_item_name'     => __( 'New Category Name', 'oakwood-bloq' ),
		'menu_name'         => __( 'Categories', 'oakwood-bloq' ),
	);

	$args = array(
		'hierarchical'      => true,
		'labels'            => $labels,
		'show_ui'           => true,
		'show_admin_column' => true,
		'query_var'         => true,
		'rewrite'           => array( 'slug' => 'gen-content-category' ),
		'show_in_rest'      => true,
		'show_in_graphql'       => true,
		'graphql_single_name'   => 'GenContentCategory',
		'graphql_plural_name'   => 'GenContentCategories',
	);

	register_taxonomy( 'gen_content_category', array( 'gen_content' ), $args );
}
add_action( 'init', 'oakwood_bloq_register_taxonomy' );

/**
 * Helpers: normalizar valores ACF de relación a IDs (database IDs).
 */
function oakwood_bloq_normalize_related_ids( $value ) {
	if ( empty( $value ) ) {
		return array();
	}

	// ACF post_object (multiple) con return_format=id devuelve array de ints.
	if ( is_numeric( $value ) ) {
		return array( (int) $value );
	}

	if ( $value instanceof WP_Post ) {
		return array( (int) $value->ID );
	}

	if ( is_array( $value ) ) {
		$ids = array();
		foreach ( $value as $item ) {
			if ( $item instanceof WP_Post ) {
				$ids[] = (int) $item->ID;
				continue;
			}
			if ( is_numeric( $item ) ) {
				$ids[] = (int) $item;
				continue;
			}
			if ( is_array( $item ) && isset( $item['ID'] ) ) {
				$ids[] = (int) $item['ID'];
				continue;
			}
		}
		return array_values( array_unique( array_filter( $ids ) ) );
	}

	return array();
}

/**
 * WPGraphQL: registrar campos showContactSection + typeContent + relatedBloqs en el tipo GenContent.
 *
 * Permite consultar:
 * genContent(id: "...") { showContactSection typeContent relatedBloqs { id title uri } relatedBloqIds relatedCaseStudies { id title uri } relatedCaseStudyIds }
 */
function oakwood_bloq_register_graphql_fields() {
	if ( ! function_exists( 'register_graphql_field' ) ) {
		return;
	}

	register_graphql_field(
		'GenContent',
		'showContactSection',
		array(
			'type'        => 'Boolean',
			'description' => __( 'Mostrar sección de contacto (ACF: show_contact_section).', 'oakwood-bloq' ),
			'resolve'     => function ( $post ) {
				$post_id = null;
				if ( is_object( $post ) && isset( $post->ID ) ) {
					$post_id = (int) $post->ID;
				} elseif ( is_array( $post ) && isset( $post['databaseId'] ) ) {
					$post_id = (int) $post['databaseId'];
				}
				if ( ! $post_id ) {
					return false;
				}

				$value = null;
				if ( function_exists( 'get_field' ) ) {
					$value = get_field( 'show_contact_section', $post_id );
				} else {
					$value = get_post_meta( $post_id, 'show_contact_section', true );
				}

				return (bool) $value;
			},
		)
	);

	register_graphql_field(
		'GenContent',
		'tags',
		array(
			'type'        => array( 'list_of' => 'String' ),
			'description' => __( 'Tags (ACF: tags).', 'oakwood-bloq' ),
			'resolve'     => function ( $post ) {
				$post_id = null;
				if ( is_object( $post ) && isset( $post->ID ) ) {
					$post_id = (int) $post->ID;
				} elseif ( is_array( $post ) && isset( $post['databaseId'] ) ) {
					$post_id = (int) $post['databaseId'];
				}
				if ( ! $post_id ) {
					return array();
				}
				$value = function_exists( 'get_field' ) ? get_field( 'tags', $post_id ) : get_post_meta( $post_id, 'tags', true );
				if ( ! is_array( $value ) ) {
					return array();
				}
				$value = array_map( function ( $t ) {
					return is_scalar( $t ) ? (string) $t : '';
				}, $value );
				return array_values( array_filter( $value, function ( $t ) {
					return $t !== '';
				} ) );
			},
		)
	);

	register_graphql_field(
		'GenContent',
		'primaryTag',
		array(
			'type'        => 'String',
			'description' => __( 'Tag principal (ACF: primary_tag).', 'oakwood-bloq' ),
			'resolve'     => function ( $post ) {
				$post_id = null;
				if ( is_object( $post ) && isset( $post->ID ) ) {
					$post_id = (int) $post->ID;
				} elseif ( is_array( $post ) && isset( $post['databaseId'] ) ) {
					$post_id = (int) $post['databaseId'];
				}
				if ( ! $post_id ) {
					return null;
				}
				$value = function_exists( 'get_field' ) ? get_field( 'primary_tag', $post_id ) : get_post_meta( $post_id, 'primary_tag', true );
				$value = is_scalar( $value ) ? (string) $value : '';
				return $value !== '' ? $value : null;
			},
		)
	);

	register_graphql_field(
		'GenContent',
		'typeContent',
		array(
			'type'        => 'String',
			'description' => __( 'Tipo de contenido (ACF: type_content).', 'oakwood-bloq' ),
			'resolve'     => function ( $post ) {
				$post_id = null;
				if ( is_object( $post ) && isset( $post->ID ) ) {
					$post_id = (int) $post->ID;
				} elseif ( is_array( $post ) && isset( $post['databaseId'] ) ) {
					$post_id = (int) $post['databaseId'];
				}
				if ( ! $post_id ) {
					return null;
				}

				$value = null;
				if ( function_exists( 'get_field' ) ) {
					$value = get_field( 'type_content', $post_id );
				} else {
					$value = get_post_meta( $post_id, 'type_content', true );
				}

				$value = is_scalar( $value ) ? (string) $value : '';
				return $value !== '' ? $value : null;
			},
		)
	);

	register_graphql_field(
		'GenContent',
		'relatedBloqs',
		array(
			'type'        => array( 'list_of' => 'GenContent' ),
			'description' => __( 'Gen Content relacionados (ACF: related_bloqs).', 'oakwood-bloq' ),
			'resolve'     => function ( $post ) {
				$post_id = null;
				if ( is_object( $post ) && isset( $post->ID ) ) {
					$post_id = (int) $post->ID;
				} elseif ( is_array( $post ) && isset( $post['databaseId'] ) ) {
					$post_id = (int) $post['databaseId'];
				}
				if ( ! $post_id ) {
					return array();
				}

				$value = null;
				if ( function_exists( 'get_field' ) ) {
					$value = get_field( 'related_bloqs', $post_id );
				} else {
					$value = get_post_meta( $post_id, 'related_bloqs', true );
				}

				$ids = oakwood_bloq_normalize_related_ids( $value );
				if ( empty( $ids ) ) {
					return array();
				}

				// Devolver posts (preservar orden del ACF).
				$posts = get_posts(
					array(
						'post_type'      => 'gen_content',
						'post__in'       => $ids,
						'orderby'        => 'post__in',
						'posts_per_page' => count( $ids ),
						'post_status'    => 'publish',
					)
				);

				return is_array( $posts ) ? $posts : array();
			},
		)
	);

	register_graphql_field(
		'GenContent',
		'relatedBloqIds',
		array(
			'type'        => array( 'list_of' => 'Int' ),
			'description' => __( 'Database IDs relacionados (ACF: related_bloqs).', 'oakwood-bloq' ),
			'resolve'     => function ( $post ) {
				$post_id = null;
				if ( is_object( $post ) && isset( $post->ID ) ) {
					$post_id = (int) $post->ID;
				} elseif ( is_array( $post ) && isset( $post['databaseId'] ) ) {
					$post_id = (int) $post['databaseId'];
				}
				if ( ! $post_id ) {
					return array();
				}

				$value = null;
				if ( function_exists( 'get_field' ) ) {
					$value = get_field( 'related_bloqs', $post_id );
				} else {
					$value = get_post_meta( $post_id, 'related_bloqs', true );
				}

				return oakwood_bloq_normalize_related_ids( $value );
			},
		)
	);

	register_graphql_field(
		'GenContent',
		'relatedCaseStudies',
		array(
			'type'        => array( 'list_of' => 'GenContent' ),
			'description' => __( 'Gen Content relacionados de categoría Case Study (ACF: related_case_studies).', 'oakwood-bloq' ),
			'resolve'     => function ( $post ) {
				$post_id = null;
				if ( is_object( $post ) && isset( $post->ID ) ) {
					$post_id = (int) $post->ID;
				} elseif ( is_array( $post ) && isset( $post['databaseId'] ) ) {
					$post_id = (int) $post['databaseId'];
				}
				if ( ! $post_id ) {
					return array();
				}

				$value = null;
				if ( function_exists( 'get_field' ) ) {
					$value = get_field( 'related_case_studies', $post_id );
				} else {
					$value = get_post_meta( $post_id, 'related_case_studies', true );
				}

				$ids = oakwood_bloq_normalize_related_ids( $value );
				if ( empty( $ids ) ) {
					return array();
				}

				$posts = get_posts(
					array(
						'post_type'      => 'gen_content',
						'post__in'       => $ids,
						'orderby'        => 'post__in',
						'posts_per_page' => count( $ids ),
						'post_status'    => 'publish',
					)
				);

				return is_array( $posts ) ? $posts : array();
			},
		)
	);

	register_graphql_field(
		'GenContent',
		'relatedCaseStudyIds',
		array(
			'type'        => array( 'list_of' => 'Int' ),
			'description' => __( 'Database IDs de Gen Content relacionados Case Study (ACF: related_case_studies).', 'oakwood-bloq' ),
			'resolve'     => function ( $post ) {
				$post_id = null;
				if ( is_object( $post ) && isset( $post->ID ) ) {
					$post_id = (int) $post->ID;
				} elseif ( is_array( $post ) && isset( $post['databaseId'] ) ) {
					$post_id = (int) $post['databaseId'];
				}
				if ( ! $post_id ) {
					return array();
				}

				$value = null;
				if ( function_exists( 'get_field' ) ) {
					$value = get_field( 'related_case_studies', $post_id );
				} else {
					$value = get_post_meta( $post_id, 'related_case_studies', true );
				}

				return oakwood_bloq_normalize_related_ids( $value );
			},
		)
	);

	// Head progresivo (fase 1): headTitle, headDescription, headCanonicalUrl — nombres propios para no chocar con otros plugins SEO
	register_graphql_field(
		'GenContent',
		'headTitle',
		array(
			'type'        => 'String',
			'description' => __( 'Título para <title>. ACF oakwood_head_title; si vacío: título del post.', 'oakwood-bloq' ),
			'resolve'     => function ( $post ) {
				$post_id = isset( $post->ID ) ? (int) $post->ID : ( isset( $post['databaseId'] ) ? (int) $post['databaseId'] : 0 );
				if ( ! $post_id ) {
					return null;
				}
				$v = function_exists( 'get_field' ) ? get_field( 'oakwood_head_title', $post_id ) : get_post_meta( $post_id, 'oakwood_head_title', true );
				if ( $v !== null && $v !== '' ) {
					return is_scalar( $v ) ? trim( (string) $v ) : null;
				}
				$p = get_post( $post_id );
				return $p ? get_the_title( $p ) : null;
			},
		)
	);

	register_graphql_field(
		'GenContent',
		'headDescription',
		array(
			'type'        => 'String',
			'description' => __( 'Meta description. ACF oakwood_head_description; si vacío: extracto del post.', 'oakwood-bloq' ),
			'resolve'     => function ( $post ) {
				$post_id = isset( $post->ID ) ? (int) $post->ID : ( isset( $post['databaseId'] ) ? (int) $post['databaseId'] : 0 );
				if ( ! $post_id ) {
					return null;
				}
				$v = function_exists( 'get_field' ) ? get_field( 'oakwood_head_description', $post_id ) : get_post_meta( $post_id, 'oakwood_head_description', true );
				if ( $v !== null && $v !== '' ) {
					return is_scalar( $v ) ? trim( (string) $v ) : null;
				}
				$p = get_post( $post_id );
				if ( ! $p ) {
					return null;
				}
				$excerpt = has_excerpt( $p ) ? $p->post_excerpt : '';
				if ( $excerpt !== '' ) {
					return $excerpt;
				}
				return wp_trim_words( wp_strip_all_tags( $p->post_content ), 30 );
			},
		)
	);

	register_graphql_field(
		'GenContent',
		'headCanonicalUrl',
		array(
			'type'        => 'String',
			'description' => __( 'URL canonica para <head>. ACF oakwood_head_canonical; si vacío: permalink del post.', 'oakwood-bloq' ),
			'resolve'     => function ( $post ) {
				$post_id = isset( $post->ID ) ? (int) $post->ID : ( isset( $post['databaseId'] ) ? (int) $post['databaseId'] : 0 );
				if ( ! $post_id ) {
					return null;
				}
				$v = function_exists( 'get_field' ) ? get_field( 'oakwood_head_canonical', $post_id ) : get_post_meta( $post_id, 'oakwood_head_canonical', true );
				if ( $v !== null && $v !== '' ) {
					return is_scalar( $v ) ? trim( (string) $v ) : null;
				}
				$p = get_post( $post_id );
				if ( ! $p ) {
					return null;
				}
				$permalink = get_permalink( $p );
				return is_string( $permalink ) ? $permalink : null;
			},
		)
	);

	// GEO (oakwood_geo_*): region, placename, position — para meta geo y JSON-LD
	register_graphql_field(
		'GenContent',
		'headGeoRegion',
		array(
			'type'        => 'String',
			'description' => __( 'Región geográfica (ACF oakwood_geo_region). Ej: US-MO.', 'oakwood-bloq' ),
			'resolve'     => function ( $post ) {
				$post_id = isset( $post->ID ) ? (int) $post->ID : ( isset( $post['databaseId'] ) ? (int) $post['databaseId'] : 0 );
				if ( ! $post_id ) {
					return null;
				}
				$v = function_exists( 'get_field' ) ? get_field( 'oakwood_geo_region', $post_id ) : get_post_meta( $post_id, 'oakwood_geo_region', true );
				return ( $v !== null && $v !== '' && is_scalar( $v ) ) ? trim( (string) $v ) : null;
			},
		)
	);

	register_graphql_field(
		'GenContent',
		'headGeoPlacename',
		array(
			'type'        => 'String',
			'description' => __( 'Nombre del lugar (ACF oakwood_geo_placename). Ej: St. Louis.', 'oakwood-bloq' ),
			'resolve'     => function ( $post ) {
				$post_id = isset( $post->ID ) ? (int) $post->ID : ( isset( $post['databaseId'] ) ? (int) $post['databaseId'] : 0 );
				if ( ! $post_id ) {
					return null;
				}
				$v = function_exists( 'get_field' ) ? get_field( 'oakwood_geo_placename', $post_id ) : get_post_meta( $post_id, 'oakwood_geo_placename', true );
				return ( $v !== null && $v !== '' && is_scalar( $v ) ) ? trim( (string) $v ) : null;
			},
		)
	);

	register_graphql_field(
		'GenContent',
		'headGeoPosition',
		array(
			'type'        => 'String',
			'description' => __( 'Coordenadas Lat;Long (ACF oakwood_geo_position).', 'oakwood-bloq' ),
			'resolve'     => function ( $post ) {
				$post_id = isset( $post->ID ) ? (int) $post->ID : ( isset( $post['databaseId'] ) ? (int) $post['databaseId'] : 0 );
				if ( ! $post_id ) {
					return null;
				}
				$v = function_exists( 'get_field' ) ? get_field( 'oakwood_geo_position', $post_id ) : get_post_meta( $post_id, 'oakwood_geo_position', true );
				return ( $v !== null && $v !== '' && is_scalar( $v ) ) ? trim( (string) $v ) : null;
			},
		)
	);

	// JSON-LD listo para inyectar en <head> (Organization + Article con GEO)
	register_graphql_field(
		'GenContent',
		'headJsonLdData',
		array(
			'type'        => 'String',
			'description' => __( 'JSON-LD listo para <script type="application/ld+json">: Organization (Oakwood) + Article/BlogPosting con datos GEO.', 'oakwood-bloq' ),
			'resolve'     => function ( $post ) {
				return oakwood_bloq_build_head_json_ld( $post );
			},
		)
	);
}
add_action( 'graphql_register_types', 'oakwood_bloq_register_graphql_fields' );

/**
 * Construye JSON-LD para Gen Content: Organization (Oakwood) + Article/BlogPosting con GEO.
 * Usado por el campo GraphQL headJsonLdData.
 *
 * @param mixed $post Objeto del resolver GraphQL.
 * @return string|null JSON string o null.
 */
function oakwood_bloq_build_head_json_ld( $post ) {
	$post_id = isset( $post->ID ) ? (int) $post->ID : ( isset( $post['databaseId'] ) ? (int) $post['databaseId'] : 0 );
	$p       = $post_id ? get_post( $post_id ) : null;
	if ( ! $p || ! ( $p instanceof WP_Post ) ) {
		return null;
	}

	$permalink   = get_permalink( $p );
	$site_name   = get_bloginfo( 'name' );
	$site_url    = home_url( '/' );
	$type_content = function_exists( 'get_field' ) ? get_field( 'type_content', $post_id ) : get_post_meta( $post_id, 'type_content', true );
	$schema_type  = function_exists( 'oakwood_gc_schema_type' ) ? oakwood_gc_schema_type( $type_content ) : 'Article';

	$description = function_exists( 'get_field' ) ? get_field( 'oakwood_head_description', $post_id ) : get_post_meta( $post_id, 'oakwood_head_description', true );
	$description = ( $description !== null && $description !== '' ) ? trim( (string) $description ) : '';
	if ( $description === '' ) {
		$description = has_excerpt( $p ) ? (string) $p->post_excerpt : '';
	}
	if ( $description === '' ) {
		$description = wp_trim_words( wp_strip_all_tags( $p->post_content ), 30 );
	}

	$image    = get_the_post_thumbnail_url( $p, 'full' );
	$image    = ( $image && is_string( $image ) ) ? $image : null;
	$author   = get_userdata( (int) $p->post_author );
	$author_name = $author ? (string) $author->display_name : '';
	$tags     = function_exists( 'oakwood_gc_get_acf_tags_for_post' ) ? oakwood_gc_get_acf_tags_for_post( $post_id ) : array();
	$primary  = function_exists( 'get_field' ) ? get_field( 'primary_tag', $post_id ) : get_post_meta( $post_id, 'primary_tag', true );
	$primary  = ( $primary !== null && $primary !== '' ) ? trim( (string) $primary ) : null;
	if ( $primary ) {
		$tags = array_values( array_unique( array_merge( array( $primary ), $tags ) ) );
	}

	$geo_region    = function_exists( 'get_field' ) ? get_field( 'oakwood_geo_region', $post_id ) : get_post_meta( $post_id, 'oakwood_geo_region', true );
	$geo_placename = function_exists( 'get_field' ) ? get_field( 'oakwood_geo_placename', $post_id ) : get_post_meta( $post_id, 'oakwood_geo_placename', true );
	$geo_position  = function_exists( 'get_field' ) ? get_field( 'oakwood_geo_position', $post_id ) : get_post_meta( $post_id, 'oakwood_geo_position', true );
	$geo_region    = ( $geo_region !== null && $geo_region !== '' && is_scalar( $geo_region ) ) ? trim( (string) $geo_region ) : null;
	$geo_placename = ( $geo_placename !== null && $geo_placename !== '' && is_scalar( $geo_placename ) ) ? trim( (string) $geo_placename ) : null;
	$geo_position  = ( $geo_position !== null && $geo_position !== '' && is_scalar( $geo_position ) ) ? trim( (string) $geo_position ) : null;

	$organization = array(
		'@type' => 'Organization',
		'@id'   => $site_url . '#organization',
		'name'  => $site_name !== '' ? $site_name : 'Oakwood Systems',
		'url'   => $site_url,
	);
	$place_parts = array();
	if ( $geo_placename ) {
		$place_parts['name'] = $geo_placename;
	}
	if ( $geo_region ) {
		$place_parts['containedInPlace'] = array( '@type' => 'AdministrativeArea', 'name' => $geo_region );
	}
	if ( $geo_position ) {
		$parts = array_map( 'trim', explode( ';', $geo_position ) );
		if ( count( $parts ) >= 2 ) {
			$place_parts['geo'] = array( '@type' => 'GeoCoordinates', 'latitude' => $parts[0], 'longitude' => $parts[1] );
		}
	}
	if ( ! empty( $place_parts ) ) {
		$organization['areaServed'] = array_merge( array( '@type' => 'Place' ), $place_parts );
	}

	$article = array(
		'@context'        => 'https://schema.org',
		'@type'           => $schema_type,
		'@id'             => $permalink ? ( $permalink . '#article' ) : null,
		'url'             => $permalink,
		'headline'        => get_the_title( $p ),
		'description'     => $description !== '' ? $description : null,
		'datePublished'   => get_the_date( DATE_W3C, $p ),
		'dateModified'    => get_the_modified_date( DATE_W3C, $p ),
		'inLanguage'      => get_bloginfo( 'language' ),
		'keywords'        => ! empty( $tags ) ? $tags : null,
		'about'           => $primary ? array( '@type' => 'Thing', 'name' => $primary ) : null,
		'image'           => $image ? array( $image ) : null,
		'author'          => $author_name !== '' ? array( '@type' => 'Person', 'name' => $author_name ) : null,
		'publisher'       => array( '@id' => $site_url . '#organization' ),
		'mainEntityOfPage'=> $permalink ? array( '@type' => 'WebPage', '@id' => $permalink ) : null,
	);
	if ( $geo_placename || $geo_region || $geo_position ) {
		$place = array( '@type' => 'Place' );
		if ( $geo_placename ) {
			$place['name'] = $geo_placename;
		}
		if ( $geo_region ) {
			$place['containedInPlace'] = array( '@type' => 'AdministrativeArea', 'name' => $geo_region );
		}
		if ( $geo_position ) {
			$parts = array_map( 'trim', explode( ';', $geo_position ) );
			if ( count( $parts ) >= 2 ) {
				$place['geo'] = array( '@type' => 'GeoCoordinates', 'latitude' => $parts[0], 'longitude' => $parts[1] );
			}
		}
		if ( count( $place ) > 1 ) {
			$article['contentLocation'] = $place;
		}
	}
	$article = array_filter( $article, static function ( $v ) {
		return $v !== null && $v !== '';
	} );

	return wp_json_encode( array( '@context' => 'https://schema.org', '@graph' => array( $organization, $article ) ), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES );
}

/**
 * Flush rewrite rules al activar/desactivar.
 */
function oakwood_bloq_activate() {
	oakwood_bloq_register_post_type();
	oakwood_bloq_register_taxonomy();
	flush_rewrite_rules();
}
register_activation_hook( __FILE__, 'oakwood_bloq_activate' );

function oakwood_bloq_deactivate() {
	flush_rewrite_rules();
}
register_deactivation_hook( __FILE__, 'oakwood_bloq_deactivate' );

