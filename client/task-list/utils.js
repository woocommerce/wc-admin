/**
 * External dependencies
 */
import { recordEvent } from '@woocommerce/tracks';
import { Slot, Fill } from '@wordpress/components';

export const WooOnboardingTask = ( { id, ...props } ) => (
	<Fill name={ 'woocommerce_admin_onboarding_task_' + id } { ...props } />
);

WooOnboardingTask.Slot = ( { id, fillProps } ) => (
	<Slot
		name={ 'woocommerce_admin_onboarding_task_' + id }
		fillProps={ fillProps }
	/>
);

export const WooOnboardingTaskListItem = ( { id, ...props } ) => (
	<Fill
		name={ 'woocommerce_admin_onboarding_task_list_item_' + id }
		{ ...props }
	/>
);

WooOnboardingTaskListItem.Slot = ( { id, fillProps } ) => (
	<Slot
		name={ 'woocommerce_admin_onboarding_task_list_item_' + id }
		fillProps={ fillProps }
	/>
);

export function recordTaskViewEvent(
	taskName,
	isJetpackConnected,
	activePlugins,
	installedPlugins
) {
	recordEvent( 'task_view', {
		task_name: taskName,
		wcs_installed: installedPlugins.includes( 'woocommerce-services' ),
		wcs_active: activePlugins.includes( 'woocommerce-services' ),
		jetpack_installed: installedPlugins.includes( 'jetpack' ),
		jetpack_active: activePlugins.includes( 'jetpack' ),
		jetpack_connected: isJetpackConnected,
	} );
}
