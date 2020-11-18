/**
 * External dependencies
 */
import { useState } from '@wordpress/element';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';
import { compose } from '@wordpress/compose';
import { withDispatch } from '@wordpress/data';
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import Feedback from './feedback';

/**
 * Use `CustomerEffortScore` to gather a customer effort score.
 *
 * NOTE: This should live in @woocommerce/customer-effort-score to allow
 * reuse.
 *
 * @param {Object}   props                Component props.
 * @param {Function} props.trackCallback  Function to call when the results should be tracked.
 * @param {string}   props.label          The label displayed in the modal.
 * @param {Function} props.createNotice   Create a notice (snackbar).
 * @param {Function} props.openedCallback Function to call when the modal is opened.
 * @param {Object}   props.icon           Icon (React component) to be shown on the notice.
 */
function CustomerEffortScore( {
	trackCallback,
	label,
	createNotice,
	openedCallback = noop,
	icon,
} ) {
	const [ shouldCreateNotice, setShouldCreateNotice ] = useState( true );
	const [ visible, setVisible ] = useState( false );

	if ( shouldCreateNotice ) {
		createNotice( 'success', label, {
			actions: [
				{
					label: __( 'Give feedback', 'woocommerce-admin' ),
					onClick: () => {
						setVisible( true );

						openedCallback();
					},
				},
			],
			icon,
			explicitDismiss: true,
			onDismiss: openedCallback,
		} );

		setShouldCreateNotice( false );

		return null;
	}

	if ( ! visible ) {
		return null;
	}

	return <Feedback label={ label } trackCallback={ trackCallback } />;
}

CustomerEffortScore.propTypes = {
	/**
	 * The function to call when the modal is actioned.
	 */
	trackCallback: PropTypes.func.isRequired,
	/**
	 * The label displayed in the modal.
	 */
	label: PropTypes.string.isRequired,
	/**
	 * Create a notice (snackbar).
	 */
	createNotice: PropTypes.func.isRequired,
	/**
	 * Callback executed when the modal is opened.
	 */
	openedCallback: PropTypes.func,
	/**
	 * Icon (React component) to be displayed.
	 */
	icon: PropTypes.element,
};

export default compose(
	withDispatch( ( dispatch ) => {
		const { createNotice } = dispatch( 'core/notices2' );

		return {
			createNotice,
		};
	} )
)( CustomerEffortScore );
