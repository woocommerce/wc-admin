/**
 * External dependencies
 */
import { Component } from '@wordpress/element';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import './style.scss'

class RecommendedExtensionsItem extends Component {
	render() {
		const { title, copy, icon, url } = this.props;
		const classNameBase = 'woocommerce-marketing-recommended-extensions-item';

		return (
			<a href={ url }
				className={ classNameBase }>
				<img src={ icon } className={ `${ classNameBase }__img` } alt={ title } />
				<div className={ `${ classNameBase }__text` }>
					<h4>{ title }</h4>
					<p>{ copy }</p>
				</div>
			</a>
		)
	}
}

RecommendedExtensionsItem.propTypes = {
	title: PropTypes.string.isRequired,
	copy: PropTypes.string.isRequired,
	icon: PropTypes.string.isRequired,
	url: PropTypes.string.isRequired,
};

export default RecommendedExtensionsItem;
