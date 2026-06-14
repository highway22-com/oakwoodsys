<?php
/**
 * Plugin Name: Oakwood Page With Styles API
 * Description: Custom REST endpoint to return rendered page content with styles and scripts.
 * Version: 1.4.2
 * Author: Oakwood
 */

defined('ABSPATH') || exit;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Public view URLs (Pages → oakwoodsys.com)
// ---------------------------------------------------------------------------

function oakwood_page_builder_public_site_url() {
	if ( function_exists( 'oakwood_cms_public_site_url' ) ) {
		return oakwood_cms_public_site_url();
	}
	return 'https://oakwoodsys.com';
}

function oakwood_page_builder_page_frontend_path( $post_id ) {
	$post = get_post( $post_id );
	if ( ! ( $post instanceof WP_Post ) || $post->post_type !== 'page' || $post->post_name === '' ) {
		return null;
	}
	$uri = get_page_uri( $post );
	if ( is_string( $uri ) && $uri !== '' ) {
		return '/' . trim( $uri, '/' );
	}
	return '/' . $post->post_name;
}

function oakwood_page_builder_public_view_url( $post_id ) {
	$path = oakwood_page_builder_page_frontend_path( $post_id );
	if ( $path === null ) {
		return null;
	}
	return rtrim( oakwood_page_builder_public_site_url(), '/' ) . $path;
}

function oakwood_page_builder_filter_page_link( $link, $post_id, $sample ) {
	unset( $sample );
	$url = oakwood_page_builder_public_view_url( (int) $post_id );
	return $url ? $url : $link;
}
add_filter( 'page_link', 'oakwood_page_builder_filter_page_link', 99, 3 );

function oakwood_page_builder_filter_preview_post_link( $preview_link, $post ) {
	if ( ! ( $post instanceof WP_Post ) || $post->post_type !== 'page' ) {
		return $preview_link;
	}
	$url = oakwood_page_builder_public_view_url( (int) $post->ID );
	return $url ? $url : $preview_link;
}
add_filter( 'preview_post_link', 'oakwood_page_builder_filter_preview_post_link', 99, 2 );

function oakwood_page_builder_page_row_actions( $actions, $post ) {
	if ( ! ( $post instanceof WP_Post ) || $post->post_type !== 'page' || $post->post_status !== 'publish' ) {
		return $actions;
	}
	$url = oakwood_page_builder_public_view_url( (int) $post->ID );
	if ( ! $url ) {
		return $actions;
	}
	$actions['view'] = sprintf(
		'<a href="%1$s" rel="bookmark" aria-label="%2$s">%3$s</a>',
		esc_url( $url ),
		esc_attr( sprintf( __( 'View &#8220;%s&#8221;' ), get_the_title( $post ) ) ),
		__( 'View' )
	);
	return $actions;
}
add_filter( 'page_row_actions', 'oakwood_page_builder_page_row_actions', 99, 2 );

function oakwood_page_builder_rest_prepare_page( $response, $post, $request ) {
	unset( $request );
	if ( ! ( $response instanceof WP_REST_Response ) || ! ( $post instanceof WP_Post ) || $post->post_type !== 'page' ) {
		return $response;
	}
	$url = oakwood_page_builder_public_view_url( (int) $post->ID );
	if ( $url ) {
		$data           = $response->get_data();
		$data['link']   = $url;
		$response->set_data( $data );
	}
	return $response;
}
add_filter( 'rest_prepare_page', 'oakwood_page_builder_rest_prepare_page', 99, 3 );

/**
 * Normalize a Yoast/public URL to a frontend path on oakwoodsys.com.
 *
 * @param string $url_or_path Absolute or relative URL.
 * @param int    $post_id     Post ID for fallback path.
 * @return string Path with leading slash (e.g. /27244-2).
 */
function oakwood_page_builder_seo_canonical_path( $url_or_path, $post_id ) {
	if ( is_string( $url_or_path ) && $url_or_path !== '' ) {
		$parsed = wp_parse_url( $url_or_path );
		if ( is_array( $parsed ) && ! empty( $parsed['path'] ) ) {
			$path = '/' . trim( $parsed['path'], '/' );
			return $path === '/' ? '/' : $path;
		}
		if ( strpos( $url_or_path, '/' ) === 0 ) {
			$path = '/' . trim( $url_or_path, '/' );
			return $path === '/' ? '/' : $path;
		}
	}

	$frontend = oakwood_page_builder_page_frontend_path( (int) $post_id );
	return $frontend ? $frontend : '/';
}

/**
 * Resolve Yoast OG / Twitter image URL for a post.
 *
 * @param int $post_id Post ID.
 * @return string Absolute image URL or empty string.
 */
function oakwood_page_builder_seo_og_image_url( $post_id ) {
	$attachment_id = (int) get_post_meta( $post_id, '_yoast_wpseo_opengraph-image-id', true );
	if ( $attachment_id <= 0 ) {
		$attachment_id = (int) get_post_meta( $post_id, '_yoast_wpseo_twitter-image-id', true );
	}
	if ( $attachment_id > 0 ) {
		$url = wp_get_attachment_image_url( $attachment_id, 'full' );
		if ( is_string( $url ) && $url !== '' ) {
			return $url;
		}
	}

	$meta_url = get_post_meta( $post_id, '_yoast_wpseo_opengraph-image', true );
	if ( is_string( $meta_url ) && $meta_url !== '' ) {
		return $meta_url;
	}

	$meta_url = get_post_meta( $post_id, '_yoast_wpseo_twitter-image', true );
	if ( is_string( $meta_url ) && $meta_url !== '' ) {
		return $meta_url;
	}

	$thumb = get_the_post_thumbnail_url( $post_id, 'full' );
	return is_string( $thumb ) ? $thumb : '';
}

/**
 * Default document title like WordPress (post title + site name).
 *
 * @param WP_Post $post Post object.
 * @return string
 */
function oakwood_page_builder_default_seo_title( WP_Post $post ) {
	$title = trim( get_the_title( $post ) );
	if ( $title === '' ) {
		return '';
	}
	$site_name = get_bloginfo( 'name' );
	if ( $site_name !== '' ) {
		return $title . ' | ' . $site_name;
	}
	return $title;
}

/**
 * Reject Yoast titles that are empty or only a site-name suffix (e.g. " | Site Name").
 *
 * @param string $title Candidate SEO title.
 * @return string Sanitized title or empty string.
 */
function oakwood_page_builder_sanitize_seo_title( $title ) {
	$title = trim( (string) $title );
	if ( $title === '' ) {
		return '';
	}
	if ( preg_match( '/^\s*\|/', $title ) ) {
		return '';
	}
	if ( preg_match( '/^[\s|]+$/', $title ) ) {
		return '';
	}
	$parts = explode( '|', $title, 2 );
	$main  = trim( $parts[0] );
	if ( function_exists( 'mb_strlen' ) ) {
		if ( mb_strlen( $main ) < 2 ) {
			return '';
		}
	} elseif ( strlen( $main ) < 2 ) {
		return '';
	}
	return $title;
}

/**
 * Extract plain text from the first H1 in post content.
 *
 * @param WP_Post $post Post object.
 * @return string
 */
function oakwood_page_builder_extract_h1_title( WP_Post $post ) {
	if ( ! is_string( $post->post_content ) || $post->post_content === '' ) {
		return '';
	}
	if ( ! preg_match( '/<h1[^>]*>(.*?)<\/h1>/is', $post->post_content, $matches ) ) {
		return '';
	}
	$text = wp_strip_all_tags( $matches[1] );
	$text = html_entity_decode( $text, ENT_QUOTES | ENT_HTML5, 'UTF-8' );
	return trim( $text );
}

/**
 * Humanize a post slug for display (e.g. 27244-2 → 27244 2).
 *
 * @param string $slug Post slug.
 * @return string
 */
function oakwood_page_builder_humanize_slug( $slug ) {
	$slug = str_replace( array( '-', '_' ), ' ', (string) $slug );
	$slug = trim( preg_replace( '/\s+/', ' ', $slug ) );
	if ( $slug === '' ) {
		return '';
	}
	return ucwords( $slug );
}

/**
 * Append site name when missing from a title fragment.
 *
 * @param string $title Title fragment.
 * @return string
 */
function oakwood_page_builder_title_with_site_name( $title ) {
	$title = trim( (string) $title );
	if ( $title === '' ) {
		return '';
	}
	$site_name = get_bloginfo( 'name' );
	if ( $site_name !== '' && stripos( $title, $site_name ) === false ) {
		return $title . ' | ' . $site_name;
	}
	return $title;
}

/**
 * SEO meta for headless Angular pages (Yoast SEO → REST `seo` object).
 *
 * @param int $post_id Post ID.
 * @return array{title:string,description:string,ogImage:string,keywords:string,slug:string,canonicalPath:string}
 */
function oakwood_page_builder_get_seo_meta( $post_id ) {
	$post_id = (int) $post_id;
	$post    = get_post( $post_id );

	if ( ! ( $post instanceof WP_Post ) ) {
		return array(
			'title'         => '',
			'description'   => '',
			'ogImage'       => '',
			'keywords'      => '',
			'slug'          => '',
			'canonicalPath' => '/',
		);
	}

	$title       = '';
	$description = '';
	$canonical   = '';
	$keywords    = trim( (string) get_post_meta( $post_id, '_yoast_wpseo_focuskw', true ) );
	$og_from_yoast = '';

	if ( class_exists( 'YoastSEO' ) ) {
		try {
			$meta = YoastSEO()->meta->for_post( $post_id );
			if ( $meta ) {
				if ( ! empty( $meta->title ) ) {
					$title = oakwood_page_builder_sanitize_seo_title( (string) $meta->title );
				}
				if ( ! empty( $meta->description ) ) {
					$description = (string) $meta->description;
				}
				if ( ! empty( $meta->canonical ) ) {
					$canonical = (string) $meta->canonical;
				}
				if ( isset( $meta->open_graph_images ) && is_array( $meta->open_graph_images ) && ! empty( $meta->open_graph_images ) ) {
					$first = $meta->open_graph_images[0];
					if ( is_object( $first ) && ! empty( $first->url ) ) {
						$og_from_yoast = (string) $first->url;
					}
				}
			}
		} catch ( Throwable $e ) {
			unset( $e );
		}
	}

	if ( $title === '' ) {
		$raw_title = trim( (string) get_post_meta( $post_id, '_yoast_wpseo_title', true ) );
		if ( $raw_title !== '' && class_exists( 'WPSEO_Replace_Vars' ) ) {
			$replacer = new WPSEO_Replace_Vars();
			$title    = oakwood_page_builder_sanitize_seo_title( $replacer->replace( $raw_title, $post ) );
		} elseif ( $raw_title !== '' ) {
			$title = oakwood_page_builder_sanitize_seo_title( $raw_title );
		}
	}

	if ( $title === '' ) {
		$h1 = oakwood_page_builder_extract_h1_title( $post );
		if ( $h1 !== '' ) {
			$title = oakwood_page_builder_title_with_site_name( $h1 );
		}
	}

	if ( $title === '' ) {
		$title = oakwood_page_builder_sanitize_seo_title( oakwood_page_builder_default_seo_title( $post ) );
	}

	if ( $title === '' ) {
		$humanized = oakwood_page_builder_humanize_slug( $post->post_name );
		if ( $humanized !== '' ) {
			$title = oakwood_page_builder_title_with_site_name( $humanized );
		}
	}

	$title = oakwood_page_builder_sanitize_seo_title( $title );

	if ( $description === '' ) {
		$description = trim( (string) get_post_meta( $post_id, '_yoast_wpseo_metadesc', true ) );
	}
	if ( $description === '' && has_excerpt( $post ) ) {
		$description = get_the_excerpt( $post );
	}
	if ( $description === '' ) {
		$description = wp_trim_words( wp_strip_all_tags( $post->post_content ), 30 );
	}

	if ( $canonical === '' ) {
		$canonical = trim( (string) get_post_meta( $post_id, '_yoast_wpseo_canonical', true ) );
	}

	$og_image = $og_from_yoast !== '' ? $og_from_yoast : oakwood_page_builder_seo_og_image_url( $post_id );

	$slug = $post->post_name;

	return array(
		'title'         => $title,
		'description'   => $description,
		'ogImage'       => $og_image,
		'keywords'      => $keywords,
		'slug'          => $slug,
		'canonicalPath' => oakwood_page_builder_seo_canonical_path( $canonical, $post_id ),
	);
}

function oakwood_cms_public_post_types() {
$post_types = get_post_types(array('public' => true), 'names');
unset($post_types['attachment']);
return array_values($post_types);
}

function oakwood_cms_normalize_request_path($path) {
$path = is_string($path) ? trim($path) : '';

if ($path === '') {
return '';
}

$parsed = wp_parse_url($path, PHP_URL_PATH);

if (is_string($parsed) && $parsed !== '') {
$path = $parsed;
}

return trim(rawurldecode($path), '/');
}

/**
 * Safe output buffer capture — always returns a string.
 */
function oakwood_cms_capture_output($callback) {
ob_start();

try {
call_user_func($callback);
} catch (Throwable $e) {
ob_end_clean();
return '';
}

$output = ob_get_clean();
return ($output !== false) ? $output : '';
}

/**
 * Parse <link> and <script> elements from an HTML fragment using a wrapped
 * full-document so DOMDocument doesn't mangle the markup.
 */
function oakwood_cms_extract_elements($html, $tag_name) {
$elements = array();

if (!is_string($html) || trim($html) === '') {
return $elements;
}

libxml_use_internal_errors(true);

$dom = new DOMDocument();

$wrapped = '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>'
. $html
. '</body></html>';

$loaded = $dom->loadHTML($wrapped, LIBXML_NOERROR | LIBXML_NOWARNING);

libxml_clear_errors();

if (!$loaded) {
return $elements;
}

foreach ($dom->getElementsByTagName($tag_name) as $node) {
if (!($node instanceof DOMElement)) {
continue;
}

$attributes = array();

foreach ($node->attributes as $attribute) {
$attributes[$attribute->nodeName] = html_entity_decode(
$attribute->nodeValue,
ENT_QUOTES,
'UTF-8'
);
}

$elements[] = array(
'attributes' => $attributes,
'content'    => trim(
html_entity_decode(
$node->textContent ?? '',
ENT_QUOTES,
'UTF-8'
)
),
);
}

return $elements;
}

/**
 * Extract <style> blocks with raw CSS (regex-based to avoid DOMDocument
 * stripping or encoding CSS content).
 */
function oakwood_cms_extract_style_tags_raw($html) {
$result = array();

if (!is_string($html) || trim($html) === '') {
return $result;
}

if (!preg_match_all(
'/<style\b([^>]*)>([\s\S]*?)<\/style>/i',
$html,
$matches,
PREG_SET_ORDER
)) {
return $result;
}

foreach ($matches as $match) {
$attr_str = isset($match[1]) ? $match[1] : '';
$css      = isset($match[2]) ? trim($match[2]) : '';

if ($css === '') {
continue;
}

$id    = null;
$media = null;

if (preg_match('/\bid=["\']([^"\']+)["\']/i', $attr_str, $id_match)) {
$id = html_entity_decode($id_match[1], ENT_QUOTES, 'UTF-8');
}

if (preg_match('/\bmedia=["\']([^"\']+)["\']/i', $attr_str, $media_match)) {
$media = html_entity_decode($media_match[1], ENT_QUOTES, 'UTF-8');
}

$result[] = array(
'id'    => $id,
'media' => $media,
'css'   => $css,
);
}

return $result;
}

/**
 * Given a public stylesheet URL, attempt to read the CSS text from the local
 * filesystem (wp-content/...) so the Angular app can scope every rule to
 * #wp-content-root without a client-side fetch round-trip.
 *
 * Returns the CSS string on success, or null when the file cannot be resolved
 * (e.g. a CDN URL or a file that does not exist on disk).
 */
function oakwood_cms_read_stylesheet_text($href) {
if (!is_string($href) || $href === '') {
return null;
}

$href_clean = strtok($href, '?#');

if (!is_string($href_clean)) {
return null;
}

$parsed   = parse_url($href_clean);
$url_path = isset($parsed['path']) ? $parsed['path'] : '';

if ($url_path === '') {
return null;
}

$wp_content_prefix = '/wp-content/';
if (strpos($url_path, $wp_content_prefix) !== 0) {
return null;
}

$relative  = substr($url_path, strlen($wp_content_prefix));
$file_path = WP_CONTENT_DIR . '/' . $relative;

if (!file_exists($file_path) || !is_readable($file_path)) {
return null;
}

$css = file_get_contents($file_path);
return ($css !== false && $css !== '') ? $css : null;
}

/**
 * Enrich each stylesheet entry with a 'css' key containing the file text so
 * the Angular client can scope the rules to #wp-content-root at injection time.
 */
function oakwood_cms_enrich_stylesheets_with_text($stylesheets) {
return array_map(function ($sheet) {
if (!isset($sheet['css'])) {
$sheet['css'] = oakwood_cms_read_stylesheet_text(
isset($sheet['href']) ? $sheet['href'] : ''
);
}
return $sheet;
}, $stylesheets);
}

function oakwood_cms_dedupe_stylesheets($stylesheets) {
$map = array();

foreach ($stylesheets as $item) {
$href = isset($item['href']) ? (string) $item['href'] : '';

if ($href === '') {
continue;
}

$id  = !empty($item['id']) ? (string) $item['id'] : '';
$key = $id . '|' . $href;

if (!isset($map[$key])) {
$map[$key] = $item;
}
}

return array_values($map);
}

function oakwood_cms_dedupe_inline_styles($inline_styles) {
$map = array();

foreach ($inline_styles as $item) {
$css = isset($item['css']) ? trim((string) $item['css']) : '';

if ($css === '') {
continue;
}

$id  = !empty($item['id']) ? (string) $item['id'] : '';
$key = $id !== '' ? $id : md5($css);

if (!isset($map[$key])) {
$map[$key] = $item;
}
}

return array_values($map);
}

/**
 * Admin-only assets (toolbar/editor/admin UI) should never be shipped to the
 * headless frontend response because they can override page CSS and distort
 * layout (e.g. top margin bump from admin-bar styles).
 */
function oakwood_cms_is_admin_asset($id, $href = '') {
$id = strtolower((string) $id);
$href = strtolower((string) $href);

$admin_id_tokens = array(
'admin-bar',
'dashicons',
'wp-components',
'wp-preferences',
'media-views',
'wpcode-admin-bar',
'yoast-seo-adminbar',
'wp-mail-smtp-admin-bar',
'wpforms-admin-bar',
'popup-maker-admin-bar',
);

foreach ($admin_id_tokens as $token) {
if ($id !== '' && strpos($id, $token) !== false) {
return true;
}
}

if (
strpos($href, '/wp-admin/') !== false ||
strpos($href, '/wp-includes/css/admin-bar') !== false ||
strpos($href, 'admin-bar.css') !== false
) {
return true;
}

return false;
}

function oakwood_cms_filter_frontend_stylesheets($stylesheets) {
return array_values(array_filter($stylesheets, function ($sheet) {
$id = isset($sheet['id']) ? $sheet['id'] : '';
$href = isset($sheet['href']) ? $sheet['href'] : '';
return !oakwood_cms_is_admin_asset($id, $href);
}));
}

function oakwood_cms_filter_frontend_inline_styles($inline_styles) {
return array_values(array_filter($inline_styles, function ($style) {
$id = isset($style['id']) ? strtolower((string) $style['id']) : '';

if ($id === '') {
return true;
}

$admin_inline_tokens = array(
'admin-bar-inline-css',
'wpforms-admin-bar-inline-css',
'wpcode-admin-bar',
);

foreach ($admin_inline_tokens as $token) {
if (strpos($id, $token) !== false) {
return false;
}
}

return true;
}));
}

function oakwood_cms_filter_frontend_scripts($scripts) {
return array_values(array_filter($scripts, function ($script) {
$id  = isset($script['id']) ? strtolower((string) $script['id']) : '';
$src = isset($script['src']) ? strtolower((string) $script['src']) : '';

if (
strpos($id, 'admin-bar') !== false ||
strpos($id, 'wpcode-admin-bar') !== false ||
strpos($id, 'popup-maker-admin-bar') !== false ||
strpos($src, '/wp-admin/') !== false ||
strpos($src, '/wp-includes/js/admin-bar') !== false
) {
return false;
}

return true;
}));
}

/**
 * Wrap block content with the same classes WordPress theme templates apply
 * around post content so global block-layout rules can match in headless UI.
 */
function oakwood_cms_wrap_block_content_for_headless($content_html, $page) {
if (!is_string($content_html) || trim($content_html) === '') {
return $content_html;
}

if (!($page instanceof WP_Post)) {
return $content_html;
}

if (!function_exists('has_blocks') || !has_blocks((int) $page->ID)) {
return $content_html;
}

// Avoid double wrapping if a wrapper was already introduced upstream.
if (strpos($content_html, 'wp-block-post-content') !== false) {
return $content_html;
}

return '<div class="entry-content wp-block-post-content has-global-padding is-layout-constrained wp-block-post-content-is-layout-constrained">'
. $content_html
. '</div>';
}

// ---------------------------------------------------------------------------
// Collect Otter / ThemeIsle block CSS
// ---------------------------------------------------------------------------

function oakwood_cms_collect_otter_assets($post_id) {
$result = array(
'stylesheets'  => array(),
'inlineStyles' => array(),
);

if (!is_numeric($post_id) || !function_exists('has_blocks') || !has_blocks((int) $post_id)) {
return $result;
}

$frontend_class = 'ThemeIsle\\GutenbergBlocks\\CSS\\Block_Frontend';
$handler_class  = 'ThemeIsle\\GutenbergBlocks\\CSS\\CSS_Handler';

if (!class_exists($frontend_class)) {
return $result;
}

$post_id  = (int) $post_id;
$frontend = $frontend_class::instance();

$otter_css = '';

if (method_exists($frontend, 'get_page_css_meta')) {
$otter_css = (string) $frontend->get_page_css_meta($post_id);
}

if ($otter_css === '' && method_exists($frontend, 'get_page_css_inline')) {
$otter_css = (string) $frontend->get_page_css_inline($post_id);
}

$otter_css = trim($otter_css);

if ($otter_css !== '') {
$result['inlineStyles'][] = array(
'id'    => 'otter-post-css-' . $post_id,
'media' => 'all',
'css'   => $otter_css,
);
}

if (
class_exists($handler_class) &&
method_exists($handler_class, 'has_css_file') &&
method_exists($handler_class, 'get_css_url') &&
$handler_class::has_css_file($post_id)
) {
$css_url = $handler_class::get_css_url($post_id);

if (is_string($css_url) && $css_url !== '') {
$result['stylesheets'][] = array(
'href'  => $css_url,
'id'    => 'otter-post-css-file-' . $post_id,
'rel'   => 'stylesheet',
'media' => 'all',
'type'  => 'text/css',
);
}
}

return $result;
}

// ---------------------------------------------------------------------------
// Collect Spectra / UAGB block CSS
// ---------------------------------------------------------------------------

function oakwood_cms_collect_uagb_assets($post_id) {
$result = array(
'stylesheets'  => array(),
'inlineStyles' => array(),
);

if (!is_numeric($post_id) || !function_exists('has_blocks') || !has_blocks((int) $post_id)) {
return $result;
}

$post_id    = (int) $post_id;
$upload_dir = wp_upload_dir();
$base_dir   = trailingslashit($upload_dir['basedir']);
$base_url   = trailingslashit($upload_dir['baseurl']);

$global_css_file = $base_dir . 'uag-plugin/custom-style-blocks.css';
$global_css_url  = $base_url . 'uag-plugin/custom-style-blocks.css';

if (file_exists($global_css_file)) {
$result['stylesheets'][] = array(
'href'  => $global_css_url,
'id'    => 'uagb-global-css',
'rel'   => 'stylesheet',
'media' => 'all',
'type'  => 'text/css',
);
}

$pattern = $base_dir . 'uag-plugin/assets/*/uag-css-' . $post_id . '.css';
$matches = glob($pattern);

if (!empty($matches) && is_array($matches)) {
$css_file = $matches[0];
$css_url  = $base_url . ltrim(
str_replace(
wp_normalize_path($base_dir),
'',
wp_normalize_path($css_file)
),
'/'
);

$result['stylesheets'][] = array(
'href'  => $css_url,
'id'    => 'uagb-post-css-' . $post_id,
'rel'   => 'stylesheet',
'media' => 'all',
'type'  => 'text/css',
);

return $result;
}

$spectra_meta_keys = array(
'_uagb_css',
'_uag_page_assets',
'_spectra_page_assets',
'uagb_style_timestamp',
);

foreach ($spectra_meta_keys as $meta_key) {
$inline_css = get_post_meta($post_id, $meta_key, true);

if (is_string($inline_css) && trim($inline_css) !== '') {
$result['inlineStyles'][] = array(
'id'    => 'uagb-post-inline-css-' . $post_id,
'media' => 'all',
'css'   => trim($inline_css),
);
break;
}
}

if (empty($result['inlineStyles'])) {
$dynamic_css = oakwood_cms_generate_uagb_dynamic_css($post_id);

if ($dynamic_css !== '') {
$result['inlineStyles'][] = array(
'id'    => 'uagb-post-dynamic-css-' . $post_id,
'media' => 'all',
'css'   => $dynamic_css,
);
}
}

return $result;
}

function oakwood_cms_generate_uagb_dynamic_css($post_id) {
$post_id = (int) $post_id;

if (class_exists('UAGB_Post_Assets')) {
try {
$post_assets = new UAGB_Post_Assets($post_id);

if (method_exists($post_assets, 'generate_assets')) {
$post_assets->generate_assets();
}

if (method_exists($post_assets, 'get_css_file_data')) {
$css_data = $post_assets->get_css_file_data();

if (is_array($css_data)) {
$combined = '';

foreach ($css_data as $css_chunk) {
if (is_string($css_chunk) && trim($css_chunk) !== '') {
$combined .= $css_chunk . "\n";
}
}

if (trim($combined) !== '') {
return trim($combined);
}
}
}

if (method_exists($post_assets, 'get_stylesheet')) {
$css = $post_assets->get_stylesheet();

if (is_string($css) && trim($css) !== '') {
return trim($css);
}
}
} catch (Throwable $e) {
// Silently fail — Spectra internals are not a public API.
}
}

return '';
}

// ---------------------------------------------------------------------------
// Elementor helpers (kept from working v1.3.0 — renders Elementor correctly)
// ---------------------------------------------------------------------------

/**
 * Whether the page is built with Elementor.
 */
function oakwood_cms_is_elementor(int $post_id) {
if (!did_action('elementor/loaded') || !class_exists('\Elementor\Plugin')) {
return false;
}
$documents = \Elementor\Plugin::$instance->documents ?? null;
if (!$documents) {
return false;
}
$document = $documents->get($post_id);
return $document && method_exists($document, 'is_built_with_elementor') && $document->is_built_with_elementor();
}

/**
 * Ensure Elementor enqueues its frontend assets before wp_head/wp_footer capture.
 */
function oakwood_cms_enqueue_builder_assets(int $post_id) {
if (did_action('elementor/loaded') && class_exists('\Elementor\Plugin')) {
$frontend = \Elementor\Plugin::$instance->frontend;
if ($frontend && method_exists($frontend, 'enqueue_styles')) {
$frontend->enqueue_styles();
}
if ($frontend && method_exists($frontend, 'enqueue_scripts')) {
$frontend->enqueue_scripts();
}
}
do_action('oakwood_cms_enqueue_builder_assets', $post_id);
}

/**
 * Render content. For Elementor pages use the builder API so document styles
 * (classic widget CSS + atomic base-desktop.css + per-document local-{id}-frontend-{device}.css)
 * are enqueued. The plain the_content filter omits the atomic/responsive layout CSS.
 */
function oakwood_cms_render_builder_content(WP_Post $page) {
if (oakwood_cms_is_elementor((int) $page->ID)) {
$frontend = \Elementor\Plugin::$instance->frontend;
if ($frontend && method_exists($frontend, 'get_builder_content_for_display')) {
$html = $frontend->get_builder_content_for_display((int) $page->ID, true);
if (is_string($html) && $html !== '') {
return $html;
}
}
}
return apply_filters('the_content', $page->post_content);
}

/**
 * Per-document Elementor CSS files that physically exist in uploads/elementor/css.
 * Deterministic safety net so atomic/responsive layout CSS is always returned even
 * if Elementor's runtime enqueue does not fire inside the REST context.
 *
 * @return array<int,array<string,string|null>>
 */
function oakwood_cms_elementor_css_assets(int $post_id) {
$assets = array();
$upload = wp_upload_dir();
if (empty($upload['basedir']) || empty($upload['baseurl'])) {
return $assets;
}

$css_dir = trailingslashit($upload['basedir']) . 'elementor/css';
$css_url = trailingslashit($upload['baseurl']) . 'elementor/css';

if (!is_dir($css_dir)) {
return $assets;
}

// base-desktop.css = atomic foundation (defines .e-flexbox-base display, --display, etc.)
$candidates = array('base-desktop.css', 'post-' . $post_id . '.css');
foreach (array('desktop', 'tablet', 'mobile') as $device) {
$candidates[] = 'local-' . $post_id . '-frontend-' . $device . '.css';
}

foreach ($candidates as $file) {
$path = $css_dir . '/' . $file;
if (!is_readable($path)) {
continue;
}
$version = (string) @filemtime($path);
$assets[] = array(
'href'  => $css_url . '/' . $file . ($version !== '' ? '?ver=' . $version : ''),
'id'    => 'oakwood-elementor-' . sanitize_title($file) . '-css',
'rel'   => 'stylesheet',
'media' => 'all',
'type'  => 'text/css',
);
}

return $assets;
}

// ---------------------------------------------------------------------------
// Main REST callback
// ---------------------------------------------------------------------------

function oakwood_cms_rendered_page_response(WP_REST_Request $request) {
global $post, $wp_query;

$admin_bar_filter_added = false;

if (is_user_logged_in()) {
add_filter('show_admin_bar', '__return_false');
$admin_bar_filter_added = true;
}

$request_path = oakwood_cms_normalize_request_path(
$request->get_param('path')
);

if ($request_path === '') {
return new WP_Error(
'oakwood_page_missing_path',
__('Missing path.', 'oakwood-cms'),
array('status' => 400)
);
}

$page = get_page_by_path(
$request_path,
OBJECT,
oakwood_cms_public_post_types()
);

if (!($page instanceof WP_Post)) {
return new WP_Error(
'oakwood_page_not_found',
__('WordPress page not found.', 'oakwood-cms'),
array('status' => 404)
);
}

// ---- Snapshot globals ----
$previous_post = $post;

if (!($wp_query instanceof WP_Query)) {
$wp_query = new WP_Query();
}

$previous_query_post        = isset($wp_query->post)              ? $wp_query->post              : null;
$previous_queried_object    = isset($wp_query->queried_object)    ? $wp_query->queried_object    : null;
$previous_queried_object_id = isset($wp_query->queried_object_id) ? $wp_query->queried_object_id : 0;
$previous_is_singular       = isset($wp_query->is_singular)       ? $wp_query->is_singular       : false;
$previous_is_page           = isset($wp_query->is_page)           ? $wp_query->is_page           : false;
$previous_is_single         = isset($wp_query->is_single)         ? $wp_query->is_single         : false;
$previous_is_404            = isset($wp_query->is_404)            ? $wp_query->is_404            : false;

// ---- Set up context ----
$post = $page;
setup_postdata($post);

$wp_query->post               = $post;
$wp_query->queried_object     = $post;
$wp_query->queried_object_id  = $post->ID;
$wp_query->is_singular        = true;
$wp_query->is_page            = ($post->post_type === 'page');
$wp_query->is_single          = ($post->post_type !== 'page');
$wp_query->is_404             = false;

// Trick plugins that guard on is_main_query() / wp_using_themes().
add_filter('wp_using_themes', '__return_true');

$the_posts_filter = static function ($posts) use ($page) {
return empty($posts) ? array($page) : $posts;
};
add_filter('the_posts', $the_posts_filter, 999);

// ---- Enqueue Elementor builder assets ----
// For Elementor pages: calls enqueue_styles/enqueue_scripts on the Elementor
// frontend object so its CSS is in $wp_styles before wp_head() is captured.
oakwood_cms_enqueue_builder_assets((int) $page->ID);

// ---- Render content ----
// For Elementor pages: uses get_builder_content_for_display() which enqueues
// the atomic/responsive CSS files (base-desktop.css, local-{id}-frontend-*.css).
// For all other pages: apply_filters('the_content') as normal.
$content_html = oakwood_cms_render_builder_content($page);
$content_html = oakwood_cms_wrap_block_content_for_headless($content_html, $page);

// Fire wp_enqueue_scripts so non-Elementor plugins enqueue their block assets.
if (!did_action('wp_enqueue_scripts')) {
do_action('wp_enqueue_scripts');
} else {
do_action('uagb_register_page_specific_styles', $post->ID);
do_action('kadence_blocks_render_inline_css', $post->ID);
}

// ---- Force-enqueue WP core block library styles ----
// In REST context these are never auto-enqueued because the normal WordPress
// template loop (which calls wp_enqueue_block_assets etc.) never runs.
// Without them, Gutenberg pages lose layout, colour, and typography CSS.
wp_enqueue_style('wp-block-library');
wp_enqueue_style('wp-block-library-theme');
wp_enqueue_style('global-styles');

// ---- Capture head + footer HTML ----
$head_html   = oakwood_cms_capture_output('wp_head');
$footer_html = oakwood_cms_capture_output('wp_footer');

$body_classes = array_values(array_unique(get_body_class()));

// ---- Restore globals ----
remove_filter('the_posts', $the_posts_filter, 999);
remove_filter('wp_using_themes', '__return_true');

wp_reset_postdata();

$post                         = $previous_post;
$wp_query->post               = $previous_query_post;
$wp_query->queried_object     = $previous_queried_object;
$wp_query->queried_object_id  = $previous_queried_object_id;
$wp_query->is_singular        = $previous_is_singular;
$wp_query->is_page            = $previous_is_page;
$wp_query->is_single          = $previous_is_single;
$wp_query->is_404             = $previous_is_404;

// ---- Collect stylesheets from head + footer + content ----
$all_links = array_merge(
oakwood_cms_extract_elements($head_html, 'link'),
oakwood_cms_extract_elements($footer_html, 'link'),
oakwood_cms_extract_elements($content_html, 'link')
);

$stylesheets = array_values(array_filter(array_map(function ($element) {
$attributes = isset($element['attributes']) ? $element['attributes'] : array();

if (empty($attributes['href'])) {
return null;
}

$rel = isset($attributes['rel']) ? strtolower(trim($attributes['rel'])) : 'stylesheet';

if ($rel !== 'stylesheet') {
return null;
}

return array(
'href'  => $attributes['href'],
'id'    => isset($attributes['id'])    ? $attributes['id']    : null,
'rel'   => isset($attributes['rel'])   ? $attributes['rel']   : 'stylesheet',
'media' => isset($attributes['media']) ? $attributes['media'] : null,
'type'  => isset($attributes['type'])  ? $attributes['type']  : null,
);
}, $all_links)));

$stylesheets = oakwood_cms_dedupe_stylesheets($stylesheets);

// ---- Collect inline styles from head + footer + content ----
$inline_styles = array_merge(
oakwood_cms_extract_style_tags_raw($head_html),
oakwood_cms_extract_style_tags_raw($footer_html),
oakwood_cms_extract_style_tags_raw($content_html)
);

$inline_styles = oakwood_cms_dedupe_inline_styles($inline_styles);

// ---- Deterministic Elementor per-document CSS files ----
// Adds base-desktop.css (atomic foundation) + post-{id}.css + responsive
// local-{id}-frontend-{device}.css files that exist on disk, even if
// Elementor's runtime enqueue didn't fire inside the REST context.
$elementor_assets = oakwood_cms_elementor_css_assets((int) $page->ID);
if (!empty($elementor_assets)) {
$stylesheets = oakwood_cms_dedupe_stylesheets(
array_merge($stylesheets, $elementor_assets)
);
}

// ---- Merge Otter / ThemeIsle assets ----
$otter_assets = oakwood_cms_collect_otter_assets($page->ID);

if (!empty($otter_assets['stylesheets'])) {
$stylesheets = oakwood_cms_dedupe_stylesheets(
array_merge($stylesheets, $otter_assets['stylesheets'])
);
}

if (!empty($otter_assets['inlineStyles'])) {
$inline_styles = oakwood_cms_dedupe_inline_styles(
array_merge($inline_styles, $otter_assets['inlineStyles'])
);
}

// ---- Merge Spectra / UAGB assets ----
$uagb_assets = oakwood_cms_collect_uagb_assets($page->ID);

if (!empty($uagb_assets['stylesheets'])) {
$stylesheets = oakwood_cms_dedupe_stylesheets(
array_merge($stylesheets, $uagb_assets['stylesheets'])
);
}

if (!empty($uagb_assets['inlineStyles'])) {
$inline_styles = oakwood_cms_dedupe_inline_styles(
array_merge($inline_styles, $uagb_assets['inlineStyles'])
);
}

// ---- Also pull directly from WP_Styles registry as a safety net ----
$extra_stylesheets = oakwood_cms_collect_wp_registered_styles($page->ID);

if (!empty($extra_stylesheets)) {
$stylesheets = oakwood_cms_dedupe_stylesheets(
array_merge($stylesheets, $extra_stylesheets)
);
}

// ---- Footer scripts ----
$footer_scripts = array_values(array_filter(array_map(function ($element) {
$content    = trim(isset($element['content'])    ? $element['content']    : '');
$attributes = isset($element['attributes']) ? $element['attributes'] : array();

if (empty($attributes['src']) && $content === '') {
return null;
}

return array(
'id'    => isset($attributes['id'])    ? $attributes['id']    : null,
'src'   => isset($attributes['src'])   ? $attributes['src']   : null,
'type'  => isset($attributes['type'])  ? $attributes['type']  : null,
'nonce' => isset($attributes['nonce']) ? $attributes['nonce'] : null,
'async' => array_key_exists('async', $attributes),
'defer' => array_key_exists('defer', $attributes),
'code'  => $content !== '' ? $content : null,
);
}, oakwood_cms_extract_elements($footer_html, 'script'))));

// ---- Enrich stylesheets with raw CSS text for client-side scoping ----
// The Angular app scopes every rule to #wp-content-root so WP styles cannot
// affect the navbar, footer, or any other Angular component.
$stylesheets = oakwood_cms_enrich_stylesheets_with_text($stylesheets);

// Remove admin-only assets from the API payload.
$stylesheets   = oakwood_cms_filter_frontend_stylesheets($stylesheets);
$inline_styles = oakwood_cms_filter_frontend_inline_styles($inline_styles);
$footer_scripts = oakwood_cms_filter_frontend_scripts($footer_scripts);

if ($admin_bar_filter_added) {
remove_filter('show_admin_bar', '__return_false');
}

return rest_ensure_response(array(
'path'          => $request_path,
'slug'          => $page->post_name,
'postType'      => $page->post_type,
'title'         => get_the_title($page),
'excerpt'       => has_excerpt($page) ? get_the_excerpt($page) : '',
'content'       => $content_html,
'permalink'     => get_permalink($page),
'bodyClasses'   => $body_classes,
'stylesheets'   => $stylesheets,
'inlineStyles'  => $inline_styles,
'footerScripts' => $footer_scripts,
'headHtml'      => $head_html,
'footerHtml'    => $footer_html,
'seo'           => oakwood_page_builder_get_seo_meta( (int) $page->ID ),
));
}

// ---------------------------------------------------------------------------
// Safety-net: read enqueued stylesheets directly from WP_Styles
// ---------------------------------------------------------------------------

function oakwood_cms_collect_wp_registered_styles($post_id) {
global $wp_styles;

$result = array();

if (!($wp_styles instanceof WP_Styles)) {
return $result;
}

$queue      = $wp_styles->queue;
$registered = $wp_styles->registered;

if (empty($queue) || !is_array($queue)) {
return $result;
}

$all_handles = oakwood_cms_resolve_style_handles($queue, $registered);

foreach ($all_handles as $handle) {
if (!isset($registered[$handle])) {
continue;
}

/** @var _WP_Dependency $dep */
$dep = $registered[$handle];
$src = $dep->src;

if (empty($src) || !is_string($src)) {
continue;
}

if (strpos($src, '//') === false && strpos($src, 'http') !== 0) {
$src = site_url($src);
}

$ver = $dep->ver;

if ($ver === null) {
$ver = $wp_styles->default_version;
}

if (!empty($ver)) {
$src = add_query_arg('ver', $ver, $src);
}

$media = !empty($dep->args) ? $dep->args : 'all';

$result[] = array(
'href'  => $src,
'id'    => $handle . '-css',
'rel'   => 'stylesheet',
'media' => $media,
'type'  => null,
);
}

return $result;
}

function oakwood_cms_resolve_style_handles($handles, $registered, &$seen = array()) {
$result = array();

foreach ($handles as $handle) {
if (isset($seen[$handle])) {
continue;
}

$seen[$handle] = true;

if (!isset($registered[$handle])) {
continue;
}

$deps = $registered[$handle]->deps;

if (!empty($deps) && is_array($deps)) {
$result = array_merge(
$result,
oakwood_cms_resolve_style_handles($deps, $registered, $seen)
);
}

$result[] = $handle;
}

return array_unique($result);
}

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

function oakwood_cms_register_rendered_page_routes() {
$route_args = array(
'methods'             => 'GET',
'callback'            => 'oakwood_cms_rendered_page_response',
'permission_callback' => '__return_true',
'args'                => array(
'path' => array(
'type'              => 'string',
'required'          => true,
'sanitize_callback' => 'sanitize_text_field',
),
),
);

register_rest_route('custom/v1',  '/rendered-page', $route_args);
register_rest_route('oakwood/v1', '/rendered-page', $route_args);
}

add_action('rest_api_init', 'oakwood_cms_register_rendered_page_routes');
