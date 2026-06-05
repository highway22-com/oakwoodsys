<?php
/**
 * Gutenberg block styles — Oakwood typography roles in the block sidebar.
 *
 * @package OakwoodsysTheme
 */

defined( 'ABSPATH' ) || exit;

/**
 * Register Oakwood block styles for core heading and paragraph blocks.
 */
function oakwoodsys_theme_register_block_styles() {
	if ( ! function_exists( 'register_block_style' ) ) {
		return;
	}

	$heading_styles = array(
		'oak-hero-title'    => __( 'Hero Title', 'oakwoodsys-theme' ),
		'oak-section-title' => __( 'Section Title', 'oakwoodsys-theme' ),
		'oak-card-title'    => __( 'Card Title', 'oakwoodsys-theme' ),
		'oak-cta-title'     => __( 'CTA Title', 'oakwoodsys-theme' ),
	);

	foreach ( $heading_styles as $name => $label ) {
		register_block_style(
			'core/heading',
			array(
				'name'  => $name,
				'label' => $label,
			)
		);
	}

	$paragraph_styles = array(
		'oak-hero-subtitle'   => __( 'Hero Subtitle', 'oakwoodsys-theme' ),
		'oak-section-eyebrow' => __( 'Section Eyebrow', 'oakwoodsys-theme' ),
		'oak-section-body'    => __( 'Section Body', 'oakwoodsys-theme' ),
		'oak-cta-description' => __( 'CTA Description', 'oakwoodsys-theme' ),
	);

	foreach ( $paragraph_styles as $name => $label ) {
		register_block_style(
			'core/paragraph',
			array(
				'name'  => $name,
				'label' => $label,
			)
		);
	}

	register_block_style(
		'core/button',
		array(
			'name'  => 'oak-button-primary',
			'label' => __( 'Oakwood Primary', 'oakwoodsys-theme' ),
		)
	);
}
add_action( 'init', 'oakwoodsys_theme_register_block_styles' );
