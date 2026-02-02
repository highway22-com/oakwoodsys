<?php
/**
 * Registra el grupo de campos ACF "CMS Page Content" para el post type oakwood_page.
 * Requiere que el plugin Advanced Custom Fields esté instalado y activo.
 *
 * Estructura: un único campo "Page content (JSON)" para pegar/editar el JSON completo
 * de la página (page, videoUrls?, sections), igual que home-content.json.
 */

defined( 'ABSPATH' ) || exit;

function oakwood_cms_register_acf_field_group() {
	if ( ! function_exists( 'acf_add_local_field_group' ) ) {
		return;
	}

	acf_add_local_field_group(
		array(
			'key'                   => 'group_oakwood_cms_page_content',
			'title'                 => __( 'CMS Page Content', 'oakwood-cms' ),
			'fields'                => array(
				array(
					'key'           => 'field_oakwood_cms_page_content',
					'label'         => __( 'Page content (JSON)', 'oakwood-cms' ),
					'name'          => 'page_content',
					'type'          => 'textarea',
					'required'      => 0,
					'instructions'  => __( 'JSON completo de la página (page, videoUrls?, sections). Misma estructura que home-content.json.', 'oakwood-cms' ),
					'rows'          => 20,
					'new_lines'     => '',
					'placeholder'   => '{"page":"home","videoUrls":[],"sections":[]}',
					'wrapper'       => array(
						'class' => 'oakwood-cms-json-source',
					),
				),
			),
			'location'              => array(
				array(
					array(
						'param'    => 'post_type',
						'operator' => '==',
						'value'    => 'oakwood_page',
					),
				),
			),
			'menu_order'            => 0,
			'position'              => 'normal',
			'style'                 => 'default',
			'label_placement'       => 'top',
			'instruction_placement' => 'label',
		)
	);
}
add_action( 'acf/init', 'oakwood_cms_register_acf_field_group' );
