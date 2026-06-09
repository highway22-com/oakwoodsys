<?php
/**
 * Oakwood Theme — core loader (included by oakwood-theme.php).
 *
 * @package Oakwood_Theme
 */

defined( 'ABSPATH' ) || exit;

if ( ! defined( 'OAKWOOD_THEME_VERSION' ) ) {
	define( 'OAKWOOD_THEME_VERSION', '1.4.0' );
}

/**
 * @return string Plugin asset directory.
 */
function oakwood_theme_dir() {
	return defined( 'OAKWOOD_THEME_DIR' ) ? OAKWOOD_THEME_DIR : __DIR__;
}

/**
 * @return string Plugin asset URL.
 */
function oakwood_theme_url() {
	if ( defined( 'OAKWOOD_THEME_URL' ) ) {
		return OAKWOOD_THEME_URL;
	}
	return plugins_url( '', oakwood_theme_dir() . '/oakwood-theme.php' );
}

/**
 * Register List block styles (editor Styles panel on any theme).
 */
add_action(
	'init',
	static function () {
		if ( ! function_exists( 'register_block_style' ) ) {
			return;
		}

		$styles = array(
			array(
				'name'  => 'oakwood-dot-light',
				'label' => __( 'White dots', 'oakwood-theme' ),
			),
			array(
				'name'  => 'oakwood-dot',
				'label' => __( 'Blue dots', 'oakwood-theme' ),
			),
			array(
				'name'  => 'oakwood-checkmark',
				'label' => __( 'Green checkmarks', 'oakwood-theme' ),
			),
			array(
				'name'  => 'oakwood-checkmark-light',
				'label' => __( 'White checkmarks', 'oakwood-theme' ),
			),
		);

		foreach ( $styles as $style ) {
			register_block_style( 'core/list', $style );
		}
	},
	9
);

/**
 * Component class markers — patterns/blocks work outside full sections.
 *
 * @return string[]
 */
function oakwood_theme_component_markers() {
	return array(
		'oakwood-hero',
		'oakwood-achievements',
		'oakwood-investing',
		'oakwood-governance',
		'oakwood-licensing',
		'oakwood-helps',
		'oakwood-cta',
		'oakwood-accordion',
		'oakwood-cta-panel',
		'oakwood-cta-button',
		'oakwood-card',
		'oakwood-achievement-item',
		'oakwood-achievement-row',
		'oakwood-cards-row',
		'oakwood-section-intro',
		'oakwood-eyebrow',
		'oakwood-governance-text',
		'oakwood-check-icon',
		'oakwood-card-icon',
	);
}

/**
 * @param string $content Post content.
 */
function oakwood_theme_content_has_markup( $content ) {
	if ( ! is_string( $content ) || '' === $content ) {
		return false;
	}
	if ( false !== strpos( $content, 'oakwood-' ) ) {
		return true;
	}
	foreach ( oakwood_theme_component_markers() as $marker ) {
		if ( false !== strpos( $content, $marker ) ) {
			return true;
		}
	}
	return false;
}

/**
 * Whether Solutions CSS should load in the block editor (always — patterns, empty pages).
 */
function oakwood_theme_should_enqueue_editor_styles() {
	return true;
}

/**
 * Enqueue Inter and Segoe UI fonts, reusing oakwoodsys-theme when available.
 *
 * @return string[] Style handles enqueued as dependencies for solutions CSS.
 */
function oakwood_theme_enqueue_fonts() {
	if ( wp_style_is( 'oakwoodsys-theme-font-inter', 'registered' ) ) {
		wp_enqueue_style( 'oakwoodsys-theme-font-inter' );
		wp_enqueue_style( 'oakwoodsys-theme-font-segoe' );
		return array( 'oakwoodsys-theme-font-inter', 'oakwoodsys-theme-font-segoe' );
	}

	$inter_url = 'https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap';
	$segoe_url = 'https://fonts.cdnfonts.com/css/segoe-ui-4';

	if ( function_exists( 'oakwoodsys_theme_get_tokens' ) ) {
		$tokens = oakwoodsys_theme_get_tokens();
		if ( ! empty( $tokens['fonts']['inter']['googleUrl'] ) ) {
			$inter_url = $tokens['fonts']['inter']['googleUrl'];
		}
		if ( ! empty( $tokens['fonts']['segoe']['cdnUrl'] ) ) {
			$segoe_url = $tokens['fonts']['segoe']['cdnUrl'];
		}
	}

	if ( ! wp_style_is( 'oakwood-theme-font-inter', 'registered' ) ) {
		wp_register_style( 'oakwood-theme-font-inter', $inter_url, array(), null );
		wp_register_style( 'oakwood-theme-font-segoe', $segoe_url, array(), null );
	}

	wp_enqueue_style( 'oakwood-theme-font-inter' );
	wp_enqueue_style( 'oakwood-theme-font-segoe' );

	return array( 'oakwood-theme-font-inter', 'oakwood-theme-font-segoe' );
}

/**
 * Enqueue Solutions Template 2 CSS (inline from oakwood-theme folder).
 */
function oakwood_theme_enqueue_styles() {
	$css_file = oakwood_theme_dir() . '/oakwood-theme-styles.css';
	if ( ! is_readable( $css_file ) ) {
		return;
	}

	$handle    = 'oakwood-theme-solutions';
	$font_deps = oakwood_theme_enqueue_fonts();
	$css       = file_get_contents( $css_file );

	// Editor canvas: hide placehold.co cover img (same as frontend).
	$css .= "\n.editor-styles-wrapper .oakwood-achievements.wp-block-cover .wp-block-cover__image-background[src*=\"placehold\"],\n";
	$css .= ".block-editor-block-list__layout .oakwood-achievements.wp-block-cover .wp-block-cover__image-background[src*=\"placehold\"],\n";
	$css .= ".editor-styles-wrapper .oakwood-cta.wp-block-cover .wp-block-cover__image-background[src*=\"placehold\"],\n";
	$css .= ".editor-styles-wrapper .oakwood-cta.wp-block-cover .wp-block-cover__video-background[src*=\"placehold\"],\n";
	$css .= ".block-editor-block-list__layout .oakwood-cta.wp-block-cover .wp-block-cover__image-background[src*=\"placehold\"],\n";
	$css .= ".block-editor-block-list__layout .oakwood-cta.wp-block-cover .wp-block-cover__video-background[src*=\"placehold\"] {\n";
	$css .= "\tdisplay: none !important;\n}\n";

	wp_register_style( $handle, false, $font_deps, (string) filemtime( $css_file ) );
	wp_enqueue_style( $handle );
	wp_add_inline_style( $handle, $css );
}

/**
 * Enqueue accordion behaviour when accordion markup is present.
 *
 * @param string $content Post content.
 */
function oakwood_theme_maybe_enqueue_scripts( $content ) {
	if ( ! is_string( $content ) || false === strpos( $content, 'oakwood-accordion' ) ) {
		return;
	}

	$js_file = oakwood_theme_dir() . '/oakwood-theme-accordion.js';
	if ( ! is_readable( $js_file ) ) {
		return;
	}

	wp_enqueue_script(
		'oakwood-theme-accordion',
		oakwood_theme_url() . '/oakwood-theme-accordion.js',
		array(),
		(string) filemtime( $js_file ),
		true
	);
}

/**
 * Frontend — any page/post with Oakwood component markup.
 */
add_action(
	'wp_enqueue_scripts',
	static function () {
		if ( ! is_singular() ) {
			return;
		}
		$post = get_queried_object();
		if ( ! $post || empty( $post->post_content ) ) {
			return;
		}
		if ( ! oakwood_theme_content_has_markup( $post->post_content ) ) {
			return;
		}
		oakwood_theme_enqueue_styles();
		oakwood_theme_maybe_enqueue_scripts( $post->post_content );
	},
	100
);

/**
 * Block editor — match frontend in admin preview.
 */
add_action(
	'enqueue_block_editor_assets',
	static function () {
		if ( ! oakwood_theme_should_enqueue_editor_styles() ) {
			return;
		}
		oakwood_theme_enqueue_styles();

		global $post;
		$content = ( $post instanceof WP_Post ) ? (string) $post->post_content : '';
		oakwood_theme_maybe_enqueue_scripts( $content );
	},
	100
);

/**
 * Block editor iframe (WP 6.3+).
 */
add_action(
	'enqueue_block_assets',
	static function () {
		if ( ! is_admin() ) {
			return;
		}
		if ( ! oakwood_theme_should_enqueue_editor_styles() ) {
			return;
		}
		oakwood_theme_enqueue_styles();

		global $post;
		$content = ( $post instanceof WP_Post ) ? (string) $post->post_content : '';
		oakwood_theme_maybe_enqueue_scripts( $content );
	},
	100
);
