/** @format */
/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { IconButton, ToggleControl } from '@wordpress/components';
import { fill, find, findIndex, first, noop, partial, uniq } from 'lodash';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import './style.scss';
import Card from 'components/card';
import EllipsisMenu from 'components/ellipsis-menu';
import MenuItem from 'components/ellipsis-menu/menu-item';
import MenuTitle from 'components/ellipsis-menu/menu-title';
import Pagination from 'components/pagination';
import Table from './table';
import TableSummary from './summary';

/**
 * This is an accessible, sortable, and scrollable table for displaying tabular data (like revenue and other analytics data).
 * It accepts `headers` for column headers, and `rows` for the table content.
 * `rowHeader` can be used to define the index of the row header (or false if no header).
 *
 * `TableCard` serves as Card wrapper & contains a card header, `<Table />`, `<TableSummary />`, and `<Pagination />`.
 * This includes filtering and comparison functionality for report pages.
 */
class TableCard extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			showCols: fill( Array( props.headers.length ), true ),
			selectedRows: [],
		};
		this.toggleCols = this.toggleCols.bind( this );
		this.selectRow = this.selectRow.bind( this );
		this.selectAllRows = this.selectAllRows.bind( this );
	}

	toggleCols( selected ) {
		const { headers, query, onQueryChange } = this.props;
		return () => {
			// Handle hiding a sorted column
			if ( query.orderby ) {
				const sortBy = findIndex( headers, { key: query.orderby } );
				if ( sortBy === selected ) {
					const defaultSort = find( headers, { defaultSort: true } ) || first( headers ) || {};
					onQueryChange( 'sort' )( defaultSort.key, 'desc' );
				}
			}

			this.setState( prevState => ( {
				showCols: prevState.showCols.map(
					( toggled, i ) => ( selected === i ? ! toggled : toggled )
				),
			} ) );
		};
	}

	filterCols( rows = [] ) {
		const { showCols } = this.state;
		// Header is a 1d array
		if ( ! Array.isArray( first( rows ) ) ) {
			return rows.filter( ( col, i ) => showCols[ i ] );
		}
		// Rows is a 2d array
		return rows.map( row => row.filter( ( col, i ) => showCols[ i ] ) );
	}

	selectAllRows( event ) {
		const { ids } = this.props;
		if ( event.target.checked ) {
			this.setState( {
				selectedRows: ids,
			} );
		} else {
			this.setState( {
				selectedRows: [],
			} );
		}
	}

	selectRow( i, event ) {
		const { ids } = this.props;
		if ( event.target.checked ) {
			this.setState( ( { selectedRows } ) => ( {
				selectedRows: uniq( [ ids[ i ], ...selectedRows ] ),
			} ) );
		} else {
			this.setState( ( { selectedRows } ) => {
				const index = selectedRows.indexOf( ids[ i ] );
				return {
					selectedRows: [ ...selectedRows.slice( 0, index ), ...selectedRows.slice( index + 1 ) ],
				};
			} );
		}
	}

	getCheckbox( i ) {
		const { ids = [] } = this.props;
		const { selectedRows } = this.state;
		const isChecked = -1 !== selectedRows.indexOf( ids[ i ] );
		return {
			display: (
				<input type="checkbox" onChange={ partial( this.selectRow, i ) } checked={ isChecked } />
			),
			value: false,
		};
	}

	getAllCheckbox() {
		const { ids = [] } = this.props;
		const { selectedRows } = this.state;
		const isAllChecked = ids.length === selectedRows.length;
		return {
			label: (
				<input
					type="checkbox"
					onChange={ this.selectAllRows }
					aria-label={ __( 'Select All' ) }
					checked={ isAllChecked }
				/>
			),
			required: true,
		};
	}

	render() {
		const {
			compareBy,
			onClickDownload,
			onQueryChange,
			query,
			rowHeader,
			rowsPerPage,
			summary,
			title,
			totalRows,
		} = this.props;
		const { showCols } = this.state;
		const allHeaders = this.props.headers;
		let headers = this.filterCols( this.props.headers );
		let rows = this.filterCols( this.props.rows );
		if ( compareBy ) {
			rows = rows.map( ( row, i ) => {
				return [ this.getCheckbox( i ), ...row ];
			} );
			headers = [ this.getAllCheckbox(), ...headers ];
		}

		return (
			<Card
				className="woocommerce-table"
				title={ title }
				action={
					onClickDownload && (
						<IconButton onClick={ onClickDownload } icon="arrow-down" size={ 18 } isDefault>
							{ __( 'Download', 'wc-admin' ) }
						</IconButton>
					)
				}
				menu={
					<EllipsisMenu label={ __( 'Choose which values to display', 'wc-admin' ) }>
						<MenuTitle>{ __( 'Columns:', 'wc-admin' ) }</MenuTitle>
						{ allHeaders.map( ( { label, required }, i ) => {
							if ( required ) {
								return null;
							}
							return (
								<MenuItem key={ i } onInvoke={ this.toggleCols( i ) }>
									<ToggleControl
										label={ label }
										checked={ !! showCols[ i ] }
										onChange={ this.toggleCols( i ) }
									/>
								</MenuItem>
							);
						} ) }
					</EllipsisMenu>
				}
			>
				<Table
					rows={ rows }
					headers={ headers }
					rowHeader={ rowHeader }
					caption={ title }
					query={ query }
					onSort={ onQueryChange( 'sort' ) }
				/>

				{ summary && <TableSummary data={ summary } /> }

				<Pagination
					page={ parseInt( query.page ) || 1 }
					perPage={ rowsPerPage }
					total={ totalRows }
					onPageChange={ onQueryChange( 'page' ) }
					onPerPageChange={ onQueryChange( 'per_page' ) }
				/>
			</Card>
		);
	}
}

TableCard.propTypes = {
	/**
	 * The string to use as a query parameter when comparing row items.
	 */
	compareBy: PropTypes.string,
	/**
	 * An array of column headers (see `Table` props).
	 */
	headers: PropTypes.arrayOf(
		PropTypes.shape( {
			defaultSort: PropTypes.bool,
			isSortable: PropTypes.bool,
			key: PropTypes.string,
			label: PropTypes.string,
			required: PropTypes.bool,
		} )
	),
	/**
	 * A list of IDs, matching to the row list so that id[ 0 ] contains the object ID for the object displayed in row[ 0 ].
	 */
	ids: PropTypes.arrayOf( PropTypes.number ),
	/**
	 * A function which returns a callback function to update the query string for a given `param`.
	 */
	onQueryChange: PropTypes.func,
	/**
	 * A callback function which handles then "download" button press. Optional, if not used, the button won't appear.
	 */
	onClickDownload: PropTypes.func,
	/**
	 *  An object of the query parameters passed to the page, ex `{ page: 2, per_page: 5 }`.
	 */
	query: PropTypes.object,
	/**
	 * An array of arrays of display/value object pairs (see `Table` props).
	 */
	rowHeader: PropTypes.oneOfType( [ PropTypes.number, PropTypes.bool ] ),
	/**
	 * Which column should be the row header, defaults to the first item (`0`) (see `Table` props).
	 */
	rows: PropTypes.arrayOf(
		PropTypes.arrayOf(
			PropTypes.shape( {
				display: PropTypes.node,
				value: PropTypes.oneOfType( [ PropTypes.string, PropTypes.number, PropTypes.bool ] ),
			} )
		)
	).isRequired,
	/**
	 * The total number of rows to display per page.
	 */
	rowsPerPage: PropTypes.number.isRequired,
	/**
	 * An array of objects with `label` & `value` properties, which display in a line under the table.
	 * Optional, can be left off to show no summary.
	 */
	summary: PropTypes.arrayOf(
		PropTypes.shape( {
			label: PropTypes.node,
			value: PropTypes.oneOfType( [ PropTypes.string, PropTypes.number ] ),
		} )
	),
	/**
	 * The title used in the card header, also used as the caption for the content in this table.
	 */
	title: PropTypes.string.isRequired,
	/**
	 * The total number of rows (across all pages).
	 */
	totalRows: PropTypes.number.isRequired,
};

TableCard.defaultProps = {
	onQueryChange: noop,
	query: {},
	rowHeader: 0,
	rows: [],
};

export default TableCard;
