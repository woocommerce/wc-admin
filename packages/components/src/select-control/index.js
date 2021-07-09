/**
 * External dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import classnames from 'classnames';
import { useState, useEffect, useRef, createElement } from '@wordpress/element';
import { escapeRegExp, identity, noop } from 'lodash';
import PropTypes from 'prop-types';
import {
	__experimentalUseFocusOutside as useFocusOutside,
	useDebounce,
	useInstanceId,
} from '@wordpress/compose';
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import List from './list';
import Tags from './tags';
import Control from './control';

function SelectControl( {
	selected,
	options,
	excludeSelectedOptions,
	multiple,
	...props
} ) {
	const instanceId = useInstanceId( SelectControl );
	const [ isExpanded, setIsExpanded ] = useState( false );
	const [ isFocused, setIsFocused ] = useState( false );
	const [ query, setQuery ] = useState( '' );
	const [ searchOptions, setSearchOptions ] = useState( [] );
	const [ selectedIndex, setSelectedIndex ] = useState(
		selected && options?.length && ! excludeSelectedOptions
			? options.findIndex( ( option ) => option.key === selected )
			: null
	);
	const selectControlRef = useRef();

	useEffect( () => {
		const newSelectedIndex =
			selected && options?.length && ! excludeSelectedOptions
				? options.findIndex( ( option ) => option.key === selected )
				: null;
		if ( newSelectedIndex !== selectedIndex ) {
			setSelectedIndex( newSelectedIndex );
		}
	}, [ selected, options, excludeSelectedOptions ] );

	const useFocusOutsideProps = useFocusOutside( () => {
		reset();
	} );

	const getSelected = () => {
		// Return the passed value if an array is provided.
		if ( multiple || Array.isArray( selected ) ) {
			return selected;
		}

		const selectedOption = options.find(
			( option ) => option.key === selected
		);
		return selectedOption ? [ selectedOption ] : [];
	};

	const reset = ( selected = getSelected() ) => {
		// Reset selectedIndex if single selection.
		if ( ! multiple && selected.length && selected[ 0 ].key ) {
			const newSelectedIndex = ! excludeSelectedOptions
				? options.findIndex( ( i ) => i.key === selected[ 0 ].key )
				: null;
			setSelectedIndex( newSelectedIndex );
		}
		setIsExpanded( false );
		setIsFocused( false );
	};

	const hasMultiple = () => {
		if ( ! multiple ) {
			return false;
		}

		if ( Array.isArray( selected ) ) {
			return selected.some( ( item ) => Boolean( item.label ) );
		}

		return Boolean( selected );
	};

	const getOptions = () => {
		const { isSearchable } = props;
		const selectedKeys = getSelected().map( ( option ) => option.key );
		const shownOptions = isSearchable ? searchOptions : options;

		if ( excludeSelectedOptions ) {
			return shownOptions.filter(
				( option ) => ! selectedKeys.includes( option.key )
			);
		}
		return shownOptions;
	};

	const triggerOnChange = ( newValue ) => {
		const { onChange } = props;
		// Trigger a change if the selected value is different and pass back
		// an array or string depending on the original value.
		if ( multiple || Array.isArray( selected ) ) {
			onChange( newValue, query );
		} else {
			onChange( newValue.length > 0 ? newValue[ 0 ].key : '', query );
		}
	};

	const selectOption = ( option ) => {
		const newSelected = multiple ? [ ...selected, option ] : [ option ];

		reset( newSelected );

		const oldSelected = Array.isArray( selected )
			? selected
			: [ { key: selected } ];
		const isSelected = oldSelected.findIndex(
			( val ) => val.key === option.key
		);
		if ( isSelected === -1 ) {
			triggerOnChange( newSelected );
		}

		// After selecting option, the list will reset and we'd need to correct selectedIndex.
		const newSelectedIndex = excludeSelectedOptions
			? // Since we're excluding the selected option, invalidate selection
			  // so re-focusing wont immediately set it to the neigbouring option.
			  null
			: getOptions().findIndex( ( i ) => i.key === option.key );

		setSelectedIndex( newSelectedIndex );
	};

	const decrementSelectedIndex = () => {
		const options = getOptions();
		const nextSelectedIndex =
			selectedIndex !== null
				? ( selectedIndex === 0 ? options.length : selectedIndex ) - 1
				: options.length - 1;

		setSelectedIndex( nextSelectedIndex );
	};

	const incrementSelectedIndex = () => {
		const options = getOptions();
		const nextSelectedIndex =
			selectedIndex !== null ? ( selectedIndex + 1 ) % options.length : 0;

		setSelectedIndex( nextSelectedIndex );
	};

	const debouncedSpeak = useDebounce( speak, 500 );
	const announce = ( searchOptions ) => {
		if ( ! debouncedSpeak ) {
			return;
		}
		if ( !! searchOptions.length ) {
			debouncedSpeak(
				sprintf(
					_n(
						'%d result found, use up and down arrow keys to navigate.',
						'%d results found, use up and down arrow keys to navigate.',
						searchOptions.length,
						'woocommerce-admin'
					),
					searchOptions.length
				),
				'assertive'
			);
		} else {
			debouncedSpeak(
				__( 'No results.', 'woocommerce-admin' ),
				'assertive'
			);
		}
	};

	const getOptionsByQuery = ( options, query ) => {
		const { getSearchExpression, maxResults, onFilter } = props;
		const filtered = [];

		// Create a regular expression to filter the options.
		const expression = getSearchExpression(
			escapeRegExp( query ? query.trim() : '' )
		);
		const search = expression ? new RegExp( expression, 'i' ) : /^$/;

		for ( let i = 0; i < options.length; i++ ) {
			const option = options[ i ];

			// Merge label into keywords
			let { keywords = [] } = option;
			if ( typeof option.label === 'string' ) {
				keywords = [ ...keywords, option.label ];
			}

			const isMatch = keywords.some( ( keyword ) =>
				search.test( keyword )
			);
			if ( ! isMatch ) {
				continue;
			}

			filtered.push( option );

			// Abort early if max reached
			if ( maxResults && filtered.length === maxResults ) {
				break;
			}
		}

		return onFilter( filtered, query );
	};

	const cacheSearchOptionsRef = useRef( [] );
	const search = ( query ) => {
		const cacheSearchOptions = cacheSearchOptionsRef.current || [];
		const searchOptions =
			query !== null && ! query.length && ! props.hideBeforeSearch
				? cacheSearchOptions
				: getOptionsByQuery( cacheSearchOptions, query );

		setQuery( query );
		setIsFocused( true );
		setSearchOptions( searchOptions );
		setSelectedIndex( query?.length > 0 ? null : selectedIndex );
		setIsExpanded( Boolean( getOptions().length ) );

		updateSearchOptions( query );
	};

	const activePromiseRef = useRef();
	const updateSearchOptions = useDebounce( ( query ) => {
		const { hideBeforeSearch, onSearch } = props;

		const promise = ( activePromiseRef.current = Promise.resolve(
			onSearch( options, query )
		).then( ( promiseOptions ) => {
			if ( promise !== activePromiseRef.current ) {
				// Another promise has become active since this one was asked to resolve, so do nothing,
				// or else we might end triggering a race condition updating the state.
				return;
			}

			cacheSearchOptionsRef.current = promiseOptions;

			// Get all options if `hideBeforeSearch` is enabled and query is not null.
			const searchOptions =
				query !== null && ! query.length && ! hideBeforeSearch
					? promiseOptions
					: getOptionsByQuery( promiseOptions, query );

			setSearchOptions( searchOptions );
			setSelectedIndex( query?.length > 0 ? null : selectedIndex );
			setIsExpanded( Boolean( getOptions().length ) );
			announce( searchOptions );
		} ) );
	}, props.searchDebounceTime );

	const onAutofillChange = ( event ) => {
		const searchOptions = getOptionsByQuery( options, event.target.value );

		if ( searchOptions.length === 1 ) {
			selectOption( searchOptions[ 0 ] );
		}
	};

	const {
		autofill,
		children,
		className,
		disabled,
		controlClassName,
		inlineTags,
		isSearchable,
	} = props;

	const hasMultipleItems = hasMultiple();
	const { key: selectedKey = '' } = options[ selectedIndex ] || {};
	const listboxId = isExpanded
		? `woocommerce-select-control__listbox-${ instanceId }`
		: null;
	const activeId = isExpanded
		? `woocommerce-select-control__option-${ instanceId }-${ selectedKey }`
		: null;
	return (
		<div
			className={ classnames( 'woocommerce-select-control', className, {
				'has-inline-tags': hasMultipleItems && inlineTags,
				'is-focused': isFocused,
				'is-searchable': isSearchable,
			} ) }
			{ ...useFocusOutsideProps }
			ref={ selectControlRef }
		>
			{ autofill && (
				<input
					onChange={ onAutofillChange }
					name={ autofill }
					type="text"
					className="woocommerce-select-control__autofill-input"
					tabIndex="-1"
				/>
			) }
			{ children }
			<Control
				{ ...props }
				isExpanded={ isExpanded }
				isFocused={ isFocused }
				selectedIndex={ selectedIndex }
				searchOptions={ searchOptions }
				query={ query }
				activeId={ activeId }
				className={ controlClassName }
				disabled={ disabled }
				hasTags={ hasMultipleItems }
				isExpanded={ isExpanded }
				listboxId={ listboxId }
				onSearch={ search }
				selected={ getSelected() }
				onChange={ triggerOnChange }
				setExpanded={ setIsExpanded }
				updateSearchOptions={ updateSearchOptions }
				decrementSelectedIndex={ decrementSelectedIndex }
				incrementSelectedIndex={ incrementSelectedIndex }
			/>
			{ ! inlineTags && hasMultipleItems && (
				<Tags { ...props } selected={ getSelected() } />
			) }
			{ isExpanded && (
				<List
					{ ...props }
					isExpanded={ isExpanded }
					isFocused={ isFocused }
					selectedIndex={ selectedIndex }
					searchOptions={ searchOptions }
					query={ query }
					activeId={ activeId }
					listboxId={ listboxId }
					node={ selectControlRef.current }
					onSelect={ selectOption }
					onSearch={ search }
					options={ getOptions() }
					decrementSelectedIndex={ decrementSelectedIndex }
					incrementSelectedIndex={ incrementSelectedIndex }
					setExpanded={ setIsExpanded }
				/>
			) }
		</div>
	);
}

SelectControl.propTypes = {
	/**
	 * Name to use for the autofill field, not used if no string is passed.
	 */
	autofill: PropTypes.string,
	/**
	 * A renderable component (or string) which will be displayed before the `Control` of this component.
	 */
	children: PropTypes.node,
	/**
	 * Class name applied to parent div.
	 */
	className: PropTypes.string,
	/**
	 * Class name applied to control wrapper.
	 */
	controlClassName: PropTypes.string,
	/**
	 * Allow the select options to be disabled.
	 */
	disabled: PropTypes.bool,
	/**
	 * Exclude already selected options from the options list.
	 */
	excludeSelectedOptions: PropTypes.bool,
	/**
	 * Add or remove items to the list of options after filtering,
	 * passed the array of filtered options and should return an array of options.
	 */
	onFilter: PropTypes.func,
	/**
	 * Function to add regex expression to the filter the results, passed the search query.
	 */
	getSearchExpression: PropTypes.func,
	/**
	 * Help text to be appended beneath the input.
	 */
	help: PropTypes.oneOfType( [ PropTypes.string, PropTypes.node ] ),
	/**
	 * Render tags inside input, otherwise render below input.
	 */
	inlineTags: PropTypes.bool,
	/**
	 * Allow the select options to be filtered by search input.
	 */
	isSearchable: PropTypes.bool,
	/**
	 * A label to use for the main input.
	 */
	label: PropTypes.string,
	/**
	 * Function called when selected results change, passed result list.
	 */
	onChange: PropTypes.func,
	/**
	 * Function run after search query is updated, passed previousOptions and query,
	 * should return a promise with an array of updated options.
	 */
	onSearch: PropTypes.func,
	/**
	 * An array of objects for the options list.  The option along with its key, label and
	 * value will be returned in the onChange event.
	 */
	options: PropTypes.arrayOf(
		PropTypes.shape( {
			isDisabled: PropTypes.bool,
			key: PropTypes.oneOfType( [ PropTypes.number, PropTypes.string ] )
				.isRequired,
			keywords: PropTypes.arrayOf(
				PropTypes.oneOfType( [ PropTypes.string, PropTypes.number ] )
			),
			label: PropTypes.oneOfType( [
				PropTypes.string,
				PropTypes.object,
			] ),
			value: PropTypes.any,
		} )
	).isRequired,
	/**
	 * A placeholder for the search input.
	 */
	placeholder: PropTypes.string,
	/**
	 * Time in milliseconds to debounce the search function after typing.
	 */
	searchDebounceTime: PropTypes.number,
	/**
	 * An array of objects describing selected values or optionally a string for a single value.
	 * If the label of the selected value is omitted, the Tag of that value will not
	 * be rendered inside the search box.
	 */
	selected: PropTypes.oneOfType( [
		PropTypes.string,
		PropTypes.arrayOf(
			PropTypes.shape( {
				key: PropTypes.oneOfType( [
					PropTypes.number,
					PropTypes.string,
				] ).isRequired,
				label: PropTypes.string,
			} )
		),
	] ),
	/**
	 * A limit for the number of results shown in the options menu.  Set to 0 for no limit.
	 */
	maxResults: PropTypes.number,
	/**
	 * Allow multiple option selections.
	 */
	multiple: PropTypes.bool,
	/**
	 * Render a 'Clear' button next to the input box to remove its contents.
	 */
	showClearButton: PropTypes.bool,
	/**
	 * The input type for the search box control.
	 */
	searchInputType: PropTypes.oneOf( [
		'text',
		'search',
		'number',
		'email',
		'tel',
		'url',
	] ),
	/**
	 * Only show list options after typing a search query.
	 */
	hideBeforeSearch: PropTypes.bool,
	/**
	 * Show all options on focusing, even if a query exists.
	 */
	showAllOnFocus: PropTypes.bool,
	/**
	 * Render results list positioned statically instead of absolutely.
	 */
	staticList: PropTypes.bool,
};

SelectControl.defaultProps = {
	autofill: null,
	excludeSelectedOptions: true,
	getSearchExpression: identity,
	inlineTags: false,
	isSearchable: false,
	onChange: noop,
	onFilter: identity,
	onSearch: ( options ) => Promise.resolve( options ),
	maxResults: 0,
	multiple: false,
	searchDebounceTime: 0,
	searchInputType: 'search',
	selected: [],
	showAllOnFocus: false,
	showClearButton: false,
	hideBeforeSearch: false,
	staticList: false,
};

export default SelectControl;
