<?php
/**
 * Registers the ACF field group "CMS Page Content" for the oakwood_page post type.
 * Requires the Advanced Custom Fields plugin to be installed and active.
 *
 * Structure: a single "Page content (JSON)" field to paste/edit the complete page JSON
 * (page, videoUrls?, sections), same as home-content.json.
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
					'instructions'  => __( 'Complete page JSON (page, videoUrls?, sections). Optional: seo { headTitle, headDescription, ogImage, keywords }. Same structure as home-content.json.', 'oakwood-cms' ),
					'rows'          => 20,
					'new_lines'     => '',
					'placeholder'   => '{"page":"home","seo":{"headTitle":"","headDescription":"","ogImage":"","keywords":""},"sections":[]}',
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
