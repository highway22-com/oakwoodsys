<?php
/**
 * WPGraphQL: campos ACF en Person y authorPerson en GenContent.
 *
 * Person: name, position, firstName, email, picture, socialLinks.
 * GenContent: authorPerson (Person) — reemplaza/autor cuando está definido.
 */

defined( 'ABSPATH' ) || exit;

function oakwood_people_register_graphql_types() {
	if ( ! function_exists( 'register_graphql_object_type' ) || ! function_exists( 'register_graphql_field' ) ) {
		return;
	}

	// Tipo para un enlace social.
	register_graphql_object_type(
		'PersonSocialLink',
		array(
			'description' => __( 'Enlace social de una persona.', 'oakwood-people' ),
			'fields'      => array(
				'platform' => array(
					'type'        => 'String',
					'description' => __( 'Plataforma (LinkedIn, Twitter, etc.).', 'oakwood-people' ),
				),
				'url'      => array(
					'type'        => 'String',
					'description' => __( 'URL del perfil.', 'oakwood-people' ),
				),
			),
		)
	);

	// Campos ACF en Person.
	$person_acf_fields = array(
		'name'      => array( 'type' => 'String', 'acf' => 'name' ),
		'firstName' => array( 'type' => 'String', 'acf' => 'first_name' ),
		'position' => array( 'type' => 'String', 'acf' => 'position' ),
		'email'     => array( 'type' => 'String', 'acf' => 'email' ),
		'picture'   => array( 'type' => 'String', 'acf' => 'picture' ),
	);

	foreach ( $person_acf_fields as $graphql_name => $config ) {
		register_graphql_field(
			'Person',
			$graphql_name,
			array(
				'type'        => $config['type'],
				'description' => sprintf( __( 'ACF: %s.', 'oakwood-people' ), $config['acf'] ),
				'resolve'     => function ( $person ) use ( $config ) {
					$id = isset( $person->ID ) ? (int) $person->ID : ( isset( $person['databaseId'] ) ? (int) $person['databaseId'] : 0 );
					if ( ! $id ) {
						return null;
					}
					$value = function_exists( 'get_field' ) ? get_field( $config['acf'], $id ) : get_post_meta( $id, $config['acf'], true );
					if ( $config['type'] === 'String' ) {
						return is_scalar( $value ) ? (string) $value : null;
					}
					return $value;
				},
			)
		);
	}

	// socialLinks: construido desde campos URL individuales (compatible ACF Free).
	$social_fields = array(
		'linkedin_url'   => 'LinkedIn',
		'twitter_url'    => 'Twitter',
		'facebook_url'   => 'Facebook',
		'instagram_url'  => 'Instagram',
		'website_url'    => 'Website',
	);

	register_graphql_field(
		'Person',
		'socialLinks',
		array(
			'type'        => array( 'list_of' => 'PersonSocialLink' ),
			'description' => __( 'Enlaces sociales (LinkedIn, Twitter, etc.).', 'oakwood-people' ),
			'resolve'     => function ( $person ) use ( $social_fields ) {
				$id = isset( $person->ID ) ? (int) $person->ID : ( isset( $person['databaseId'] ) ? (int) $person['databaseId'] : 0 );
				if ( ! $id ) {
					return array();
				}
				$out = array();
				foreach ( $social_fields as $meta_key => $platform ) {
					$url = function_exists( 'get_field' ) ? get_field( $meta_key, $id ) : get_post_meta( $id, $meta_key, true );
					$url = is_string( $url ) ? trim( $url ) : '';
					if ( $url !== '' ) {
						$out[] = array( 'platform' => $platform, 'url' => $url );
					}
				}
				return $out;
			},
		)
	);

	// GenContent: authorPerson (Person) desde ACF author_person.
	register_graphql_field(
		'GenContent',
		'authorPerson',
		array(
			'type'        => 'Person',
			'description' => __( 'Autor como Person (ACF: author_person). Si está definido, usar en lugar del autor WP.', 'oakwood-people' ),
			'resolve'     => function ( $post ) {
				$post_id = null;
				if ( is_object( $post ) && isset( $post->ID ) ) {
					$post_id = (int) $post->ID;
				} elseif ( is_array( $post ) && isset( $post['databaseId'] ) ) {
					$post_id = (int) $post['databaseId'];
				}
				if ( ! $post_id ) {
					return null;
				}
				$person = function_exists( 'get_field' ) ? get_field( 'author_person', $post_id ) : null;
				if ( ! $person || ! ( $person instanceof WP_Post ) || $person->post_type !== 'person' ) {
					return null;
				}
				return $person;
			},
		)
	);
}
add_action( 'graphql_register_types', 'oakwood_people_register_graphql_types' );
