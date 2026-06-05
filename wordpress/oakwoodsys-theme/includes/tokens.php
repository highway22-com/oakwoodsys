<?php
/**
 * Design tokens loader — reads shared/design-tokens.json from the repo.
 *
 * @package OakwoodsysTheme
 */

defined( 'ABSPATH' ) || exit;

/**
 * Absolute path to design-tokens.json (repo shared/ or plugin fallback copy).
 *
 * @return string
 */
function oakwoodsys_theme_tokens_file_path() {
	$repo_shared = dirname( dirname( OAKWOODSYS_THEME_PATH ) ) . '/shared/design-tokens.json';
	if ( is_readable( $repo_shared ) ) {
		return $repo_shared;
	}
	$plugin_fallback = OAKWOODSYS_THEME_PATH . 'assets/design-tokens.json';
	if ( is_readable( $plugin_fallback ) ) {
		return $plugin_fallback;
	}
	return $repo_shared;
}

/**
 * Load and cache design tokens.
 *
 * @return array<string, mixed>
 */
function oakwoodsys_theme_get_tokens() {
	static $cache = null;
	if ( is_array( $cache ) ) {
		return $cache;
	}

	$path = oakwoodsys_theme_tokens_file_path();
	if ( ! is_readable( $path ) ) {
		$cache = array();
		return $cache;
	}

	$raw  = file_get_contents( $path );
	$data = json_decode( $raw, true );
	$cache = is_array( $data ) ? $data : array();
	return $cache;
}

/**
 * Resolve a color hex from token keys (e.g. "primary.700" or semantic "section-eyebrow").
 *
 * @param string $key Dot-separated path.
 * @return string|null
 */
function oakwoodsys_theme_color( $key ) {
	$tokens = oakwoodsys_theme_get_tokens();
	if ( empty( $tokens['colors'] ) ) {
		return null;
	}

	$parts  = explode( '.', $key );
	$cursor = $tokens['colors'];

	foreach ( $parts as $part ) {
		if ( ! is_array( $cursor ) || ! array_key_exists( $part, $cursor ) ) {
			if ( isset( $tokens['colors']['semantic'][ $key ] ) ) {
				return $tokens['colors']['semantic'][ $key ];
			}
			return null;
		}
		$cursor = $cursor[ $part ];
	}

	return is_string( $cursor ) ? $cursor : null;
}
