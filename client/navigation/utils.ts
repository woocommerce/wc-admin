/**
 * External dependencies
 */
import { getAdminLink } from '@woocommerce/wc-admin-settings';

type MenuId = 'primary' | 'favorites' | 'plugins' | 'secondary';

interface Item {
	id: string;
	matchExpression: string;
	url: string;
	order: number;
	title: string;
	parent: string;
	menuId: MenuId;
	capability: string;
	isCategory: boolean;
}

interface Category {
	id: string;
	isCategory: boolean;
	menuId: MenuId;
	migrate: boolean;
	order: number;
	parent: string;
	title: string;
	primary?: Item[];
	favorites?: Item[];
	plugins?: Item[];
	secondary?: Item[];
}

/**
 * Get the full URL if a relative path is passed.
 */
export const getFullUrl = ( url: string ): string => {
	if ( url.indexOf( 'http' ) === 0 ) {
		return url;
	}

	return getAdminLink( url );
};

/**
 * Get a default regex expression to match the path and provided params.
 */
export const getDefaultMatchExpression = ( url: string ): string => {
	const escapedUrl = url.replace( /[-\/\\^$*+?.()|[\]{}]/gi, '\\$&' );
	const [ path, args, hash ] = escapedUrl.split( /\\\?|#/ );
	const hashExpression = hash ? `(.*#${ hash }$)` : '';
	const argsExpression = args
		? args.split( '&' ).reduce( ( acc, param ) => {
				return `${ acc }(?=.*[?|&]${ param }(&|$|#))`;
		  }, '' )
		: '';
	return '^' + path + argsExpression + hashExpression;
};

/**
 * Get a match score for a menu item given a location.
 */
export const getMatchScore = (
	location: Location,
	itemUrl: string,
	itemExpression: string | null = null
): number => {
	if ( ! itemUrl ) {
		return 0;
	}

	const fullUrl = getFullUrl( itemUrl );
	const { href } = location;

	// Return highest possible score for exact match.
	if ( fullUrl === href ) {
		return Number.MAX_SAFE_INTEGER;
	}

	const defaultExpression = getDefaultMatchExpression( fullUrl );
	const regexp = new RegExp( itemExpression || defaultExpression, 'i' );
	return ( decodeURIComponent( href ).match( regexp ) || [] ).length;
};

interface wcNavigation {
	menuItems: Item[];
	rootBackLabel: string;
	rootBackUrl: string;
	historyPatched: boolean;
}

declare global {
	interface Window {
		wcNavigation: wcNavigation;
	}
}

interface wcNavigation {
	menuItems: Array< Item >;
	rootBackLabel: string;
	rootBackUrl: string;
	historyPatched: boolean;
}

declare global {
	interface Window {
		wcNavigation: wcNavigation;
	}
}

/**
 * Adds a listener that runs on history change.
 *
 * @param {Function} listener Listener to add on history change.
 * @return {Function} Function to remove listeners.
 */
export const addHistoryListener = ( listener: () => void ): ( () => void ) => {
	// Monkey patch pushState to allow trigger the pushstate event listener.
	if ( ! window.wcNavigation.historyPatched ) {
		( ( history ) => {
			/* global CustomEvent */
			const pushState = history.pushState;
			const replaceState = history.replaceState;
			history.pushState = function (
				state: {
					[ key: string ]: string;
				},
				title: string,
				url: string
			) {
				const pushStateEvent = new CustomEvent( 'pushstate', state );
				window.dispatchEvent( pushStateEvent );
				return pushState.apply( history, [ state, title, url ] );
			};
			history.replaceState = function (
				state: {
					[ key: string ]: string;
				},
				title: string,
				url: string
			) {
				const replaceStateEvent = new CustomEvent(
					'replacestate',
					state
				);
				window.dispatchEvent( replaceStateEvent );
				return replaceState.apply( history, [ state, title, url ] );
			};
			window.wcNavigation.historyPatched = true;
		} )( window.history );
	}

	window.addEventListener( 'popstate', listener );
	window.addEventListener( 'pushstate', listener );
	window.addEventListener( 'replacestate', listener );

	return () => {
		window.removeEventListener( 'popstate', listener );
		window.removeEventListener( 'pushstate', listener );
		window.removeEventListener( 'replacestate', listener );
	};
};

/**
 * Get the closest matching item.
 *
 * @param {Array} items An array of items to match against.
 */
export const getMatchingItem = ( items: Item[] ): Item | null => {
	let matchedItem = null;
	let highestMatchScore = 0;

	items.forEach( ( item ) => {
		const score = getMatchScore(
			window.location,
			item.url,
			item.matchExpression
		);
		if ( score > 0 && score >= highestMatchScore ) {
			highestMatchScore = score;
			matchedItem = item;
		}
	} );

	return matchedItem || null;
};

/**
 * Available menu IDs.
 */
export const menuIds: MenuId[] = [
	'primary',
	'favorites',
	'plugins',
	'secondary',
];

/**
 * Default categories for the menu.
 */
export const defaultCategories: {
	[ key: string ]: Category;
} = {
	woocommerce: {
		id: 'woocommerce',
		isCategory: true,
		menuId: 'primary',
		migrate: true,
		order: 10,
		parent: '',
		title: 'WooCommerce',
	},
};

/**
 * Sort an array of menu items by their order property.
 *
 * @param {Array} menuItems Array of menu items.
 * @return {Array} Sorted menu items.
 */
export const sortMenuItems = ( menuItems: Item[] ): Item[] => {
	return menuItems.sort( ( a, b ) => {
		if ( a.order === b.order ) {
			return a.title.localeCompare( b.title );
		}

		return a.order - b.order;
	} );
};

/**
 * Get a flat tree structure of all Categories and thier children grouped by menuId
 *
 * @param {Array} menuItems Array of menu items.
 * @param {Function} currentUserCan Callback method passed the capability to determine if a menu item is visible.
 * @return {Object} Mapped menu items and categories.
 */
export const getMappedItemsCategories = (
	menuItems: Item[],
	currentUserCan: ( capability: string ) => boolean
): {
	items: {
		[ key: string ]: Category | { [ key: string ]: Item[] };
	};
	categories: {
		[ key: string ]: Category | Item;
	};
} => {
	const categories: {
		[ key: string ]: Category | Item;
	} = { ...defaultCategories };

	const items = sortMenuItems( menuItems ).reduce(
		(
			acc: {
				[ key: string ]: Category | { [ key: string ]: Item[] };
			},
			item: Item
		) => {
			// Set up the category if it doesn't yet exist.
			if ( ! acc[ item.parent ] ) {
				acc[ item.parent ] = {};
				menuIds.forEach( ( menuId ) => {
					acc[ item.parent ][ menuId ] = [];
				} );
			}

			// Incorrect menu ID.
			if ( ! acc[ item.parent ][ item.menuId ] ) {
				return acc;
			}

			// User does not have permission to view this item.
			if (
				currentUserCan &&
				item.capability &&
				! currentUserCan( item.capability )
			) {
				return acc;
			}

			// Add categories.
			if ( item.isCategory ) {
				categories[ item.id ] = item;
			}

			const menuIdArray = acc[ item.parent ][ item.menuId ];

			if ( menuIdArray ) {
				menuIdArray.push( item );
			}

			return acc;
		},
		{}
	);

	return {
		items,
		categories,
	};
};
