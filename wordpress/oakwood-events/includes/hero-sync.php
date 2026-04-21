<?php
/**
 * Derive featured image and duration hints from hero video URLs (self-hosted MP4, YouTube, Vimeo).
 *
 * @package Oakwood_Events
 */

defined( 'ABSPATH' ) || exit;

/**
 * Filter: path to ffprobe binary (default "ffprobe").
 *
 * @param string $path Executable path.
 */
function oakwood_events_get_ffprobe_binary() {
	return (string) apply_filters( 'oakwood_events_ffprobe_path', 'ffprobe' );
}

/**
 * Filter: path to ffmpeg binary (default "ffmpeg").
 *
 * @param string $path Executable path.
 */
function oakwood_events_get_ffmpeg_binary() {
	return (string) apply_filters( 'oakwood_events_ffmpeg_path', 'ffmpeg' );
}

/**
 * YouTube Data API key (optional). Define OAKWOOD_EVENTS_YOUTUBE_API_KEY in wp-config.php for duration from YouTube.
 *
 * @return string
 */
function oakwood_events_get_youtube_api_key() {
	if ( defined( 'OAKWOOD_EVENTS_YOUTUBE_API_KEY' ) && is_string( OAKWOOD_EVENTS_YOUTUBE_API_KEY ) && OAKWOOD_EVENTS_YOUTUBE_API_KEY !== '' ) {
		return OAKWOOD_EVENTS_YOUTUBE_API_KEY;
	}
	return (string) apply_filters( 'oakwood_events_youtube_data_api_key', '' );
}

/**
 * Normalize host for comparison (lowercase, strip leading www.).
 *
 * @param string|null $host Host.
 * @return string
 */
function oakwood_events_normalize_host( $host ) {
	if ( ! is_string( $host ) || $host === '' ) {
		return '';
	}
	$h = strtolower( $host );
	if ( substr( $h, 0, 4 ) === 'www.' ) {
		$h = substr( $h, 4 );
	}
	return $h;
}

/**
 * Whether URL host matches this site's home URL host.
 *
 * @param string $url Video URL.
 * @return bool
 */
function oakwood_events_hero_url_is_same_site( $url ) {
	$h = oakwood_events_normalize_host( wp_parse_url( $url, PHP_URL_HOST ) );
	if ( $h === '' ) {
		return false;
	}
	$home = oakwood_events_normalize_host( wp_parse_url( home_url(), PHP_URL_HOST ) );
	$site  = oakwood_events_normalize_host( wp_parse_url( site_url(), PHP_URL_HOST ) );
	return ( $h !== '' && ( $h === $home || $h === $site ) );
}

/**
 * Map a same-site URL to an MP4 path under uploads, or empty string if invalid / traversal.
 *
 * @param string $url Video URL.
 * @return string Absolute filesystem path or ''.
 */
function oakwood_events_hero_local_mp4_path_from_url( $url ) {
	if ( ! oakwood_events_hero_url_is_same_site( $url ) ) {
		return '';
	}
	$path = wp_parse_url( $url, PHP_URL_PATH );
	if ( ! is_string( $path ) || $path === '' ) {
		return '';
	}
	$path = urldecode( $path );
	$ext  = strtolower( pathinfo( $path, PATHINFO_EXTENSION ) );
	if ( $ext !== 'mp4' ) {
		return '';
	}
	$uploads = wp_upload_dir();
	if ( ! empty( $uploads['error'] ) ) {
		return '';
	}
	$baseurl_path = wp_parse_url( $uploads['baseurl'], PHP_URL_PATH );
	if ( ! is_string( $baseurl_path ) || $baseurl_path === '' ) {
		return '';
	}
	$baseurl_path = '/' . ltrim( $baseurl_path, '/' );
	if ( strpos( $path, $baseurl_path ) !== 0 ) {
		return '';
	}
	$rel = substr( $path, strlen( $baseurl_path ) );
	$rel = str_replace( array( "\0" ), '', $rel );
	$rel = ltrim( str_replace( '\\', '/', $rel ), '/' );
	$file = trailingslashit( $uploads['basedir'] ) . $rel;
	$real_file = realpath( $file );
	$real_base = realpath( $uploads['basedir'] );
	if ( ! $real_file || ! $real_base || ! is_file( $real_file ) ) {
		return '';
	}
	if ( strpos( $real_file, $real_base ) !== 0 ) {
		return '';
	}
	return $real_file;
}

/**
 * Extract YouTube video id from common URL shapes.
 *
 * @param string $url URL.
 * @return string Id or ''.
 */
function oakwood_events_extract_youtube_id( $url ) {
	if ( ! is_string( $url ) || $url === '' ) {
		return '';
	}
	$parsed = wp_parse_url( $url );
	if ( ! is_array( $parsed ) ) {
		return '';
	}
	$host = oakwood_events_normalize_host( isset( $parsed['host'] ) ? $parsed['host'] : '' );
	if ( $host === 'youtu.be' && ! empty( $parsed['path'] ) ) {
		$id = trim( basename( $parsed['path'] ), '/' );
		return preg_match( '/^[a-zA-Z0-9_-]{6,}$/', $id ) ? $id : '';
	}
	if ( $host === 'youtube.com' || $host === 'm.youtube.com' || $host === 'music.youtube.com' ) {
		if ( ! empty( $parsed['query'] ) ) {
			parse_str( $parsed['query'], $q );
			if ( ! empty( $q['v'] ) && is_string( $q['v'] ) ) {
				$id = $q['v'];
				return preg_match( '/^[a-zA-Z0-9_-]{6,}$/', $id ) ? $id : '';
			}
		}
		$path = isset( $parsed['path'] ) ? $parsed['path'] : '';
		if ( is_string( $path ) && $path !== '' ) {
			if ( preg_match( '#/(?:embed|shorts|live)/([a-zA-Z0-9_-]{6,})#', $path, $m ) ) {
				return $m[1];
			}
		}
	}
	return '';
}

/**
 * Extract numeric Vimeo video id from URL.
 *
 * @param string $url URL.
 * @return string Id or ''.
 */
function oakwood_events_extract_vimeo_id( $url ) {
	if ( ! is_string( $url ) || $url === '' ) {
		return '';
	}
	$parsed = wp_parse_url( $url );
	if ( ! is_array( $parsed ) || empty( $parsed['host'] ) ) {
		return '';
	}
	$host = oakwood_events_normalize_host( $parsed['host'] );
	if ( $host !== 'vimeo.com' && $host !== 'player.vimeo.com' ) {
		return '';
	}
	$path = isset( $parsed['path'] ) ? $parsed['path'] : '';
	if ( ! is_string( $path ) ) {
		return '';
	}
	if ( preg_match( '#/(?:video/)?(\d{6,})#', $path, $m ) ) {
		return $m[1];
	}
	return '';
}

/**
 * GET JSON body with short timeout.
 *
 * @param string $request_url URL.
 * @return array|null Decoded array or null.
 */
function oakwood_events_hero_remote_get_json( $request_url ) {
	$response = wp_remote_get(
		$request_url,
		array(
			'timeout' => 12,
			'redirection' => 3,
		)
	);
	if ( is_wp_error( $response ) ) {
		return null;
	}
	$code = (int) wp_remote_retrieve_response_code( $response );
	if ( $code < 200 || $code >= 400 ) {
		return null;
	}
	$body = wp_remote_retrieve_body( $response );
	if ( ! is_string( $body ) || $body === '' ) {
		return null;
	}
	$data = json_decode( $body, true );
	return is_array( $data ) ? $data : null;
}

/**
 * Vimeo oEmbed payload for a Vimeo watch URL.
 *
 * @param string $url Original hero URL.
 * @return array|null Keys thumbnail_url, duration (seconds) optional.
 */
function oakwood_events_vimeo_oembed_data( $url ) {
	$vimeo_id = oakwood_events_extract_vimeo_id( $url );
	if ( $vimeo_id === '' ) {
		return null;
	}
	$embed_url = 'https://vimeo.com/' . $vimeo_id;
	$oembed    = 'https://vimeo.com/api/oembed.json?url=' . rawurlencode( $embed_url );
	$data      = oakwood_events_hero_remote_get_json( $oembed );
	if ( ! $data ) {
		return null;
	}
	$out = array(
		'thumbnail_url' => isset( $data['thumbnail_url'] ) && is_string( $data['thumbnail_url'] ) ? $data['thumbnail_url'] : '',
		'duration'      => null,
	);
	if ( isset( $data['duration'] ) && is_numeric( $data['duration'] ) ) {
		$out['duration'] = (int) $data['duration'];
	}
	return $out;
}

/**
 * Parse YouTube contentDetails.duration (ISO 8601) to seconds.
 *
 * @param string $iso ISO duration.
 * @return int|null
 */
function oakwood_events_youtube_iso8601_duration_to_seconds( $iso ) {
	if ( ! is_string( $iso ) || $iso === '' ) {
		return null;
	}
	if ( ! preg_match( '/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/', $iso, $m ) ) {
		return null;
	}
	$h = isset( $m[1] ) && $m[1] !== '' ? (int) $m[1] : 0;
	$i = isset( $m[2] ) && $m[2] !== '' ? (int) $m[2] : 0;
	$s = isset( $m[3] ) && $m[3] !== '' ? (int) $m[3] : 0;
	$sec = $h * 3600 + $i * 60 + $s;
	return $sec > 0 ? $sec : null;
}

/**
 * YouTube video duration via Data API (optional key).
 *
 * @param string $video_id YouTube id.
 * @return int|null Seconds.
 */
function oakwood_events_youtube_duration_seconds_via_api( $video_id ) {
	$key = oakwood_events_get_youtube_api_key();
	if ( $key === '' || $video_id === '' ) {
		return null;
	}
	$url  = add_query_arg(
		array(
			'part' => 'contentDetails',
			'id'   => $video_id,
			'key'  => $key,
		),
		'https://www.googleapis.com/youtube/v3/videos'
	);
	$data = oakwood_events_hero_remote_get_json( $url );
	if ( ! $data || empty( $data['items'][0]['contentDetails']['duration'] ) ) {
		return null;
	}
	return oakwood_events_youtube_iso8601_duration_to_seconds( (string) $data['items'][0]['contentDetails']['duration'] );
}

/**
 * Duration in seconds for a single hero URL.
 *
 * @param string $url URL.
 * @return int|null
 */
function oakwood_events_hero_duration_seconds_for_url( $url ) {
	$local = oakwood_events_hero_local_mp4_path_from_url( $url );
	if ( $local !== '' ) {
		$sec = oakwood_events_ffprobe_duration_seconds( $local );
		return ( $sec !== null && $sec > 0 ) ? $sec : null;
	}
	$yt = oakwood_events_extract_youtube_id( $url );
	if ( $yt !== '' ) {
		return oakwood_events_youtube_duration_seconds_via_api( $yt );
	}
	if ( oakwood_events_extract_vimeo_id( $url ) !== '' ) {
		$vm = oakwood_events_vimeo_oembed_data( $url );
		if ( $vm && isset( $vm['duration'] ) && is_int( $vm['duration'] ) && $vm['duration'] > 0 ) {
			return $vm['duration'];
		}
	}
	return null;
}

/**
 * First supported hero URL duration in whole minutes (minimum 1), or 0 if none.
 *
 * @param array $urls Clean URL list.
 * @return int
 */
function oakwood_events_hero_duration_minutes_from_urls( array $urls ) {
	foreach ( $urls as $url ) {
		if ( ! is_string( $url ) || $url === '' ) {
			continue;
		}
		$sec = oakwood_events_hero_duration_seconds_for_url( $url );
		if ( $sec !== null && $sec > 0 ) {
			return max( 1, (int) ceil( $sec / 60 ) );
		}
	}
	return 0;
}

/**
 * Run ffprobe to read duration in seconds.
 *
 * @param string $file Absolute path to media file.
 * @return float|null
 */
function oakwood_events_ffprobe_duration_seconds( $file ) {
	$bin = oakwood_events_get_ffprobe_binary();
	if ( $bin === '' || ! is_readable( $file ) ) {
		return null;
	}
	$cmd = sprintf(
		'%s -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 %s',
		escapeshellcmd( $bin ),
		escapeshellarg( $file )
	);
	$output = shell_exec( $cmd ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.system_calls_shell_exec
	if ( ! is_string( $output ) ) {
		return null;
	}
	$output = trim( $output );
	if ( $output === '' || ! is_numeric( $output ) ) {
		return null;
	}
	$v = (float) $output;
	return $v > 0 ? $v : null;
}

/**
 * Extract one JPEG frame from local MP4 using ffmpeg.
 *
 * @param string $file Absolute path to MP4.
 * @return string|null Path to temp jpeg or null.
 */
function oakwood_events_ffmpeg_extract_frame_jpeg( $file ) {
	$bin = oakwood_events_get_ffmpeg_binary();
	if ( $bin === '' || ! is_readable( $file ) ) {
		return null;
	}
	$tmp = wp_tempnam( 'oak-hero-frame-' );
	if ( ! $tmp ) {
		return null;
	}
	$out = $tmp . '.jpg';
	// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.system_calls_shell_exec
	$cmd = sprintf(
		'%s -y -hide_banner -loglevel error -ss 1 -i %s -frames:v 1 -q:v 2 %s',
		escapeshellcmd( $bin ),
		escapeshellarg( $file ),
		escapeshellarg( $out )
	);
	shell_exec( $cmd );
	@unlink( $tmp );
	if ( ! is_file( $out ) || filesize( $out ) < 100 ) {
		@unlink( $out );
		return null;
	}
	return $out;
}

/**
 * Download remote image to temp file for sideload.
 *
 * @param string $image_url HTTPS image URL.
 * @return string|\WP_Error Path to temp file or error.
 */
function oakwood_events_hero_download_image_temp( $image_url ) {
	if ( ! function_exists( 'download_url' ) ) {
		require_once ABSPATH . 'wp-admin/includes/file.php';
	}
	return download_url( $image_url, 20 );
}

/**
 * Sideload a local temp image file as media attachment for a post.
 *
 * @param int    $post_id Post ID.
 * @param string $tmp_path Temp file path.
 * @param string $filename Desired filename (basename).
 * @return int|\WP_Error Attachment ID or error.
 */
function oakwood_events_sideload_temp_image( $post_id, $tmp_path, $filename ) {
	if ( ! function_exists( 'media_handle_sideload' ) ) {
		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/media.php';
		require_once ABSPATH . 'wp-admin/includes/image.php';
	}
	$file_array = array(
		'name'     => $filename,
		'tmp_name' => $tmp_path,
	);
	$att_id = media_handle_sideload( $file_array, $post_id );
	if ( is_wp_error( $att_id ) ) {
		@unlink( $tmp_path );
		return $att_id;
	}
	return (int) $att_id;
}

/**
 * Try YouTube thumbnail URLs until one downloads.
 *
 * @param string $video_id YouTube id.
 * @return string|\WP_Error Temp path or error.
 */
function oakwood_events_youtube_thumbnail_temp_file( $video_id ) {
	$candidates = array(
		'https://i.ytimg.com/vi/' . $video_id . '/maxresdefault.jpg',
		'https://i.ytimg.com/vi/' . $video_id . '/hqdefault.jpg',
		'https://i.ytimg.com/vi/' . $video_id . '/sddefault.jpg',
	);
	foreach ( $candidates as $img_url ) {
		$tmp = oakwood_events_hero_download_image_temp( $img_url );
		if ( ! is_wp_error( $tmp ) && is_string( $tmp ) && is_readable( $tmp ) && filesize( $tmp ) > 500 ) {
			return $tmp;
		}
		if ( is_string( $tmp ) && is_file( $tmp ) ) {
			@unlink( $tmp );
		}
	}
	return new \WP_Error( 'oakwood_hero_yt_thumb', __( 'Could not download YouTube thumbnail.', 'oakwood-events' ) );
}

/**
 * Resolve first hero URL to a temp JPEG path suitable for sideload, or WP_Error.
 *
 * @param string $url Hero URL.
 * @return string|\WP_Error
 */
function oakwood_events_hero_thumbnail_temp_for_url( $url ) {
	$local = oakwood_events_hero_local_mp4_path_from_url( $url );
	if ( $local !== '' ) {
		$jpg = oakwood_events_ffmpeg_extract_frame_jpeg( $local );
		if ( $jpg ) {
			return $jpg;
		}
		return new \WP_Error( 'oakwood_hero_ffmpeg', __( 'Could not extract frame from local video (ffmpeg).', 'oakwood-events' ) );
	}
	$yt = oakwood_events_extract_youtube_id( $url );
	if ( $yt !== '' ) {
		return oakwood_events_youtube_thumbnail_temp_file( $yt );
	}
	if ( oakwood_events_extract_vimeo_id( $url ) !== '' ) {
		$vm = oakwood_events_vimeo_oembed_data( $url );
		if ( $vm && ! empty( $vm['thumbnail_url'] ) ) {
			$tmp = oakwood_events_hero_download_image_temp( $vm['thumbnail_url'] );
			if ( ! is_wp_error( $tmp ) ) {
				return $tmp;
			}
			return $tmp;
		}
		return new \WP_Error( 'oakwood_hero_vimeo', __( 'Could not load Vimeo oEmbed thumbnail.', 'oakwood-events' ) );
	}
	return new \WP_Error( 'oakwood_hero_unknown', __( 'Unsupported hero video URL for thumbnail.', 'oakwood-events' ) );
}

/**
 * If the post has no featured image, sideload thumbnail from the first supported hero URL.
 *
 * @param int   $post_id Post ID.
 * @param array $videos_clean Sanitized URL list.
 */
function oakwood_events_sync_hero_thumbnail_after_save( $post_id, array $videos_clean ) {
	$post_id = (int) $post_id;
	if ( $post_id < 1 ) {
		return;
	}
	if ( get_post_thumbnail_id( $post_id ) ) {
		return;
	}
	foreach ( $videos_clean as $url ) {
		if ( ! is_string( $url ) || $url === '' ) {
			continue;
		}
		$tmp = oakwood_events_hero_thumbnail_temp_for_url( $url );
		if ( is_wp_error( $tmp ) ) {
			continue;
		}
		$filename = sanitize_file_name( 'hero-' . md5( $url ) . '.jpg' );
		$att      = oakwood_events_sideload_temp_image( $post_id, $tmp, $filename );
		if ( ! is_wp_error( $att ) && $att > 0 ) {
			set_post_thumbnail( $post_id, $att );
			return;
		}
	}
}
