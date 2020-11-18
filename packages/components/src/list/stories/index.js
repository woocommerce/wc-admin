/**
 * External dependencies
 */
import CartIcon from 'gridicons/dist/cart';
import ChevronRightIcon from 'gridicons/dist/chevron-right';
import MySitesIcon from 'gridicons/dist/my-sites';
import LinkBreakIcon from 'gridicons/dist/link-break';
import NoticeIcon from 'gridicons/dist/notice';

import { withConsole } from '@storybook/addon-console';

/**
 * Internal dependencies
 */
import List from '../';
import './style.scss';

function logItemClick( event ) {
	const a = event.currentTarget;
	const itemDescription = a.href
		? `[${ a.textContent }](${ a.href }) ${ a.dataset.linkType }`
		: `[${ a.textContent }]`;
	const itemTag = a.dataset.listItemTag
		? `'${ a.dataset.listItemTag }'`
		: 'not set';
	const logMessage = `[${ itemDescription } item clicked (tag: ${ itemTag })`;

	// eslint-disable-next-line no-console
	console.log( logMessage );

	event.preventDefault();
	return false;
}

export default {
	title: 'WooCommerce Admin/components/List',
	component: List,
	decorators: [ ( storyFn, context ) => withConsole()( storyFn )( context ) ],
};

export const Default = () => {
	const listItems = [
		{
			title: 'WooCommerce.com',
			href: 'https://woocommerce.com',
			onClick: logItemClick,
		},
		{
			title: 'WordPress.org',
			href: 'https://wordpress.org',
			onClick: logItemClick,
		},
		{
			title: 'A list item with no action',
		},
		{
			title: 'Click me!',
			content: 'An alert will be triggered.',
			onClick: ( event ) => {
				// eslint-disable-next-line no-alert
				window.alert( 'List item clicked' );
				return logItemClick( event );
			},
		},
	];

	return <List items={ listItems } />;
};

export const BeforeAndAfter = () => {
	const listItems = [
		{
			before: <CartIcon />,
			after: <ChevronRightIcon />,
			title: 'WooCommerce.com',
			href: 'https://woocommerce.com',
			onClick: logItemClick,
		},
		{
			before: <MySitesIcon />,
			after: <ChevronRightIcon />,
			title: 'WordPress.org',
			href: 'https://wordpress.org',
			onClick: logItemClick,
		},
		{
			before: <LinkBreakIcon />,
			title: 'A list item with no action',
			description: 'List item description text',
		},
		{
			before: <NoticeIcon />,
			title: 'Click me!',
			content: 'An alert will be triggered.',
			onClick: ( event ) => {
				// eslint-disable-next-line no-alert
				window.alert( 'List item clicked' );
				return logItemClick( event );
			},
		},
	];

	return <List items={ listItems } />;
};

export const CustomStyleAndTags = () => {
	const listItems = [
		{
			before: <CartIcon />,
			after: <ChevronRightIcon />,
			title: 'WooCommerce.com',
			href: 'https://woocommerce.com',
			onClick: logItemClick,
			listItemTag: 'woocommerce.com-link',
		},
		{
			before: <MySitesIcon />,
			after: <ChevronRightIcon />,
			title: 'WordPress.org',
			href: 'https://wordpress.org',
			onClick: logItemClick,
			listItemTag: 'wordpress.org-link',
		},
		{
			before: <LinkBreakIcon />,
			title: 'A list item with no action',
		},
		{
			before: <NoticeIcon />,
			title: 'Click me!',
			content: 'An alert will be triggered.',
			onClick: ( event ) => {
				// eslint-disable-next-line no-alert
				window.alert( 'List item clicked' );
				return logItemClick( event );
			},
			listItemTag: 'click-me',
		},
	];

	return <List items={ listItems } className="storybook-custom-list" />;
};
