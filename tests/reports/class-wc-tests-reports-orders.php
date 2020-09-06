<?php
/**
 * Orders Report tests.
 *
 * @package WooCommerce\Admin\Tests\Orders
 */

use \Automattic\WooCommerce\Admin\API\Reports\Orders\DataStore as OrdersDataStore;
use \Automattic\WooCommerce\Admin\API\Reports\Orders\Query as OrdersQuery;
use \Automattic\WooCommerce\Admin\API\Reports\TimeInterval;

/**
 * Class WC_Tests_Reports_Orders
 */
class WC_Tests_Reports_Orders extends WC_Unit_Test_Case {
	/**
	 * Test that extended info handles variations correctly.
	 */
	public function test_extended_info() {
		global $wpdb;
		WC_Helper_Reports::reset_stats_dbs();

		// Populate all of the data.
		$parent_product = new WC_Product_Variable();
		$parent_product->set_name( 'Variable Product' );
		$parent_product->set_regular_price( 25 );

		$attribute = new WC_Product_Attribute();
		$attribute->set_id( 0 );
		$attribute->set_name( 'pa_color' );
		$attribute->set_options( explode( WC_DELIMITER, 'green | red' ) );
		$attribute->set_visible( false );
		$attribute->set_variation( true );
		$parent_product->set_attributes( array( $attribute ) );
		$parent_product->save();

		$variation = new WC_Product_Variation();
		$variation->set_name( 'Test Variation' );
		$variation->set_parent_id( $parent_product->get_id() );
		$variation->set_regular_price( 10 );
		$variation->set_attributes( array( 'pa_color' => 'green' ) );
		$variation->set_manage_stock( true );
		$variation->set_stock_quantity( 25 );
		$variation->save();

		$simple_product = new WC_Product_Simple();
		$simple_product->set_name( 'Simple Product' );
		$simple_product->set_regular_price( 25 );
		$simple_product->save();

		$order = WC_Helper_Order::create_order( 1, $variation );
		// Add simple product.
		$item = new WC_Order_Item_Product();
		$item->set_props(
			array(
				'product'  => $simple_product,
				'quantity' => 1,
				'subtotal' => wc_get_price_excluding_tax( $simple_product, array( 'qty' => 1 ) ),
				'total'    => wc_get_price_excluding_tax( $simple_product, array( 'qty' => 1 ) ),
			)
		);
		$item->save();
		$order->add_item( $item );
		// Fix totals.
		$order->set_total( 75 ); // ( 4 * 10 ) + 25 + 10 shipping (in helper).
		$order->set_status( 'completed' );
		$order->save();

		WC_Helper_Queue::run_all_pending();

		$data_store = new OrdersDataStore();
		$start_time = gmdate( 'Y-m-d H:00:00', $order->get_date_created()->getOffsetTimestamp() );
		$end_time   = gmdate( 'Y-m-d H:59:59', $order->get_date_created()->getOffsetTimestamp() );
		$args       = array(
			'after'         => $start_time,
			'before'        => $end_time,
			'extended_info' => 1,
		);
		// Test retrieving the stats through the data store.
		$data     = $data_store->get_data( $args );
		$expected = (object) array(
			'total'   => 1,
			'pages'   => 1,
			'page_no' => 1,
			'data'    => array(
				0 => array(
					'order_id'         => $order->get_id(),
					'parent_id'        => 0,
					'status'           => 'completed',
					'net_total'        => 65.0,
					'total_sales'      => 75.0,
					'num_items_sold'   => 5,
					'customer_id'      => $data->data[0]['customer_id'], // Not under test.
					'customer_type'    => 'new',
					'date_created'     => $data->data[0]['date_created'], // Not under test.
					'date_created_gmt' => $data->data[0]['date_created_gmt'], // Not under test.
					'extended_info'    => array(
						'products' => array(
							array(
								'id'       => $variation->get_id(),
								'name'     => $variation->get_name(),
								'quantity' => 4,
							),
							array(
								'id'       => $simple_product->get_id(),
								'name'     => $simple_product->get_name(),
								'quantity' => 1,
							),
						),
						'coupons'  => array(),
						'customer' => $data->data[0]['extended_info']['customer'], // Not under test.
					),
				),
			),
		);
		$this->assertEquals( $expected, $data );
	}
}
