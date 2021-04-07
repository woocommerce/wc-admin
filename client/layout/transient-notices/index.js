/**
 * External dependencies
 */
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import SnackbarList from './snackbar/list';
import './style.scss';

function TransientNotices( props ) {
	const { removeNotice: onRemove } = useDispatch( 'core/notices' );

	const { className } = props;
	const classes = classnames(
		'woocommerce-transient-notices',
		'components-notices__snackbar',
		className
	);
	const notices = useSelect( ( select ) =>
		select( 'core/notices' ).getNotices()
	);

	return (
		<SnackbarList
			notices={ notices }
			className={ classes }
			onRemove={ onRemove }
		/>
	);
}

TransientNotices.propTypes = {
	/**
	 * Additional class name to style the component.
	 */
	className: PropTypes.string,
	/**
	 * Array of notices to be displayed.
	 */
	notices: PropTypes.array,
};

export default TransientNotices;
