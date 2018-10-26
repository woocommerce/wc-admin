/**
 * @format
 */

export const NAMESPACE = '/wc/v3/';
export const ERROR = 'ERROR';

// WordPress & WooCommerce both set a hard limit of 100 for the per_page parameter
export const MAX_PER_PAGE = 100;

export const QUERY_DEFAULTS = {
	pageSize: 25,
	period: 'month',
	compare: 'previous_year',
};
