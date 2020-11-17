/**
 * External dependencies
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

/**
 * Internal dependencies
 */
import Feedback from '../index';

const mockTrackCallback = jest.fn();

describe( 'Survey', () => {
	it( 'should close modal when cancel button pressed', async () => {
		render(
			<Feedback trackCallback={ mockTrackCallback } label="Testing" />
		);

		// Wait for the modal to render.
		await screen.findByRole( 'dialog' );

		// Press cancel button.
		fireEvent.click( screen.getByRole( 'button', { name: /cancel/i } ) );

		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	} );

	it( 'should halt with an error when submitting without a score', async () => {
		render(
			<Feedback trackCallback={ mockTrackCallback } label="Testing" />
		);

		await screen.findByRole( 'dialog' ); // Wait for the modal to render.

		fireEvent.click( screen.getByRole( 'button', { name: /send/i } ) ); // Press send button.

		// Wait for error message.
		await screen.findByRole( 'alert' );

		expect( screen.getByRole( 'dialog' ) ).toBeInTheDocument();
	} );

	it( 'should disable the comments field initially', async () => {
		render(
			<Feedback trackCallback={ mockTrackCallback } label="Testing" />
		);

		// Wait for the modal to render.
		await screen.findByRole( 'dialog' );

		expect(
			screen.queryByLabelText( 'Comments (Optional)' )
		).not.toBeInTheDocument();
	} );

	it.each( [ 'Very difficult', 'Somewhat difficult' ] )(
		'should toggle the comments field when %s is selected',
		async ( labelText ) => {
			render(
				<Feedback trackCallback={ mockTrackCallback } label="Testing" />
			);

			// Wait for the modal to render.
			await screen.findByRole( 'dialog' );

			// Select the option.
			fireEvent.click( screen.getByLabelText( labelText ) );

			// Wait for comments field to show.
			await screen.findByLabelText( 'Comments (Optional)' );

			// Select neutral score.
			fireEvent.click( screen.getByLabelText( 'Neutral' ) );

			// Wait for comments field to hide.
			await waitFor( () => {
				expect(
					screen.queryByLabelText( 'Comments (Optional)' )
				).not.toBeInTheDocument();
			} );
		}
	);
} );
