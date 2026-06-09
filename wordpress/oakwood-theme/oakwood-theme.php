<?php
/**
 * Plugin Name: Oakwood Theme
 * Description: Solutions Template 2 — estilos Oakwood, estilos de lista y acordeón para cualquier tema WP.
 * Version: 1.4.0
 * Text Domain: oakwood-theme
 *
 * @package Oakwood_Theme
 */

defined( 'ABSPATH' ) || exit;

if ( ! defined( 'OAKWOOD_THEME_DIR' ) ) {
	define( 'OAKWOOD_THEME_DIR', __DIR__ );
}

if ( ! defined( 'OAKWOOD_THEME_URL' ) ) {
	define( 'OAKWOOD_THEME_URL', plugins_url( '', __FILE__ ) );
}

require OAKWOOD_THEME_DIR . '/oakwood-theme-core.php';
