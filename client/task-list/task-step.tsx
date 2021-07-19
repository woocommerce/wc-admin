/**
 * External dependencies
 */
import { cloneElement, useRef, useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { PLUGINS_STORE_NAME, WCDataSelector } from '@woocommerce/data';

/**
 * Internal dependencies
 */
import { recordTaskViewEvent, WooOnboardingTask } from './utils';

type TaskStepProps = {
	taskContainer?: React.ReactElement;
	query: { task?: string };
};

export const TaskStep: React.FC< TaskStepProps > = ( {
	taskContainer,
	query,
} ) => {
	const { task: id } = query;
	const prevTaskRef = useRef< string >();
	const { isJetpackConnected, activePlugins, installedPlugins } = useSelect(
		( select: WCDataSelector ) => {
			const {
				getActivePlugins,
				getInstalledPlugins,
				isJetpackConnected: getIsJetpackConnected,
			} = select( PLUGINS_STORE_NAME );

			return {
				activePlugins: getActivePlugins(),
				isJetpackConnected: getIsJetpackConnected(),
				installedPlugins: getInstalledPlugins(),
			};
		}
	);

	const recordTaskView = () => {
		if ( ! id ) {
			return;
		}

		recordTaskViewEvent(
			id,
			isJetpackConnected,
			activePlugins,
			installedPlugins
		);
	};

	useEffect( () => {
		if ( prevTaskRef.current !== id ) {
			window.document.documentElement.scrollTop = 0;
		}
		prevTaskRef.current = id;
		recordTaskView();
	}, [ query ] );

	if ( ! id ) {
		return null;
	}

	return (
		<div className="woocommerce-task-dashboard__container">
			<WooOnboardingTask.Slot
				fillProps={ {
					query,
				} }
				id={ id }
			/>
		</div>
	);
};
