import { NavigableMenu } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';

import { Tab } from '../tab';
import { recordEvent } from './client/lib/tracks';

export const Tabs = ( {
	tabs,
	onTabClick,
	selectedTab: selectedTabName,
	tabOpen = false,
} ) => {
	const [ { tabOpen: tabIsOpenState, currentTab }, setTabState ] = useState( {
		tabOpen,
		currentTab: selectedTabName,
	} );

	// Keep state synced with props
	useEffect( () => {
		setTabState( {
			tabOpen,
			currentTab: selectedTabName,
		} );
	}, [ tabOpen, selectedTabName ] );

	return (
		<NavigableMenu
			role="tablist"
			orientation="horizontal"
			className="woocommerce-layout__activity-panel-tabs"
		>
			{ tabs &&
				tabs.map( ( tab, i ) => (
					<Tab
						key={ i }
						index={ i }
						isPanelOpen={ tabIsOpenState }
						selected={ currentTab === tab.name }
						{ ...tab }
						onTabClick={ () => {
							const isTabOpen =
								currentTab === tab.name || currentTab === ''
									? ! tabIsOpenState
									: true;

							// If a panel is being opened, or if an existing panel is already open and a different one is being opened, record a track.
							if ( ! isTabOpen || currentTab !== tab.name ) {
								recordEvent( 'activity_panel_open', {
									tab: tab.name,
								} );
							}

							setTabState( {
								tabOpen: isTabOpen,
								currentTab: tab.name,
							} );
							onTabClick( tab, isTabOpen );
						} }
					/>
				) ) }
		</NavigableMenu>
	);
};
