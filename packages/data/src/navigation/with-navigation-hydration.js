/**
 * External dependencies
 */
import { useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { STORE_NAME } from './constants';

/**
 * Higher-order component used to hydrate navigation data.
 *
 * @param {Object} data Data object with menu items and site information.
 */
export const withNavigationHydration = ( data ) => ( OriginalComponent ) => {
	return ( props ) => {
		const dataRef = useRef( data );

		useSelect( ( select, registry ) => {
			if ( ! dataRef.current ) {
				return;
			}

			const { isResolving, hasFinishedResolution } = select( STORE_NAME );
			const {
				startResolution,
				finishResolution,
				setMenuItems,
			} = registry.dispatch( STORE_NAME );

			if (
				! isResolving( 'getMenuItems' ) &&
				! hasFinishedResolution( 'getMenuItems' )
			) {
				startResolution( 'getMenuItems', [] );
				setMenuItems( dataRef.current.menuItems );
				finishResolution( 'getMenuItems', [] );
			}
		} );

		return <OriginalComponent { ...props } />;
	};
};
