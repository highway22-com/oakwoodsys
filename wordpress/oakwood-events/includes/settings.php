<?php

defined( 'ABSPATH' ) || exit;

function oakwood_events_default_global_content() {
	return array(
		'hero' => array(
			'eyebrow'       => 'Events',
			'title'         => 'Check Out Our Upcoming Events and Activities',
			'description'   => 'Practical sessions to help you move forward with cloud, data, and AI.',
			'heroVideoUrls' => array(),
			'heroImage'     => '',
		),
		'noEventsMessage' => array(
			'title'      => 'No Upcoming Events',
			'description'=> "No upcoming events right now. We're actively planning new sessions. Check back soon!",
			'ctaText'    => 'Browse Past Events',
			'ctaAnchor'  => 'past-events',
		),
		'upcomingEventsSection' => array(
			'eyebrow'     => 'Upcoming Events',
			'title'       => 'Upcoming Events from Oakwood',
			'description' => 'Practical sessions to help you move forward with cloud, data, and AI.',
		),
		'pastEventsSection' => array(
			'eyebrow'     => 'Past Events',
			'title'       => 'A recap of events that brought ideas to life.',
			'description' => 'Discover our past events from Oakwood.',
		),
		'ctaSection' => array(
			'title'       => 'Interested in us hosting a customized session for your team?',
			'description' => 'Looking for something specific? Oakwood can deliver tailored workshops, demos, or strategy sessions for your team.',
			'primaryText' => 'Request a session',
			'primaryLink' => '/contact-us',
		),
	);
}

function oakwood_events_get_global_content() {
	$raw = get_option( OAKWOOD_EVENTS_GLOBAL_OPTION, '' );
	if ( is_string( $raw ) && trim( $raw ) !== '' ) {
		$decoded = json_decode( $raw, true );
		if ( is_array( $decoded ) ) {
			return $decoded;
		}
	}
	return oakwood_events_default_global_content();
}

function oakwood_events_admin_menu() {
	add_submenu_page(
		'edit.php?post_type=' . OAKWOOD_EVENTS_POST_TYPE,
		__( 'Events settings', 'oakwood-events' ),
		__( 'Settings', 'oakwood-events' ),
		'manage_options',
		'oakwood-events-settings',
		'oakwood_events_settings_page'
	);
}
add_action( 'admin_menu', 'oakwood_events_admin_menu' );

function oakwood_events_settings_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	$notice = '';
	if ( isset( $_POST['oakwood_events_settings_submit'] ) ) {
		check_admin_referer( 'oakwood_events_settings_save', 'oakwood_events_settings_nonce' );
		$raw = isset( $_POST['oakwood_events_global_json'] ) ? wp_unslash( $_POST['oakwood_events_global_json'] ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		$raw = is_string( $raw ) ? trim( $raw ) : '';
		if ( $raw === '' ) {
			update_option( OAKWOOD_EVENTS_GLOBAL_OPTION, '' );
			$notice = __( 'Settings cleared. Defaults will be used.', 'oakwood-events' );
		} else {
			$decoded = json_decode( $raw, true );
			if ( json_last_error() !== JSON_ERROR_NONE || ! is_array( $decoded ) ) {
				$notice = __( 'Invalid JSON. Nothing saved.', 'oakwood-events' );
			} else {
				update_option( OAKWOOD_EVENTS_GLOBAL_OPTION, wp_json_encode( $decoded, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) );
				$notice = __( 'Settings saved.', 'oakwood-events' );
			}
		}
	}

	$current = oakwood_events_get_global_content();
	$current_raw = wp_json_encode( $current, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES );

	echo '<div class="wrap">';
	echo '<h1>' . esc_html__( 'Events settings', 'oakwood-events' ) . '</h1>';

	if ( $notice !== '' ) {
		echo '<div class="notice notice-info is-dismissible"><p>' . esc_html( $notice ) . '</p></div>';
	}

	echo '<p class="description">' . esc_html__( 'Edit the global sections for the events JSON (hero, sections, CTA). This is stored as a single JSON blob in wp_options.', 'oakwood-events' ) . '</p>';
	echo '<form method="post">';
	wp_nonce_field( 'oakwood_events_settings_save', 'oakwood_events_settings_nonce' );
	echo '<textarea name="oakwood_events_global_json" rows="24" class="large-text code" style="font-family:monospace;">' . esc_textarea( $current_raw ) . '</textarea>';
	echo '<p><button type="submit" class="button button-primary" name="oakwood_events_settings_submit" value="1">' . esc_html__( 'Save settings', 'oakwood-events' ) . '</button></p>';
	echo '</form>';
	echo '</div>';
}

