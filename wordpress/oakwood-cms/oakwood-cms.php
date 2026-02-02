<?php
/**
 * Plugin Name: Oakwood CMS
 * Plugin URI: https://oakwoodsys.com
 * Description: Sirve JSON de páginas desde archivos. Sin base de datos: pones home.json, services.json, etc. en wp-content/uploads/oakwood-cms/ y este plugin los expone por GraphQL (WPGraphQL).
 * Version: 1.0.1
 * Author: Aetro
 * Author URI: https://torre.ai/luisnoejasso?r=7zLtySsb
 * License: GPL v2 or later
 * Text Domain: oakwood-cms
 *
 * Requiere: WPGraphQL. Opcional: Advanced Custom Fields (ACF) para editar el JSON desde un grupo de campos.
 * Uso: archivos JSON en wp-content/uploads/oakwood-cms/. Query: cmsPage(slug: "home") { content }.
 */

defined( 'ABSPATH' ) || exit;

add_action( 'acf/init', function () {
	if ( function_exists( 'acf_add_local_field_group' ) ) {
		require_once __DIR__ . '/acf-cms-page.php';
	}
}, 5 );

/**
 * Registrar Custom Post Type "CMS Pages" (visible en el menú lateral como Case Studies).
 */
function oakwood_cms_register_post_type() {
	$labels = array(
		'name'               => _x( 'CMS Pages', 'post type general name', 'oakwood-cms' ),
		'singular_name'      => _x( 'CMS Page', 'post type singular name', 'oakwood-cms' ),
		'menu_name'          => _x( 'CMS Pages', 'admin menu', 'oakwood-cms' ),
		'add_new'            => _x( 'Add New', 'cms page', 'oakwood-cms' ),
		'add_new_item'       => __( 'Add New CMS Page', 'oakwood-cms' ),
		'edit_item'          => __( 'Edit CMS Page', 'oakwood-cms' ),
		'new_item'           => __( 'New CMS Page', 'oakwood-cms' ),
		'view_item'          => __( 'View CMS Page', 'oakwood-cms' ),
		'search_items'       => __( 'Search CMS Pages', 'oakwood-cms' ),
		'not_found'          => __( 'No CMS pages found', 'oakwood-cms' ),
		'not_found_in_trash' => __( 'No CMS pages found in trash', 'oakwood-cms' ),
	);

	$args = array(
		'label'               => __( 'CMS Page', 'oakwood-cms' ),
		'labels'              => $labels,
		'supports'            => array( 'title', 'custom-fields' ),
		'public'              => false,
		'publicly_queryable'  => false,
		'show_ui'             => true,
		'show_in_menu'        => true,
		'menu_position'       => 20,
		'menu_icon'           => 'dashicons-admin-page',
		'show_in_admin_bar'   => true,
		'show_in_nav_menus'   => false,
		'can_export'         => true,
		'has_archive'        => false,
		'exclude_from_search' => true,
		'capability_type'     => 'post',
		'show_in_rest'        => true,
		'rewrite'             => false,
		'show_in_graphql'     => true,
		'graphql_single_name' => 'CmsPageEntry',
		'graphql_plural_name' => 'CmsPageEntries',
	);

	register_post_type( 'oakwood_page', $args );
}
add_action( 'init', 'oakwood_cms_register_post_type' );

/**
 * Ruta base donde se leen los JSON (directorio dentro de uploads).
 */
function oakwood_cms_upload_dir() {
	$upload = wp_upload_dir();
	return $upload['basedir'] . '/oakwood-cms';
}

function oakwood_cms_file_path( $slug ) {
	$base = oakwood_cms_upload_dir();
	$safe = preg_replace( '/[^a-z0-9\-]/', '', $slug );
	if ( $safe === '' ) {
		return '';
	}
	return $base . '/' . $safe . '.json';
}

define( 'OAKWOOD_CMS_META_KEY', '_oakwood_page_content' );
define( 'OAKWOOD_CMS_HISTORY_META_KEY', '_oakwood_page_content_history' );
define( 'OAKWOOD_CMS_HISTORY_MAX', 20 );

/**
 * Resolver GraphQL cmsPage: primero archivo, luego post meta (si editaron en WP).
 */
function oakwood_cms_graphql_resolve( $root, array $args ) {
	$slug = isset( $args['slug'] ) ? $args['slug'] : '';
	$path = oakwood_cms_file_path( $slug );
	if ( $path !== '' && is_readable( $path ) ) {
		$raw  = file_get_contents( $path );
		$data = json_decode( $raw, true );
		if ( is_array( $data ) ) {
			$data['page'] = $slug;
			return array( 'content' => wp_json_encode( $data ) );
		}
	}
	// Fallback: post por slug (contenido guardado en meta)
	$posts = get_posts( array(
		'post_type'      => 'oakwood_page',
		'name'           => $slug,
		'post_status'    => 'publish',
		'posts_per_page' => 1,
	) );
	if ( ! empty( $posts ) ) {
		$post_id = $posts[0]->ID;
		if ( function_exists( 'get_field' ) ) {
			$raw = get_field( 'page_content', $post_id );
		} else {
			$raw = get_post_meta( $post_id, OAKWOOD_CMS_META_KEY, true );
		}
		if ( $raw !== '' && $raw !== false && $raw !== null ) {
			$data = json_decode( $raw, true );
			if ( is_array( $data ) ) {
				$data['page'] = $slug;
				return array( 'content' => wp_json_encode( $data ) );
			}
		}
	}
	return array( 'content' => null );
}

/**
 * Registrar tipo y campo en WPGraphQL.
 */
function oakwood_cms_register_graphql() {
	if ( ! function_exists( 'register_graphql_object_type' ) || ! function_exists( 'register_graphql_field' ) ) {
		return;
	}
	// Tipo: contenido de una página CMS (JSON como string para máxima flexibilidad).
	register_graphql_object_type( 'CmsPageContent', array(
		'description' => __( 'Contenido de una página CMS (home, services, about-us, bloq, industries). El campo content es el JSON completo.', 'oakwood-cms' ),
		'fields'      => array(
			'content' => array(
				'type'        => 'String',
				'description' => __( 'JSON completo de la página (page, videoUrls?, sections).', 'oakwood-cms' ),
			),
		),
	) );

	// RootQuery: cmsPage(slug: String): CmsPageContent
	register_graphql_field( 'RootQuery', 'cmsPage', array(
		'description' => __( 'Contenido de una página CMS por slug (home, services, about-us, bloq, industries).', 'oakwood-cms' ),
		'type'        => 'CmsPageContent',
		'args'        => array(
			'slug' => array(
				'type'        => array( 'non_null' => 'String' ),
				'description' => __( 'Slug de la página.', 'oakwood-cms' ),
			),
		),
		'resolve'     => function ( $source, $args, $context, $info ) {
			return oakwood_cms_graphql_resolve( $source, $args );
		},
	) );
}
add_action( 'graphql_register_types', 'oakwood_cms_register_graphql' );

/**
 * Meta box para editar el JSON (solo si ACF no está activo; si ACF está activo se usa el grupo "CMS Page Content").
 */
function oakwood_cms_add_meta_box() {
	if ( function_exists( 'acf_add_local_field_group' ) ) {
		return;
	}
	add_meta_box(
		'oakwood_cms_content',
		__( 'Page content (JSON)', 'oakwood-cms' ),
		'oakwood_cms_meta_box_callback',
		'oakwood_page',
		'normal',
		'default'
	);
}
add_action( 'add_meta_boxes', 'oakwood_cms_add_meta_box' );

/**
 * Meta box: vista previa del JSON (formato legible, se actualiza al editar el textarea).
 */
function oakwood_cms_add_preview_meta_box() {
	add_meta_box(
		'oakwood_cms_preview',
		__( 'Vista previa del JSON', 'oakwood-cms' ),
		'oakwood_cms_preview_meta_box_callback',
		'oakwood_page',
		'normal',
		'default'
	);
}
add_action( 'add_meta_boxes', 'oakwood_cms_add_preview_meta_box' );

/**
 * Meta box: historial de cambios del JSON (lista + Restaurar).
 */
function oakwood_cms_add_history_meta_box() {
	add_meta_box(
		'oakwood_cms_history',
		__( 'Historial de cambios', 'oakwood-cms' ),
		'oakwood_cms_history_meta_box_callback',
		'oakwood_page',
		'side',
		'default'
	);
}
add_action( 'add_meta_boxes', 'oakwood_cms_add_history_meta_box' );

function oakwood_cms_meta_box_callback( \WP_Post $post ) {
	$content = get_post_meta( $post->ID, OAKWOOD_CMS_META_KEY, true );
	$slug    = $post->post_name;
	wp_nonce_field( 'oakwood_cms_save', 'oakwood_cms_nonce' );
	echo '<p><strong>' . esc_html__( 'Slug (ruta):', 'oakwood-cms' ) . '</strong> <code>' . esc_html( $slug ) . '</code>';
	if ( ! in_array( $slug, array( 'home', 'services', 'about-us', 'bloq', 'industries' ), true ) ) {
		echo '<br><em>' . esc_html__( 'Recomendado: home, services, about-us, bloq, industries (edita el slug del post).', 'oakwood-cms' ) . '</em>';
	}
	echo '</p>';
	echo '<p><label for="oakwood_cms_content">' . esc_html__( 'JSON (misma estructura que home-content.json):', 'oakwood-cms' ) . '</label><br>';
	echo '<textarea id="oakwood_cms_content" name="oakwood_cms_content" rows="20" class="large-text code oakwood-cms-json-source" style="width:100%; font-family: monospace;">' . esc_textarea( $content ) . '</textarea></p>';
}

function oakwood_cms_preview_meta_box_callback( \WP_Post $post ) {
	echo '<p class="description">' . esc_html__( 'Vista en vivo del JSON mientras editas. Si el JSON no es válido se mostrará un aviso.', 'oakwood-cms' ) . '</p>';
	echo '<pre id="oakwood-cms-json-preview" class="oakwood-cms-preview" style="max-height:320px; overflow:auto; padding:12px; background:#f6f7f7; border:1px solid #c3c4c7; border-radius:4px; font-size:12px; white-space:pre-wrap; word-break:break-all;"></pre>';
	oakwood_cms_preview_script();
}

function oakwood_cms_history_meta_box_callback( \WP_Post $post ) {
	$history = get_post_meta( $post->ID, OAKWOOD_CMS_HISTORY_META_KEY, true );
	if ( ! is_array( $history ) ) {
		$history = array();
	}
	if ( empty( $history ) ) {
		echo '<p class="description">' . esc_html__( 'Aún no hay historial. Se guardará una entrada cada vez que guardes la página.', 'oakwood-cms' ) . '</p>';
		return;
	}
	$history_for_js = array();
	echo '<ul class="oakwood-cms-history-list" style="margin:0; padding-left:20px;">';
	foreach ( array_slice( $history, 0, OAKWOOD_CMS_HISTORY_MAX ) as $i => $entry ) {
		$date = isset( $entry['date'] ) ? $entry['date'] : '';
		$user = isset( $entry['user'] ) ? get_user_by( 'id', $entry['user'] ) : null;
		$user_name = $user ? $user->display_name : __( 'Desconocido', 'oakwood-cms' );
		$content = isset( $entry['content'] ) ? $entry['content'] : '';
		$history_for_js[] = array( 'content' => $content );
		$date_formatted = $date ? wp_date( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), strtotime( $date ) ) : '';
		echo '<li style="margin-bottom:8px;">';
		echo '<span style="font-size:11px; color:#646970;">' . esc_html( $date_formatted ) . ' · ' . esc_html( $user_name ) . '</span><br>';
		echo '<button type="button" class="button button-small oakwood-cms-restore" data-index="' . (int) $i . '" style="margin-top:4px;">' . esc_html__( 'Restaurar', 'oakwood-cms' ) . '</button>';
		echo '</li>';
	}
	echo '</ul>';
	echo '<script type="application/json" id="oakwood-cms-history-data">' . wp_json_encode( $history_for_js ) . '</script>';
	oakwood_cms_history_script();
}

function oakwood_cms_preview_script() {
	?>
	<script>
	(function() {
		function getJsonTextarea() {
			return document.getElementById('oakwood_cms_content') || document.querySelector('.oakwood-cms-json-source textarea') || document.querySelector('textarea[name*="page_content"]');
		}
		function updatePreview() {
			var ta = getJsonTextarea();
			var pre = document.getElementById('oakwood-cms-json-preview');
			if (!ta || !pre) return;
			var raw = ta.value.trim();
			if (raw === '') {
				pre.textContent = '';
				pre.style.color = '';
				return;
			}
			try {
				var data = JSON.parse(raw);
				pre.textContent = JSON.stringify(data, null, 2);
				pre.style.color = '';
			} catch (e) {
				pre.textContent = 'JSON no válido: ' + e.message;
				pre.style.color = '#b32d2e';
			}
		}
		var ta = getJsonTextarea();
		if (ta) {
			ta.addEventListener('input', updatePreview);
			ta.addEventListener('change', updatePreview);
			updatePreview();
		}
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', function() { setTimeout(updatePreview, 500); });
		} else {
			setTimeout(updatePreview, 500);
		}
	})();
	</script>
	<?php
}

function oakwood_cms_history_script() {
	?>
	<script>
	(function() {
		function getJsonTextarea() {
			return document.getElementById('oakwood_cms_content') || document.querySelector('.oakwood-cms-json-source textarea') || document.querySelector('textarea[name*="page_content"]');
		}
		document.addEventListener('click', function(e) {
			if (!e.target || !e.target.classList.contains('oakwood-cms-restore')) return;
			var index = parseInt(e.target.getAttribute('data-index'), 10);
			var el = document.getElementById('oakwood-cms-history-data');
			if (!el || isNaN(index)) return;
			try {
				var history = JSON.parse(el.textContent);
				if (history[index] && history[index].content !== undefined) {
					var ta = getJsonTextarea();
					if (ta) {
						ta.value = history[index].content;
						ta.dispatchEvent(new Event('input', { bubbles: true }));
					}
				}
			} catch (err) {}
		});
	})();
	</script>
	<?php
}

function oakwood_cms_save_meta( $post_id ) {
	if ( ! isset( $_POST['oakwood_cms_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['oakwood_cms_nonce'] ) ), 'oakwood_cms_save' ) ) {
		return;
	}
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}
	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}
	if ( get_post_type( $post_id ) !== 'oakwood_page' ) {
		return;
	}
	$raw = isset( $_POST['oakwood_cms_content'] ) ? wp_unslash( $_POST['oakwood_cms_content'] ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
	if ( $raw !== '' ) {
		$decoded = json_decode( $raw, true );
		if ( json_last_error() !== JSON_ERROR_NONE ) {
			return;
		}
	}
	$previous = get_post_meta( $post_id, OAKWOOD_CMS_META_KEY, true );
	update_post_meta( $post_id, OAKWOOD_CMS_META_KEY, $raw );
	oakwood_cms_push_history( $post_id, $raw, $previous );
	// Escribir también al archivo para que GraphQL pueda leer desde archivo
	$post = get_post( $post_id );
	if ( $post && $post->post_name ) {
		$path = oakwood_cms_file_path( $post->post_name );
		if ( $path !== '' ) {
			$dir = dirname( $path );
			if ( ! file_exists( $dir ) ) {
				wp_mkdir_p( $dir );
			}
			if ( $raw !== '' ) {
				$data = json_decode( $raw, true );
				if ( is_array( $data ) ) {
					$data['page'] = $post->post_name;
					file_put_contents( $path, wp_json_encode( $data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT ) );
				}
			}
		}
	}
}
add_action( 'save_post_oakwood_page', 'oakwood_cms_save_meta' );

/**
 * Cuando se guarda desde ACF, sincronizar el JSON al archivo para que GraphQL pueda leer desde archivo.
 */
function oakwood_cms_acf_save_post_sync_file( $post_id ) {
	if ( get_post_type( $post_id ) !== 'oakwood_page' ) {
		return;
	}
	if ( ! function_exists( 'get_field' ) ) {
		return;
	}
	$post = get_post( $post_id );
	if ( ! $post || ! $post->post_name || $post->post_name === 'auto-draft' ) {
		return;
	}
	$raw = get_field( 'page_content', $post_id );
	if ( $raw === '' || $raw === false || $raw === null ) {
		return;
	}
	$path = oakwood_cms_file_path( $post->post_name );
	if ( $path === '' ) {
		return;
	}
	$dir = dirname( $path );
	if ( ! file_exists( $dir ) ) {
		wp_mkdir_p( $dir );
	}
	$data = json_decode( $raw, true );
	if ( is_array( $data ) ) {
		$data['page'] = $post->post_name;
		file_put_contents( $path, wp_json_encode( $data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT ) );
	}
	oakwood_cms_push_history( $post_id, $raw, null );
}
add_action( 'acf/save_post', 'oakwood_cms_acf_save_post_sync_file', 20 );

/**
 * Añade una entrada al historial (solo si el contenido cambió). Máximo OAKWOOD_CMS_HISTORY_MAX entradas.
 * Si $previous_content es null (p. ej. guardado desde ACF), se evita duplicado comparando con la última entrada del historial.
 */
function oakwood_cms_push_history( $post_id, $new_content, $previous_content ) {
	$history = get_post_meta( $post_id, OAKWOOD_CMS_HISTORY_META_KEY, true );
	if ( ! is_array( $history ) ) {
		$history = array();
	}
	if ( $previous_content !== null && $new_content === $previous_content ) {
		return;
	}
	if ( ! empty( $history ) && isset( $history[0]['content'] ) && $history[0]['content'] === $new_content ) {
		return;
	}
	array_unshift( $history, array(
		'date'    => current_time( 'mysql' ),
		'user'    => get_current_user_id(),
		'content' => $new_content,
	) );
	$history = array_slice( $history, 0, OAKWOOD_CMS_HISTORY_MAX );
	update_post_meta( $post_id, OAKWOOD_CMS_HISTORY_META_KEY, $history );
}

/**
 * Crea el directorio en uploads al activar el plugin.
 */
function oakwood_cms_activate() {
	oakwood_cms_register_post_type();
	$dir = oakwood_cms_upload_dir();
	if ( ! file_exists( $dir ) ) {
		wp_mkdir_p( $dir );
	}
	$htaccess = $dir . '/.htaccess';
	if ( ! file_exists( $htaccess ) ) {
		file_put_contents( $htaccess, "Options -Indexes\n" );
	}
}
register_activation_hook( __FILE__, 'oakwood_cms_activate' );
