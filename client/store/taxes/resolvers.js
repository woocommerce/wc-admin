/** @format */
/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { dispatch } from '@wordpress/data';
import { stringify } from 'qs';

export default {
	// TODO: Use controls data plugin or fresh-data instead of async
	async getTaxes( ...args ) {
		// This is interim code to work with either 2.x or 3.x version of @wordpress/data
		// TODO: Change to just `getNotes( query )` after Gutenberg plugin uses @wordpress/data 3+
		const query = args.length === 1 ? args[ 0 ] : args[ 1 ];

		try {
			const params = query ? '?' + stringify( query ) : '';
			const products = await apiFetch( {
				path:
					'https://virtserver.swaggerhub.com/peterfabian/wc-v3-api/1.0.0/reports/taxes' + params,
			} );
			dispatch( 'wc-admin' ).setTaxes( products, query );
		} catch ( error ) {
			dispatch( 'wc-admin' ).setTaxesError( query );
		}
	},
};
