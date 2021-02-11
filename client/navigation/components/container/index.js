/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useMemo, useState, useRef } from '@wordpress/element';
import classnames from 'classnames';
import { compose } from '@wordpress/compose';
import {
	Navigation,
	NavigationMenu,
	NavigationGroup,
} from '@woocommerce/experimental';
import { NAVIGATION_STORE_NAME } from '@woocommerce/data';
import { recordEvent } from '@woocommerce/tracks';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { addHistoryListener, getMatchingItem } from '../../utils';
import Header from '../header';
import Item from '../../components/Item';

const Container = ( { menuItems } ) => {
	useEffect( () => {
		// Collapse the original WP Menu.
		document.documentElement.classList.remove( 'wp-toolbar' );
		const adminMenu = document.getElementById( 'adminmenumain' );

		if ( ! adminMenu ) {
			return;
		}

		adminMenu.classList.add( 'folded' );
	}, [] );

	const { rootBackLabel, rootBackUrl } = window.wcNavigation;

	const parentCategory = {
		capability: 'manage_woocommerce',
		id: 'woocommerce',
		isCategory: true,
		menuId: 'primary',
		migrate: true,
		order: 10,
		parent: '',
		title: 'WooCommerce',
	};
	const categoriesMap = menuItems.reduce(
		( acc, item ) => {
			if ( item.isCategory ) {
				return { ...acc, [ item.id ]: item };
			}
			return acc;
		},
		{
			woocommerce: parentCategory,
		}
	);
	const categories = Object.values( categoriesMap );

	const [ activeItem, setActiveItem ] = useState( 'woocommerce-home' );
	const [ activeLevel, setActiveLevel ] = useState( 'woocommerce' );

	useEffect( () => {
		const initialMatchedItem = getMatchingItem( menuItems );
		if ( initialMatchedItem ) {
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

	const getMenuItemsByCategory = ( items ) => {
		return items.reduce( ( acc, item ) => {
			// Set up the category if it doesn't yet exist.
			if ( ! acc[ item.parent ] ) {
				acc[ item.parent ] = {};
			}

			// Check if parent category is in the same menu.
			if (
				item.parent !== 'woocommerce' &&
				categoriesMap[ item.parent ] &&
				categoriesMap[ item.parent ].menuId !== item.menuId
			) {
				return acc;
			}

			// Create the menu object if it doesn't exist in this category.
			if ( ! acc[ item.parent ][ item.menuId ] ) {
				acc[ item.parent ][ item.menuId ] = [];
			}

			acc[ item.parent ][ item.menuId ].push( item );
			return acc;
		}, {} );
	};

	const categorizedItems = useMemo(
		() => getMenuItemsByCategory( menuItems ),
		[ menuItems ]
	);

	const navDomRef = useRef( null );

	const trackBackClick = ( id ) => {
		recordEvent( 'navigation_back_click', {
			category: id,
		} );
	};

	const isRoot = activeLevel === 'woocommerce';
	const isRootBackVisible = isRoot && rootBackUrl;

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
					{ categories.map( ( category ) => {
						const {
							primary: primaryItems,
							secondary: secondaryItems,
							plugins: pluginItems,
						} = categorizedItems[ category.id ] || {};
						return [
							( !! primaryItems || !! pluginItems ) && (
								<NavigationMenu
									key={ category.id }
									title={ category.title }
									menu={ category.id }
									parentMenu={ category.parent }
									backButtonLabel={
										isRootBackVisible
											? rootBackLabel
											: category.backButtonLabel || null
									}
									onBackButtonClick={
										isRootBackVisible
											? () => {
													trackBackClick(
														'woocommerce'
													);
													window.location = rootBackUrl;
											  }
											: () =>
													trackBackClick(
														category.id
													)
									}
								>
									{ !! primaryItems && (
										<NavigationGroup>
											{ primaryItems.map( ( item ) => (
												<Item
													key={ item.id }
													item={ item }
												/>
											) ) }
										</NavigationGroup>
									) }
									{ !! pluginItems && (
										<NavigationGroup
											title={
												category.id === 'woocommerce'
													? __(
															'Extensions',
															'woocommerce-admin'
													  )
													: null
											}
										>
											{ pluginItems.map( ( item ) => (
												<Item
													key={ item.id }
													item={ item }
												/>
											) ) }
										</NavigationGroup>
									) }
								</NavigationMenu>
							),
							!! secondaryItems && (
								<NavigationMenu
									className="components-navigation__menu-secondary"
									key={ `secondary/${ category.id }` }
									title={ ! isRoot ? category.title : null }
									menu={ category.id }
									parentMenu={ category.parent }
									backButtonLabel={
										category.backButtonLabel || null
									}
									onBackButtonClick={
										isRootBackVisible
											? null
											: () =>
													trackBackClick(
														category.id
													)
									}
								>
									<NavigationGroup
										onBackButtonClick={ () =>
											trackBackClick( category.id )
										}
									>
										{ secondaryItems.map( ( item ) => (
											<Item
												key={ item.id }
												item={ item }
											/>
										) ) }
									</NavigationGroup>
								</NavigationMenu>
							),
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
