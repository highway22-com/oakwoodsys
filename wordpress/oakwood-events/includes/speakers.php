<?php

defined( 'ABSPATH' ) || exit;

define( 'OAKWOOD_SPEAKER_ROLE_META', '_oakwood_speaker_role' );
define( 'OAKWOOD_SPEAKER_BIO_META', '_oakwood_speaker_bio' );
define( 'OAKWOOD_SPEAKER_IMAGE_ID_META', '_oakwood_speaker_image_id' );
define( 'OAKWOOD_SPEAKER_IMAGE_URL_META', '_oakwood_speaker_image_url' );

function oakwood_events_speaker_term_fields_add( $taxonomy ) {
	echo '<div class="form-field term-group">';
	echo '<label for="oakwood_speaker_role">' . esc_html__( 'Role', 'oakwood-events' ) . '</label>';
	echo '<input type="text" id="oakwood_speaker_role" name="oakwood_speaker_role" value="" />';
	echo '</div>';

	echo '<div class="form-field term-group">';
	echo '<label for="oakwood_speaker_bio">' . esc_html__( 'Description', 'oakwood-events' ) . '</label>';
	echo '<textarea id="oakwood_speaker_bio" name="oakwood_speaker_bio" rows="4"></textarea>';
	echo '</div>';

	echo '<div class="form-field term-group">';
	echo '<label>' . esc_html__( 'Image', 'oakwood-events' ) . '</label>';
	echo '<input type="hidden" id="oakwood_speaker_image_id" name="oakwood_speaker_image_id" value="" />';
	echo '<input type="hidden" id="oakwood_speaker_image_url" name="oakwood_speaker_image_url" value="" />';
	echo '<div id="oakwood-speaker-image-preview" style="margin:8px 0;"></div>';
	echo '<button type="button" class="button" id="oakwood-speaker-image-select">' . esc_html__( 'Select image', 'oakwood-events' ) . '</button> ';
	echo '<button type="button" class="button" id="oakwood-speaker-image-remove" style="display:none;">' . esc_html__( 'Remove', 'oakwood-events' ) . '</button>';
	echo '</div>';

	oakwood_events_speaker_media_script();
}

function oakwood_events_speaker_term_fields_edit( \WP_Term $term, $taxonomy ) {
	$role = get_term_meta( $term->term_id, OAKWOOD_SPEAKER_ROLE_META, true );
	$bio  = get_term_meta( $term->term_id, OAKWOOD_SPEAKER_BIO_META, true );
	$image_id = (int) get_term_meta( $term->term_id, OAKWOOD_SPEAKER_IMAGE_ID_META, true );
	$image_url_meta = (string) get_term_meta( $term->term_id, OAKWOOD_SPEAKER_IMAGE_URL_META, true );
	$image_url = '';
	if ( $image_id ) {
		$src = wp_get_attachment_image_src( $image_id, 'thumbnail' );
		if ( is_array( $src ) && ! empty( $src[0] ) ) {
			$image_url = $src[0];
		}
	}
	if ( $image_url === '' && $image_url_meta !== '' ) {
		$image_url = $image_url_meta;
	}

	echo '<tr class="form-field term-group-wrap">';
	echo '<th scope="row"><label for="oakwood_speaker_role">' . esc_html__( 'Role', 'oakwood-events' ) . '</label></th>';
	echo '<td><input type="text" id="oakwood_speaker_role" name="oakwood_speaker_role" value="' . esc_attr( $role ) . '" /></td>';
	echo '</tr>';

	echo '<tr class="form-field term-group-wrap">';
	echo '<th scope="row"><label for="oakwood_speaker_bio">' . esc_html__( 'Description', 'oakwood-events' ) . '</label></th>';
	echo '<td><textarea id="oakwood_speaker_bio" name="oakwood_speaker_bio" rows="4" style="width:100%;">' . esc_textarea( $bio ) . '</textarea></td>';
	echo '</tr>';

	echo '<tr class="form-field term-group-wrap">';
	echo '<th scope="row"><label>' . esc_html__( 'Image', 'oakwood-events' ) . '</label></th>';
	echo '<td>';
	echo '<input type="hidden" id="oakwood_speaker_image_id" name="oakwood_speaker_image_id" value="' . esc_attr( (string) $image_id ) . '" />';
	echo '<input type="hidden" id="oakwood_speaker_image_url" name="oakwood_speaker_image_url" value="' . esc_attr( $image_url_meta ) . '" />';
	echo '<div id="oakwood-speaker-image-preview" style="margin:8px 0;">';
	if ( $image_url !== '' ) {
		echo '<img src="' . esc_url( $image_url ) . '" alt="" style="max-width:120px;height:auto;border:1px solid #c3c4c7;padding:2px;background:#fff;" />';
	}
	echo '</div>';
	echo '<button type="button" class="button" id="oakwood-speaker-image-select">' . esc_html__( 'Select image', 'oakwood-events' ) . '</button> ';
	echo '<button type="button" class="button" id="oakwood-speaker-image-remove"' . ( $image_id ? '' : ' style="display:none;"' ) . '>' . esc_html__( 'Remove', 'oakwood-events' ) . '</button>';
	echo '</td>';
	echo '</tr>';

	oakwood_events_speaker_media_script();
}

function oakwood_events_speaker_save_term_meta( $term_id ) {
	if ( isset( $_POST['oakwood_speaker_role'] ) ) {
		update_term_meta( $term_id, OAKWOOD_SPEAKER_ROLE_META, sanitize_text_field( wp_unslash( $_POST['oakwood_speaker_role'] ) ) );
	}
	if ( isset( $_POST['oakwood_speaker_bio'] ) ) {
		update_term_meta( $term_id, OAKWOOD_SPEAKER_BIO_META, sanitize_textarea_field( wp_unslash( $_POST['oakwood_speaker_bio'] ) ) );
	}
	if ( isset( $_POST['oakwood_speaker_image_id'] ) ) {
		$image_id = (int) wp_unslash( $_POST['oakwood_speaker_image_id'] );
		if ( $image_id > 0 ) {
			update_term_meta( $term_id, OAKWOOD_SPEAKER_IMAGE_ID_META, $image_id );
		} else {
			delete_term_meta( $term_id, OAKWOOD_SPEAKER_IMAGE_ID_META );
		}
	}
	if ( isset( $_POST['oakwood_speaker_image_url'] ) ) {
		$url = esc_url_raw( wp_unslash( $_POST['oakwood_speaker_image_url'] ) );
		if ( $url !== '' ) {
			update_term_meta( $term_id, OAKWOOD_SPEAKER_IMAGE_URL_META, $url );
		} else {
			delete_term_meta( $term_id, OAKWOOD_SPEAKER_IMAGE_URL_META );
		}
	}
}

add_action( OAKWOOD_EVENTS_SPEAKER_TAXONOMY . '_add_form_fields', 'oakwood_events_speaker_term_fields_add', 10, 2 );
add_action( OAKWOOD_EVENTS_SPEAKER_TAXONOMY . '_edit_form_fields', 'oakwood_events_speaker_term_fields_edit', 10, 2 );
add_action( 'created_' . OAKWOOD_EVENTS_SPEAKER_TAXONOMY, 'oakwood_events_speaker_save_term_meta', 10, 1 );
add_action( 'edited_' . OAKWOOD_EVENTS_SPEAKER_TAXONOMY, 'oakwood_events_speaker_save_term_meta', 10, 1 );

function oakwood_events_speaker_media_script() {
	static $printed = false;
	if ( $printed ) {
		return;
	}
	$printed = true;

	// Only works when WordPress media scripts are loaded.
	wp_enqueue_media();

	echo '<script>
	(function(){
		var frame;
		function setPreview(url){
			var preview = document.getElementById("oakwood-speaker-image-preview");
			if(!preview) return;
			preview.innerHTML = url ? ("<img src=\\"" + url + "\\" alt=\\"\\" style=\\"max-width:120px;height:auto;border:1px solid #c3c4c7;padding:2px;background:#fff;\\" />") : "";
		}
		document.addEventListener("click", function(e){
			var t = e.target;
			if(!t) return;
			if(t.id === "oakwood-speaker-image-select"){
				e.preventDefault();
				if(frame){ frame.open(); return; }
				frame = wp.media({ title: "Select Speaker Image", button: { text: "Use this image" }, multiple: false });
				frame.on("select", function(){
					var attachment = frame.state().get("selection").first().toJSON();
					var input = document.getElementById("oakwood_speaker_image_id");
					if(input){ input.value = attachment.id; }
					var url = (attachment.sizes && attachment.sizes.thumbnail ? attachment.sizes.thumbnail.url : attachment.url);
					var urlInput = document.getElementById("oakwood_speaker_image_url");
					if(urlInput){ urlInput.value = url; }
					setPreview(url);
					var removeBtn = document.getElementById("oakwood-speaker-image-remove");
					if(removeBtn){ removeBtn.style.display = ""; }
				});
				frame.open();
			}
			if(t.id === "oakwood-speaker-image-remove"){
				e.preventDefault();
				var input2 = document.getElementById("oakwood_speaker_image_id");
				if(input2){ input2.value = ""; }
				var urlInput2 = document.getElementById("oakwood_speaker_image_url");
				if(urlInput2){ urlInput2.value = ""; }
				setPreview("");
				t.style.display = "none";
			}
		});
	})();
	</script>';
}

function oakwood_events_get_speaker_term_data( \WP_Term $term ) {
	$role = (string) get_term_meta( $term->term_id, OAKWOOD_SPEAKER_ROLE_META, true );
	$bio  = (string) get_term_meta( $term->term_id, OAKWOOD_SPEAKER_BIO_META, true );
	$image_id = (int) get_term_meta( $term->term_id, OAKWOOD_SPEAKER_IMAGE_ID_META, true );
	$image_url = '';
	if ( $image_id ) {
		$src = wp_get_attachment_image_src( $image_id, 'full' );
		if ( is_array( $src ) && ! empty( $src[0] ) ) {
			$image_url = $src[0];
		}
	}
	if ( $image_url === '' ) {
		$image_url = (string) get_term_meta( $term->term_id, OAKWOOD_SPEAKER_IMAGE_URL_META, true );
	}

	return array(
		'name'        => $term->name,
		'slug'        => $term->slug,
		'role'        => $role,
		'description' => $bio,
		'bio'         => $bio,
		'imageUrl'    => $image_url,
	);
}

