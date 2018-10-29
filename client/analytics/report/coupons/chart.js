/** @format */
/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';
import { find } from 'lodash';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import ReportChart from 'analytics/components/report-chart';
import ReportSummary from 'analytics/components/report-summary';

class CouponsReportChart extends Component {
	getCharts() {
		return [
			{
				key: 'gross_discount',
				label: __( 'Gross Discount', 'wc-admin' ),
				type: 'currency',
			},
			{
				key: 'coupons_count',
				label: __( 'Coupons Count', 'wc-admin' ),
				type: 'number',
			},
			{
				key: 'orders_count',
				label: __( 'Orders Count', 'wc-admin' ),
				type: 'number',
			},
		];
	}

	getSelectedChart() {
		const { query } = this.props;
		const charts = this.getCharts();
		const chart = find( charts, { key: query.chart } );
		if ( chart ) {
			return chart;
		}

		return charts[ 0 ];
	}

	render() {
		const { query } = this.props;
		return (
			<Fragment>
				<ReportSummary
					charts={ this.getCharts() }
					endpoint="coupons"
					query={ query }
					selectedChart={ this.getSelectedChart() }
				/>
				<ReportChart
					charts={ this.getCharts() }
					endpoint="coupons"
					query={ query }
					selectedChart={ this.getSelectedChart() }
				/>
			</Fragment>
		);
	}
}

CouponsReportChart.propTypes = {
	query: PropTypes.object.isRequired,
};

export default CouponsReportChart;
