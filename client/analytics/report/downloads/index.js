/**
 * External dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import { charts, filters, advancedFilters } from './config';
import DownloadsReportTable from './table';
import getSelectedChart from 'client/lib/get-selected-chart';
import ReportChart from 'client/analytics/components/report-chart';
import ReportSummary from 'client/analytics/components/report-summary';
import ReportFilters from 'client/analytics/components/report-filters';

export default class DownloadsReport extends Component {
	render() {
		const { query, path } = this.props;

		return (
			<Fragment>
				<ReportFilters
					query={ query }
					path={ path }
					filters={ filters }
					advancedFilters={ advancedFilters }
					report="downloads"
				/>
				<ReportSummary
					charts={ charts }
					endpoint="downloads"
					query={ query }
					selectedChart={ getSelectedChart( query.chart, charts ) }
					filters={ filters }
					advancedFilters={ advancedFilters }
				/>
				<ReportChart
					charts={ charts }
					endpoint="downloads"
					path={ path }
					query={ query }
					selectedChart={ getSelectedChart( query.chart, charts ) }
					filters={ filters }
					advancedFilters={ advancedFilters }
				/>
				<DownloadsReportTable
					query={ query }
					filters={ filters }
					advancedFilters={ advancedFilters }
				/>
			</Fragment>
		);
	}
}

DownloadsReport.propTypes = {
	query: PropTypes.object.isRequired,
};
