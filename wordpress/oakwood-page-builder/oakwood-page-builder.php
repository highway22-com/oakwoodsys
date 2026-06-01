<?php
/**
 * Plugin Name: Oakwood Page With Styles API
 * Description: Custom REST endpoint to return rendered page content with styles and scripts.
 * Version: 1.4.1
 * Author: Oakwood
 */

defined('ABSPATH') || exit;

// ---------------------------------------------------------------------------
// Public view URLs (Pages → oakwoodsys.com)
// ---------------------------------------------------------------------------

function oakwood_page_builder_public_site_url() {
	if (function_exists('oakwood_cms_public_site_url')) {
		return oakwood_cms_public_site_url();
	}
	return 'https://oakwoodsys.com';
}

function oakwood_page_builder_page_frontend_path($post_id) {
	$post = get_post($post_id);
	if (!($post instanceof WP_Post) || $post->post_type !== 'page' || $post->post_name === '') {
		return null;
	}
	$uri = get_page_uri($post);
	if (is_string($uri) && $uri !== '') {
		return '/' . trim($uri, '/');
	}
	return '/' . $post->post_name;
}

function oakwood_page_builder_public_view_url($post_id) {
	$path = oakwood_page_builder_page_frontend_path($post_id);
	if ($path === null) {
		return null;
	}
	return rtrim(oakwood_page_builder_public_site_url(), '/') . $path;
}

function oakwood_page_builder_filter_page_link($link, $post_id, $sample) {
	unset($sample);
	$url = oakwood_page_builder_public_view_url((int) $post_id);
	return $url ? $url : $link;
}
add_filter('page_link', 'oakwood_page_builder_filter_page_link', 99, 3);

function oakwood_page_builder_filter_preview_post_link($preview_link, $post) {
	if (!($post instanceof WP_Post) || $post->post_type !== 'page') {
		return $preview_link;
	}
	$url = oakwood_page_builder_public_view_url((int) $post->ID);
	return $url ? $url : $preview_link;
}
add_filter('preview_post_link', 'oakwood_page_builder_filter_preview_post_link', 99, 2);

function oakwood_page_builder_page_row_actions($actions, $post) {
	if (!($post instanceof WP_Post) || $post->post_type !== 'page' || $post->post_status !== 'publish') {
		return $actions;
	}
	$url = oakwood_page_builder_public_view_url((int) $post->ID);
	if (!$url) {
		return $actions;
	}
	$actions['view'] = sprintf(
		'<a href="%1$s" rel="bookmark" aria-label="%2$s">%3$s</a>',
		esc_url($url),
		esc_attr(sprintf(__('View &#8220;%s&#8221;'), get_the_title($post))),
		__('View')
	);
	return $actions;
}
add_filter('page_row_actions', 'oakwood_page_builder_page_row_actions', 99, 2);

function oakwood_page_builder_rest_prepare_page($response, $post, $request) {
	unset($request);
	if (!($response instanceof WP_REST_Response) || !($post instanceof WP_Post) || $post->post_type !== 'page') {
		return $response;
	}
	$url = oakwood_page_builder_public_view_url((int) $post->ID);
	if ($url) {
		$data = $response->get_data();
		$data['link'] = $url;
		$response->set_data($data);
	}
	return $response;
}
add_filter('rest_prepare_page', 'oakwood_page_builder_rest_prepare_page', 99, 3);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

// Wrap in a full document so libxml parses it predictably.
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
 * Heuristic: meta value is likely CSS, not a timestamp or flag.
 */
function oakwood_cms_looks_like_css($value) {
	if (!is_string($value)) {
		return false;
	}
	$trimmed = trim($value);
	if ($trimmed === '') {
		return false;
	}
	if (preg_match('/^\d+$/', $trimmed)) {
		return false;
	}
	return strpos($trimmed, '{') !== false || strpos($trimmed, ':') !== false;
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

if (!empty($upload_dir['error'])) {
	return $result;
}

$base_dir = trailingslashit($upload_dir['basedir']);
$base_url = trailingslashit($upload_dir['baseurl']);

// ---- Global block stylesheet ----
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

// ---- Per-page CSS file (Spectra stores it in a blog-id subfolder) ----
$pattern = $base_dir . 'uag-plugin/assets/*/uag-css-' . $post_id . '.css';
$matches = glob($pattern);

$has_uagb_file = false;

if (!empty($matches) && is_array($matches)) {
$css_file = $matches[0];
if (is_readable($css_file) && filesize($css_file) > 0) {
$css_url = $base_url . ltrim(
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
$has_uagb_file = true;
}
}

// ---- Fallback: try known Spectra meta keys (only if no non-empty CSS file) ----
if (!$has_uagb_file) {
$spectra_meta_keys = array(
'_uagb_css',
'_uag_page_assets',
'_spectra_page_assets',
);

foreach ($spectra_meta_keys as $meta_key) {
$inline_css = get_post_meta($post_id, $meta_key, true);

if (oakwood_cms_looks_like_css($inline_css)) {
$result['inlineStyles'][] = array(
'id'    => 'uagb-post-inline-css-' . $post_id,
'media' => 'all',
'css'   => trim($inline_css),
);
break;
}
}

// ---- Last resort: generate CSS dynamically via Spectra's own method ----
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
}

return $result;
}

/**
 * Try to generate Spectra block CSS dynamically by calling its own internal
 * CSS-generation classes. Works with Spectra 2.x.
 */
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
// Main REST callback
// ---------------------------------------------------------------------------

function oakwood_cms_rendered_page_response(WP_REST_Request $request) {
global $post, $wp_query;

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
// FIX: snapshot is_404 so we can restore it — Claude's version set it but never restored it.
$previous_is_404            = isset($wp_query->is_404)            ? $wp_query->is_404            : false;

// ---- Set up context ----
$post = $page;
setup_postdata($post);

$wp_query->post              = $post;
$wp_query->queried_object    = $post;
$wp_query->queried_object_id = $post->ID;
$wp_query->is_singular       = true;
$wp_query->is_page           = ($post->post_type === 'page');
$wp_query->is_single         = ($post->post_type !== 'page');
$wp_query->is_404            = false;

$using_themes_filter = static function () {
	return true;
};
$the_posts_filter = static function ($posts) use ($page) {
	return empty($posts) ? array($page) : $posts;
};

add_filter('wp_using_themes', $using_themes_filter);
add_filter('the_posts', $the_posts_filter, 999);

$content_html = '';
$head_html    = '';
$footer_html  = '';
$body_classes = array();
$render_error = null;

try {
	$content_html = apply_filters('the_content', $post->post_content ?? '');

	if (!did_action('wp_enqueue_scripts')) {
		do_action('wp_enqueue_scripts');
	} else {
		do_action('uagb_register_page_specific_styles', $post->ID);
		do_action('kadence_blocks_render_inline_css', $post->ID);
	}

	$head_html   = oakwood_cms_capture_output('wp_head');
	$footer_html = oakwood_cms_capture_output('wp_footer');
	$body_classes = array_values(array_unique(get_body_class()));
} catch (Throwable $e) {
	$render_error = $e;
} finally {
	remove_filter('the_posts', $the_posts_filter, 999);
	remove_filter('wp_using_themes', $using_themes_filter);
	wp_reset_postdata();

	$post                        = $previous_post;
	$wp_query->post              = $previous_query_post;
	$wp_query->queried_object    = $previous_queried_object;
	$wp_query->queried_object_id = $previous_queried_object_id;
	$wp_query->is_singular       = $previous_is_singular;
	$wp_query->is_page           = $previous_is_page;
	$wp_query->is_single         = $previous_is_single;
	$wp_query->is_404            = $previous_is_404;
}

if ($render_error instanceof Throwable) {
	return new WP_Error(
		'oakwood_page_render_failed',
		__('Failed to render page content.', 'oakwood-cms'),
		array('status' => 500)
	);
}

// ---- Collect stylesheets from head + footer ----
$all_links = array_merge(
oakwood_cms_extract_elements($head_html, 'link'),
oakwood_cms_extract_elements($footer_html, 'link')
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

// ---- Collect inline styles from head + footer ----
$inline_styles = array_merge(
oakwood_cms_extract_style_tags_raw($head_html),
oakwood_cms_extract_style_tags_raw($footer_html)
);

$inline_styles = oakwood_cms_dedupe_inline_styles($inline_styles);

// ---- Also collect inline styles embedded in the content HTML itself ----
// (Kadence Blocks and some others print <style> directly inside post content)
$content_inline_styles = oakwood_cms_extract_style_tags_raw($content_html);

if (!empty($content_inline_styles)) {
$inline_styles = oakwood_cms_dedupe_inline_styles(
array_merge($inline_styles, $content_inline_styles)
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

return rest_ensure_response(array(
'path'          => $request_path,
'slug'          => $page->post_name,
'postType'      => $page->post_type,
'title'         => get_the_title($page),
'excerpt'       => has_excerpt($page) ? get_the_excerpt($page) : '',
'content'       => $content_html,
'permalink'     => ($page->post_type === 'page' ? oakwood_page_builder_public_view_url($page->ID) : null) ?: get_permalink($page),
'bodyClasses'   => $body_classes,
'stylesheets'   => $stylesheets,
'inlineStyles'  => $inline_styles,
'footerScripts' => $footer_scripts,
'headHtml'      => $head_html,
'footerHtml'    => $footer_html,
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

if (strpos($src, '//') !== 0 && strpos($src, 'http') !== 0 && strpos($src, 'https') !== 0) {
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