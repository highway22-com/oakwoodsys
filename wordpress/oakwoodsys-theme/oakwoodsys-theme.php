<?php
/**
 * Plugin Name: Oakwoodsys Theme
 * Plugin URI: https://oakwoodsys.com
 * Description: Oakwood design system for WordPress — colors, fonts, and typography tokens from Figma (Oakwood Website 2026). Enqueues CSS for native WP pages and the block editor.
 * Version: 1.0.3
 * Author: Aetro
 * Author URI: https://oakwoodsys.com
 * License: GPL v2 or later
 * Text Domain: oakwoodsys-theme
 * Requires at least: 5.8
 * Requires PHP: 7.4
 *
 * Tokens source: assets/design-tokens.json (Figma node 9994:20726).
 */

defined( 'ABSPATH' ) || exit;

define( 'OAKWOODSYS_THEME_VERSION', '1.0.3' );
define( 'OAKWOODSYS_THEME_MIN_WP', '5.8' );
define( 'OAKWOODSYS_THEME_PATH', plugin_dir_path( __FILE__ ) );
define( 'OAKWOODSYS_THEME_URL', plugin_dir_url( __FILE__ ) );

require_once OAKWOODSYS_THEME_PATH . 'includes/tokens.php';
require_once OAKWOODSYS_THEME_PATH . 'includes/enqueue.php';

/**
 * Load editor integrations when WordPress supports block patterns/styles.
 */
function oakwoodsys_theme_load_modules() {
	if ( version_compare( get_bloginfo( 'version' ), OAKWOODSYS_THEME_MIN_WP, '<' ) ) {
		return;
	}

	require_once OAKWOODSYS_THEME_PATH . 'includes/editor.php';
	require_once OAKWOODSYS_THEME_PATH . 'includes/block-styles.php';
	require_once OAKWOODSYS_THEME_PATH . 'includes/patterns.php';
}
add_action( 'plugins_loaded', 'oakwoodsys_theme_load_modules' );

/**
 * Admin notice when WordPress is too old for patterns/block styles.
 */
function oakwoodsys_theme_admin_notice_wp_version() {
	if ( ! current_user_can( 'activate_plugins' ) ) {
		return;
	}

	if ( version_compare( get_bloginfo( 'version' ), OAKWOODSYS_THEME_MIN_WP, '>=' ) ) {
		return;
	}

	echo '<div class="notice notice-warning"><p>';
	echo esc_html(
		sprintf(
			/* translators: 1: plugin name, 2: minimum WordPress version */
			__( '%1$s requires WordPress %2$s or newer. CSS is loaded, but block patterns and styles are disabled.', 'oakwoodsys-theme' ),
			'Oakwoodsys Theme',
			OAKWOODSYS_THEME_MIN_WP
		)
	);
	echo '</p></div>';
}
add_action( 'admin_notices', 'oakwoodsys_theme_admin_notice_wp_version' );

/**
 * Flush rewrite rules on activation.
 */
function oakwoodsys_theme_activate() {
	flush_rewrite_rules();
}
register_activation_hook( __FILE__, 'oakwoodsys_theme_activate' );

/**
 * Flush rewrite rules on deactivation.
 */
function oakwoodsys_theme_deactivate() {
	flush_rewrite_rules();
}
register_deactivation_hook( __FILE__, 'oakwoodsys_theme_deactivate' );
