/**
 * External dependencies
 */
import { __, _n } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { map } from 'lodash';
import { Date, Link } from '@woocommerce/components';
import { getNewPath, getPersistedQuery } from '@woocommerce/navigation';
import { formatValue } from '@woocommerce/number';
import { getSetting } from '@woocommerce/wc-admin-settings';
import { defaultTableDateFormat } from '@woocommerce/date';

/**
 * Internal dependencies
 */
import ReportTable from '../../components/report-table';
import { CurrencyContext } from '../../../lib/currency-context';

class CouponsReportTable extends Component {
	constructor() {
		super();

		this.getHeadersContent = this.getHeadersContent.bind( this );
		this.getRowsContent = this.getRowsContent.bind( this );
		this.getSummary = this.getSummary.bind( this );
	}

	getHeadersContent() {
		return [
			{
				label: __( 'Coupon code', 'woocommerce-admin' ),
				key: 'code',
				required: true,
				isLeftAligned: true,
				isSortable: true,
			},
			{
				label: __( 'Orders', 'woocommerce-admin' ),
				key: 'orders_count',
				required: true,
				defaultSort: true,
				isSortable: true,
				isNumeric: true,
			},
			{
				label: __( 'Amount discounted', 'woocommerce-admin' ),
				key: 'amount',
				isSortable: true,
				isNumeric: true,
			},
			{
				label: __( 'Created', 'woocommerce-admin' ),
				key: 'created',
			},
			{
				label: __( 'Expires', 'woocommerce-admin' ),
				key: 'expires',
			},
			{
				label: __( 'Type', 'woocommerce-admin' ),
				key: 'type',
			},
		];
	}

	getRowsContent( coupons ) {
		const { query } = this.props;
		const persistedQuery = getPersistedQuery( query );
		const dateFormat = getSetting( 'dateFormat', defaultTableDateFormat );
		const {
			formatAmount,
			formatDecimal: getCurrencyFormatDecimal,
			getCurrencyConfig,
		} = this.context;

		return map( coupons, ( coupon ) => {
			const {
				amount,
				coupon_id: couponId,
				orders_count: ordersCount,
			} = coupon;
			const extendedInfo = coupon.extended_info || {};
			const {
				code,
				date_created: dateCreated,
				date_expires: dateExpires,
				discount_type: discountType,
			} = extendedInfo;

			const couponUrl =
				couponId > 0
					? getNewPath( persistedQuery, '/analytics/coupons', {
							filter: 'single_coupon',
							coupons: couponId,
					  } )
					: null;

			const couponLink =
				couponUrl === null ? (
					code
				) : (
					<Link href={ couponUrl } type="wc-admin">
						{ code }
					</Link>
				);

			const ordersUrl =
				couponId > 0
					? getNewPath( persistedQuery, '/analytics/orders', {
							filter: 'advanced',
							coupon_includes: couponId,
					  } )
					: null;
			const ordersLink =
				ordersUrl === null ? (
					ordersCount
				) : (
					<Link href={ ordersUrl } type="wc-admin">
						{ formatValue(
							getCurrencyConfig(),
							'number',
							ordersCount
						) }
					</Link>
				);

			return [
				{
					display: couponLink,
					value: code,
				},
				{
					display: ordersLink,
					value: ordersCount,
				},
				{
					display: formatAmount( amount ),
					value: getCurrencyFormatDecimal( amount ),
				},
				{
					display: dateCreated ? (
						<Date
							date={ dateCreated }
							visibleFormat={ dateFormat }
						/>
					) : (
						__( 'N/A', 'woocommerce-admin' )
					),
					value: dateCreated,
				},
				{
					display: dateExpires ? (
						<Date
							date={ dateExpires }
							visibleFormat={ dateFormat }
						/>
					) : (
						__( 'N/A', 'woocommerce-admin' )
					),
					value: dateExpires,
				},
				{
					display: this.getCouponType( discountType ),
					value: discountType,
				},
			];
		} );
	}

	getSummary( totals ) {
		const {
			coupons_count: couponsCount = 0,
			orders_count: ordersCount = 0,
			amount = 0,
		} = totals;
		const { formatAmount, getCurrencyConfig } = this.context;
		const currency = getCurrencyConfig();
		return [
			{
				label: _n(
					'Coupon',
					'Coupons',
					couponsCount,
					'woocommerce-admin'
				),
				value: formatValue( currency, 'number', couponsCount ),
			},
			{
				label: _n(
					'Order',
					'Orders',
					ordersCount,
					'woocommerce-admin'
				),
				value: formatValue( currency, 'number', ordersCount ),
			},
			{
				label: __( 'Amount discounted', 'woocommerce-admin' ),
				value: formatAmount( amount ),
			},
		];
	}

	getCouponType( discountType ) {
		const couponTypes = {
			percent: __( 'Percentage', 'woocommerce-admin' ),
			fixed_cart: __( 'Fixed cart', 'woocommerce-admin' ),
			fixed_product: __( 'Fixed product', 'woocommerce-admin' ),
		};
		return couponTypes[ discountType ] || __( 'N/A', 'woocommerce-admin' );
	}

	render() {
		const { advancedFilters, filters, isRequesting, query } = this.props;

		return (
			<ReportTable
				compareBy="coupons"
				endpoint="coupons"
				getHeadersContent={ this.getHeadersContent }
				getRowsContent={ this.getRowsContent }
				getSummary={ this.getSummary }
				summaryFields={ [ 'coupons_count', 'orders_count', 'amount' ] }
				isRequesting={ isRequesting }
				itemIdField="coupon_id"
				query={ query }
				searchBy="coupons"
				tableQuery={ {
					orderby: query.orderby || 'orders_count',
					order: query.order || 'desc',
					extended_info: true,
				} }
				title={ __( 'Coupons', 'woocommerce-admin' ) }
				columnPrefsKey="coupons_report_columns"
				filters={ filters }
				advancedFilters={ advancedFilters }
			/>
		);
	}
}

CouponsReportTable.contextType = CurrencyContext;

export default CouponsReportTable;
