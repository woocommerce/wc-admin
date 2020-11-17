/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import TYPES from './action-types';

export function setCesSurveyTracksQueue( queue ) {
	return {
		type: TYPES.SET_CES_SURVEY_TRACKS_QUEUE,
		queue,
	};
}

export function addCesSurveyTrack(
	action,
	label,
	pageNow = window.pagenow,
	adminPage = window.adminpage,
	onSubmitLabel = __( 'Thank you for your feedback!', 'woocommerce-admin' )
) {
	return {
		type: TYPES.ADD_CES_SURVEY_TRACK,
		action,
		label,
		pageNow,
		adminPage,
		onSubmitLabel,
	};
}
