/**
 * External dependencies
 */
import { useEffect, useMemo, useState, useRef } from '@wordpress/element';
import classnames from 'classnames';
import { compose } from '@wordpress/compose';
import { Navigation } from '@woocommerce/experimental';
import { NAVIGATION_STORE_NAME } from '@woocommerce/data';
import { recordEvent } from '@woocommerce/tracks';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { addHistoryListener, getMatchingItem } from '../../utils';
import Header from '../header';
import { PrimaryMenu } from './primary-menu';
import { SecondaryMenu } from './secondary-menu';

const woocommerceMenuIds = [ 'primary', 'favorites', 'plugins', 'secondary' ];

const defaultCategories = {
	woocommerce: {
		capability: 'manage_woocommerce',
		id: 'woocommerce',
		isCategory: true,
		menuId: 'primary',
		migrate: true,
		order: 10,
		parent: '',
		title: 'WooCommerce',
	},
};

/**
 * Get a map of all categories, including the topmost WooCommerce parentCategory
 *
 * @param {Array} menuItems Array of menuItems
 * @return {Object} Map of categories by id
 */
export const getCategoriesMap = ( menuItems ) => {
	return menuItems.reduce(
		( acc, item ) => {
			if ( item.isCategory ) {
				return { ...acc, [ item.id ]: item };
			}
			return acc;
		},
		{
			woocommerce: {
				capability: 'manage_woocommerce',
				id: 'woocommerce',
				isCategory: true,
				menuId: 'primary',
				migrate: true,
				order: 10,
				parent: '',
				title: 'WooCommerce',
			},
		}
	);
};

/**
 * Get a flat tree structure of all Categories and thier children grouped by menuId
 *
 * @param {Array} menuIds Array of menu IDs.
 * @param {Array} menuItems Array of menu items.
 * @return {Object} Mapped menu items by category.
 */
export const getMenuItemsByCategory = ( menuIds, menuItems ) => {
	const categories = defaultCategories;
	const items = menuItems.reduce( ( acc, item ) => {
		// Set up the category if it doesn't yet exist.
		if ( ! acc[ item.parent ] ) {
			acc[ item.parent ] = {};
			menuIds.forEach( ( menuId ) => {
				acc[ item.parent ][ menuId ] = [];
			} );
		}

		// Incorrect menu ID.
		if ( ! acc[ item.parent ][ item.menuId ] ) {
			return acc;
		}

		// Add categories.
		if ( item.isCategory ) {
			categories[ item.id ] = item;
		}

		acc[ item.parent ][ item.menuId ].push( item );
		return acc;
	}, {} );

	// Sort added menu items.
	Object.keys( items ).forEach( ( categoryId ) => {
		menuIds.forEach( ( menuId ) => {
			items[ categoryId ][ menuId ] = items[ categoryId ][ menuId ].sort(
				( a, b ) => a.order - b.order
			);
		} );
	} );

	return {
		items,
		categories,
	};
};

const Container = ( { menuItems } ) => {
	useEffect( () => {
		// Collapse the original WP Menu.
		document.documentElement.classList.remove( 'wp-toolbar' );
		document.body.classList.add( 'has-woocommerce-navigation' );
		const adminMenu = document.getElementById( 'adminmenumain' );

		if ( ! adminMenu ) {
			return;
		}

		adminMenu.classList.add( 'folded' );
	}, [] );

	const [ activeItem, setActiveItem ] = useState( 'woocommerce-home' );
	const [ activeLevel, setActiveLevel ] = useState( 'woocommerce' );

	useEffect( () => {
		const initialMatchedItem = getMatchingItem( menuItems );
		if ( initialMatchedItem && activeItem !== initialMatchedItem ) {
			setActiveItem( initialMatchedItem );
			setActiveLevel( initialMatchedItem.parent );
		}

		const removeListener = addHistoryListener( () => {
			setTimeout( () => {
				const matchedItem = getMatchingItem( menuItems );
				if ( matchedItem ) {
					setActiveItem( matchedItem );
				}
			}, 0 );
		} );

		return removeListener;
	}, [ menuItems ] );

	const { categories, items } = useMemo(
		() => getMenuItemsByCategory( woocommerceMenuIds, menuItems ),
		[ menuItems ]
	);

	const navDomRef = useRef( null );

	const onBackClick = ( id ) => {
		recordEvent( 'navigation_back_click', {
			category: id,
		} );
	};

	const isRoot = activeLevel === 'woocommerce';

	const classes = classnames( 'woocommerce-navigation', {
		'is-root': isRoot,
	} );

	return (
		<div className={ classes }>
			<Header />
			<div className="woocommerce-navigation__wrapper" ref={ navDomRef }>
				<Navigation
					activeItem={ activeItem ? activeItem.id : null }
					activeMenu={ activeLevel }
					onActivateMenu={ ( ...args ) => {
						if ( navDomRef && navDomRef.current ) {
							navDomRef.current.scrollTop = 0;
						}

						setActiveLevel( ...args );
					} }
				>
					{ Object.values( categories ).map( ( category ) => {
						const categoryItems = items[ category.id ];

						return [
							<PrimaryMenu
								key={ category.id }
								category={ category }
								onBackClick={ onBackClick }
								primaryItems={ [
									...categoryItems.primary,
									...categoryItems.favorites,
								] }
								pluginItems={ categoryItems.plugins }
							/>,
							<SecondaryMenu
								key={ `secondary/${ category.id }` }
								category={ category }
								onBackClick={ onBackClick }
								items={ categoryItems.secondary }
							/>,
						];
					} ) }
				</Navigation>
			</div>
		</div>
	);
};

export default compose(
	withSelect( ( select ) => {
		const { getActiveItem, getMenuItems } = select( NAVIGATION_STORE_NAME );

		return {
			activeItem: getActiveItem(),
			menuItems: getMenuItems(),
		};
	} )
)( Container );
