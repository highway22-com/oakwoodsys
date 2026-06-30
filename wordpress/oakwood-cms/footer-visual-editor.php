<?php
/**
 * Visual editor (Gutenberg-like) for the footer CMS page.
 *
 * Adds a "Footer Builder" meta box to the oakwood_page whose slug is "footer".
 * The editor is a thin UI layer on top of the existing JSON source field
 * (ACF `page_content` or the `oakwood_cms_content` meta box): it reads the
 * initial JSON, renders editable cards/sections, and writes the serialized
 * JSON back into that same field on every change, so the existing save flow
 * (post meta + uploads/oakwood-cms/footer.json + GraphQL) is untouched.
 */

defined( 'ABSPATH' ) || exit;

/**
 * Slug of the CMS page that holds the footer JSON.
 */
function oakwood_footer_editor_slug() {
	return 'footer';
}

/**
 * Whether a given post is the footer CMS page.
 *
 * @param mixed $post Post object or ID.
 * @return bool
 */
function oakwood_footer_editor_is_target( $post ) {
	$post = get_post( $post );
	if ( ! ( $post instanceof WP_Post ) ) {
		return false;
	}
	return $post->post_type === 'oakwood_page' && $post->post_name === oakwood_footer_editor_slug();
}

/**
 * Read the raw JSON currently stored for the post (meta first, then ACF).
 *
 * @param int $post_id Post ID.
 * @return string
 */
function oakwood_footer_editor_get_raw( $post_id ) {
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
 * Register the "Footer Builder" meta box only on the footer CMS page.
 *
 * @param string  $post_type Current post type.
 * @param WP_Post $post      Current post.
 */
function oakwood_footer_editor_add_meta_box( $post_type, $post ) {
	if ( $post_type !== 'oakwood_page' || ! oakwood_footer_editor_is_target( $post ) ) {
		return;
	}
	add_meta_box(
		'oakwood_footer_editor',
		__( 'Footer Builder', 'oakwood-cms' ),
		'oakwood_footer_editor_meta_box_callback',
		'oakwood_page',
		'normal',
		'high'
	);
}
add_action( 'add_meta_boxes', 'oakwood_footer_editor_add_meta_box', 10, 2 );

/**
 * Meta box markup: a single root element the JS app mounts into.
 *
 * @param WP_Post $post Current post.
 */
function oakwood_footer_editor_meta_box_callback( WP_Post $post ) {
	unset( $post );
	echo '<div id="oakwood-footer-editor" class="ome-root">';
	echo '<p class="ome-loading">' . esc_html__( 'Loading footer editor…', 'oakwood-cms' ) . '</p>';
	echo '</div>';
	echo '<noscript><p>' . esc_html__( 'Enable JavaScript to use the visual footer editor.', 'oakwood-cms' ) . '</p></noscript>';
}

/**
 * Enqueue the editor assets only on the footer CMS page edit screen.
 *
 * @param string $hook Current admin page hook.
 */
function oakwood_footer_editor_enqueue( $hook ) {
	if ( $hook !== 'post.php' && $hook !== 'post-new.php' ) {
		return;
	}

	$post = get_post();
	if ( ! oakwood_footer_editor_is_target( $post ) ) {
		return;
	}

	$base = plugin_dir_url( __FILE__ );
	$dir  = plugin_dir_path( __FILE__ );

	$css_path = $dir . 'assets/menu-editor.css';
	$js_path  = $dir . 'assets/footer-editor.js';

	wp_enqueue_style(
		'oakwood-menu-editor',
		$base . 'assets/menu-editor.css',
		array(),
		file_exists( $css_path ) ? (string) filemtime( $css_path ) : '1.0.0'
	);

	wp_enqueue_script(
		'oakwood-footer-editor',
		$base . 'assets/footer-editor.js',
		array(),
		file_exists( $js_path ) ? (string) filemtime( $js_path ) : '1.0.0',
		true
	);

	wp_localize_script(
		'oakwood-footer-editor',
		'OAKWOOD_FOOTER_EDITOR',
		array(
			'initial' => oakwood_footer_editor_get_raw( (int) $post->ID ),
			'i18n'    => array(
				'general'      => __( 'General', 'oakwood-cms' ),
				'logo'         => __( 'Logo', 'oakwood-cms' ),
				'contact'      => __( 'Contact', 'oakwood-cms' ),
				'socialMedia'  => __( 'Social Media', 'oakwood-cms' ),
				'services'     => __( 'Links: Services', 'oakwood-cms' ),
				'industries'   => __( 'Links: Industries', 'oakwood-cms' ),
				'resources'    => __( 'Links: Resources', 'oakwood-cms' ),
				'company'      => __( 'Links: Company', 'oakwood-cms' ),
				'solutions'    => __( 'Links: Solutions', 'oakwood-cms' ),
				'policies'     => __( 'Policies', 'oakwood-cms' ),
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
add_action( 'admin_enqueue_scripts', 'oakwood_footer_editor_enqueue' );
