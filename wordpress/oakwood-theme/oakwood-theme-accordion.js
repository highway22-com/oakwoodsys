/**
 * Oakwood theme front-end scripts.
 */
( function () {
	'use strict';

	document.addEventListener( 'DOMContentLoaded', function () {
		document.querySelectorAll( '.oakwood-accordion details' ).forEach( function ( detail ) {
			detail.addEventListener( 'toggle', function () {
				detail.classList.add( 'is-toggling' );
				window.setTimeout( function () {
					detail.classList.remove( 'is-toggling' );
				}, 300 );

				if ( detail.open ) {
					const parent = detail.closest( '.oakwood-accordion' );
					if ( parent ) {
						parent.querySelectorAll( 'details' ).forEach( function ( other ) {
							if ( other !== detail ) {
								other.open = false;
							}
						} );
					}
				}
			} );
		} );
	} );
} )();
