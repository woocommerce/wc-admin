/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import interpolateComponents from 'interpolate-components';
import { ORDER_STATUSES } from '@woocommerce/wc-admin-settings';

/**
 * Internal dependencies
 */
import DefaultDate from './default-date';

const SETTINGS_FILTER = 'woocommerce_admin_analytics_settings';
export const DEFAULT_ACTIONABLE_STATUSES = [ 'processing', 'on-hold' ];
export const DEFAULT_ORDER_STATUSES = [
	'completed',
	'processing',
	'refunded',
	'cancelled',
	'failed',
	'pending',
	'on-hold',
];
export const DEFAULT_DATE_RANGE = 'period=month&compare=previous_year';

const filteredOrderStatuses = Object.keys( ORDER_STATUSES )
	.filter( status => status !== 'refunded' )
	.map( key => {
		return {
			value: key,
			label: ORDER_STATUSES[ key ],
			description: sprintf(
				__( 'Include the %s status in reports', 'woocommerce-admin' ),
				ORDER_STATUSES[ key ]
			),
		};
	} );

export const config = applyFilters( SETTINGS_FILTER, {
	woocommerce_included_report_order_statuses: {
		label: __( 'Included Statuses:', 'woocommerce-admin' ),
		inputType: 'checkboxGroup',
		options: [
			{
				key: 'defaultStatuses',
				options: filteredOrderStatuses.filter( status =>
					DEFAULT_ORDER_STATUSES.includes( status.value )
				),
			},
			{
				key: 'customStatuses',
				label: __( 'Custom Statuses', 'woocommerce-admin' ),
				options: filteredOrderStatuses.filter(
					status => ! DEFAULT_ORDER_STATUSES.includes( status.value )
				),
			},
		],
		helpText: interpolateComponents( {
			mixedString: __(
				'Orders with these statuses are included in your reports totals. ' +
					'The {{strong}}Refunded{{/strong}} status is always included.',
				'woocommerce-admin'
			),
			components: {
				strong: <strong />,
			},
		} ),
		defaultValue: [ 'processing', 'on-hold', 'completed' ],
	},
	woocommerce_actionable_order_statuses: {
		label: __( 'Actionable Statuses:', 'woocommerce-admin' ),
		inputType: 'checkboxGroup',
		options: [
			{
				key: 'defaultStatuses',
				options: filteredOrderStatuses.filter( status =>
					DEFAULT_ORDER_STATUSES.includes( status.value )
				),
			},
			{
				key: 'customStatuses',
				label: __( 'Custom Statuses', 'woocommerce-admin' ),
				options: filteredOrderStatuses.filter(
					status => ! DEFAULT_ORDER_STATUSES.includes( status.value )
				),
			},
		],
		helpText: __(
			'Orders with these statuses require action on behalf of the store admin.' +
				'These orders will show up in the Orders tab under the activity panel.',
			'woocommerce-admin'
		),
		defaultValue: DEFAULT_ACTIONABLE_STATUSES,
	},
	woocommerce_default_date_range: {
		name: 'woocommerce_default_date_range',
		label: __( 'Default Date Range:', 'woocommerce-admin' ),
		inputType: 'component',
		component: DefaultDate,
		helpText: __(
			'Select a default date range. When no range is selected, reports will be viewed by ' +
				'the default date range.',
			'woocommerce-admin'
		),
		defaultValue: DEFAULT_DATE_RANGE,
	},
} );
