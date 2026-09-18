<?php
/**
 * Plugin Name: Oakwood Search
 * Plugin URI: https://oakwoodsys.com
 * Description: REST search over published WordPress pages, blogs, and case studies for the Angular navbar. Returns oakwoodsys.com paths (including /solutions/{category}/{slug} vanity URLs).
 * Version: 1.1.0
 * Author: Oakwood Systems
 * License: GPL v2 or later
 * Text Domain: oakwood-search
 */

defined( 'ABSPATH' ) || exit;

define( 'OAKWOOD_SEARCH_MIN_LENGTH', 2 );
define( 'OAKWOOD_SEARCH_DEFAULT_PER_PAGE', 15 );
define( 'OAKWOOD_SEARCH_MAX_PER_PAGE', 50 );
define( 'OAKWOOD_SEARCH_SNIPPET_LENGTH', 160 );

/**
 * REST: GET /wp-json/oakwood/v1/search?q=&page=1&per_page=15
 */
function oakwood_search_register_routes() {
	register_rest_route(
		'oakwood/v1',
		'/search',
		array(
			'methods'             => 'GET',
			'callback'            => 'oakwood_search_rest_search',
			'permission_callback' => '__return_true',
			'args'                => array(
				'q'        => array(
					'type'              => 'string',
					'sanitize_callback' => 'sanitize_text_field',
				),
				'page'     => array(
					'type'              => 'integer',
					'default'           => 1,
					'sanitize_callback' => 'absint',
				),
				'per_page' => array(
					'type'              => 'integer',
					'default'           => OAKWOOD_SEARCH_DEFAULT_PER_PAGE,
					'sanitize_callback' => 'absint',
				),
			),
		)
	);
}
add_action( 'rest_api_init', 'oakwood_search_register_routes' );

/**
 * @param WP_REST_Request $request Request.
 * @return WP_REST_Response
 */
function oakwood_search_rest_search( \WP_REST_Request $request ) {
	$q        = trim( (string) $request->get_param( 'q' ) );
	$page     = max( 1, (int) $request->get_param( 'page' ) );
	$per_page = (int) $request->get_param( 'per_page' );
	if ( $per_page < 1 ) {
		$per_page = OAKWOOD_SEARCH_DEFAULT_PER_PAGE;
	}
	$per_page = min( OAKWOOD_SEARCH_MAX_PER_PAGE, $per_page );

	if ( strlen( $q ) < OAKWOOD_SEARCH_MIN_LENGTH ) {
		return rest_ensure_response(
			array(
				'items'   => array(),
				'page'    => $page,
				'perPage' => $per_page,
				'total'   => 0,
				'hasMore' => false,
			)
		);
	}

	$query = new WP_Query(
		array(
			'post_type'           => array( 'page', 'gen_content' ),
			'post_status'         => 'publish',
			's'                   => $q,
			'has_password'        => false,
			'paged'               => $page,
			'posts_per_page'      => $per_page,
			'ignore_sticky_posts' => true,
			'no_found_rows'       => false,
			'meta_query'          => array(
				'relation' => 'OR',
				array(
					'key'     => '_yoast_wpseo_meta-robots-noindex',
					'compare' => 'NOT EXISTS',
				),
				array(
					'key'     => '_yoast_wpseo_meta-robots-noindex',
					'value'   => '1',
					'compare' => '!=',
				),
			),
		)
	);

	$items = array();
	foreach ( $query->posts as $post ) {
		if ( ! ( $post instanceof WP_Post ) ) {
			continue;
		}
		if ( oakwood_search_is_noindex( $post->ID ) ) {
			continue;
		}
		$items[] = oakwood_search_map_post( $post );
	}

	$total = (int) $query->found_posts;

	return rest_ensure_response(
		array(
			'items'   => $items,
			'page'    => $page,
			'perPage' => $per_page,
			'total'   => $total,
			'hasMore' => ( $page * $per_page ) < $total,
		)
	);
}

/**
 * @param int $post_id Post ID.
 * @return bool
 */
function oakwood_search_is_noindex( $post_id ) {
	$flag = (string) get_post_meta( (int) $post_id, '_yoast_wpseo_meta-robots-noindex', true );
	return $flag === '1';
}

/**
 * @param WP_Post $post Page or gen_content.
 * @return array{type:string,id:string,title:string,slug:string,link:string,snippet:string,image:string}
 */
function oakwood_search_map_post( WP_Post $post ) {
	$mapped = oakwood_search_post_type_and_link( $post );
	$image  = get_the_post_thumbnail_url( $post, 'medium' );

	return array(
		'type'    => $mapped['type'],
		'id'      => (string) $post->ID,
		'title'   => html_entity_decode( get_the_title( $post ), ENT_QUOTES, 'UTF-8' ),
		'slug'    => (string) $post->post_name,
		'link'    => $mapped['link'],
		'snippet' => oakwood_search_snippet( $post ),
		'image'   => is_string( $image ) ? $image : '',
	);
}

/**
 * @param WP_Post $post Page or gen_content.
 * @return array{type:string,link:string}
 */
function oakwood_search_post_type_and_link( WP_Post $post ) {
	if ( $post->post_type === 'gen_content' ) {
		$category = function_exists( 'oakwood_bloq_get_content_category_slug' )
			? oakwood_bloq_get_content_category_slug( $post->ID )
			: 'blog';
		$type     = $category === 'case-study' ? 'case-study' : 'blog';
		$link     = '';
		if ( function_exists( 'oakwood_bloq_angular_canonical_path' ) ) {
			$path = oakwood_bloq_angular_canonical_path( $post->ID );
			if ( is_string( $path ) && $path !== '' ) {
				$link = $path;
			}
		}
		if ( $link === '' ) {
			$slug = ltrim( (string) $post->post_name, '/' );
			$link = $type === 'case-study' ? '/resources/case-studies/' . $slug : '/blog/' . $slug;
		}
		return array(
			'type' => $type,
			'link' => $link,
		);
	}

	return array(
		'type' => 'page',
		'link' => oakwood_search_page_link( $post ),
	);
}

/**
 * Public Angular path: Yoast canonical (oakwoodsys.com) → solutions vanity map → page builder path.
 *
 * @param WP_Post $post Page.
 * @return string
 */
function oakwood_search_page_link( WP_Post $post ) {
	$canonical = oakwood_search_yoast_canonical_path( $post->ID );
	if ( $canonical !== '' && $canonical !== '/' ) {
		return $canonical;
	}

	$map  = oakwood_search_solutions_vanity_map();
	$slug = (string) $post->post_name;
	if ( $slug !== '' && isset( $map[ $slug ] ) ) {
		return $map[ $slug ];
	}

	if ( function_exists( 'oakwood_page_builder_page_frontend_path' ) ) {
		$path = oakwood_page_builder_page_frontend_path( $post->ID );
		if ( is_string( $path ) && $path !== '' ) {
			return $path;
		}
	}

	return '/' . ltrim( $slug, '/' );
}

/**
 * @param int $post_id Post ID.
 * @return string Path with leading slash, or empty if not an oakwoodsys.com canonical.
 */
function oakwood_search_yoast_canonical_path( $post_id ) {
	$canonical = '';

	if ( class_exists( 'YoastSEO' ) ) {
		try {
			$meta = YoastSEO()->meta->for_post( (int) $post_id );
			if ( $meta && ! empty( $meta->canonical ) ) {
				$canonical = (string) $meta->canonical;
			}
		} catch ( Throwable $e ) {
			unset( $e );
		}
	}

	if ( $canonical === '' ) {
		$canonical = (string) get_post_meta( (int) $post_id, '_yoast_wpseo_canonical', true );
	}

	$canonical = trim( $canonical );
	if ( $canonical === '' ) {
		return '';
	}

	if ( strpos( $canonical, '/' ) === 0 && strpos( $canonical, '//' ) !== 0 ) {
		$path = '/' . trim( $canonical, '/' );
		return $path === '/' ? '/' : $path;
	}

	$parsed = wp_parse_url( $canonical );
	if ( ! is_array( $parsed ) || empty( $parsed['path'] ) ) {
		return '';
	}

	$host = isset( $parsed['host'] ) ? strtolower( (string) $parsed['host'] ) : '';
	if ( $host !== '' && ! in_array( $host, array( 'oakwoodsys.com', 'www.oakwoodsys.com' ), true ) ) {
		return '';
	}

	$path = '/' . trim( (string) $parsed['path'], '/' );
	return $path === '/' ? '/' : $path;
}

/**
 * slug → /solutions/{category}/{slug} from CMS menu.json (same source as the Angular navbar).
 *
 * @return array<string,string>
 */
function oakwood_search_solutions_vanity_map() {
	static $map = null;
	if ( is_array( $map ) ) {
		return $map;
	}

	$map  = array();
	$menu = oakwood_search_load_menu_json();
	$solutions = ( is_array( $menu ) && isset( $menu['content']['solutions'] ) && is_array( $menu['content']['solutions'] ) )
		? $menu['content']['solutions']
		: array();

	foreach ( $solutions as $category => $items ) {
		if ( ! is_array( $items ) ) {
			continue;
		}
		$category_segment = $category === 'dataAndAnalytics' ? 'data-analytics' : (string) $category;
		foreach ( $items as $item ) {
			if ( ! is_array( $item ) ) {
				continue;
			}
			$raw = trim( (string) ( $item['link'] ?? $item['slug'] ?? '' ), '/' );
			if ( $raw === '' ) {
				continue;
			}
			$segments     = array_values( array_filter( explode( '/', $raw ) ) );
			$link_segment = $segments ? (string) $segments[ count( $segments ) - 1 ] : $raw;
			if ( $link_segment === '' ) {
				continue;
			}
			$map[ $link_segment ] = '/solutions/' . $category_segment . '/' . $link_segment;
		}
	}

	return $map;
}

/**
 * @return array<string,mixed>|null
 */
function oakwood_search_load_menu_json() {
	$path = '';
	if ( function_exists( 'oakwood_cms_file_path' ) ) {
		$path = oakwood_cms_file_path( 'menu' );
	}
	if ( $path === '' ) {
		$upload = wp_upload_dir();
		$path   = $upload['basedir'] . '/oakwood-cms/menu.json';
	}
	if ( ! is_readable( $path ) ) {
		return null;
	}
	$raw  = file_get_contents( $path );
	$data = is_string( $raw ) ? json_decode( $raw, true ) : null;
	return is_array( $data ) ? $data : null;
}

/**
 * @param WP_Post $post Page.
 * @return string
 */
function oakwood_search_snippet( WP_Post $post ) {
	$text = '';
	if ( has_excerpt( $post ) ) {
		$text = wp_strip_all_tags( get_the_excerpt( $post ) );
	}
	if ( $text === '' ) {
		$text = wp_strip_all_tags( (string) $post->post_content );
	}
	$text = preg_replace( '/\s+/u', ' ', $text );
	$text = trim( (string) $text );
	if ( function_exists( 'mb_substr' ) ) {
		if ( mb_strlen( $text ) > OAKWOOD_SEARCH_SNIPPET_LENGTH ) {
			$text = mb_substr( $text, 0, OAKWOOD_SEARCH_SNIPPET_LENGTH );
		}
	} elseif ( strlen( $text ) > OAKWOOD_SEARCH_SNIPPET_LENGTH ) {
		$text = substr( $text, 0, OAKWOOD_SEARCH_SNIPPET_LENGTH );
	}
	return $text;
}
