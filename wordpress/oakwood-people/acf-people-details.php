<?php
/**
 * Registra grupo ACF para People (Person).
 *
 * Person (post type person):
 * - name → name (Text)
 * - position → position (Text)
 * - firstName → first_name (Text)
 * - email → email (Email)
 * - picture → picture (Image URL)
 * - socialLinks → campos URL individuales (linkedin_url, twitter_url, etc.) — compatible ACF Free.
 *
 * author_person en Gen Content lo define Oakwood Bloq (acf-related-bloqs.php) para editarlo en la misma caja.
 */

defined( 'ABSPATH' ) || exit;

function oakwood_people_register_acf_field_groups() {
	if ( ! function_exists( 'acf_add_local_field_group' ) ) {
		return;
	}

	// ——— Person (People) ———
	acf_add_local_field_group(
		array(
			'key'      => 'group_oakwood_people_details',
			'title'    => 'Person Details',
			'fields'   => array(
				array(
					'key'   => 'field_oakwood_person_name',
					'label' => 'Name',
					'name'  => 'name',
					'type'  => 'text',
					'required' => 1,
				),
				array(
					'key'   => 'field_oakwood_person_first_name',
					'label' => 'First Name',
					'name'  => 'first_name',
					'type'  => 'text',
				),
				array(
					'key'   => 'field_oakwood_person_position',
					'label' => 'Position',
					'name'  => 'position',
					'type'  => 'text',
				),
				array(
					'key'   => 'field_oakwood_person_email',
					'label' => 'Email',
					'name'  => 'email',
					'type'  => 'email',
				),
				array(
					'key'           => 'field_oakwood_person_picture',
					'label'         => 'Picture',
					'name'          => 'picture',
					'type'          => 'image',
					'return_format' => 'url',
					'preview_size'  => 'medium',
				),
				array(
					'key'   => 'field_oakwood_person_linkedin_url',
					'label' => 'LinkedIn URL',
					'name'  => 'linkedin_url',
					'type'  => 'url',
				),
				array(
					'key'   => 'field_oakwood_person_twitter_url',
					'label' => 'Twitter / X URL',
					'name'  => 'twitter_url',
					'type'  => 'url',
				),
				array(
					'key'   => 'field_oakwood_person_facebook_url',
					'label' => 'Facebook URL',
					'name'  => 'facebook_url',
					'type'  => 'url',
				),
				array(
					'key'   => 'field_oakwood_person_instagram_url',
					'label' => 'Instagram URL',
					'name'  => 'instagram_url',
					'type'  => 'url',
				),
				array(
					'key'   => 'field_oakwood_person_website_url',
					'label' => 'Website / Other URL',
					'name'  => 'website_url',
					'type'  => 'url',
				),
			),
			'location' => array(
				array(
					array(
						'param'    => 'post_type',
						'operator' => '==',
						'value'    => 'person',
					),
				),
			),
			'position' => 'normal',
			'style'    => 'default',
		)
	);
}
add_action( 'acf/init', 'oakwood_people_register_acf_field_groups' );
