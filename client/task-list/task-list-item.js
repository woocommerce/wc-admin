/**
 * External dependencies
 */
import { __, _n } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { recordEvent } from '@woocommerce/tracks';
import { TaskItem, useSlot } from '@woocommerce/experimental';

/**
 * Internal dependencies
 */
import { WooOnboardingTaskListItem } from './utils';
import './task-list.scss';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const TaskListItem = ( {
	currentTask,
	eventName,
	task,
	expandingItems = false,
	setCurrentTask,
} ) => {
	const { createNotice } = useDispatch( 'core/notices' );

	const dismissTask = ( { key, onDismiss } ) => {
		createNotice( 'success', __( 'Task dismissed' ), {
			actions: [
				{
					label: __( 'Undo', 'woocommerce-admin' ),
					onClick: () => undoDismissTask( key ),
				},
			],
		} );

		recordEvent( `${ eventName }_dismiss_task`, { task_name: key } );

		// @todo This should use the task API to set dismissed tasks.
		// updateOptions( {
		// 	woocommerce_task_list_dismissed_tasks: [ ...dismissedTasks, key ],
		// } );
		if ( onDismiss ) {
			onDismiss();
		}
	};

	const undoDismissTask = ( key ) => {
		// @todo This should use the task API to set dismissed tasks.
		// const updatedDismissedTasks = dismissedTasks.filter(
		// 	( task ) => task !== key
		// );

		// updateOptions( {
		// 	woocommerce_task_list_dismissed_tasks: updatedDismissedTasks,
		// } );
		recordEvent( `${ eventName }_undo_dismiss_task`, {
			task_name: key,
		} );
	};

	const remindTaskLater = ( { key, onDismiss } ) => {
		createNotice(
			'success',
			__( 'Task postponed until tomorrow', 'woocommerce-admin' ),
			{
				actions: [
					{
						label: __( 'Undo', 'woocommerce-admin' ),
						onClick: () => undoRemindTaskLater( key ),
					},
				],
			}
		);
		recordEvent( `${ eventName }_remindmelater_task`, {
			task_name: key,
		} );

		// @todo This should use the task API to set snooze time.
		// const dismissTime = Date.now() + DAY_IN_MS;
		// updateOptions( {
		// 	woocommerce_task_list_remind_me_later_tasks: {
		// 		...remindMeLaterTasks,
		// 		[ key ]: dismissTime,
		// 	},
		// } );
		if ( onDismiss ) {
			onDismiss();
		}
	};

	const undoRemindTaskLater = ( key ) => {
		// @todo This should use the task API to set snooze time.
		// const {
		// 	// eslint-disable-next-line no-unused-vars
		// 	[ key ]: oldValue,
		// 	...updatedRemindMeLaterTasks
		// } = remindMeLaterTasks;

		// updateOptions( {
		// 	woocommerce_task_list_remind_me_later_tasks: updatedRemindMeLaterTasks,
		// } );
		recordEvent( `${ eventName }_undo_remindmelater_task`, {
			task_name: key,
		} );
	};

	const slot = useSlot(
		`woocommerce_admin_onboarding_task_list_item_${ task.id }`
	);
	const hasFills = Boolean( slot?.fills?.length );

	if ( hasFills ) {
		return (
			<WooOnboardingTaskListItem
				fillProps={ {
					dismissTask,
					task,
					remindTaskLater,
					setCurrentTask,
				} }
				id={ task.id }
			/>
		);
	}

	return (
		<TaskItem
			key={ task.id }
			title={ task.title }
			completed={ task.isComplete }
			content={ task.content }
			onClick={
				! expandingItems || task.isComplete
					? task.onClick
					: () => setCurrentTask( task.id )
			}
			expandable={ expandingItems }
			expanded={ expandingItems && currentTask === task.id }
			onDismiss={
				task.isDismissable ? () => dismissTask( task ) : undefined
			}
			remindMeLater={
				task.isSnoozable ? () => remindTaskLater( task ) : undefined
			}
			time={ task.time }
			level={ task.level }
			action={ task.onClick }
			actionLabel={ task.actionLabel }
			additionalInfo={ task.additionalInfo }
		/>
	);
};

export default TaskListItem;
