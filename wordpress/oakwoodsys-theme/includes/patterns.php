<?php
/**
 * Block patterns — Oakwood layout sections visible in the Gutenberg inserter.
 *
 * @package OakwoodsysTheme
 */

defined( 'ABSPATH' ) || exit;

/**
 * Register the Oakwood pattern category.
 */
function oakwoodsys_theme_register_pattern_category() {
	if ( ! function_exists( 'register_block_pattern_category' ) ) {
		return;
	}

	register_block_pattern_category(
		'oakwood',
		array(
			'label' => __( 'Oakwood', 'oakwoodsys-theme' ),
		)
	);
}
add_action( 'init', 'oakwoodsys_theme_register_pattern_category' );

/**
 * Register Oakwood block patterns.
 */
function oakwoodsys_theme_register_patterns() {
	if ( ! function_exists( 'register_block_pattern' ) ) {
		return;
	}

	$patterns = array(
		'oakwoodsys-theme/hero'            => array(
			'title'       => __( 'Oakwood — Hero', 'oakwoodsys-theme' ),
			'description' => _x( 'Video/image hero with title, subtitle and primary button.', 'Block pattern description', 'oakwoodsys-theme' ),
			'categories'  => array( 'oakwood', 'header' ),
			'content'     => '<!-- wp:group {"align":"full","className":"oak-hero-section","style":{"color":{"background":"#001258","text":"#ffffff"},"spacing":{"padding":{"top":"120px","bottom":"120px","left":"40px","right":"40px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull oak-hero-section has-text-color has-background" style="color:#ffffff;background-color:#001258;padding-top:120px;padding-right:40px;padding-bottom:120px;padding-left:40px"><!-- wp:heading {"level":1,"className":"oak-hero-title"} -->
<h1 class="wp-block-heading oak-hero-title">Your hero headline goes here</h1>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"oak-hero-subtitle"} -->
<p class="oak-hero-subtitle">A short supporting description for the hero section. Use Segoe UI at 20px.</p>
<!-- /wp:paragraph -->

<!-- wp:buttons -->
<div class="wp-block-buttons"><!-- wp:button {"className":"is-style-oak-button-primary"} -->
<div class="wp-block-button is-style-oak-button-primary"><a class="wp-block-button__link wp-element-button">Get started</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div>
<!-- /wp:group -->',
		),
		'oakwoodsys-theme/section-header'  => array(
			'title'       => __( 'Oakwood — Section Header', 'oakwoodsys-theme' ),
			'description' => _x( 'Eyebrow label, section title and description.', 'Block pattern description', 'oakwoodsys-theme' ),
			'categories'  => array( 'oakwood', 'text' ),
			'content'     => '<!-- wp:group {"className":"oak-section-header","layout":{"type":"constrained"}} -->
<div class="wp-block-group oak-section-header"><!-- wp:paragraph {"className":"oak-section-eyebrow"} -->
<p class="oak-section-eyebrow">Section label</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":2,"className":"oak-section-title"} -->
<h2 class="wp-block-heading oak-section-title">Section title goes here</h2>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"oak-section-body"} -->
<p class="oak-section-body">Section description text. Use this for introductory copy below the heading.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->',
		),
		'oakwoodsys-theme/feature-card'    => array(
			'title'       => __( 'Oakwood — Feature Card', 'oakwoodsys-theme' ),
			'description' => _x( 'Card with title and body text.', 'Block pattern description', 'oakwoodsys-theme' ),
			'categories'  => array( 'oakwood', 'featured' ),
			'content'     => '<!-- wp:group {"className":"oak-feature-card","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"40px","bottom":"40px","left":"40px","right":"40px"}},"color":{"background":"#ffffff"}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group oak-feature-card has-background" style="border-radius:8px;background-color:#ffffff;padding-top:40px;padding-right:40px;padding-bottom:40px;padding-left:40px"><!-- wp:heading {"level":3,"className":"oak-card-title"} -->
<h3 class="wp-block-heading oak-card-title">Feature title</h3>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"oak-section-body"} -->
<p class="oak-section-body">Short description for this feature or service card.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->',
		),
		'oakwoodsys-theme/features-grid-3' => array(
			'title'       => __( 'Oakwood — Features Grid (3 columns)', 'oakwoodsys-theme' ),
			'description' => _x( 'Centered section header plus three feature cards in a row.', 'Block pattern description', 'oakwoodsys-theme' ),
			'categories'  => array( 'oakwood', 'columns', 'featured' ),
			'content'     => '<!-- wp:group {"align":"full","className":"oak-features-section","style":{"color":{"background":"#F2F8FD"},"spacing":{"padding":{"top":"80px","bottom":"80px","left":"40px","right":"40px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull oak-features-section has-background" style="background-color:#F2F8FD;padding-top:80px;padding-right:40px;padding-bottom:80px;padding-left:40px"><!-- wp:group {"className":"oak-section-header oak-section-header--centered","layout":{"type":"constrained","contentSize":"840px"}} -->
<div class="wp-block-group oak-section-header oak-section-header--centered"><!-- wp:paragraph {"align":"center","className":"oak-section-eyebrow"} -->
<p class="has-text-align-center oak-section-eyebrow">Why Oakwood</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"textAlign":"center","level":2,"className":"oak-section-title"} -->
<h2 class="wp-block-heading has-text-align-center oak-section-title">What we deliver for your team</h2>
<!-- /wp:heading -->

<!-- wp:paragraph {"align":"center","className":"oak-section-body"} -->
<p class="has-text-align-center oak-section-body">Three capability areas that help organizations modernize faster with less risk.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:columns {"className":"oak-feature-grid","style":{"spacing":{"blockGap":{"left":"24px","top":"24px"}}}} -->
<div class="wp-block-columns oak-feature-grid"><!-- wp:column -->
<div class="wp-block-column"><!-- wp:group {"className":"oak-feature-card","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"40px","bottom":"40px","left":"40px","right":"40px"},"blockGap":"24px"},"color":{"background":"#ffffff"},"dimensions":{"minHeight":"274px"}},"layout":{"type":"flex","orientation":"vertical"}} -->
<div class="wp-block-group oak-feature-card has-background" style="border-radius:8px;background-color:#ffffff;min-height:274px;padding-top:40px;padding-right:40px;padding-bottom:40px;padding-left:40px"><!-- wp:paragraph {"className":"oak-feature-icon"} -->
<p class="oak-feature-icon" aria-hidden="true"></p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3,"className":"oak-card-title"} -->
<h3 class="wp-block-heading oak-card-title">Instant Process Automation</h3>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"oak-section-body"} -->
<p class="oak-section-body">Automate repetitive workflows and reduce manual handoffs across your organization.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"><!-- wp:group {"className":"oak-feature-card","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"40px","bottom":"40px","left":"40px","right":"40px"},"blockGap":"24px"},"color":{"background":"#ffffff"},"dimensions":{"minHeight":"274px"}},"layout":{"type":"flex","orientation":"vertical"}} -->
<div class="wp-block-group oak-feature-card has-background" style="border-radius:8px;background-color:#ffffff;min-height:274px;padding-top:40px;padding-right:40px;padding-bottom:40px;padding-left:40px"><!-- wp:paragraph {"className":"oak-feature-icon"} -->
<p class="oak-feature-icon" aria-hidden="true"></p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3,"className":"oak-card-title"} -->
<h3 class="wp-block-heading oak-card-title">Smart Routing &amp; Approval Logic</h3>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"oak-section-body"} -->
<p class="oak-section-body">Route requests to the right teams with configurable approval paths and audit trails.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"><!-- wp:group {"className":"oak-feature-card","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"40px","bottom":"40px","left":"40px","right":"40px"},"blockGap":"24px"},"color":{"background":"#ffffff"},"dimensions":{"minHeight":"274px"}},"layout":{"type":"flex","orientation":"vertical"}} -->
<div class="wp-block-group oak-feature-card has-background" style="border-radius:8px;background-color:#ffffff;min-height:274px;padding-top:40px;padding-right:40px;padding-bottom:40px;padding-left:40px"><!-- wp:paragraph {"className":"oak-feature-icon"} -->
<p class="oak-feature-icon" aria-hidden="true"></p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3,"className":"oak-card-title"} -->
<h3 class="wp-block-heading oak-card-title">Real-Time Visibility</h3>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"oak-section-body"} -->
<p class="oak-section-body">Monitor pipeline health and operational KPIs with dashboards your teams actually use.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div>
<!-- /wp:column --></div>
<!-- /wp:columns --></div>
<!-- /wp:group -->',
		),
		'oakwoodsys-theme/cta'             => array(
			'title'       => __( 'Oakwood — CTA', 'oakwoodsys-theme' ),
			'description' => _x( 'Call to action with large title, description and button.', 'Block pattern description', 'oakwoodsys-theme' ),
			'categories'  => array( 'oakwood', 'call-to-action' ),
			'content'     => '<!-- wp:group {"align":"full","className":"oak-cta-section","style":{"spacing":{"padding":{"top":"80px","bottom":"80px","left":"40px","right":"40px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull oak-cta-section" style="padding-top:80px;padding-right:40px;padding-bottom:80px;padding-left:40px"><!-- wp:heading {"textAlign":"center","level":2,"className":"oak-cta-title"} -->
<h2 class="wp-block-heading has-text-align-center oak-cta-title">Ready to get started?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph {"align":"center","className":"oak-cta-description"} -->
<p class="has-text-align-center oak-cta-description">Contact our team to discuss your next project.</p>
<!-- /wp:paragraph -->

<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
<div class="wp-block-buttons"><!-- wp:button {"className":"is-style-oak-button-primary"} -->
<div class="wp-block-button is-style-oak-button-primary"><a class="wp-block-button__link wp-element-button">Contact us</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div>
<!-- /wp:group -->',
		),
	);

	foreach ( $patterns as $slug => $args ) {
		if ( empty( $args['content'] ) ) {
			continue;
		}
		register_block_pattern( $slug, $args );
	}
}
add_action( 'init', 'oakwoodsys_theme_register_patterns' );
