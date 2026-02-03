<?php
/**
 * Registra el grupo de campos ACF "Case Study Details" según la estructura de case-studies-import-data.json.
 * Requiere que el plugin Advanced Custom Fields esté instalado y activo.
 *
 * Estructura JSON → ACF:
 * - heroImage → hero_image (Image URL)
 * - solutionImage → solution_image (Image URL)
 * - tags → tags (Checkbox)
 * - overview → overview (WYSIWYG, HTML/párrafos)
 * - businessChallenge → business_challenge (WYSIWYG, HTML/párrafos)
 * - solution → solution (WYSIWYG, HTML/párrafos)
 * - testimonial → testimonial (Group)
 * - connectedServices → connected_services (Repeater)
 * - relatedCaseStudies → related_case_studies (Relationship)
 * - cardDescription → card_description (WYSIWYG, HTML/párrafos)
 */

defined( 'ABSPATH' ) || exit;

function oakwood_cs_register_acf_field_group() {
	if ( ! function_exists( 'acf_add_local_field_group' ) ) {
		return;
	}

	acf_add_local_field_group(
		array(
			'key'                   => 'group_oakwood_case_study_details',
			'title'                 => 'Case Study Details',
			'fields'                => array(
				// Hero Image (heroImage)
				array(
					'key'               => 'field_oakwood_hero_image',
					'label'             => 'Hero Image',
					'name'              => 'hero_image',
					'type'              => 'image',
					'required'          => 1,
					'return_format'     => 'url',
					'preview_size'      => 'medium',
				),
				// Solution Image (solutionImage)
				array(
					'key'               => 'field_oakwood_solution_image',
					'label'             => 'Solution Image',
					'name'              => 'solution_image',
					'type'              => 'image',
					'required'          => 0,
					'return_format'     => 'url',
					'preview_size'      => 'medium',
				),
				// Tags (tags)
				array(
					'key'               => 'field_oakwood_tags',
					'label'             => 'Tags',
					'name'              => 'tags',
					'type'              => 'checkbox',
					'choices'           => array(
						'Case Study'             => 'Case Study',
						'HPC'                    => 'HPC',
						'Featured'               => 'Featured',
						'Application Innovation' => 'Application Innovation',
						'Data & AI'              => 'Data & AI',
						'Data Center'            => 'Data Center',
						'Modern Work'             => 'Modern Work',
						'Managed Services'       => 'Managed Services',
						'IoT'                    => 'IoT',
						'Healthcare'             => 'Healthcare',
						'Data Governance'        => 'Data Governance',
					),
					'return_format'     => 'value',
					'layout'            => 'vertical',
				),
				// Overview (overview) – WYSIWYG para HTML y párrafos
				array(
					'key'               => 'field_oakwood_overview',
					'label'             => 'Overview',
					'name'              => 'overview',
					'type'              => 'wysiwyg',
					'required'          => 1,
					'tabs'              => 'all',
					'toolbar'           => 'full',
					'media_upload'      => 1,
					'delay'             => 0,
				),
				// Business Challenge (businessChallenge) – WYSIWYG para HTML y párrafos
				array(
					'key'               => 'field_oakwood_business_challenge',
					'label'             => 'Business Challenge',
					'name'              => 'business_challenge',
					'type'              => 'wysiwyg',
					'required'          => 1,
					'tabs'              => 'all',
					'toolbar'           => 'full',
					'media_upload'      => 1,
					'delay'             => 0,
				),
				// Solution (solution) – WYSIWYG para HTML y párrafos
				array(
					'key'               => 'field_oakwood_solution',
					'label'             => 'Solution',
					'name'              => 'solution',
					'type'              => 'wysiwyg',
					'required'          => 1,
					'tabs'              => 'all',
					'toolbar'           => 'full',
					'media_upload'      => 1,
					'delay'             => 0,
				),
				// Card Description (cardDescription) – WYSIWYG para HTML en tarjetas/listados
				array(
					'key'               => 'field_oakwood_card_description',
					'label'             => 'Card Description',
					'name'              => 'card_description',
					'type'              => 'wysiwyg',
					'required'          => 0,
					'tabs'              => 'all',
					'toolbar'           => 'full',
					'media_upload'      => 1,
					'delay'             => 0,
					'instructions'      => 'Texto/HTML que se muestra en la tarjeta del case study (listados, featured, etc.). Si está vacío se usará el excerpt.',
				),
				// Testimonial group (testimonial)
				array(
					'key'               => 'field_oakwood_testimonial',
					'label'             => 'Testimonial',
					'name'              => 'testimonial',
					'type'              => 'group',
					'required'          => 0,
					'sub_fields'        => array(
						array(
							'key'   => 'field_oakwood_testimonial_company',
							'label' => 'Company',
							'name'  => 'testimonial_company',
							'type'  => 'text',
						),
						array(
							'key'           => 'field_oakwood_testimonial_company_logo',
							'label'         => 'Company Logo',
							'name'          => 'testimonial_company_logo',
							'type'          => 'image',
							'return_format' => 'url',
						),
						array(
							'key'   => 'field_oakwood_testimonial_quote',
							'label' => 'Quote',
							'name'  => 'testimonial_quote',
							'type'  => 'textarea',
							'rows'  => 3,
						),
						array(
							'key'   => 'field_oakwood_testimonial_author',
							'label' => 'Author',
							'name'  => 'testimonial_author',
							'type'  => 'text',
						),
						array(
							'key'   => 'field_oakwood_testimonial_role',
							'label' => 'Role',
							'name'  => 'testimonial_role',
							'type'  => 'text',
						),
					),
				),
				// Connected Services repeater (connectedServices)
				array(
					'key'               => 'field_oakwood_connected_services',
					'label'             => 'Connected Services',
					'name'              => 'connected_services',
					'type'              => 'repeater',
					'required'          => 0,
					'layout'            => 'block',
					'button_label'      => 'Add Service',
					'sub_fields'        => array(
						array(
							'key'   => 'field_oakwood_service_icon',
							'label' => 'Icon',
							'name'  => 'service_icon',
							'type'  => 'text',
							'placeholder' => 'fa-chart-line',
						),
						array(
							'key'   => 'field_oakwood_service_title',
							'label' => 'Title',
							'name'  => 'service_title',
							'type'  => 'text',
						),
						array(
							'key'   => 'field_oakwood_service_description',
							'label' => 'Description',
							'name'  => 'service_description',
							'type'  => 'textarea',
							'rows'  => 2,
						),
						array(
							'key'   => 'field_oakwood_service_link',
							'label' => 'Link',
							'name'  => 'service_link',
							'type'  => 'url',
							'placeholder' => '/services/data-and-ai',
						),
						array(
							'key'   => 'field_oakwood_service_slug',
							'label' => 'Slug',
							'name'  => 'service_slug',
							'type'  => 'text',
							'placeholder' => 'data-and-ai',
						),
					),
				),
				// Related Case Studies (relatedCaseStudies) – Post Object múltiple (compatible ACF Free)
				array(
					'key'               => 'field_oakwood_related_case_studies',
					'label'             => 'Related Case Studies',
					'name'              => 'related_case_studies',
					'type'              => 'post_object',
					'required'          => 0,
					'post_type'         => array( 'case_study' ),
					'return_format'     => 'object',
					'multiple'          => 1,
					'allow_null'        => 0,
				),
			),
			'location'              => array(
				array(
					array(
						'param'    => 'post_type',
						'operator' => '==',
						'value'    => 'case_study',
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
add_action( 'acf/init', 'oakwood_cs_register_acf_field_group' );
