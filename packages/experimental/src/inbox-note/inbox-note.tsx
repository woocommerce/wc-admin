/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useRef } from '@wordpress/element';
import { Button, Dropdown, Popover } from '@wordpress/components';
import VisibilitySensor from 'react-visibility-sensor';
import moment from 'moment';
import classnames from 'classnames';
import { H, Section } from '@woocommerce/components';
import { sanitize } from 'dompurify';

/**
 * Internal dependencies
 */
import InboxNoteAction from './action';

const ALLOWED_TAGS = [ 'a', 'b', 'em', 'i', 'strong', 'p', 'br' ];
const ALLOWED_ATTR = [ 'target', 'href', 'rel', 'name', 'download' ];

const sanitizeHTML = ( html: string ) => {
	return {
		__html: sanitize( html, { ALLOWED_TAGS, ALLOWED_ATTR } ),
	};
};

export type InboxNoteAction = {
	id: number;
	url: string;
	label: string;
	primary: boolean;
	actioned_text?: boolean;
};

export type InboxNote = {
	id: number;
	status: string;
	title: string;
	name: string;
	content: string;
	date_created: string;
	date_created_gmt: string;
	actions: InboxNoteAction[];
	layout: string;
	image: string;
	is_deleted: boolean;
	type: string;
};

type InboxNoteProps = {
	note: InboxNote;
	lastRead: number;
	onDismiss?: ( note: InboxNote, type: 'all' | 'note' ) => void;
	onNoteActionClick?: ( note: InboxNote, action: InboxNoteAction ) => void;
	onBodyLinkClick?: ( note: InboxNote, link: string ) => void;
	onNoteVisible?: ( note: InboxNote ) => void;
};

const DropdownWithPopoverProps = Dropdown as React.ComponentType<
	Dropdown.Props & { popoverProps: Omit< Popover.Props, 'children' > }
>;

const InboxNote: React.FC< InboxNoteProps > = ( {
	note,
	lastRead,
	onDismiss,
	onNoteActionClick,
	onBodyLinkClick,
	onNoteVisible,
} ) => {
	const [ clickedActionText, setClickedActionText ] = useState( false );
	const hasBeenSeen = useRef( false );
	const toggleButtonRef = useRef< HTMLButtonElement >( null );

	const handleBodyClick = ( event: {
		target: EventTarget | HTMLBaseElement;
	} ) => {
		if ( 'href' in event.target ) {
			const innerLink = event.target.href;
			if ( innerLink && onBodyLinkClick ) {
				onBodyLinkClick( note, innerLink );
			}
		}
	};

	// Trigger a view Tracks event when the note is seen.
	const onVisible = ( isVisible: boolean ) => {
		if ( isVisible && ! hasBeenSeen.current ) {
			onNoteVisible && onNoteVisible( note );

			hasBeenSeen.current = true;
		}
	};

	const handleBlur = ( event: React.FocusEvent, onClose: () => void ) => {
		const dropdownClasses = [
			'woocommerce-admin-dismiss-notification',
			'components-popover__content',
		];
		// This line is for IE compatibility.
		let relatedTarget: EventTarget | Element | null = null;
		if ( event.relatedTarget ) {
			relatedTarget = event.relatedTarget;
		} else if ( toggleButtonRef.current ) {
			const ownerDoc = toggleButtonRef.current.ownerDocument;
			relatedTarget = ownerDoc ? ownerDoc.activeElement : null;
		}
		let isClickOutsideDropdown = false;
		if ( relatedTarget && 'className' in relatedTarget ) {
			const classNames = relatedTarget.className;
			isClickOutsideDropdown = dropdownClasses.some( ( className ) =>
				classNames.includes( className )
			);
		}
		if ( isClickOutsideDropdown ) {
			event.preventDefault();
		} else {
			onClose();
		}
	};

	const onDropdownDismiss = (
		type: 'note' | 'all',
		onToggle: () => void
	) => {
		onDismiss && onDismiss( note, type );
		onToggle();
	};

	const renderDismissButton = () => {
		if ( clickedActionText ) {
			return null;
		}

		return (
			<DropdownWithPopoverProps
				contentClassName="woocommerce-admin-dismiss-dropdown"
				position="bottom right"
				renderToggle={ ( { onClose, onToggle } ) => (
					<Button
						isTertiary
						onClick={ onToggle }
						ref={ toggleButtonRef }
						onBlur={ ( event: React.FocusEvent ) =>
							handleBlur( event, onClose )
						}
					>
						{ __( 'Dismiss', 'woocommerce-admin' ) }
					</Button>
				) }
				focusOnMount={ false }
				popoverProps={ { noArrow: true } }
				renderContent={ ( { onToggle } ) => (
					<ul>
						<li>
							<Button
								className="woocommerce-admin-dismiss-notification"
								onClick={ () =>
									onDropdownDismiss( 'note', onToggle )
								}
							>
								{ __(
									'Dismiss this message',
									'woocommerce-admin'
								) }
							</Button>
						</li>
						<li>
							<Button
								className="woocommerce-admin-dismiss-notification"
								onClick={ () =>
									onDropdownDismiss( 'all', onToggle )
								}
							>
								{ __(
									'Dismiss all messages',
									'woocommerce-admin'
								) }
							</Button>
						</li>
					</ul>
				) }
			/>
		);
	};

	const renderActions = ( note: InboxNote ) => {
		const { actions: noteActions, id: noteId } = note;

		if ( !! clickedActionText ) {
			return clickedActionText;
		}

		if ( ! noteActions ) {
			return;
		}

		return (
			<>
				{ noteActions.map( ( action, index ) => (
					<InboxNoteAction
						key={ index }
						label={ action.label }
						href={
							action && action.url && action.url.length
								? action.url
								: undefined
						}
						onClick={ () => onActionClicked( action ) }
					/>
				) ) }
			</>
		);
	};

	const onActionClicked = ( action: InboxNoteAction ) => {
		onNoteActionClick && onNoteActionClick( note, action );
		if ( ! action.actioned_text ) {
			return;
		}

		setClickedActionText( action.actioned_text );
	};

	const {
		content,
		date_created: dateCreated,
		date_created_gmt: dateCreatedGmt,
		image,
		is_deleted: isDeleted,
		layout,
		status,
		title,
	} = note;

	if ( isDeleted ) {
		return null;
	}

	const unread =
		! lastRead ||
		! dateCreatedGmt ||
		new Date( dateCreatedGmt + 'Z' ).getTime() > lastRead;
	const date = dateCreated;
	const hasImage = layout !== 'plain' && layout !== '';
	const cardClassName = classnames( 'woocommerce-inbox-message', layout, {
		'message-is-unread': unread && status === 'unactioned',
	} );

	return (
		<VisibilitySensor onChange={ onVisible }>
			<section className={ cardClassName }>
				{ hasImage && (
					<div className="woocommerce-inbox-message__image">
						<img src={ image } alt="" />
					</div>
				) }
				<div className="woocommerce-inbox-message__wrapper">
					<div className="woocommerce-inbox-message__content">
						{ unread && (
							<div className="woocommerce-inbox-message__unread-indicator" />
						) }
						{ date && (
							<span className="woocommerce-inbox-message__date">
								{ moment.utc( date ).fromNow() }
							</span>
						) }
						<H className="woocommerce-inbox-message__title">
							{ title }
						</H>
						<Section className="woocommerce-inbox-message__text">
							<span
								dangerouslySetInnerHTML={ sanitizeHTML(
									content
								) }
								onClick={ ( event ) =>
									handleBodyClick( event )
								}
							/>
						</Section>
					</div>
					<div className="woocommerce-inbox-message__actions">
						{ renderActions( note ) }
						{ renderDismissButton() }
					</div>
				</div>
			</section>
		</VisibilitySensor>
	);
};

export { InboxNote };
