/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { MenuGroup, MenuItem } from '@wordpress/components';
import { check } from '@wordpress/icons';
import { useState, useEffect, Fragment } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { OPTIONS_STORE_NAME } from '@woocommerce/data';
import { useExperiment } from '@woocommerce/explat';
import { recordEvent } from '@woocommerce/tracks';

/**
 * Internal dependencies
 */
import { DisplayOption } from '../header/activity-panel/display-options';
import TaskList from './task-list';
import TaskListPlaceholder from './placeholder';
import { TaskStep } from './task-step';
import './tasks/appearance';
import './tasks/PaymentGatewaySuggestions';
import './tasks/products';
import './tasks/shipping';
import './tasks/tax';

const TaskDashboard = ( { query } ) => {
	const { task } = query;
	const { createNotice } = useDispatch( 'core/notices' );
	const { updateOptions } = useDispatch( OPTIONS_STORE_NAME );
	const [ taskLists, setTaskLists ] = useState( [] );
	const [ isLoadingExperiment, experimentAssignment ] = useExperiment(
		'woocommerce_tasklist_progression'
	);

	useEffect( () => {
		document.body.classList.add( 'woocommerce-onboarding' );
		document.body.classList.add( 'woocommerce-task-dashboard__body' );
		apiFetch( {
			path: '/wc-admin/onboarding/tasks',
		} )
			.then( ( results ) => {
				setTaskLists( results );
			} )
			.catch( () => {
				createNotice(
					'error',
					__(
						'There was an error fetching the task list',
						'wooocoommerce-admin'
					)
				);
			} );
	}, [] );

	const getCurrentTask = () => {
		if ( ! task ) {
			return null;
		}

		const tasks = taskLists.reduce(
			( acc, taskList ) => [ ...acc, ...taskList.tasks ],
			[]
		);

		const currentTask = tasks.find( ( t ) => t.id === task );

		if ( ! currentTask ) {
			return null;
		}

		return currentTask;
	};

	const toggleTaskList = ( taskList ) => {
		const { isHidden } = taskList;
		const newValue = ! isHidden;

		recordEvent(
			newValue ? 'extended_tasklist_hide' : 'extended_tasklist_show'
		);
		// @todo This should be updated to handle any ID.
		updateOptions( {
			woocommerce_extended_task_list_hidden: newValue ? 'yes' : 'no',
		} );
	};

	const currentTask = getCurrentTask();

	if ( task && ! currentTask ) {
		return null;
	}

	if ( currentTask ) {
		return (
			<TaskStep taskContainer={ currentTask.container } query={ query } />
		);
	}

	if ( isLoadingExperiment ) {
		return <TaskListPlaceholder />;
	}

	return taskLists.map( ( taskList ) => {
		const {
			id,
			isComplete,
			isHidden,
			isToggleable,
			title,
			tasks,
		} = taskList;

		return (
			<Fragment key={ id }>
				<TaskList
					name={ id }
					eventName="tasklist"
					expandingItems={
						experimentAssignment?.variationName === 'treatment'
					}
					isComplete={ isComplete }
					query={ query }
					tasks={ tasks }
					title={ title }
					onComplete={ () =>
						updateOptions( {
							woocommerce_default_homepage_layout: 'two_columns',
						} )
					}
					onHide={ () =>
						updateOptions( {
							woocommerce_task_list_prompt_shown: true,
							woocommerce_default_homepage_layout: 'two_columns',
						} )
					}
				/>
				{ isToggleable && (
					<DisplayOption>
						<MenuGroup
							className="woocommerce-layout__homescreen-display-options"
							label={ __( 'Display', 'woocommerce-admin' ) }
						>
							<MenuItem
								className="woocommerce-layout__homescreen-extension-tasklist-toggle"
								icon={ ! isHidden && check }
								isSelected={ ! isHidden }
								role="menuitemcheckbox"
								onClick={ () => toggleTaskList( taskList ) }
							>
								{ __(
									'Show things to do next',
									'woocommerce-admin'
								) }
							</MenuItem>
						</MenuGroup>
					</DisplayOption>
				) }
			</Fragment>
		);
	} );
};

export default TaskDashboard;
