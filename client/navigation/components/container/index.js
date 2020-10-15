/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { compose } from '@wordpress/compose';
import {
	__experimentalNavigation as Navigation,
	__experimentalNavigationBackButton as NavigationBackButton,
	__experimentalNavigationMenu as NavigationMenu,
	__experimentalNavigationGroup as NavigationGroup,
} from '@wordpress/components';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { addHistoryListener, getMatchingItem } from '../../utils';
import { NAVIGATION_STORE_NAME } from '../../store';
import Header from '../header';
import Item from '../../components/Item';

const Container = ( { menuItems } ) => {
	useEffect( () => {
		// Collapse the original WP Menu.
		const adminMenu = document.getElementById( 'adminmenumain' );
		adminMenu.classList.add( 'folded' );
	}, [] );

	const dashboardUrl =
		window.wcNavigation && window.wcNavigation.dashboardUrl;

	const categories = menuItems.filter( ( item ) => item.isCategory );
	categories.push( {
		capability: 'manage_woocommerce',
		id: 'woocommerce',
		isCategory: true,
		menuId: 'primary',
		migrate: true,
		order: 10,
		parent: '',
		title: 'WooCommerce',
	} );

	const [ activeItem, setActiveItem ] = useState( 'woocommerce-home' );
	const [ activeLevel, setActiveLevel ] = useState( 'woocommerce' );

	useEffect( () => {
		const initialMatchedItem = getMatchingItem( menuItems );
		setActiveItem( initialMatchedItem );
		setActiveLevel( initialMatchedItem.parent );

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

	return (
		<div className="woocommerce-navigation">
			<Header />
			<Navigation
				activeItem={ activeItem ? activeItem.id : null }
				activeMenu={ activeLevel }
				onActivateMenu={ setActiveLevel }
			>
				{ activeLevel === 'woocommerce' && dashboardUrl && (
					<NavigationBackButton
						className="woocommerce-navigation__back-to-dashboard"
						href={ dashboardUrl }
						backButtonLabel={ __(
							'WordPress Dashboard',
							'woocommerce-navigation'
						) }
					></NavigationBackButton>
				) }
				{ categories.map( ( category ) => (
					<NavigationMenu
						key={ category.id }
						title={ category.title }
						menu={ category.id }
						parentMenu={ category.parent }
						backButtonLabel={ category.backButtonLabel }
					>
						<NavigationGroup>
							{ menuItems
								.filter(
									( item ) =>
										item.parent === category.id &&
										item.menuId !== 'secondary'
								)
								.map( ( item ) => (
									<Item key={ item.id } item={ item } />
								) ) }
						</NavigationGroup>
						<NavigationGroup>
							{ menuItems
								.filter(
									( item ) =>
										item.parent === category.id &&
										item.menuId === 'secondary'
								)
								.map( ( item ) => (
									<Item key={ item.id } item={ item } />
								) ) }
						</NavigationGroup>
					</NavigationMenu>
				) ) }
			</Navigation>
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
