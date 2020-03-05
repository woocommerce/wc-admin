/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { render, Component } from '@wordpress/element';
import { ExternalLink, Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import DismissModal from './dismiss-modal';
const metaBox = document.getElementById( 'wc-admin-shipping-banner-root' );

class ShippingBanner extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			showShippingBanner: true, // TODO: update to get state when closedForever is clicked
			isDismissModalOpen: false,
		};
	}

	closeDismissModal = () => this.setState( { isDismissModalOpen: false } );
	openDismissModal = () => {
		this.setState( { isDismissModalOpen: true } );
		// TODO: tracking
	};

	hideBanner = () => {
		this.setState( { showShippingBanner: false } );
	};

	createShippingLabelClicked = () => {
		// TODO: install and activate WCS
		// TODO: open WCS modal
		// TODO: Tracking
	};

	render() {
		const { isDismissModalOpen, showShippingBanner } = this.state;

		if ( ! showShippingBanner ) {
			return null;
		}

		return (
			<div>
				<h3>
					{ __(
						'Fulfill X items with WooCommerce Shipping',
						'woocommerce-admin'
					) }
				</h3>
				<p>
					{ __(
						'Print discounted shipping labels with a click. This will install WooCommerce Services.'
					) }
					<ExternalLink href="woocommerce.com">
						Learn More
					</ExternalLink>
				</p>
				<Button isPrimary onClick={ this.createShippingLabelClicked }>
					{ __( 'Create shipping label' ) }
				</Button>
				<button
					onClick={ this.openDismissModal }
					type="button"
					className="notice-dismiss"
				>
					<span className="screen-reader-text">
						{ __(
							'Close Print Label Banner.',
							'woocommerce-admin'
						) }
					</span>
				</button>
				<DismissModal
					visible={ isDismissModalOpen }
					onClose={ this.closeDismissModal }
					onCloseAll={ this.hideBanner }
				/>
			</div>
		);
	}
}

// Render the header.
render( <ShippingBanner />, metaBox );
