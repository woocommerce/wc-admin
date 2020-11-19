/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import PropTypes from 'prop-types';
import CheckmarkIcon from 'gridicons/dist/checkmark';
import { EmptyContent, Section } from '@woocommerce/components';
import { ITEMS_STORE_NAME } from '@woocommerce/data';

/**
 * Internal dependencies
 */
import {
	ActivityCard,
	ActivityCardPlaceholder,
} from '../../../header/activity-panel/activity-card';
import ProductStockCard from './card';

class StockPanel extends Component {
	renderEmptyCard() {
		return (
			<ActivityCard
				className="woocommerce-empty-activity-card"
				title={ __(
					'Your stock is in good shape.',
					'woocommerce-admin'
				) }
				icon={ <CheckmarkIcon size={ 48 } /> }
			>
				{ __(
					'You currently have no products running low on stock.',
					'woocommerce-admin'
				) }
			</ActivityCard>
		);
	}

	renderProducts() {
		const { products } = this.props;

		if ( products.length === 0 ) {
			return this.renderEmptyCard();
		}

		return products.map( ( product ) => (
			<ProductStockCard key={ product.id } product={ product } />
		) );
	}

	render() {
		const { isError, isRequesting } = this.props;

		if ( isError ) {
			const title = __(
				'There was an error getting your low stock products. Please try again.',
				'woocommerce-admin'
			);
			const actionLabel = __( 'Reload', 'woocommerce-admin' );
			const actionCallback = () => {
				// @todo Add tracking for how often an error is displayed, and the reload action is clicked.
				window.location.reload();
			};

			return (
				<EmptyContent
					title={ title }
					actionLabel={ actionLabel }
					actionURL={ null }
					actionCallback={ actionCallback }
				/>
			);
		}

		return (
			<Section>
				{ isRequesting ? (
					<ActivityCardPlaceholder
						className="woocommerce-stock-activity-card"
						hasAction
						lines={ 1 }
					/>
				) : (
					this.renderProducts()
				) }
			</Section>
		);
	}
}

StockPanel.propTypes = {
	products: PropTypes.array.isRequired,
	isError: PropTypes.bool,
	isRequesting: PropTypes.bool,
};

StockPanel.defaultProps = {
	products: [],
	isError: false,
	isRequesting: false,
};

export default compose(
	withSelect( ( select ) => {
		const { getItems, getItemsError, isResolving } = select(
			ITEMS_STORE_NAME
		);

		const productsQuery = {
			page: 1,
			per_page: 5,
			low_in_stock: true,
			status: 'publish',
		};

		const products = Array.from(
			getItems( 'products', productsQuery ).values()
		);
		const isError = Boolean( getItemsError( 'products', productsQuery ) );
		const isRequesting = isResolving( 'getItems', [
			'products',
			productsQuery,
		] );

		return { products, isError, isRequesting };
	} )
)( StockPanel );
