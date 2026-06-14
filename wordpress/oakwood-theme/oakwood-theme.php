<?php
/**
 * Plugin Name: Oakwood Theme
 * Description: Oakwood Systems Group design system, page patterns, and accordion block.
 * Version: 1.0.8
 * Author: Oakwood Systems Group
 * License: GPL-2.0-or-later
 * Text Domain: oakwood-theme
 *
 * @package Oakwood_Theme
 */

defined( 'ABSPATH' ) || exit;

define( 'OAK_DIR', plugin_dir_path( __FILE__ ) );
define( 'OAK_URL', plugin_dir_url( __FILE__ ) );
define( 'OAK_VER', '1.0.8' );

if ( ! defined( 'OAK_THEME_DIR' ) ) {
	define( 'OAK_THEME_DIR', OAK_DIR );
}

if ( ! defined( 'OAK_THEME_URL' ) ) {
	define( 'OAK_THEME_URL', OAK_URL );
}

require OAK_THEME_DIR . '/oakwood-theme-core.php';
