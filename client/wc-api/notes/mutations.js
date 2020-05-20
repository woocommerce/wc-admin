/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { dispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { getResourceName } from '../utils';

const updateNote = ( operations ) => ( noteId, noteFields ) => {
	const resourceKey = 'note';
	operations.update( [ resourceKey ], {
		[ resourceKey ]: { noteId, ...noteFields },
	} );
};

const removeNote = ( operations ) => async ( noteId ) => {
	const { createNotice } = dispatch( 'core/notices' );
	const resourceKey = 'note';
	const resourceName = getResourceName( 'note', noteId );
	const result = await operations.remove( [ resourceKey ], {
		[ resourceKey ]: { noteId },
	} );
	const response = result[ 0 ][ resourceName ];
	if ( response && response.data ) {
		createNotice(
			'success',
			__( 'Message dismissed.', 'woocommerce-admin' )
		);
	}
	if ( response && response.error ) {
		createNotice(
			'error',
			__( 'Message could not be dismissed.', 'woocommerce-admin' )
		);
	}
};

const removeAllNotes = ( operations ) => async () => {
	const { createNotice } = dispatch( 'core/notices' );
	const resourceKey = 'note';
	const result = await operations.removeAll( [ resourceKey ] );
	const response = result[ 0 ][ resourceKey ];
	if ( response && response.data ) {
		createNotice(
			'success',
			__( 'All messages dismissed.', 'woocommerce-admin' )
		);
	}
	if ( response && response.error ) {
		createNotice(
			'error',
			__( 'Messages could not be dismissed.', 'woocommerce-admin' )
		);
	}
};

const triggerNoteAction = ( operations ) => ( noteId, actionId ) => {
	const resourceKey = 'note-action';
	operations.update( [ resourceKey ], {
		[ resourceKey ]: { noteId, actionId },
	} );
};

export default {
	updateNote,
	removeNote,
	removeAllNotes,
	triggerNoteAction,
};
