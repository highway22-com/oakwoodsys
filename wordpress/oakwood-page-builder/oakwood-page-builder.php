<?php
/**
 * Plugin Name: Oakwood Page With Styles API
 * Description: Custom REST endpoint to return rendered page content with styles and scripts.
 * Version: 1.3.2
 * Author: Oakwood
 */

defined('ABSPATH') || exit;

/**
 * URL del sitio público (Angular en oakwoodsys.com).
 *
 * @return string
 */
function oakwood_page_builder_public_site_url() {
	if (function_exists('oakwood_cms_public_site_url')) {
		return oakwood_cms_public_site_url();
	}
	return 'https://oakwoodsys.com';
}

/**
 * Ruta del frontend para una Page de WordPress (soporta jerarquía parent/child).
 *
 * @param int $post_id Post ID.
 * @return string|null Path con barra inicial, p. ej. /terms-of-service o /legal/privacy.
 */
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

/**
 * URL pública para "View" en el admin (Pages → oakwoodsys.com/{slug o path}).
 *
 * @param int $post_id Post ID.
 * @return string|null
 */
function oakwood_page_builder_public_view_url($post_id) {
	$path = oakwood_page_builder_page_frontend_path($post_id);
	if ($path === null) {
		return null;
	}
	return rtrim(oakwood_page_builder_public_site_url(), '/') . $path;
}

/**
 * Enlaces View/Preview del listado Pages → frontend Angular.
 *
 * @param string $link    Permalink generado por WordPress.
 * @param int    $post_id Post ID.
 * @param bool   $sample  Muestra de permalink.
 * @return string
 */
function oakwood_page_builder_filter_page_link($link, $post_id, $sample) {
	unset($sample);
	$url = oakwood_page_builder_public_view_url((int) $post_id);
	return $url ? $url : $link;
}
add_filter('page_link', 'oakwood_page_builder_filter_page_link', 99, 3);

/**
 * @param string  $preview_link Enlace de vista previa.
 * @param WP_Post $post         Post.
 * @return string
 */
function oakwood_page_builder_filter_preview_post_link($preview_link, $post) {
	if (!($post instanceof WP_Post) || $post->post_type !== 'page') {
		return $preview_link;
	}
	$url = oakwood_page_builder_public_view_url((int) $post->ID);
	return $url ? $url : $preview_link;
}
add_filter('preview_post_link', 'oakwood_page_builder_filter_preview_post_link', 99, 2);

/**
 * Fuerza "View" en el listado Pages (prioridad alta; no depende solo de page_link).
 *
 * @param array   $actions Acciones de fila.
 * @param WP_Post $post    Post.
 * @return array
 */
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
		esc_attr(
			sprintf(
				/* translators: %s: post title */
				__('View &#8220;%s&#8221;'),
				get_the_title($post)
			)
		),
		__('View')
	);
	return $actions;
}
add_filter('page_row_actions', 'oakwood_page_builder_page_row_actions', 99, 2);

/**
 * Editor de bloques: campo link en REST apunta al frontend público.
 *
 * @param WP_REST_Response $response Respuesta REST.
 * @param WP_Post          $post     Post.
 * @param WP_REST_Request  $request  Request.
 * @return WP_REST_Response
 */
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

function oakwood_cms_capture_output($callback) {
	ob_start();
	call_user_func($callback);
	return ob_get_clean();
}

function oakwood_cms_extract_elements($html, $tag_name) {
	$elements = array();

	if (!is_string($html) || $html === '') {
		return $elements;
	}

	libxml_use_internal_errors(true);

	$dom = new DOMDocument();

	$loaded = $dom->loadHTML(
		'<?xml encoding="utf-8" ?>' . $html,
		LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD
	);

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
			'content' => trim(
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

function oakwood_cms_extract_style_tags_raw($html) {
	$result = array();

	if (!is_string($html) || $html === '') {
		return $result;
	}

	if (!preg_match_all(
		'/<style\\b([^>]*)>([\\s\\S]*?)<\\/style>/i',
		$html,
		$matches,
		PREG_SET_ORDER
	)) {
		return $result;
	}

	foreach ($matches as $match) {
		$attr_str = isset($match[1]) ? $match[1] : '';
		$css = isset($match[2]) ? trim($match[2]) : '';

		if ($css === '') {
			continue;
		}

		$id = null;
		$media = null;

		if (preg_match('/\\bid=["\']([^"\']+)["\']/i', $attr_str, $id_match)) {
			$id = html_entity_decode($id_match[1], ENT_QUOTES, 'UTF-8');
		}

		if (preg_match('/\\bmedia=["\']([^"\']+)["\']/i', $attr_str, $media_match)) {
			$media = html_entity_decode($media_match[1], ENT_QUOTES, 'UTF-8');
		}

		$result[] = array(
			'id' => $id,
			'media' => $media,
			'css' => $css,
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

		$id = !empty($item['id']) ? (string) $item['id'] : '';
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

		$id = !empty($item['id']) ? (string) $item['id'] : '';
		$key = $id !== '' ? $id : md5($css);

		if (!isset($map[$key])) {
			$map[$key] = $item;
		}
	}

	return array_values($map);
}

function oakwood_cms_collect_otter_assets($post_id) {
	$result = array(
		'stylesheets' => array(),
		'inlineStyles' => array(),
	);

	if (!is_numeric($post_id) || !function_exists('has_blocks') || !has_blocks((int) $post_id)) {
		return $result;
	}

	$frontend_class = 'ThemeIsle\\GutenbergBlocks\\CSS\\Block_Frontend';
	$handler_class = 'ThemeIsle\\GutenbergBlocks\\CSS\\CSS_Handler';

	if (!class_exists($frontend_class)) {
		return $result;
	}

	$frontend = $frontend_class::instance();
	$post_id = (int) $post_id;
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
			'id' => 'otter-post-css-' . $post_id,
			'media' => 'all',
			'css' => $otter_css,
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
				'href' => $css_url,
				'id' => 'otter-post-css-file-' . $post_id,
				'rel' => 'stylesheet',
				'media' => 'all',
				'type' => 'text/css',
			);
		}
	}

	return $result;
}

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

	if (!($wp_query instanceof WP_Query)) {
		$wp_query = isset($GLOBALS['wp_query']) && ($GLOBALS['wp_query'] instanceof WP_Query)
			? $GLOBALS['wp_query']
			: new WP_Query();
	}

	$previous_post = $post;
	$previous_query_post = isset($wp_query->post) ? $wp_query->post : null;
	$previous_queried_object = isset($wp_query->queried_object)
		? $wp_query->queried_object
		: null;

	$previous_queried_object_id = isset($wp_query->queried_object_id)
		? $wp_query->queried_object_id
		: 0;

	$previous_is_singular = isset($wp_query->is_singular)
		? $wp_query->is_singular
		: false;

	$previous_is_page = isset($wp_query->is_page)
		? $wp_query->is_page
		: false;

	$previous_is_single = isset($wp_query->is_single)
		? $wp_query->is_single
		: false;

	$post = $page;

	setup_postdata($post);

	$wp_query->post = $post;
	$wp_query->queried_object = $post;
	$wp_query->queried_object_id = $post->ID;
	$wp_query->is_singular = true;
	$wp_query->is_page = ($post->post_type === 'page');
	$wp_query->is_single = ($post->post_type !== 'page');

	$content_html = apply_filters('the_content', $post->post_content);

	$head_html = oakwood_cms_capture_output(function () {
		wp_head();
	});

	$footer_html = oakwood_cms_capture_output(function () {
		wp_footer();
	});

	$body_classes = array_values(array_unique(get_body_class()));

	wp_reset_postdata();

	$post = $previous_post;

	$wp_query->post = $previous_query_post;
	$wp_query->queried_object = $previous_queried_object;
	$wp_query->queried_object_id = $previous_queried_object_id;
	$wp_query->is_singular = $previous_is_singular;
	$wp_query->is_page = $previous_is_page;
	$wp_query->is_single = $previous_is_single;

	$all_links = array_merge(
		oakwood_cms_extract_elements($head_html, 'link'),
		oakwood_cms_extract_elements($footer_html, 'link')
	);

	$stylesheets = array_values(array_filter(array_map(function ($element) {
		$attributes = isset($element['attributes'])
			? $element['attributes']
			: array();

		if (empty($attributes['href'])) {
			return null;
		}

		$rel = isset($attributes['rel'])
			? strtolower($attributes['rel'])
			: 'stylesheet';

		if ($rel !== 'stylesheet') {
			return null;
		}

		return array(
			'href' => $attributes['href'],
			'id' => isset($attributes['id']) ? $attributes['id'] : null,
			'rel' => isset($attributes['rel'])
				? $attributes['rel']
				: 'stylesheet',
			'media' => isset($attributes['media'])
				? $attributes['media']
				: null,
			'type' => isset($attributes['type'])
				? $attributes['type']
				: null,
		);
	}, $all_links)));

	$stylesheets = oakwood_cms_dedupe_stylesheets($stylesheets);

	$inline_styles = array_merge(
		oakwood_cms_extract_style_tags_raw($head_html),
		oakwood_cms_extract_style_tags_raw($footer_html)
	);

	$inline_styles = oakwood_cms_dedupe_inline_styles($inline_styles);

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

	$footer_scripts = array_values(array_filter(array_map(function ($element) {
		$content = trim(
			isset($element['content']) ? $element['content'] : ''
		);

		$attributes = isset($element['attributes'])
			? $element['attributes']
			: array();

		if (empty($attributes['src']) && $content === '') {
			return null;
		}

		return array(
			'id' => isset($attributes['id']) ? $attributes['id'] : null,
			'src' => isset($attributes['src']) ? $attributes['src'] : null,
			'type' => isset($attributes['type']) ? $attributes['type'] : null,
			'nonce' => isset($attributes['nonce']) ? $attributes['nonce'] : null,
			'async' => isset($attributes['async']),
			'defer' => isset($attributes['defer']),
			'code' => $content,
		);
	}, oakwood_cms_extract_elements($footer_html, 'script'))));

	$response = array(
		'path' => $request_path,
		'slug' => $page->post_name,
		'postType' => $page->post_type,
		'title' => get_the_title($page),
		'excerpt' => has_excerpt($page) ? get_the_excerpt($page) : '',
		'content' => $content_html,
		'permalink' => oakwood_page_builder_public_view_url($page->ID) ?: get_permalink($page),
		'bodyClasses' => $body_classes,
		'stylesheets' => $stylesheets,
		'inlineStyles' => $inline_styles,
		'footerScripts' => $footer_scripts,
		'headHtml' => $head_html,
		'footerHtml' => $footer_html,
	);

	return rest_ensure_response($response);
}

function oakwood_cms_register_rendered_page_routes() {
	$route_args = array(
		'methods' => 'GET',
		'callback' => 'oakwood_cms_rendered_page_response',
		'permission_callback' => '__return_true',
		'args' => array(
			'path' => array(
				'type' => 'string',
				'required' => true,
				'sanitize_callback' => 'sanitize_text_field',
			),
		),
	);

	register_rest_route('custom/v1', '/rendered-page', $route_args);

	register_rest_route('oakwood/v1', '/rendered-page', $route_args);
}

add_action(
	'rest_api_init',
	'oakwood_cms_register_rendered_page_routes'
);