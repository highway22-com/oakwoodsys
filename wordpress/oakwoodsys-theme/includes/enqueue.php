<?php
/**
 * Enqueue fonts and theme styles (frontend + REST-rendered pages).
 *
 * @package OakwoodsysTheme
 */

defined( 'ABSPATH' ) || exit;

/**
 * Register font stylesheets.
 */
function oakwoodsys_theme_register_fonts() {
	$tokens = oakwoodsys_theme_get_tokens();
	$inter  = isset( $tokens['fonts']['inter']['googleUrl'] )
		? $tokens['fonts']['inter']['googleUrl']
		: 'https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap';
	$segoe  = isset( $tokens['fonts']['segoe']['cdnUrl'] )
		? $tokens['fonts']['segoe']['cdnUrl']
		: 'https://fonts.cdnfonts.com/css/segoe-ui-4';

	wp_register_style(
		'oakwoodsys-theme-font-inter',
		$inter,
		array(),
		null
	);
	wp_register_style(
		'oakwoodsys-theme-font-segoe',
		$segoe,
		array(),
		null
	);
}
add_action( 'wp_enqueue_scripts', 'oakwoodsys_theme_register_fonts', 5 );
add_action( 'enqueue_block_editor_assets', 'oakwoodsys_theme_register_fonts', 5 );

/**
 * Enqueue theme CSS on the frontend.
 */
function oakwoodsys_theme_enqueue_assets() {
	wp_enqueue_style( 'oakwoodsys-theme-font-inter' );
	wp_enqueue_style( 'oakwoodsys-theme-font-segoe' );

	wp_enqueue_style(
		'oakwoodsys-theme-tokens',
		OAKWOODSYS_THEME_URL . 'assets/css/tokens.css',
		array( 'oakwoodsys-theme-font-inter', 'oakwoodsys-theme-font-segoe' ),
		OAKWOODSYS_THEME_VERSION
	);

	wp_enqueue_style(
		'oakwoodsys-theme',
		OAKWOODSYS_THEME_URL . 'assets/css/typography.css',
		array( 'oakwoodsys-theme-tokens' ),
		OAKWOODSYS_THEME_VERSION
	);
}
add_action( 'wp_enqueue_scripts', 'oakwoodsys_theme_enqueue_assets', 20 );

/**
 * Enqueue theme CSS in the block editor.
 */
function oakwoodsys_theme_enqueue_editor_assets() {
	wp_enqueue_style( 'oakwoodsys-theme-font-inter' );
	wp_enqueue_style( 'oakwoodsys-theme-font-segoe' );

	wp_enqueue_style(
		'oakwoodsys-theme-tokens',
		OAKWOODSYS_THEME_URL . 'assets/css/tokens.css',
		array( 'oakwoodsys-theme-font-inter', 'oakwoodsys-theme-font-segoe' ),
		OAKWOODSYS_THEME_VERSION
	);

	wp_enqueue_style(
		'oakwoodsys-theme',
		OAKWOODSYS_THEME_URL . 'assets/css/typography.css',
		array( 'oakwoodsys-theme-tokens' ),
		OAKWOODSYS_THEME_VERSION
	);

	wp_enqueue_style(
		'oakwoodsys-theme-editor',
		OAKWOODSYS_THEME_URL . 'assets/css/editor.css',
		array( 'oakwoodsys-theme' ),
		OAKWOODSYS_THEME_VERSION
	);
}
add_action( 'enqueue_block_editor_assets', 'oakwoodsys_theme_enqueue_editor_assets', 20 );
