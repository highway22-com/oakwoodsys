<?php
/**
 * Plugin Name: Oakwood Blog
 * Plugin URI: https://oakwoodsys.com
 * Description: Registra el CPT "Gen Content" (gen_content) + taxonomía, agrega campos ACF (show_contact_section, related_bloqs) y los expone en WPGraphQL.
 * Version: 7.0.12
 * Author: Aetro
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: oakwood-blog
 *
 * Requiere: Advanced Custom Fields (ACF). Para GraphQL: WPGraphQL.
 */

defined( 'ABSPATH' ) || exit;

// Definición del grupo ACF (Related Bloqs).
require_once __DIR__ . '/acf-related-bloqs.php';

// GEO: schema + meta desde ACF (frontend).
require_once __DIR__ . '/geo-integration.php';

// Migración bloq → blog (una sola vez, datos existentes).
require_once __DIR__ . '/migrate-bloq-to-blog.php';

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
		'name'                  => _x( 'Gen Contents', 'post type general name', 'oakwood-blog' ),
		'singular_name'         => _x( 'Gen Content', 'post type singular name', 'oakwood-blog' ),
		'menu_name'             => _x( 'Gen Content', 'admin menu', 'oakwood-blog' ),
		'add_new'               => _x( 'Add New', 'gen content', 'oakwood-blog' ),
		'add_new_item'          => __( 'Add New Gen Content', 'oakwood-blog' ),
		'edit_item'             => __( 'Edit Gen Content', 'oakwood-blog' ),
		'new_item'              => __( 'New Gen Content', 'oakwood-blog' ),
		'view_item'             => __( 'View Gen Content', 'oakwood-blog' ),
		'search_items'          => __( 'Search Gen Contents', 'oakwood-blog' ),
		'not_found'             => __( 'No gen content found', 'oakwood-blog' ),
		'not_found_in_trash'    => __( 'No gen content found in trash', 'oakwood-blog' ),
	);

	$args = array(
		'label'                 => __( 'Gen Content', 'oakwood-blog' ),
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
		'name'              => _x( 'Gen Content Categories', 'taxonomy general name', 'oakwood-blog' ),
		'singular_name'     => _x( 'Gen Content Category', 'taxonomy singular name', 'oakwood-blog' ),
		'search_items'      => __( 'Search Categories', 'oakwood-blog' ),
		'all_items'         => __( 'All Categories', 'oakwood-blog' ),
		'edit_item'         => __( 'Edit Category', 'oakwood-blog' ),
		'update_item'       => __( 'Update Category', 'oakwood-blog' ),
		'add_new_item'      => __( 'Add New Category', 'oakwood-blog' ),
		'new_item_name'     => __( 'New Category Name', 'oakwood-blog' ),
		'menu_name'         => __( 'Categories', 'oakwood-blog' ),
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
 * Registrar taxonomía Tags para Gen Content (flexible: agregar/eliminar libremente).
 * Las categorías (Blog, Case Study, temas) se mantienen en gen_content_category.
 */
function oakwood_bloq_register_tag_taxonomy() {
	$labels = array(
		'name'                       => _x( 'Tags', 'taxonomy general name', 'oakwood-blog' ),
		'singular_name'              => _x( 'Tag', 'taxonomy singular name', 'oakwood-blog' ),
		'search_items'               => __( 'Search Tags', 'oakwood-blog' ),
		'all_items'                  => __( 'All Tags', 'oakwood-blog' ),
		'edit_item'                  => __( 'Edit Tag', 'oakwood-blog' ),
		'update_item'                => __( 'Update Tag', 'oakwood-blog' ),
		'add_new_item'               => __( 'Add New Tag', 'oakwood-blog' ),
		'new_item_name'              => __( 'New Tag Name', 'oakwood-blog' ),
		'menu_name'                  => __( 'Tags', 'oakwood-blog' ),
	);

	$args = array(
		'hierarchical'          => true,
		'labels'                => $labels,
		'show_ui'               => true,
		'show_admin_column'     => true,
		'query_var'             => true,
		'rewrite'               => array( 'slug' => 'gen-content-tag' ),
		'show_in_rest'          => true,
		'show_in_graphql'       => true,
		'graphql_single_name'   => 'GenContentTag',
		'graphql_plural_name'   => 'GenContentTags',
	);

	register_taxonomy( 'gen_content_tag', array( 'gen_content' ), $args );
}
add_action( 'init', 'oakwood_bloq_register_tag_taxonomy' );

/**
 * Ocultar selector "Parent" en Tags (todos los términos son planos).
 */
function oakwood_bloq_hide_tag_parent_selector() {
	$screen = get_current_screen();
	if ( ! $screen || $screen->post_type !== 'gen_content' ) {
		return;
	}
	echo '<style>
		.taxonomy-gen_content_tag .term-parent-wrap,
		.taxonomy-gen_content_tag .term-parent,
		#gen_content_tagdiv .term-parent-wrap,
		.taxonomy-gen_content_tag .form-field.term-parent-wrap {
			display: none !important;
		}
	</style>';
}
add_action( 'admin_head-post.php', 'oakwood_bloq_hide_tag_parent_selector' );
add_action( 'admin_head-post-new.php', 'oakwood_bloq_hide_tag_parent_selector' );

/**
 * Columna Primary Tag en la tabla de listado Gen Content.
 */
function oakwood_bloq_add_primary_tag_column( $columns ) {
	$new = array();
	foreach ( $columns as $key => $label ) {
		$new[ $key ] = $label;
		if ( $key === 'taxonomy-gen_content_tag' ) {
			$new['primary_tag'] = __( 'Primary Tag', 'oakwood-blog' );
		}
	}
	return $new;
}
function oakwood_bloq_render_primary_tag_column( $column, $post_id ) {
	if ( $column !== 'primary_tag' ) {
		return;
	}
	$primary = function_exists( 'oakwood_gc_get_primary_tag_for_post' ) ? oakwood_gc_get_primary_tag_for_post( $post_id ) : null;
	echo $primary ? esc_html( $primary ) : '—';
}
add_filter( 'manage_gen_content_posts_columns', 'oakwood_bloq_add_primary_tag_column' );
add_action( 'manage_gen_content_posts_custom_column', 'oakwood_bloq_render_primary_tag_column', 10, 2 );

add_action( 'init', 'oakwood_bloq_create_default_category_terms', 99 );
add_action( 'init', 'oakwood_bloq_create_default_tag_terms', 99 );

/**
 * Categorías: solo Blog y Case Study (tipo de contenido). ACF y queries dependen de estos slugs.
 */
function oakwood_bloq_get_default_category_terms() {
	return array(
		array( 'name' => 'Blog', 'slug' => 'blog' ),
		array( 'name' => 'Case Study', 'slug' => 'case-study' ),
	);
}

/**
 * Crear términos por defecto en gen_content_category (Blog, Case Study).
 */
function oakwood_bloq_create_default_category_terms() {
	if ( ! taxonomy_exists( 'gen_content_category' ) ) {
		return;
	}
	foreach ( oakwood_bloq_get_default_category_terms() as $term_data ) {
		if ( ! term_exists( $term_data['slug'], 'gen_content_category' ) ) {
			wp_insert_term( $term_data['name'], 'gen_content_category', array( 'slug' => $term_data['slug'] ) );
		}
	}
}

/**
 * Tags por defecto para Gen Content (topic/industry). Las 14 etiquetas filtrables.
 */
function oakwood_bloq_get_default_tag_terms() {
	return array(
		array( 'name' => 'High-Performance Computing (HPC)', 'slug' => 'high-performance-computing-hpc' ),
		array( 'name' => 'Data & AI Solutions', 'slug' => 'data-ai-solutions' ),
		array( 'name' => 'Cloud & Infrastructure', 'slug' => 'cloud-infrastructure' ),
		array( 'name' => 'Application Innovation', 'slug' => 'application-innovation' ),
		array( 'name' => 'Modern Work', 'slug' => 'modern-work' ),
		array( 'name' => 'Managed Services', 'slug' => 'managed-services' ),
		array( 'name' => 'Microsoft Licensing', 'slug' => 'microsoft-licensing' ),
		array( 'name' => 'Manufacturing', 'slug' => 'manufacturing' ),
		array( 'name' => 'Healthcare', 'slug' => 'healthcare' ),
		array( 'name' => 'Financial Services', 'slug' => 'financial-services' ),
		array( 'name' => 'Retail', 'slug' => 'retail' ),
		array( 'name' => 'Education/Public Sector', 'slug' => 'education-public-sector' ),
		array( 'name' => 'Electronic Design Automation (EDA)', 'slug' => 'electronic-design-automation-eda' ),
		array( 'name' => 'Other', 'slug' => 'other' ),
	);
}

/**
 * Crear términos por defecto en gen_content_tag.
 */
function oakwood_bloq_create_default_tag_terms() {
	if ( ! taxonomy_exists( 'gen_content_tag' ) ) {
		return;
	}
	foreach ( oakwood_bloq_get_default_tag_terms() as $term_data ) {
		if ( ! term_exists( $term_data['slug'], 'gen_content_tag' ) ) {
			wp_insert_term( $term_data['name'], 'gen_content_tag', array( 'slug' => $term_data['slug'] ) );
		}
	}
}

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
 * WPGraphQL: registrar campos showContactSection + tags + primaryTagName + relatedBloqs en el tipo GenContent.
 * tags y primaryTagName se derivan de la taxonomía gen_content_tag (tema/industry).
 * primaryTagName evita conflicto con el campo primaryTag de ACF (tipo PrimaryTag).
 *
 * Permite consultar:
 * genContent(id: "...") { showContactSection tags primaryTagName relatedBloqs { id title uri } relatedBloqIds relatedCaseStudies { id title uri } relatedCaseStudyIds }
 */
function oakwood_bloq_register_graphql_fields() {
	if ( ! function_exists( 'register_graphql_field' ) ) {
		return;
	}

	register_graphql_field(
		'GenContent',
		'tags',
		array(
			'type'        => array( 'list_of' => 'String' ),
			'description' => __( 'Tag names from gen_content_tag (for display).', 'oakwood-blog' ),
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
				return function_exists( 'oakwood_gc_get_tag_terms_for_post' ) ? oakwood_gc_get_tag_terms_for_post( $post_id ) : array();
			},
		)
	);

	register_graphql_field(
		'GenContent',
		'primaryTagName',
		array(
			'type'        => 'String',
			'description' => __( 'Primary tag name from gen_content_tag (ACF/Yoast or first tag). Avoids conflict with ACF primaryTag.', 'oakwood-blog' ),
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
				return function_exists( 'oakwood_gc_get_primary_tag_for_post' ) ? oakwood_gc_get_primary_tag_for_post( $post_id ) : null;
			},
		)
	);

	register_graphql_field(
		'GenContent',
		'showContactSection',
		array(
			'type'        => 'Boolean',
			'description' => __( 'Show contact section (ACF: show_contact_section).', 'oakwood-blog' ),
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
		'relatedBloqs',
		array(
			'type'        => array( 'list_of' => 'GenContent' ),
			'description' => __( 'Related Gen Content (ACF: related_bloqs).', 'oakwood-blog' ),
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

				// Construir lista solo con posts que existen, son gen_content y publicados (evita null en GraphQL).
				$result = array();
				foreach ( $ids as $id ) {
					$id = (int) $id;
					if ( $id <= 0 ) {
						continue;
					}
					$p = get_post( $id );
					if ( ! $p || ! isset( $p->post_type ) || $p->post_type !== 'gen_content' || $p->post_status !== 'publish' ) {
						continue;
					}
					$result[] = $p;
				}
				return $result;
			},
		)
	);

	register_graphql_field(
		'GenContent',
		'relatedBloqSlugs',
		array(
			'type'        => array( 'list_of' => 'String' ),
			'description' => __( 'Related Gen Content slugs (ACF: related_bloqs). To request full data by slug without resolving list_of GenContent.', 'oakwood-blog' ),
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

				$slugs = array();
				foreach ( $ids as $id ) {
					$id = (int) $id;
					if ( $id <= 0 ) {
						continue;
					}
					$p = get_post( $id );
					if ( ! $p || ! isset( $p->post_type ) || $p->post_type !== 'gen_content' || $p->post_status !== 'publish' ) {
						continue;
					}
					if ( ! empty( $p->post_name ) ) {
						$slugs[] = $p->post_name;
					}
				}
				return $slugs;
			},
		)
	);

	register_graphql_field(
		'GenContent',
		'relatedBloqIds',
		array(
			'type'        => array( 'list_of' => 'Int' ),
			'description' => __( 'Related database IDs (ACF: related_bloqs).', 'oakwood-blog' ),
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
			'description' => __( 'Related Gen Content with Case Study category (ACF: related_case_studies).', 'oakwood-blog' ),
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

				// Construir lista solo con posts que existen, son gen_content y publicados (evita null en GraphQL).
				$result = array();
				foreach ( $ids as $id ) {
					$id = (int) $id;
					if ( $id <= 0 ) {
						continue;
					}
					$p = get_post( $id );
					if ( ! $p || ! isset( $p->post_type ) || $p->post_type !== 'gen_content' || $p->post_status !== 'publish' ) {
						continue;
					}
					$result[] = $p;
				}
				return $result;
			},
		)
	);

	register_graphql_field(
		'GenContent',
		'relatedCaseStudyIds',
		array(
			'type'        => array( 'list_of' => 'Int' ),
			'description' => __( 'Related Case Study Gen Content database IDs (ACF: related_case_studies).', 'oakwood-blog' ),
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
			'description' => __( 'Title for <title>. ACF oakwood_head_title; if empty: post title.', 'oakwood-blog' ),
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
			'description' => __( 'Meta description. ACF oakwood_head_description; if empty: post excerpt.', 'oakwood-blog' ),
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
			'description' => __( 'Canonical URL for <head>. ACF oakwood_head_canonical; if empty: post permalink.', 'oakwood-blog' ),
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
			'description' => __( 'Geographic region (ACF oakwood_geo_region). E.g. US-MO.', 'oakwood-blog' ),
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
			'description' => __( 'Place name (ACF oakwood_geo_placename). E.g. St. Louis.', 'oakwood-blog' ),
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
			'description' => __( 'Lat;Long coordinates (ACF oakwood_geo_position).', 'oakwood-blog' ),
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
			'description' => __( 'JSON-LD ready for <script type="application/ld+json">: Organization (Oakwood) + Article/BlogPosting with GEO data.', 'oakwood-blog' ),
			'resolve'     => function ( $post ) {
				return oakwood_bloq_build_head_json_ld( $post );
			},
		)
	);
}
add_action( 'graphql_register_types', 'oakwood_bloq_register_graphql_fields' );

/**
 * Filtros where para genContents: categorySlug (blog/case-study) y tagSlug.
 * Permite: genContents(where: { categorySlug: "case-study", tagSlug: "data-ai-solutions" }) { nodes { ... } }
 */
function oakwood_bloq_register_gencontents_where_args() {
	if ( ! function_exists( 'register_graphql_field' ) ) {
		return;
	}
	register_graphql_field(
		'RootQueryToGenContentConnectionWhereArgs',
		'categorySlug',
		array(
			'type'        => 'String',
			'description' => __( 'Filter by gen_content_category slug (blog or case-study).', 'oakwood-blog' ),
		)
	);
	register_graphql_field(
		'RootQueryToGenContentConnectionWhereArgs',
		'tagSlug',
		array(
			'type'        => 'String',
			'description' => __( 'Filter by gen_content_tag slug (topic/industry).', 'oakwood-blog' ),
		)
	);
}
add_action( 'graphql_register_types', 'oakwood_bloq_register_gencontents_where_args' );

/**
 * Aplicar tax_query cuando categorySlug o tagSlug están en where (solo para gen_content).
 */
function oakwood_bloq_gencontents_connection_tax_query( $query_args, $source, $args, $context, $info ) {
	$post_type = $query_args['post_type'] ?? null;
	$is_gen_content = ( is_array( $post_type ) && in_array( 'gen_content', $post_type, true ) )
		|| $post_type === 'gen_content';
	if ( ! $is_gen_content ) {
		return $query_args;
	}

	$where = $args['where'] ?? array();
	$tax_queries = array();

	if ( ! empty( $where['categorySlug'] ) && is_string( $where['categorySlug'] ) ) {
		$tax_queries[] = array(
			'taxonomy' => 'gen_content_category',
			'field'    => 'slug',
			'terms'    => sanitize_text_field( $where['categorySlug'] ),
		);
	}
	if ( ! empty( $where['tagSlug'] ) && is_string( $where['tagSlug'] ) ) {
		$tax_queries[] = array(
			'taxonomy' => 'gen_content_tag',
			'field'    => 'slug',
			'terms'    => sanitize_text_field( $where['tagSlug'] ),
		);
	}

	if ( ! empty( $tax_queries ) ) {
		$query_args['tax_query'] = count( $tax_queries ) > 1
			? array_merge( array( 'relation' => 'AND' ), $tax_queries )
			: $tax_queries[0];
	}

	return $query_args;
}
add_filter( 'graphql_post_object_connection_query_args', 'oakwood_bloq_gencontents_connection_tax_query', 10, 5 );

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
	$schema_type = function_exists( 'oakwood_gc_schema_type_for_post' ) ? oakwood_gc_schema_type_for_post( $post_id ) : 'Article';

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
	$tags     = function_exists( 'oakwood_gc_get_tag_terms_for_post' ) ? oakwood_gc_get_tag_terms_for_post( $post_id ) : array();
	$primary  = ! empty( $tags ) ? $tags[0] : null;

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
	oakwood_bloq_register_tag_taxonomy();
	oakwood_bloq_create_default_category_terms();
	oakwood_bloq_create_default_tag_terms();
	flush_rewrite_rules();
}
register_activation_hook( __FILE__, 'oakwood_bloq_activate' );

function oakwood_bloq_deactivate() {
	flush_rewrite_rules();
}
register_deactivation_hook( __FILE__, 'oakwood_bloq_deactivate' );

