/**
 * External dependencies
 */
import React, { useState, useEffect } from '@wordpress/element';
import { Guide } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { recordEvent } from '@woocommerce/tracks';
import interpolateComponents from 'interpolate-components';
import classNames from 'classnames';
import { Link } from '@woocommerce/components';

/**
 * Internal dependencies
 */
import { LineChartIllustration } from '../welcome-modal/illustrations/line-chart';
import { PageContent } from '../welcome-modal/page-content';
import './style.scss';

const page = {
	image: <LineChartIllustration />,
	content: (
		<PageContent
			title={ __(
				'Welcome to your new store management experience.',
				'woocommerce-admin'
			) }
			body={ interpolateComponents( {
				mixedString: __(
					"{{link}}Learn more{{/link}} about the visual changes you'll see in your store admin, or feel free to have a look around and explore.",
					'woocommerce-admin'
				),
				components: {
					link: (
						<Link
							href="https://wordpress.com/support/store/"
							type="external"
							target="_blank"
						/>
					)
				}
			} ) }
		/>
	)
};

export default function WelcomeFromCalypsoModal( { onClose } ) {
	const [ guideIsOpen, setGuideIsOpen ] = useState( true );

	useEffect( () => {
		recordEvent( 'welcome_from_calypso_modal_open' );
	}, [] );

	if ( ! guideIsOpen ) {
		return null;
	}

	const guideClassNames = classNames(
		'woocommerce__welcome-modal',
		'woocommerce__welcome-from-calypso-modal'
	);

	return (
		<Guide
			onFinish={ () => {
				if ( onClose ) {
					onClose();
				}

				setGuideIsOpen( false );
				recordEvent( 'welcome_from_calypso_modal_close' );
			} }
			className={ guideClassNames }
			finishButtonText={ __( "Let's go", 'woocommerce-admin' ) }
			pages={ [ page ] }
		/>
	);
}