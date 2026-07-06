<?php
/**
 * Visual editor (Gutenberg-like) for the navbar/menu CMS page.
 *
 * Adds a "Menu Builder" meta box to the oakwood_page whose slug is "menu".
 * The editor is a thin UI layer on top of the existing JSON source field
 * (ACF `page_content` or the `oakwood_cms_content` meta box): it reads the
 * initial JSON, renders editable cards/sections, and writes the serialized
 * JSON back into that same field on every change, so the existing save flow
 * (post meta + uploads/oakwood-cms/menu.json + GraphQL) is untouched.
 */

defined( 'ABSPATH' ) || exit;

/**
 * Slug of the CMS page that holds the navbar/menu JSON.
 */
function oakwood_menu_editor_slug() {
	return 'menu';
}

/**
 * Whether a given post is the menu CMS page.
 *
 * @param mixed $post Post object or ID.
 * @return bool
 */
function oakwood_menu_editor_is_target( $post ) {
	$post = get_post( $post );
	if ( ! ( $post instanceof WP_Post ) ) {
		return false;
	}
	return $post->post_type === 'oakwood_page' && $post->post_name === oakwood_menu_editor_slug();
}

/**
 * Read the raw JSON currently stored for the post (meta first, then ACF).
 *
 * @param int $post_id Post ID.
 * @return string
 */
function oakwood_menu_editor_get_raw( $post_id ) {
	$meta_key = defined( 'OAKWOOD_CMS_META_KEY' ) ? OAKWOOD_CMS_META_KEY : '_oakwood_page_content';
	$raw      = get_post_meta( $post_id, $meta_key, true );
	if ( ( $raw === '' || $raw === false || $raw === null ) && function_exists( 'get_field' ) ) {
		$acf = get_field( 'page_content', $post_id );
		if ( is_string( $acf ) ) {
			$raw = $acf;
		}
	}
	return is_string( $raw ) ? $raw : '';
}

/**
 * Register the "Menu Builder" meta box only on the menu CMS page.
 *
 * @param string  $post_type Current post type.
 * @param WP_Post $post      Current post.
 */
function oakwood_menu_editor_add_meta_box( $post_type, $post ) {
	if ( $post_type !== 'oakwood_page' || ! oakwood_menu_editor_is_target( $post ) ) {
		return;
	}
	add_meta_box(
		'oakwood_menu_editor',
		__( 'Menu Builder', 'oakwood-cms' ),
		'oakwood_menu_editor_meta_box_callback',
		'oakwood_page',
		'normal',
		'high'
	);
}
add_action( 'add_meta_boxes', 'oakwood_menu_editor_add_meta_box', 10, 2 );

/**
 * Meta box markup: a single root element the JS app mounts into.
 *
 * @param WP_Post $post Current post.
 */
function oakwood_menu_editor_meta_box_callback( WP_Post $post ) {
	unset( $post );
	echo '<div id="oakwood-menu-editor" class="ome-root">';
	echo '<p class="ome-loading">' . esc_html__( 'Loading menu editor…', 'oakwood-cms' ) . '</p>';
	echo '</div>';
	echo '<noscript><p>' . esc_html__( 'Enable JavaScript to use the visual menu editor.', 'oakwood-cms' ) . '</p></noscript>';
}

/**
 * Enqueue the editor assets only on the menu CMS page edit screen.
 *
 * @param string $hook Current admin page hook.
 */
function oakwood_menu_editor_enqueue( $hook ) {
	if ( $hook !== 'post.php' && $hook !== 'post-new.php' ) {
		return;
	}

	$post = get_post();
	if ( ! oakwood_menu_editor_is_target( $post ) ) {
		return;
	}

	$base = plugin_dir_url( __FILE__ );
	$dir  = plugin_dir_path( __FILE__ );

	$css_path = $dir . 'assets/menu-editor.css';
	$js_path  = $dir . 'assets/menu-editor.js';

	wp_enqueue_style(
		'oakwood-menu-editor',
		$base . 'assets/menu-editor.css',
		array(),
		file_exists( $css_path ) ? (string) filemtime( $css_path ) : '1.0.0'
	);

	wp_enqueue_script(
		'oakwood-menu-editor',
		$base . 'assets/menu-editor.js',
		array(),
		file_exists( $js_path ) ? (string) filemtime( $js_path ) : '1.0.0',
		true
	);

	wp_localize_script(
		'oakwood-menu-editor',
		'OAKWOOD_MENU_EDITOR',
		array(
			'initial' => oakwood_menu_editor_get_raw( (int) $post->ID ),
			'i18n'    => array(
				'menu'         => __( 'Main menu', 'oakwood-cms' ),
				'services'     => __( 'Services', 'oakwood-cms' ),
				'solutions'    => __( 'Solutions', 'oakwood-cms' ),
				'industries'   => __( 'Industries', 'oakwood-cms' ),
				'resources'    => __( 'Resources', 'oakwood-cms' ),
				'add'          => __( 'Add', 'oakwood-cms' ),
				'remove'       => __( 'Remove', 'oakwood-cms' ),
				'moveUp'       => __( 'Move up', 'oakwood-cms' ),
				'moveDown'     => __( 'Move down', 'oakwood-cms' ),
				'item'         => __( 'Item', 'oakwood-cms' ),
				'rawShow'      => __( 'Edit raw JSON', 'oakwood-cms' ),
				'rawHide'      => __( 'Hide raw JSON', 'oakwood-cms' ),
				'invalidJson'  => __( 'The stored JSON is invalid. Fix it in the raw JSON editor below.', 'oakwood-cms' ),
				'noField'      => __( 'JSON source field not found on this screen.', 'oakwood-cms' ),
			),
		)
	);
}
add_action( 'admin_enqueue_scripts', 'oakwood_menu_editor_enqueue' );
