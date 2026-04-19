<?php

defined( 'ABSPATH' ) || exit;

function oakwood_events_rest_register_routes() {
	register_rest_route(
		'oakwood/v1',
		'/events-content',
		array(
			'methods'             => 'GET',
			'callback'            => 'oakwood_events_rest_events_content',
			'permission_callback' => '__return_true',
		)
	);
}
add_action( 'rest_api_init', 'oakwood_events_rest_register_routes' );

function oakwood_events_rest_events_content( \WP_REST_Request $request ) {
	$response = oakwood_events_build_events_content_array();
	return rest_ensure_response( $response );
}

function oakwood_events_build_event_item( \WP_Post $post ) {
	$post_id = $post->ID;

	$image_url = '';
	$thumb_id = get_post_thumbnail_id( $post_id );
	if ( $thumb_id ) {
		$src = wp_get_attachment_image_src( $thumb_id, 'full' );
		if ( is_array( $src ) && ! empty( $src[0] ) ) {
			$image_url = $src[0];
		}
	}

	$hero_image = $image_url;

	$speakers_terms = wp_get_post_terms( $post_id, OAKWOOD_EVENTS_SPEAKER_TAXONOMY );
	$speakers = array();
	if ( is_array( $speakers_terms ) ) {
		foreach ( $speakers_terms as $term ) {
			if ( $term instanceof \WP_Term ) {
				$speakers[] = oakwood_events_get_speaker_term_data( $term );
			}
		}
	}

	$type        = oakwood_events_get_meta( $post_id, 'type', 'online' );
	$duration_raw = oakwood_events_get_meta( $post_id, 'durationMinutes', '' );
	$duration_minutes = is_numeric( $duration_raw ) ? (int) $duration_raw : 0;
	if ( $duration_minutes < 1 ) {
		$duration_minutes = null;
	}

	$tz_string = oakwood_events_get_resolved_event_timezone_for_post( $post_id );

	$item = array(
		'slug'        => $post->post_name,
		'type'        => $type === 'in-person' ? 'in-person' : 'online',
		'tag'         => oakwood_events_get_primary_tag_label_for_post( $post_id ),
		'title'       => get_the_title( $post ),
		'summary'     => has_excerpt( $post ) ? get_the_excerpt( $post ) : '',
		'imageUrl'    => (string) $image_url,
		'imageAlt'    => get_the_title( $post ),
		'location'    => (string) oakwood_events_get_meta( $post_id, 'location', '' ),
		'eventStartISO' => (string) oakwood_events_get_meta( $post_id, 'eventStartISO', '' ),
		'eventTimeZone' => $tz_string,
		'registerLink'=> (string) oakwood_events_get_meta( $post_id, 'registerLink', '' ),
		'heroVideoUrls' => oakwood_events_get_meta_array( $post_id, 'heroVideoUrls' ),
		'heroImage'   => (string) $hero_image,
		'subtitle'    => '',
		'overview'    => (string) apply_filters( 'the_content', $post->post_content ),
		'speakers'    => $speakers,
	);

	$event_end_iso = (string) oakwood_events_get_meta( $post_id, 'eventEndISO', '' );
	if ( $event_end_iso !== '' ) {
		$item['eventEndISO'] = $event_end_iso;
	}
	if ( null !== $duration_minutes ) {
		$item['durationMinutes'] = $duration_minutes;
	}

	return $item;
}

