/* Oakwood Accordion JS
   Uses their toggle approach:
   - Listens on native 'toggle' event (fires when details opens/closes)
   - Closes other items when one opens (exclusive behaviour)
   - Adds is-toggling class for 300ms for flash animation on +/-
   - Keyboard accessible */
( function () {
    'use strict';

    document.addEventListener( 'DOMContentLoaded', function () {
        document.querySelectorAll( '.oak-accordion' ).forEach( function ( accordion ) {
            accordion.querySelectorAll( '.oak-acc-item' ).forEach( function ( detail ) {

                /* Keyboard: make summary trigger toggle on Enter/Space */
                var summary = detail.querySelector( 'summary' );
                if ( summary ) {
                    summary.setAttribute( 'tabindex', '0' );
                    summary.setAttribute( 'role', 'button' );
                    summary.setAttribute( 'aria-expanded', detail.open ? 'true' : 'false' );
                }

                detail.addEventListener( 'toggle', function () {

                    /* Flash animation */
                    detail.classList.add( 'is-toggling' );
                    window.setTimeout( function () {
                        detail.classList.remove( 'is-toggling' );
                    }, 300 );

                    /* Update aria */
                    if ( summary ) {
                        summary.setAttribute( 'aria-expanded', detail.open ? 'true' : 'false' );
                    }

                    /* Close all siblings when this one opens */
                    if ( detail.open ) {
                        accordion.querySelectorAll( '.oak-acc-item' ).forEach( function ( other ) {
                            if ( other !== detail && other.open ) {
                                other.open = false;
                            }
                        } );
                    }
                } );
            } );
        } );
    } );

} )();

/* ── CTA Button arrow injection ── */
( function () {
    var arrowSVG = '<svg class="oak-btn-arrow" width="14" height="13" viewBox="0 0 14 13" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M8.25 0.28125L13.75 5.53125C13.9062 5.6875 14 5.875 14 6.09375C14 6.28125 13.9062 6.46875 13.75 6.625L8.25 11.875C7.96875 12.1562 7.46875 12.1562 7.1875 11.8438C6.90625 11.5625 6.90625 11.0625 7.21875 10.7812L11.375 6.84375H0.75C0.3125 6.84375 0 6.5 0 6.09375C0 5.65625 0.3125 5.34375 0.75 5.34375H11.375L7.21875 1.375C6.90625 1.09375 6.90625 0.59375 7.1875 0.3125C7.46875 0 7.9375 0 8.25 0.28125Z" fill="currentColor"/></svg>';

    function initCtaButtons() {
        document.querySelectorAll( '.oak-cta-inner .wp-block-button__link, .is-style-oak-cta-inner .wp-block-button__link, .oak-hero-btn .wp-block-button__link' ).forEach( function ( btn ) {
            if ( btn.dataset.oakArrow ) { return; }
            btn.dataset.oakArrow = '1';

            /* Wrap existing text in a span so it can slide */
            var text = btn.innerHTML.trim();
            btn.innerHTML = '<span class="oak-btn-text">' + text + '</span>' + arrowSVG;
        } );
    }

    if ( document.readyState === 'loading' ) {
        document.addEventListener( 'DOMContentLoaded', initCtaButtons );
    } else {
        initCtaButtons();
    }
} )();
