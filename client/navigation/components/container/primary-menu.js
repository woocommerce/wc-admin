/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { NavigationMenu, NavigationGroup } from '@woocommerce/experimental';
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import CategoryTitle from '../category-title';
import Item from '../../components/Item';

export const PrimaryMenu = ( {
	category,
	onBackClick,
	pluginItems,
	primaryItems,
} ) => {
	if ( ! primaryItems.length && ! pluginItems.length ) {
		return null;
	}

	const { rootBackLabel, rootBackUrl } = window.wcNavigation;

	const filteredRootBackUrl = applyFilters(
		'woocommerce_navigation_root_back_url',
		rootBackUrl
	);

	const isRootBackVisible =
		category.id === 'woocommerce' && filteredRootBackUrl;

	return (
		<NavigationMenu
			title={ <CategoryTitle category={ category } /> }
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
							onBackClick( 'woocommerce' );
							window.location = filteredRootBackUrl;
					  }
					: () => onBackClick( category.id )
			}
		>
			{ !! primaryItems.length && (
				<NavigationGroup>
					{ primaryItems.map( ( item ) => (
						<Item key={ item.id } item={ item } />
					) ) }
				</NavigationGroup>
			) }
			{ !! pluginItems.length && (
				<NavigationGroup
					title={
						category.id === 'woocommerce'
							? __( 'Extensions', 'woocommerce-admin' )
							: null
					}
				>
					{ pluginItems.map( ( item ) => (
						<Item key={ item.id } item={ item } />
					) ) }
				</NavigationGroup>
			) }
		</NavigationMenu>
	);
};
