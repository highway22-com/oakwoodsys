<?php

defined( 'ABSPATH' ) || exit;

function oakwood_events_meta_keys() {
	return array(
		'type',
		'location',
		'eventStartISO',
		'eventEndISO',
		'durationMinutes',
		'registerLink',
		'eventTimeZone',
		'heroVideoUrls',
	);
}

function oakwood_events_register_meta() {
	$keys = oakwood_events_meta_keys();
	foreach ( $keys as $key ) {
		$args = array(
			'type'              => 'string',
			'single'            => true,
			'show_in_rest'      => true,
			'auth_callback'     => function() {
				return current_user_can( 'edit_posts' );
			},
			'sanitize_callback' => 'sanitize_text_field',
		);

		if ( $key === 'durationMinutes' ) {
			$args['sanitize_callback'] = 'oakwood_events_sanitize_duration_minutes_string';
		}

		if ( $key === 'eventTimeZone' ) {
			$args['sanitize_callback'] = 'oakwood_events_sanitize_timezone_meta';
		}

		if ( $key === 'heroVideoUrls' ) {
			$args['sanitize_callback'] = 'oakwood_events_sanitize_json_array_string';
		}

		register_post_meta( OAKWOOD_EVENTS_POST_TYPE, '_oakwood_events_' . $key, $args );
	}
}
add_action( 'init', 'oakwood_events_register_meta' );

function oakwood_events_sanitize_duration_minutes_string( $value ) {
	$n = absint( $value );
	if ( $n < 1 ) {
		return '';
	}
	return (string) $n;
}

/**
 * WordPress site timezone as an IANA string usable by DateTimeZone, or UTC.
 */
function oakwood_events_site_timezone_string() {
	$s = function_exists( 'wp_timezone_string' ) ? wp_timezone_string() : '';
	if ( ! is_string( $s ) || $s === '' ) {
		return 'UTC';
	}
	try {
		new \DateTimeZone( $s );
		return $s;
	} catch ( \Exception $e ) {
		return 'UTC';
	}
}

/**
 * Returns a valid timezone id; empty or invalid input falls back to the site timezone.
 */
function oakwood_events_normalize_timezone_string( $tz_string ) {
	$raw = is_string( $tz_string ) ? trim( sanitize_text_field( $tz_string ) ) : '';
	if ( $raw !== '' ) {
		try {
			new \DateTimeZone( $raw );
			return $raw;
		} catch ( \Exception $e ) {
			// Fall through to site default.
		}
	}
	return oakwood_events_site_timezone_string();
}

function oakwood_events_sanitize_timezone_meta( $value ) {
	return oakwood_events_normalize_timezone_string( is_string( $value ) ? $value : '' );
}

function oakwood_events_datetime_local_to_iso( $datetime_local, $tz_string = null ) {
	$raw = is_string( $datetime_local ) ? trim( $datetime_local ) : '';
	if ( $raw === '' ) {
		return '';
	}

	$tz_id = oakwood_events_normalize_timezone_string( is_string( $tz_string ) ? $tz_string : '' );

	try {
		$tz = new \DateTimeZone( $tz_id );
	} catch ( \Exception $e ) {
		$tz = new \DateTimeZone( 'UTC' );
	}

	// datetime-local is "YYYY-MM-DDTHH:MM" (no timezone).
	$dt = \DateTimeImmutable::createFromFormat( 'Y-m-d\TH:i', $raw, $tz );
	if ( ! $dt ) {
		// Some browsers include seconds.
		$dt = \DateTimeImmutable::createFromFormat( 'Y-m-d\TH:i:s', $raw, $tz );
	}
	if ( ! $dt ) {
		return '';
	}

	return $dt->setTimezone( $tz )->format( 'c' );
}

function oakwood_events_iso_to_datetime_local( $iso, $tz_string = null ) {
	$raw = is_string( $iso ) ? trim( $iso ) : '';
	if ( $raw === '' ) {
		return '';
	}

	$tz_id = oakwood_events_normalize_timezone_string( is_string( $tz_string ) ? $tz_string : '' );

	try {
		$tz = new \DateTimeZone( $tz_id );
	} catch ( \Exception $e ) {
		$tz = new \DateTimeZone( 'UTC' );
	}

	try {
		$dt = new \DateTimeImmutable( $raw );
	} catch ( \Exception $e ) {
		return '';
	}

	$dt = $dt->setTimezone( $tz );
	return $dt->format( 'Y-m-d\TH:i' );
}

function oakwood_events_iso_to_timestamp( $iso ) {
	$raw = is_string( $iso ) ? trim( $iso ) : '';
	if ( $raw === '' ) {
		return null;
	}

	$ts = strtotime( $raw );
	if ( false === $ts ) {
		return null;
	}

	return (int) $ts;
}

function oakwood_events_sanitize_json_array_string( $value ) {
	if ( $value === '' || $value === null ) {
		return '[]';
	}
	if ( is_array( $value ) ) {
		$clean = array();
		foreach ( $value as $item ) {
			if ( is_string( $item ) ) {
				$item = trim( $item );
				if ( $item !== '' ) {
					$clean[] = $item;
				}
			}
		}
		return wp_json_encode( array_values( $clean ) );
	}
	if ( is_string( $value ) ) {
		$raw = trim( $value );
		if ( $raw === '' ) {
			return '[]';
		}
		$decoded = json_decode( $raw, true );
		if ( is_array( $decoded ) ) {
			$clean = array();
			foreach ( $decoded as $item ) {
				if ( is_string( $item ) ) {
					$item = trim( $item );
					if ( $item !== '' ) {
						$clean[] = $item;
					}
				}
			}
			return wp_json_encode( array_values( $clean ) );
		}
	}
	return '[]';
}

function oakwood_events_get_meta( $post_id, $key, $default = '' ) {
	$value = get_post_meta( $post_id, '_oakwood_events_' . $key, true );
	if ( $value === '' || $value === null ) {
		return $default;
	}
	return $value;
}

function oakwood_events_get_meta_array( $post_id, $key ) {
	$raw = oakwood_events_get_meta( $post_id, $key, '[]' );
	if ( is_array( $raw ) ) {
		return $raw;
	}
	$decoded = json_decode( (string) $raw, true );
	return is_array( $decoded ) ? array_values( $decoded ) : array();
}

/**
 * Timezone stored on the event post, normalized; defaults to site timezone when unset or invalid.
 */
function oakwood_events_get_resolved_event_timezone_for_post( $post_id ) {
	$stored = oakwood_events_get_meta( $post_id, 'eventTimeZone', '' );
	return oakwood_events_normalize_timezone_string( is_string( $stored ) ? $stored : '' );
}

function oakwood_events_add_meta_boxes() {
	add_meta_box(
		'oakwood_events_details',
		__( 'Event details', 'oakwood-events' ),
		'oakwood_events_details_meta_box',
		OAKWOOD_EVENTS_POST_TYPE,
		'normal',
		'default'
	);
}
add_action( 'add_meta_boxes', 'oakwood_events_add_meta_boxes' );

function oakwood_events_details_meta_box( \WP_Post $post ) {
	wp_nonce_field( OAKWOOD_EVENTS_NONCE_ACTION, OAKWOOD_EVENTS_NONCE_NAME );

	$type        = oakwood_events_get_meta( $post->ID, 'type', 'online' );
	$location    = oakwood_events_get_meta( $post->ID, 'location', '' );
	$eventStartISO = oakwood_events_get_meta( $post->ID, 'eventStartISO', '' );
	$eventEndISO = oakwood_events_get_meta( $post->ID, 'eventEndISO', '' );
	$durationMinutes = oakwood_events_get_meta( $post->ID, 'durationMinutes', '' );
	$register    = oakwood_events_get_meta( $post->ID, 'registerLink', '' );
	$event_tz    = oakwood_events_get_resolved_event_timezone_for_post( $post->ID );
	$videos      = oakwood_events_get_meta_array( $post->ID, 'heroVideoUrls' );

	echo '<style>
		.oakwood-events-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;align-items:start;}
		.oakwood-events-field label{display:block;font-weight:600;margin-bottom:4px;}
		.oakwood-events-field input[type="text"], .oakwood-events-field input[type="datetime-local"], .oakwood-events-field input[type="number"], .oakwood-events-field input[type="url"], .oakwood-events-field select, .oakwood-events-field textarea{width:100%;}
		.oakwood-events-repeatable{margin:0;padding:0;list-style:none;}
		.oakwood-events-repeatable li{display:flex;gap:8px;align-items:center;margin:6px 0;}
		.oakwood-events-repeatable input{flex:1;}
	</style>';

	echo '<div class="oakwood-events-grid">';

	echo '<div class="oakwood-events-field">';
	echo '<label for="oakwood_events_type">' . esc_html__( 'Type', 'oakwood-events' ) . '</label>';
	echo '<select id="oakwood_events_type" name="oakwood_events_type">';
	echo '<option value="online"' . selected( $type, 'online', false ) . '>' . esc_html__( 'online', 'oakwood-events' ) . '</option>';
	echo '<option value="in-person"' . selected( $type, 'in-person', false ) . '>' . esc_html__( 'in-person', 'oakwood-events' ) . '</option>';
	echo '</select>';
	echo '</div>';

	echo '<div class="oakwood-events-field">';
	echo '<label for="oakwood_events_location">' . esc_html__( 'Location', 'oakwood-events' ) . '</label>';
	echo '<input type="text" id="oakwood_events_location" name="oakwood_events_location" value="' . esc_attr( $location ) . '" />';
	echo '</div>';

	echo '<div class="oakwood-events-field">';
	echo '<label for="oakwood_events_registerLink">' . esc_html__( 'Register link', 'oakwood-events' ) . '</label>';
	echo '<input type="url" id="oakwood_events_registerLink" name="oakwood_events_registerLink" value="' . esc_attr( $register ) . '" placeholder="https://..." />';
	echo '</div>';

	echo '<div class="oakwood-events-field">';
	echo '<label for="oakwood_events_eventTimeZone">' . esc_html__( 'Event timezone', 'oakwood-events' ) . '</label>';
	echo '<select id="oakwood_events_eventTimeZone" name="oakwood_events_eventTimeZone">';
	echo wp_timezone_choice( $event_tz, get_user_locale() );
	echo '</select>';
	echo '<p class="description" style="margin:4px 0 0;">' . esc_html__(
		'Start and end times use this timezone. If you change it, verify the start and end fields still match what you intend.',
		'oakwood-events'
	) . '</p>';
	echo '</div>';

	echo '<div class="oakwood-events-field">';
	echo '<label for="oakwood_events_eventStartLocal">' . esc_html__( 'Event start', 'oakwood-events' ) . '</label>';
	echo '<input type="datetime-local" id="oakwood_events_eventStartLocal" name="oakwood_events_eventStartLocal" value="' . esc_attr( oakwood_events_iso_to_datetime_local( $eventStartISO, $event_tz ) ) . '" />';
	echo '<p class="description" style="margin:4px 0 0;">' . esc_html__(
		'Wall clock in the timezone selected above (the datetime field has no offset).',
		'oakwood-events'
	) . '</p>';
	echo '</div>';

	echo '<div class="oakwood-events-field">';
	echo '<label for="oakwood_events_eventEndLocal">' . esc_html__( 'Event end', 'oakwood-events' ) . '</label>';
	echo '<input type="datetime-local" id="oakwood_events_eventEndLocal" name="oakwood_events_eventEndLocal" value="' . esc_attr( oakwood_events_iso_to_datetime_local( $eventEndISO, $event_tz ) ) . '" />';
	echo '</div>';

	echo '<div class="oakwood-events-field">';
	echo '<label for="oakwood_events_durationMinutes">' . esc_html__( 'Duration (minutes)', 'oakwood-events' ) . '</label>';
	echo '<input type="number" min="1" step="1" id="oakwood_events_durationMinutes" name="oakwood_events_durationMinutes" value="' . esc_attr( is_numeric( $durationMinutes ) ? (string) (int) $durationMinutes : '' ) . '" />';
	echo '<p class="description" style="margin:4px 0 0;">' . esc_html__( 'If this disagrees with Event end, Event end wins and duration is recalculated.', 'oakwood-events' ) . '</p>';
	echo '</div>';

	echo '</div>';

	echo '<hr style="margin:16px 0;" />';

	echo '<div class="oakwood-events-field">';
	echo '<label>' . esc_html__( 'Video URLs', 'oakwood-events' ) . '</label>';
	echo '<p class="description" style="margin:0 0 8px;">' . esc_html__(
		'YouTube, Vimeo, or direct URLs (e.g. WordPress media). Zero or more.',
		'oakwood-events'
	) . '</p>';
	echo '<ul class="oakwood-events-repeatable" id="oakwood-events-videos">';
	if ( empty( $videos ) ) {
		$videos = array( '' );
	}
	foreach ( $videos as $url ) {
		echo '<li><input type="url" name="oakwood_events_heroVideoUrls[]" value="' . esc_attr( $url ) . '" placeholder="https://..." />';
		echo '<button type="button" class="button oakwood-events-remove">' . esc_html__( 'Remove', 'oakwood-events' ) . '</button></li>';
	}
	echo '</ul>';
	echo '<button type="button" class="button" id="oakwood-events-add-video">' . esc_html__( 'Add video', 'oakwood-events' ) . '</button>';
	echo '</div>';

	echo '<script>
	(function(){
		function addRow(listId, inputName, placeholder, inputType){
			var list = document.getElementById(listId);
			if(!list) return;
			var li = document.createElement("li");
			var input = document.createElement("input");
			input.type = inputType || "text";
			input.name = inputName;
			input.placeholder = placeholder || "";
			input.style.flex = "1";
			var btn = document.createElement("button");
			btn.type = "button";
			btn.className = "button oakwood-events-remove";
			btn.textContent = "Remove";
			li.appendChild(input);
			li.appendChild(btn);
			list.appendChild(li);
		}
		document.addEventListener("click", function(e){
			var t = e.target;
			if(!t) return;
			if(t.id === "oakwood-events-add-video"){ addRow("oakwood-events-videos","oakwood_events_heroVideoUrls[]","https://...","url"); }
			if(t.classList && t.classList.contains("oakwood-events-remove")){
				e.preventDefault();
				var li = t.closest("li");
				if(li && li.parentNode){ li.parentNode.removeChild(li); }
			}
		});
	})();
	</script>';
}

function oakwood_events_save_meta( $post_id ) {
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}
	if ( ! isset( $_POST[ OAKWOOD_EVENTS_NONCE_NAME ] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST[ OAKWOOD_EVENTS_NONCE_NAME ] ) ), OAKWOOD_EVENTS_NONCE_ACTION ) ) {
		return;
	}
	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}
	if ( get_post_type( $post_id ) !== OAKWOOD_EVENTS_POST_TYPE ) {
		return;
	}

	$map = array(
		'type'        => 'oakwood_events_type',
		'location'    => 'oakwood_events_location',
		'registerLink'=> 'oakwood_events_registerLink',
	);

	foreach ( $map as $key => $field ) {
		$val = isset( $_POST[ $field ] ) ? wp_unslash( $_POST[ $field ] ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		$val = is_string( $val ) ? $val : '';
		$val = ( $key === 'registerLink' ) ? esc_url_raw( $val ) : sanitize_text_field( $val );
		update_post_meta( $post_id, '_oakwood_events_' . $key, $val );
	}

	if ( isset( $_POST['oakwood_events_primary_tag'] ) ) {
		$primary_tag = absint( wp_unslash( $_POST['oakwood_events_primary_tag'] ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		if ( $primary_tag > 0 ) {
			$term = get_term( $primary_tag, OAKWOOD_EVENTS_TAG_TAXONOMY );
			if ( $term && ! is_wp_error( $term ) ) {
				wp_set_post_terms( $post_id, array( $primary_tag ), OAKWOOD_EVENTS_TAG_TAXONOMY, false );
			} else {
				wp_set_post_terms( $post_id, array(), OAKWOOD_EVENTS_TAG_TAXONOMY, false );
			}
		} else {
			wp_set_post_terms( $post_id, array(), OAKWOOD_EVENTS_TAG_TAXONOMY, false );
		}
	}

	$tz_post = isset( $_POST['oakwood_events_eventTimeZone'] ) ? wp_unslash( $_POST['oakwood_events_eventTimeZone'] ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
	$tz_post = is_string( $tz_post ) ? trim( $tz_post ) : '';
	$event_tz = oakwood_events_normalize_timezone_string( $tz_post );
	update_post_meta( $post_id, '_oakwood_events_eventTimeZone', $event_tz );

	$start_local = isset( $_POST['oakwood_events_eventStartLocal'] ) ? wp_unslash( $_POST['oakwood_events_eventStartLocal'] ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
	$end_local   = isset( $_POST['oakwood_events_eventEndLocal'] ) ? wp_unslash( $_POST['oakwood_events_eventEndLocal'] ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
	$duration_raw = isset( $_POST['oakwood_events_durationMinutes'] ) ? wp_unslash( $_POST['oakwood_events_durationMinutes'] ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized

	$start_local = is_string( $start_local ) ? trim( $start_local ) : '';
	$end_local   = is_string( $end_local ) ? trim( $end_local ) : '';

	$duration_minutes = absint( $duration_raw );
	if ( $duration_minutes < 1 ) {
		$duration_minutes = 0;
	}

	$start_iso = oakwood_events_datetime_local_to_iso( $start_local, $event_tz );
	$end_iso   = oakwood_events_datetime_local_to_iso( $end_local, $event_tz );

	$start_ts = $start_iso ? oakwood_events_iso_to_timestamp( $start_iso ) : null;
	$end_ts   = $end_iso ? oakwood_events_iso_to_timestamp( $end_iso ) : null;

	try {
		$event_tz_obj = new \DateTimeZone( $event_tz );
	} catch ( \Exception $e ) {
		$event_tz_obj = new \DateTimeZone( 'UTC' );
	}

	// If end is missing but duration exists, derive end from start+duration.
	if ( $start_ts && ! $end_ts && $duration_minutes > 0 ) {
		$end_ts = $start_ts + ( $duration_minutes * 60 );
		$end_iso = wp_date( 'c', $end_ts, $event_tz_obj );
	}

	// If end exists but disagrees with duration, end wins (recalculate duration).
	if ( $start_ts && $end_ts ) {
		if ( $end_ts <= $start_ts ) {
			// Invalid end — drop it and fall back to duration-only derivation if possible.
			$end_ts = null;
			$end_iso = '';
			if ( $duration_minutes > 0 ) {
				$end_ts = $start_ts + ( $duration_minutes * 60 );
				$end_iso = wp_date( 'c', $end_ts, $event_tz_obj );
			}
		} else {
			$duration_minutes = (int) round( ( $end_ts - $start_ts ) / 60 );
			if ( $duration_minutes < 1 ) {
				$duration_minutes = 1;
			}
		}
	}

	// Persist canonical fields.
	if ( $start_iso === '' ) {
		update_post_meta( $post_id, '_oakwood_events_eventStartISO', '' );
		update_post_meta( $post_id, '_oakwood_events_eventEndISO', '' );
		update_post_meta( $post_id, '_oakwood_events_durationMinutes', '' );
	} else {
		update_post_meta( $post_id, '_oakwood_events_eventStartISO', sanitize_text_field( $start_iso ) );
		update_post_meta( $post_id, '_oakwood_events_eventEndISO', $end_iso ? sanitize_text_field( $end_iso ) : '' );
		update_post_meta(
			$post_id,
			'_oakwood_events_durationMinutes',
			( $duration_minutes > 0 ) ? oakwood_events_sanitize_duration_minutes_string( $duration_minutes ) : ''
		);
	}

	$videos = isset( $_POST['oakwood_events_heroVideoUrls'] ) ? (array) wp_unslash( $_POST['oakwood_events_heroVideoUrls'] ) : array(); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
	$videos_clean = array();
	foreach ( $videos as $url ) {
		if ( is_string( $url ) ) {
			$url = trim( $url );
			if ( $url !== '' ) {
				$videos_clean[] = esc_url_raw( $url );
			}
		}
	}
	update_post_meta( $post_id, '_oakwood_events_heroVideoUrls', wp_json_encode( array_values( $videos_clean ) ) );
}
add_action( 'save_post_' . OAKWOOD_EVENTS_POST_TYPE, 'oakwood_events_save_meta' );

