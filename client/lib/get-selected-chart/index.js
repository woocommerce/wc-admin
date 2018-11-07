/** @format */

/**
 * External dependencies
 */
import { find } from 'lodash';

/**
 * Takes a chart name returns the configuration for that chart from and array of charts
 *
 * @param {string} chartName - the name of the chart to get configuration for
 * @param {array} charts - list of charts for a particular report
 * @returns {object} - chart configuration object
 */
export default function getSelectedChart( chartName, charts ) {
	const chart = find( charts, { key: chartName } );
	if ( chart ) {
		return chart;
	}
	return charts[ 0 ];
}
