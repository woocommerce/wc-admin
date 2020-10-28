/**
 * External dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { Component, Fragment } from '@wordpress/element';
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import Gridicon from 'gridicons';
import PropTypes from 'prop-types';
import interpolateComponents from 'interpolate-components';
import { keyBy, map, merge } from 'lodash';

import { EmptyContent, Flag, Link, Section } from '@woocommerce/components';
import { getNewPath } from '@woocommerce/navigation';
import { getAdminLink } from '@woocommerce/wc-admin-settings';
import {
	SETTINGS_STORE_NAME,
	REPORTS_STORE_NAME,
	ITEMS_STORE_NAME,
	QUERY_DEFAULTS,
} from '@woocommerce/data';
import { recordEvent } from '@woocommerce/tracks';

/**
 * Internal dependencies
 */
import {
	ActivityCard,
	ActivityCardPlaceholder,
} from '../../../header/activity-panel/activity-card';
import ActivityOutboundLink from '../../../header/activity-panel/activity-outbound-link';
import { DEFAULT_ACTIONABLE_STATUSES } from '../../../analytics/settings/config';
import { CurrencyContext } from '../../../lib/currency-context';

class OrdersPanel extends Component {
	recordOrderEvent( eventName ) {
		recordEvent( `activity_panel_orders_${ eventName }`, {} );
	}

	renderEmptyCard() {
		const { hasNonActionableOrders } = this.props;
		if ( hasNonActionableOrders ) {
			return (
				<ActivityCard
					className="woocommerce-empty-activity-card"
					title={ __(
						'You have no orders to fulfill',
						'woocommerce-admin'
					) }
					icon={ <Gridicon icon="checkmark" size={ 48 } /> }
				>
					{ __(
						"Good job, you've fulfilled all of your new orders!",
						'woocommerce-admin'
					) }
				</ActivityCard>
			);
		}

		return (
			<ActivityCard
				className="woocommerce-empty-activity-card"
				title={ __(
					'You have no orders to fulfill',
					'woocommerce-admin'
				) }
				icon={ <Gridicon icon="time" size={ 48 } /> }
				actions={
					<Button
						href="https://docs.woocommerce.com/document/managing-orders/"
						isSecondary
						onClick={ () => this.recordOrderEvent( 'learn_more' ) }
						target="_blank"
					>
						{ __( 'Learn more', 'woocommerce-admin' ) }
					</Button>
				}
			>
				{ __(
					"You're still waiting for your customers to make their first orders. " +
						'While you wait why not learn how to manage orders?',
					'woocommerce-admin'
				) }
			</ActivityCard>
		);
	}

	renderOrders() {
		const { orders } = this.props;
		const Currency = this.context;

		if ( orders.length === 0 ) {
			return this.renderEmptyCard();
		}

		const getCustomerString = ( order ) => {
			const extendedInfo = order.extended_info || {};
			const { first_name: firstName, last_name: lastName } =
				extendedInfo.customer || {};

			if ( ! firstName && ! lastName ) {
				return '';
			}

			const name = [ firstName, lastName ].join( ' ' );
			return `{{customerLink}}${ name }{{/customerLink}}`;
		};

		const orderCardTitle = ( order ) => {
			const {
				extended_info: extendedInfo,
				order_id: orderId,
				order_number: orderNumber,
			} = order;
			const { customer } = extendedInfo || {};
			const customerUrl = customer.customer_id
				? getNewPath( {}, '/analytics/customers', {
						filter: 'single_customer',
						customers: customer.customer_id,
				  } )
				: null;

			return (
				<Fragment>
					{ interpolateComponents( {
						mixedString: sprintf(
							__(
								'{{orderLink}}Order #%(orderNumber)s{{/orderLink}} %(customerString)s',
								'woocommerce-admin'
							),
							{
								orderNumber,
								customerString: getCustomerString( order ),
							}
						),
						components: {
							orderLink: (
								<Link
									href={ getAdminLink(
										'post.php?action=edit&post=' + orderId
									) }
									onClick={ () =>
										this.recordOrderEvent( 'order_number' )
									}
									type="wp-admin"
								/>
							),
							destinationFlag: customer.country ? (
								<Flag
									code={ customer.country }
									round={ false }
								/>
							) : null,
							customerLink: customerUrl ? (
								<Link
									href={ customerUrl }
									onClick={ () =>
										this.recordOrderEvent( 'customer_name' )
									}
									type="wc-admin"
								/>
							) : (
								<span />
							),
						},
					} ) }
				</Fragment>
			);
		};

		const cards = [];
		orders.forEach( ( order ) => {
			const extendedInfo = order.extended_info || {};
			const productsCount =
				extendedInfo && extendedInfo.products
					? extendedInfo.products.length
					: 0;

			const total = order.total_sales;

			cards.push(
				<ActivityCard
					key={ order.order_id }
					className="woocommerce-order-activity-card"
					title={ orderCardTitle( order ) }
					date={ order.date_created_gmt }
					subtitle={
						<div>
							<span>
								{ sprintf(
									_n(
										'%d product',
										'%d products',
										productsCount,
										'woocommerce-admin'
									),
									productsCount
								) }
							</span>
							<span>{ Currency.formatAmount( total ) }</span>
						</div>
					}
					actions={
						<Button
							isSecondary
							href={ getAdminLink(
								'post.php?action=edit&post=' + order.order_id
							) }
							onClick={ () =>
								this.recordOrderEvent(
									'orders_begin_fulfillment'
								)
							}
						>
							{ __( 'Open', 'woocommerce-admin' ) }
						</Button>
					}
				></ActivityCard>
			);
		} );
		return (
			<Fragment>
				{ cards }
				<ActivityOutboundLink
					href={ 'edit.php?post_type=shop_order' }
					icon={ false }
					onClick={ () => this.recordOrderEvent( 'orders_manage' ) }
				>
					{ __( 'Manage all orders', 'woocommerce-admin' ) }
				</ActivityOutboundLink>
			</Fragment>
		);
	}

	render() {
		const { isRequesting, isError, orderStatuses } = this.props;

		if ( isError ) {
			if ( ! orderStatuses.length ) {
				return (
					<EmptyContent
						title={ __(
							"You currently don't have any actionable statuses. " +
								'To display orders here, select orders that require further review in settings.',
							'woocommerce-admin'
						) }
						actionLabel={ __( 'Settings', 'woocommerce-admin' ) }
						actionURL={ getAdminLink(
							'admin.php?page=wc-admin&path=/analytics/settings'
						) }
					/>
				);
			}

			const title = __(
				'There was an error getting your orders. Please try again.',
				'woocommerce-admin'
			);
			const actionLabel = __( 'Reload', 'woocommerce-admin' );
			const actionCallback = () => {
				// @todo Add tracking for how often an error is displayed, and the reload action is clicked.
				window.location.reload();
			};

			return (
				<Fragment>
					<EmptyContent
						title={ title }
						actionLabel={ actionLabel }
						actionURL={ null }
						actionCallback={ actionCallback }
					/>
				</Fragment>
			);
		}

		return (
			<Fragment>
				<Section>
					{ isRequesting ? (
						<ActivityCardPlaceholder
							className="woocommerce-order-activity-card"
							hasAction
							hasDate
							lines={ 2 }
						/>
					) : (
						this.renderOrders()
					) }
				</Section>
			</Fragment>
		);
	}
}

OrdersPanel.propTypes = {
	orders: PropTypes.array.isRequired,
	isError: PropTypes.bool,
	isRequesting: PropTypes.bool,
};

OrdersPanel.defaultProps = {
	orders: [],
	isError: false,
	isRequesting: false,
};

OrdersPanel.contextType = CurrencyContext;

export default compose(
	withSelect( ( select, props ) => {
		const { hasActionableOrders } = props;
		const { getItems, getItemsError, getItemsTotalCount } = select(
			ITEMS_STORE_NAME
		);
		const { getReportItems, getReportItemsError, isResolving } = select(
			REPORTS_STORE_NAME
		);
		const { getSetting: getMutableSetting } = select( SETTINGS_STORE_NAME );
		const {
			woocommerce_actionable_order_statuses: orderStatuses = DEFAULT_ACTIONABLE_STATUSES,
		} = getMutableSetting( 'wc_admin', 'wcAdminSettings', {} );
		if ( ! orderStatuses.length ) {
			return {
				orders: [],
				isError: true,
				isRequesting: false,
				orderStatuses,
			};
		}

		if ( hasActionableOrders ) {
			// Query the core Orders endpoint for the most up-to-date statuses.
			const actionableOrdersQuery = {
				page: 1,
				per_page: QUERY_DEFAULTS.pageSize,
				status: orderStatuses,
				_fields: [ 'id', 'date_created_gmt', 'status' ],
			};
			const actionableOrders = Array.from(
				getItems( 'orders', actionableOrdersQuery ).values()
			);
			const isRequestingActionable = isResolving( 'getItems', [
				'orders',
				actionableOrdersQuery,
			] );

			if ( isRequestingActionable ) {
				return {
					isError: Boolean(
						getItemsError( 'orders', actionableOrdersQuery )
					),
					isRequesting: isRequestingActionable,
					orderStatuses,
				};
			}

			// Retrieve the Order stats data from our reporting table.
			const ordersQuery = {
				page: 1,
				per_page: 5,
				extended_info: true,
				order_includes: map( actionableOrders, 'id' ),
				_fields: [
					'order_id',
					'order_number',
					'status',
					'data_created_gmt',
					'total_sales',
					'extended_info.customer',
					'extended_info.products',
				],
			};

			const reportOrders = getReportItems( 'orders', ordersQuery ).data;
			const isError = Boolean(
				getReportItemsError( 'orders', ordersQuery )
			);
			const isRequesting = isResolving( 'getReportItems', [
				'orders',
				ordersQuery,
			] );
			let orders = [];

			if ( reportOrders && reportOrders.length ) {
				// Merge the core endpoint data with our reporting table.
				const actionableOrdersById = keyBy( actionableOrders, 'id' );
				orders = reportOrders.map( ( order ) =>
					merge(
						{},
						order,
						actionableOrdersById[ order.order_id ] || {}
					)
				);
			}

			return { orders, isError, isRequesting, orderStatuses };
		}

		// Get a count of all orders for messaging purposes.
		// @todo Add a property to settings api for this?
		const allOrdersQuery = {
			page: 1,
			per_page: 1,
			_fields: [ 'id' ],
		};

		getItems( 'orders', allOrdersQuery );
		const totalNonActionableOrders = getItemsTotalCount(
			'orders',
			allOrdersQuery
		);
		const isError = Boolean( getItemsError( 'orders', allOrdersQuery ) );
		const isRequesting = isResolving( 'getItems', [
			'orders',
			allOrdersQuery,
		] );

		return {
			hasNonActionableOrders: totalNonActionableOrders > 0,
			isError,
			isRequesting,
			orderStatuses,
		};
	} )
)( OrdersPanel );
