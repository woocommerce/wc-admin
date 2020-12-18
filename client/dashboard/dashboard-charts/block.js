/**
 * External dependencies
 */
import { Component } from '@wordpress/element';
import PropTypes from 'prop-types';
import { __, sprintf } from '@wordpress/i18n';
import {
	Card,
	CardBody,
	CardHeader,
	__experimentalText as Text,
} from '@wordpress/components';
import {
	getHistory,
	getNewPath,
	getPersistedQuery,
} from '@woocommerce/navigation';
import { getAdminLink } from '@woocommerce/wc-admin-settings';

/**
 * Internal dependencies
 */
import ReportChart from '../../analytics/components/report-chart';
import './block.scss';

class ChartBlock extends Component {
	handleChartClick = () => {
		const { selectedChart } = this.props;

		getHistory().push( this.getChartPath( selectedChart ) );
	};

	getChartPath( chart ) {
		return getNewPath(
			{ chart: chart.key },
			'/analytics/' + chart.endpoint,
			getPersistedQuery()
		);
	}

	render() {
		const {
			charts,
			endpoint,
			path,
			query,
			selectedChart,
			filters,
		} = this.props;

		if ( ! selectedChart ) {
			return null;
		}

		return (
			<div
				role="presentation"
				className="woocommerce-dashboard__chart-block-wrapper"
				onClick={ this.handleChartClick }
			>
				<Card className="woocommerce-dashboard__chart-block">
					<CardHeader>
						<Text variant="title.small" as="h3">
							{ selectedChart.label }
						</Text>
					</CardHeader>
					<CardBody size={ null }>
						<a
							className="screen-reader-text"
							href={ getAdminLink(
								this.getChartPath( selectedChart )
							) }
						>
							{
								/* translators: %s is the chart type */
								sprintf(
									__( '%s Report', 'woocommerce-admin' ),
									selectedChart.label
								)
							}
						</a>
						<ReportChart
							charts={ charts }
							endpoint={ endpoint }
							query={ query }
							interactiveLegend={ false }
							legendPosition="bottom"
							path={ path }
							selectedChart={ selectedChart }
							showHeaderControls={ false }
							filters={ filters }
						/>
					</CardBody>
				</Card>
			</div>
		);
	}
}

ChartBlock.propTypes = {
	charts: PropTypes.array,
	endpoint: PropTypes.string.isRequired,
	path: PropTypes.string.isRequired,
	query: PropTypes.object.isRequired,
	selectedChart: PropTypes.object.isRequired,
};

export default ChartBlock;
