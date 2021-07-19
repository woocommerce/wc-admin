/**
 * External dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import { useEffect, useRef, useState } from '@wordpress/element';
import { Button, Card, CardBody, CardHeader } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { EllipsisMenu, Badge } from '@woocommerce/components';
import {
	getHistory,
	getNewPath,
	updateQueryString,
} from '@woocommerce/navigation';
import { OPTIONS_STORE_NAME, ONBOARDING_STORE_NAME } from '@woocommerce/data';
import { recordEvent } from '@woocommerce/tracks';
import { Text, List, CollapsibleList } from '@woocommerce/experimental';

/**
 * Internal dependencies
 */
import { TaskListItem } from './task-list-item';
import './task-list.scss';

export const TaskList = ( {
	query,
	name,
	eventName,
	isComplete,
	tasks,
	title: listTitle,
	collapsible = false,
	onComplete,
	onHide,
	expandingItems = false,
} ) => {
	const { updateOptions } = useDispatch( OPTIONS_STORE_NAME );
	const { profileItems } = useSelect( ( select ) => {
		const { getProfileItems } = select( ONBOARDING_STORE_NAME );

		return {
			profileItems: getProfileItems(),
		};
	} );

	const prevQueryRef = useRef( query );
	useEffect( () => {
		recordTaskListView();
	}, [] );

	useEffect( () => {
		const { task: prevTask } = prevQueryRef.current;
		const { task } = query;

		if ( prevTask !== task ) {
			window.document.documentElement.scrollTop = 0;
			prevQueryRef.current = query;
		}

		possiblyCompleteTaskList();
	}, [ query ] );

	const nowTimestamp = Date.now();
	const visibleTasks = tasks.filter(
		( task ) =>
			task.isVisible &&
			! task.isDismissed &&
			( ! task.snoozedUntil || task.snoozedUntil < nowTimestamp )
	);

	const completedTaskKeys = visibleTasks
		.filter( ( task ) => task.isComplete )
		.map( ( task ) => task.key );

	const incompleteTasks = tasks.filter(
		( task ) => task.isVisible && ! task.isComplete && ! task.isDismissed
	);

	const [ currentTask, setCurrentTask ] = useState(
		incompleteTasks[ 0 ]?.key
	);

	const possiblyCompleteTaskList = () => {
		const taskListVariableName = `woocommerce_${ name }_complete`;
		const taskListToComplete = isComplete
			? { [ taskListVariableName ]: 'no' }
			: { [ taskListVariableName ]: 'yes' };

		if (
			( ! incompleteTasks.length && ! isComplete ) ||
			( incompleteTasks.length && isComplete )
		) {
			updateOptions( {
				...taskListToComplete,
			} );

			if ( typeof onComplete === 'function' ) {
				onComplete();
			}
		}
	};

	const recordTaskListView = () => {
		if ( query.task ) {
			return;
		}

		recordEvent( `${ eventName }_view`, {
			number_tasks: visibleTasks.length,
			store_connected: profileItems.wccom_connected,
		} );
	};

	const hideTaskCard = ( action ) => {
		const updateOptionsParams = {
			[ `woocommerce_${ name }_hidden` ]: 'yes',
		};

		recordEvent( `${ eventName }_completed`, {
			action,
			completed_task_count: completedTaskKeys.length,
			incomplete_task_count: incompleteTasks.length,
		} );
		updateOptions( {
			...updateOptionsParams,
		} );

		if ( typeof onHide === 'function' ) {
			onHide();
		}
	};

	const renderMenu = () => {
		return (
			<div className="woocommerce-card__menu woocommerce-card__header-item">
				<EllipsisMenu
					label={ __( 'Task List Options', 'woocommerce-admin' ) }
					renderContent={ () => (
						<div className="woocommerce-task-card__section-controls">
							<Button
								onClick={ () => hideTaskCard( 'remove_card' ) }
							>
								{ __( 'Hide this', 'woocommerce-admin' ) }
							</Button>
						</div>
					) }
				/>
			</div>
		);
	};

	const listTasks = visibleTasks.map( ( task ) => {
		if ( ! task.onClick ) {
			task.onClick = ( e ) => {
				recordEvent( `${ eventName }_click`, {
					task_name: task.key,
				} );
				if ( e.target.nodeName === 'A' ) {
					// This is a nested link, so don't activate this task.
					return false;
				}

				if ( task.actionUrl ) {
					if ( task.actionUrl.startsWith( 'http' ) ) {
						window.location = task.actionUrl;
					} else {
						getHistory().push(
							getNewPath( {}, task.actionUrl, {} )
						);
					}
					return;
				}

				updateQueryString( { task: task.id } );
			};
		}

		return task;
	} );

	if ( ! listTasks.length ) {
		return <div className="woocommerce-task-dashboard__container"></div>;
	}

	const expandLabel = sprintf(
		/* translators: %i = number of hidden tasks */
		_n(
			'Show %i more task.',
			'Show %i more tasks.',
			listTasks.length - 2,
			'woocommerce-admin'
		),
		listTasks.length - 2
	);
	const collapseLabel = __( 'Show less', 'woocommerce-admin' );
	const ListComp = collapsible ? CollapsibleList : List;

	const listProps = collapsible
		? {
				collapseLabel,
				expandLabel,
				show: 2,
				onCollapse: () => recordEvent( `${ eventName }_collapse` ),
				onExpand: () => recordEvent( `${ eventName }_expand` ),
		  }
		: {};

	return (
		<>
			<div className="woocommerce-task-dashboard__container">
				<Card
					size="large"
					className="woocommerce-task-card woocommerce-homescreen-card"
				>
					<CardHeader size="medium">
						<div className="wooocommerce-task-card__header">
							<Text
								size="20"
								lineHeight="28px"
								variant="title.small"
							>
								{ listTitle }
							</Text>
							<Badge count={ incompleteTasks.length } />
						</div>
						{ renderMenu() }
					</CardHeader>
					<CardBody>
						<ListComp animation="custom" { ...listProps }>
							{ listTasks.map( ( task ) => (
								<TaskListItem
									key={ task.id }
									currentTask={ currentTask }
									eventName={ eventName }
									expandingItems={ expandingItems }
									task={ task }
									setCurrentTask={ setCurrentTask }
								/>
							) ) }
						</ListComp>
					</CardBody>
				</Card>
			</div>
		</>
	);
};

export default TaskList;
