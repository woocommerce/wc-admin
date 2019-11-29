<?php
/**
 * Plugin Name: WooCommerce Admin SQL modification Example
 *
 * @package WC_Admin
 */

/**
 * Register the JS.
 */
function add_report_register_script() {

	if ( ! class_exists( 'Automattic\WooCommerce\Admin\Loader' ) || ! \Automattic\WooCommerce\Admin\Loader::is_admin_page() ) {
		return;
	}

	wp_register_script(
		'sql-modification',
		plugins_url( '/dist/index.js', __FILE__ ),
		array(
			'wp-hooks',
			'wp-element',
			'wp-i18n',
			'wp-plugins',
			'wc-components',
		),
		filemtime( dirname( __FILE__ ) . '/dist/index.js' ),
		true
	);

	wp_enqueue_script( 'sql-modification' );
}
add_action( 'admin_enqueue_scripts', 'add_report_register_script' );

/**
 * Add the query argument `currency` for caching purposes. Otherwise, a
 * change of the currency will return the previous request's data.
 *
 * @param array $args query arguments.
 * @return array augmented query arguments.
 */
function apply_currency_arg( $args ) {
	$currency = 'USD';

	if ( isset( $_GET['currency'] ) ) {
		$currency = sanitize_text_field( wp_unslash( $_GET['currency'] ) );
	}

	$args['currency'] = $currency;

	return $args;
}

add_filter( 'woocommerce_reports_revenue_query_args', 'apply_currency_arg' );
add_filter( 'woocommerce_reports_orders_query_args', 'apply_currency_arg' );
add_filter( 'woocommerce_reports_orders_stats_query_args', 'apply_currency_arg' );

/**
 * Add a JOIN clause.
 *
 * @param array $clauses an array of JOIN query strings.
 * @return array augmented clauses.
 */
function add_join_subquery( $clauses ) {
	global $wpdb;

	$clauses[] = "JOIN {$wpdb->postmeta} postmeta ON {$wpdb->prefix}wc_order_stats.order_id = postmeta.post_id";

	return $clauses;
}

add_filter( 'wc_admin_clauses_join_orders_subquery', 'add_join_subquery' );
add_filter( 'wc_admin_clauses_join_order_stats_total', 'add_join_subquery' );
add_filter( 'wc_admin_clauses_join_order_stats_interval', 'add_join_subquery' );

/**
 * Add a WHERE clause.
 *
 * @param array $clauses an array of WHERE query strings.
 * @return array augmented clauses.
 */
function add_where_subquery( $clauses ) {
	$currency = 'USD';

	if ( isset( $_GET['currency'] ) ) {
		$currency = sanitize_text_field( wp_unslash( $_GET['currency'] ) );
	}

	$clauses[] = "AND postmeta.meta_key = '_order_currency' AND postmeta.meta_value = '{$currency}'";

	return $clauses;
}

add_filter( 'wc_admin_clauses_where_orders_subquery', 'add_where_subquery' );
add_filter( 'wc_admin_clauses_where_order_stats_total', 'add_where_subquery' );
add_filter( 'wc_admin_clauses_where_order_stats_interval', 'add_where_subquery' );
