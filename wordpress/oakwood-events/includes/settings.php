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

		$tz_saved = false;
		if ( isset( $_POST['oakwood_events_timezone'] ) ) {
			$tz_raw = wp_unslash( $_POST['oakwood_events_timezone'] ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			update_option( OAKWOOD_EVENTS_TIMEZONE_OPTION, oakwood_events_sanitize_saved_timezone_setting( $tz_raw ) );
			$tz_saved = true;
		}

		$raw = isset( $_POST['oakwood_events_global_json'] ) ? wp_unslash( $_POST['oakwood_events_global_json'] ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		$raw = is_string( $raw ) ? trim( $raw ) : '';

		$json_notice = '';
		if ( $raw === '' ) {
			update_option( OAKWOOD_EVENTS_GLOBAL_OPTION, '' );
			$json_notice = __( 'Global content cleared; defaults will be used for hero and sections.', 'oakwood-events' );
		} else {
			$decoded = json_decode( $raw, true );
			if ( json_last_error() !== JSON_ERROR_NONE || ! is_array( $decoded ) ) {
				$json_notice = __( 'Invalid JSON — global content was not updated.', 'oakwood-events' );
			} else {
				update_option( OAKWOOD_EVENTS_GLOBAL_OPTION, wp_json_encode( $decoded, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) );
				$json_notice = __( 'Global content saved.', 'oakwood-events' );
			}
		}

		$parts = array_filter(
			array(
				$tz_saved ? __( 'Events timezone saved.', 'oakwood-events' ) : '',
				$json_notice,
			)
		);
		$notice = implode( ' ', $parts );
	}

	$current_tz = oakwood_events_get_plugin_events_timezone();
	$current = oakwood_events_get_global_content();
	$current_raw = wp_json_encode( $current, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES );

	echo '<div class="wrap">';
	echo '<h1>' . esc_html__( 'Events settings', 'oakwood-events' ) . '</h1>';

	if ( $notice !== '' ) {
		echo '<div class="notice notice-info is-dismissible"><p>' . esc_html( $notice ) . '</p></div>';
	}

	echo '<form method="post">';
	wp_nonce_field( 'oakwood_events_settings_save', 'oakwood_events_settings_nonce' );
	echo '<p class="description">' . esc_html__( 'Events timezone applies to all events (start/end fields in the editor). Changing it changes how local times map to stored ISO timestamps when you save an event.', 'oakwood-events' ) . '</p>';
	echo '<table class="form-table" role="presentation"><tbody><tr>';
	echo '<th scope="row"><label for="oakwood_events_timezone">' . esc_html__( 'Events timezone', 'oakwood-events' ) . '</label></th>';
	echo '<td><select name="oakwood_events_timezone" id="oakwood_events_timezone" class="regular-text">';
	echo wp_timezone_choice( $current_tz, get_user_locale() );
	echo '</select></td></tr></tbody></table>';

	echo '<p class="description">' . esc_html__( 'Edit the global sections for the events JSON (hero, sections, CTA). This is stored as a single JSON blob in wp_options.', 'oakwood-events' ) . '</p>';
	echo '<textarea name="oakwood_events_global_json" rows="24" class="large-text code" style="font-family:monospace;">' . esc_textarea( $current_raw ) . '</textarea>';
	echo '<p><button type="submit" class="button button-primary" name="oakwood_events_settings_submit" value="1">' . esc_html__( 'Save settings', 'oakwood-events' ) . '</button></p>';
	echo '</form>';
	echo '</div>';
}

