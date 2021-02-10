/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { NAVIGATION_STORE_NAME } from '@woocommerce/data';
import { recordEvent } from '@woocommerce/tracks';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './style.scss';

export const FavoriteButton = ( { id } ) => {
	const { favorites } = useSelect( ( select ) => {
		return {
			favorites: select( NAVIGATION_STORE_NAME ).getFavorites(),
		};
	} );

	const { addFavorite, removeFavorite } = useDispatch(
		NAVIGATION_STORE_NAME
	);

	const isFavorited = favorites.includes( id );

	const toggleFavorite = () => {
		const toggle = isFavorited ? removeFavorite : addFavorite;
		toggle( id );
		recordEvent( 'navigation_favorite', {
			id,
			action: isFavorited ? 'unfavorite' : 'favorite',
		} );
	};

	return (
		<Button
			id="woocommerce-navigation-favorite-button"
			className="woocommerce-navigation-favorite-button"
			isTertiary
			onClick={ toggleFavorite }
			icon={ isFavorited ? 'star-filled' : 'star-empty' }
			aria-label={
				isFavorited
					? __(
							'Add this item to your favorites.',
							'woocommerce-admin'
					  )
					: __(
							'Remove this item from your favorites.',
							'woocommerce-admin'
					  )
			}
		/>
	);
};

export default FavoriteButton;
