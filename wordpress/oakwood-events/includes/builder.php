<?php

defined( 'ABSPATH' ) || exit;

function oakwood_events_build_events_content_array() {
	$global = oakwood_events_get_global_content();

	$posts = get_posts(
		array(
			'post_type'      => OAKWOOD_EVENTS_POST_TYPE,
			'post_status'    => 'publish',
			'posts_per_page' => 200,
			'orderby'        => 'date',
			'order'          => 'DESC',
		)
	);

	$events = array();
	foreach ( $posts as $post ) {
		$events[ $post->post_name ] = oakwood_events_build_event_item( $post );
	}

	return array(
		'hero'                 => isset( $global['hero'] ) ? $global['hero'] : array(),
		'noEventsMessage'       => isset( $global['noEventsMessage'] ) ? $global['noEventsMessage'] : array(),
		'upcomingEventsSection' => isset( $global['upcomingEventsSection'] ) ? $global['upcomingEventsSection'] : array(),
		'pastEventsSection'     => isset( $global['pastEventsSection'] ) ? $global['pastEventsSection'] : array(),
		'ctaSection'            => isset( $global['ctaSection'] ) ? $global['ctaSection'] : array(),
		'events'                => $events,
	);
}

