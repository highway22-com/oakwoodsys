<?php
/**
 * Oakwood Theme — core loader (included by oakwood-theme.php).
 *
 * @package Oakwood_Theme
 */

defined( 'ABSPATH' ) || exit;

/**
 * Inter stack for editor-font-family and theme presets (must be a literal stack, not var()).
 *
 * @return string
 */
function oak_font_family_inter() {
	if ( function_exists( 'oakwoodsys_theme_get_tokens' ) ) {
		$tokens = oakwoodsys_theme_get_tokens();
		if ( ! empty( $tokens['fonts']['inter']['family'] ) ) {
			return $tokens['fonts']['inter']['family'];
		}
	}
	return '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
}

/**
 * Segoe UI stack for editor-font-family and theme presets (must be a literal stack, not var()).
 *
 * @return string
 */
function oak_font_family_segoe() {
	if ( function_exists( 'oakwoodsys_theme_get_tokens' ) ) {
		$tokens = oakwoodsys_theme_get_tokens();
		if ( ! empty( $tokens['fonts']['segoe']['family'] ) ) {
			return $tokens['fonts']['segoe']['family'];
		}
	}
	return '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", Arial, sans-serif';
}

/**
 * Register Inter and Segoe UI font stylesheets.
 */
function oak_register_fonts() {
	if ( function_exists( 'oakwoodsys_theme_register_fonts' ) ) {
		oakwoodsys_theme_register_fonts();
		return;
	}

	if ( wp_style_is( 'oakwoodsys-theme-font-inter', 'registered' ) ) {
		return;
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

	if ( ! wp_style_is( 'oak-font-inter', 'registered' ) ) {
		wp_register_style( 'oak-font-inter', $inter_url, array(), null );
		wp_register_style( 'oak-font-segoe', $segoe_url, array(), null );
	}
}
add_action( 'wp_enqueue_scripts', 'oak_register_fonts', 5 );
add_action( 'enqueue_block_editor_assets', 'oak_register_fonts', 5 );
add_action( 'enqueue_block_assets', 'oak_register_fonts', 5 );

/**
 * Enqueue Inter and Segoe UI fonts, reusing oakwoodsys-theme when available.
 *
 * @return string[] Style handles enqueued as dependencies for Oakwood CSS.
 */
function oak_enqueue_fonts() {
	if ( function_exists( 'oakwoodsys_theme_register_fonts' ) ) {
		oakwoodsys_theme_register_fonts();
	}

	if ( wp_style_is( 'oakwoodsys-theme-font-inter', 'registered' ) ) {
		wp_enqueue_style( 'oakwoodsys-theme-font-inter' );
		wp_enqueue_style( 'oakwoodsys-theme-font-segoe' );
		return array( 'oakwoodsys-theme-font-inter', 'oakwoodsys-theme-font-segoe' );
	}

	oak_register_fonts();

	wp_enqueue_style( 'oak-font-inter' );
	wp_enqueue_style( 'oak-font-segoe' );

	return array( 'oak-font-inter', 'oak-font-segoe' );
}

/* ============================================================
   1. ENQUEUE CSS + JS
   ============================================================ */
function oak_enqueue_frontend() {
	$font_deps = oak_enqueue_fonts();
	wp_enqueue_style( 'oak-styles', OAK_URL . 'assets/css/oak.css', $font_deps, OAK_VER );
	wp_enqueue_style( 'oak-acc', OAK_URL . 'blocks/accordion-item/style.css', array( 'oak-styles' ), OAK_VER );
	wp_enqueue_script( 'oak-acc-js', OAK_URL . 'blocks/accordion-item/accordion.js', array(), OAK_VER, true );
}
add_action( 'wp_enqueue_scripts', 'oak_enqueue_frontend' );

function oak_enqueue_editor() {
	$font_deps = oak_enqueue_fonts();
	wp_enqueue_style( 'oak-styles', OAK_URL . 'assets/css/oak.css', $font_deps, OAK_VER );
	wp_enqueue_style( 'oak-acc', OAK_URL . 'blocks/accordion-item/style.css', array( 'oak-styles' ), OAK_VER );
}
add_action( 'enqueue_block_editor_assets', 'oak_enqueue_editor' );

function oak_enqueue_block_assets() {
	if ( ! is_admin() ) {
		return;
	}
	$font_deps = oak_enqueue_fonts();
	wp_enqueue_style( 'oak-styles', OAK_URL . 'assets/css/oak.css', $font_deps, OAK_VER );
	wp_enqueue_style( 'oak-acc', OAK_URL . 'blocks/accordion-item/style.css', array( 'oak-styles' ), OAK_VER );
}
add_action( 'enqueue_block_assets', 'oak_enqueue_block_assets' );

/* ============================================================
   2. BLOCK STYLES
   ============================================================ */
function oak_register_block_styles() {
	if ( ! function_exists( 'register_block_style' ) ) {
		return;
	}

	$group = array(
		'oak-hero', 'oak-investing', 'oak-governance', 'oak-achievements',
		'oak-licensing', 'oak-helps', 'oak-cta-wrap', 'oak-cta-inner',
		'oak-card', 'oak-hero-feature-item', 'oak-achievement-item',
		'oak-acc-item', 'oak-acc-summary', 'oak-acc-icon', 'oak-acc-body',
	);
	foreach ( $group as $name ) {
		register_block_style( 'core/group', array( 'name' => $name, 'label' => $name ) );
	}
	register_block_style( 'core/columns', array( 'name' => 'oak-cards-3', 'label' => 'oak-cards-3' ) );
	register_block_style( 'core/list', array( 'name' => 'oak-checklist', 'label' => 'oak-checklist' ) );
	register_block_style( 'core/list', array( 'name' => 'oak-checklist-green', 'label' => 'oak-checklist-green' ) );
	register_block_style( 'core/cover', array( 'name' => 'oak-hero', 'label' => 'oak-hero' ) );
	register_block_style( 'core/image', array( 'name' => 'oak-card-icon', 'label' => 'oak-card-icon' ) );
	register_block_style( 'core/heading', array( 'name' => 'oak-acc-title', 'label' => 'oak-acc-title' ) );

	register_block_style( 'core/group', array(
		'name'  => 'oak-cta-bg-home',
		'label' => 'CTA: Home background',
	) );
	register_block_style( 'core/group', array(
		'name'  => 'oak-cta-bg-industries',
		'label' => 'CTA: Industries background',
	) );
	register_block_style( 'core/group', array(
		'name'  => 'oak-cta-bg-services',
		'label' => 'CTA: Services background',
	) );
}
add_action( 'init', 'oak_register_block_styles' );

/* ============================================================
   3. BLOCK CATEGORY
   ============================================================ */
function oak_block_categories( $categories ) {
	foreach ( $categories as $cat ) {
		if ( isset( $cat['slug'] ) && $cat['slug'] === 'oakwood' ) {
			return $categories;
		}
	}
	return array_merge( array(
		array( 'slug' => 'oakwood', 'title' => 'Oakwood Systems', 'icon' => null ),
	), $categories );
}
add_filter( 'block_categories_all', 'oak_block_categories', 5, 1 );

/* ============================================================
   4. PATTERNS
   ============================================================ */
function oak_register_patterns() {
	if ( ! function_exists( 'register_block_pattern' ) ) {
		return;
	}

	register_block_pattern_category( 'oakwood', array( 'label' => 'Oakwood Systems' ) );

	$patterns = array(
		array(
			'file'        => 'patterns/solutions-template-1.php',
			'slug'        => 'oakwood-theme/solutions-template-1',
			'title'       => 'Solutions Template 1',
			'description' => 'Oakwood Azure solutions page — Hero, Cards, Governance, Sticky Impact, Services, Why Oakwood, Achievements, CTA.',
			'keywords'    => array( 'oakwood', 'azure', 'solutions', 'hero', 'landing' ),
		),
		array(
			'file'        => 'patterns/copilot-full-page.php',
			'slug'        => 'oakwood-theme/solutions-template-2',
			'title'       => 'Solutions Template 2',
			'description' => 'Oakwood Copilot solutions page — Hero, Cards, Governance, Achievements, Licensing, CTA.',
			'keywords'    => array( 'oakwood', 'copilot', 'solutions', 'hero', 'landing' ),
		),
	);

	foreach ( $patterns as $pattern ) {
		$file = OAK_DIR . $pattern['file'];
		if ( ! file_exists( $file ) ) {
			continue;
		}
		$raw = file_get_contents( $file );
		if ( ! $raw ) {
			continue;
		}
		$content = preg_replace( '/\A\s*<\?php.*?\?>\s*/s', '', $raw );
		$content = trim( $content );
		if ( empty( $content ) ) {
			continue;
		}
		register_block_pattern( $pattern['slug'], array(
			'title'         => $pattern['title'],
			'description'   => $pattern['description'],
			'categories'    => array( 'oakwood' ),
			'keywords'      => $pattern['keywords'],
			'viewportWidth' => 1280,
			'content'       => $content,
		) );
	}
}
add_action( 'init', 'oak_register_patterns', 9 );

/* ============================================================
   5. THEME SUPPORT
   ============================================================ */
function oak_theme_support() {
	add_theme_support( 'align-wide' );
	add_theme_support( 'custom-spacing' );
	add_theme_support( 'appearance-tools' );
	add_theme_support( 'editor-color-palette', array(
		array( 'name' => 'Navy Dark',   'slug' => 'oak-navy-dark',   'color' => '#060E18' ),
		array( 'name' => 'Navy',        'slug' => 'oak-navy',        'color' => '#001258' ),
		array( 'name' => 'Blue',        'slug' => 'oak-blue',        'color' => '#1E6FD9' ),
		array( 'name' => 'Blue Pale',   'slug' => 'oak-blue-pale',   'color' => '#E8F2FC' ),
		array( 'name' => 'Blue Modern', 'slug' => 'oak-blue-modern', 'color' => '#0D53A2' ),
		array( 'name' => 'Gray Light',  'slug' => 'oak-gray-light',  'color' => '#F4F6F8' ),
		array( 'name' => 'Green',       'slug' => 'oak-green',       'color' => '#2ECC71' ),
		array( 'name' => 'White',       'slug' => 'oak-white',       'color' => '#FFFFFF' ),
	) );
	add_theme_support( 'editor-font-family', array(
		array(
			'name'       => 'Inter',
			'slug'       => 'inter',
			'fontFamily' => oak_font_family_inter(),
		),
		array(
			'name'       => 'Segoe UI',
			'slug'       => 'segoe',
			'fontFamily' => oak_font_family_segoe(),
		),
	) );
}
add_action( 'after_setup_theme', 'oak_theme_support', 30 );
