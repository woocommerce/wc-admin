/** @format */
/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';

/**
 * WooCommerce dependencies
 */
import { Card, List } from '@woocommerce/components';
import { getAdminLink } from '@woocommerce/navigation';

const subTasks = [
	{
		title: __( 'Add manually (recommended)', 'woocommerce-admin' ),
		description: __(
			'For small stores we recommend adding products manually',
			'woocommerce-admin'
		),
		before: <i class="material-icons-outlined">add_box</i>,
		after: <i class="material-icons-outlined">chevron_right</i>,
		onClick: () => ( window.location.href = getAdminLink( 'post-new.php?post_type=product' ) ),
	},
	{
		title: __( 'Import', 'woocommerce-admin' ),
		description: __(
			'For larger stores we recommend importing all products at once via CSV file',
			'woocommerce-admin'
		),
		before: <i class="material-icons-outlined">import_export</i>,
		after: <i class="material-icons-outlined">chevron_right</i>,
		onClick: () =>
			( window.location.href = getAdminLink( 'edit.php?post_type=product&page=product_importer' ) ),
	},
	{
		title: __( 'Migrate', 'woocommerce-admin' ),
		description: __(
			'For stores currently selling elsewhere we suggest using a product migration service',
			'woocommerce-admin'
		),
		before: <i class="material-icons-outlined">cloud_download</i>,
		after: <i class="material-icons-outlined">chevron_right</i>,
		// @todo This should be replaced with the in-app purchase iframe when ready.
		onClick: () => window.open( 'https://woocommerce.com/products/cart2cart/', '_blank' ),
	},
];

export default class Products extends Component {
	render() {
		return (
			<Fragment>
				<Card>
					<List items={ subTasks } />
				</Card>
			</Fragment>
		);
	}
}
