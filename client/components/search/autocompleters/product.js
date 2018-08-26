/** @format */
/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { stringify } from 'qs';

/**
 * Internal dependencies
 */
import ProductImage from 'components/product-image';

const computeSuggestionMatch = ( suggestion, query ) => {
	if ( ! query ) {
		return null;
	}
	const indexOfMatch = suggestion.toLocaleLowerCase().indexOf( query.toLocaleLowerCase() );

	return {
		suggestionBeforeMatch: suggestion.substring( 0, indexOfMatch ),
		suggestionMatch: suggestion.substring( indexOfMatch, indexOfMatch + query.length ),
		suggestionAfterMatch: suggestion.substring( indexOfMatch + query.length ),
	};
};

/**
 * A products completer.
 *
 * @type {Completer}
 */
export default {
	name: 'products',
	className: 'woocommerce-search__product-result',
	triggerPrefix: '',
	options( search ) {
		let payload = '';
		if ( search ) {
			const query = {
				search: encodeURIComponent( search ),
				per_page: 10,
				orderby: 'popularity',
			};
			payload = '?' + stringify( query );
		}
		return apiFetch( { path: '/wc/v3/products' + payload } );
	},
	isDebounced: true,
	getOptionKeywords( product ) {
		return [ product.name ];
	},
	getOptionLabel( product, query ) {
		const match = computeSuggestionMatch( product.name, query ) || {};
		return [
			<ProductImage
				key="thumbnail"
				className="woocommerce-search__result-thumbnail"
				product={ product }
				width={ 18 }
				height={ 18 }
				alt=""
			/>,
			<span key="name" className="woocommerce-search__result-name" aria-label={ product.name }>
				{ match.suggestionBeforeMatch }
				<strong className="components-form-token-field__suggestion-match">
					{ match.suggestionMatch }
				</strong>
				{ match.suggestionAfterMatch }
			</span>,
		];
	},
	allowNode() {
		return true;
	},
	getOptionCompletion( product ) {
		const value = {
			id: product.id,
			label: product.name,
		};
		return value;
	},
};
