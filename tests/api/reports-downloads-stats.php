<?php
/**
 * Reports Downloads Stats REST API Test
 *
 * @package WooCommerce Admin\Tests\API.
 */

/**
 * WC_Tests_API_Reports_Downloads_Stats
 */
class WC_Tests_API_Reports_Downloads_Stats extends WC_REST_Unit_Test_Case {

	/**
	 * Endpoints.
	 *
	 * @var string
	 */
	protected $endpoint = '/wc/v3/reports/downloads/stats';

	/**
	 * Setup test reports downloads data.
	 */
	public function setUp() {
		parent::setUp();

		$this->user = $this->factory->user->create(
			array(
				'role' => 'administrator',
			)
		);
	}

	/**
	 * Test route registration.
	 */
	public function test_register_routes() {
		$routes = $this->server->get_routes();

		$this->assertArrayHasKey( $this->endpoint, $routes );
	}

	/**
	 * Test getting report.
	 */
	public function test_get_report() {
		global $wpdb;
		wp_set_current_user( $this->user );
		WC_Helper_Reports::reset_stats_dbs();

		// Populate all of the data.
		$prod_download = new WC_Product_Download();
		$prod_download->set_file( plugin_dir_url( __FILE__ ) . '/assets/images/help.png' );
		$prod_download->set_id( 1 );

		$product = new WC_Product_Simple();
		$product->set_name( 'Test Product' );
		$product->set_downloadable( 'yes' );
		$product->set_downloads( array( $prod_download ) );
		$product->set_regular_price( 25 );
		$product->save();

		$order = WC_Helper_Order::create_order( 1, $product );
		$order->set_status( 'completed' );
		$order->set_total( 100 );
		$order->save();

		$download = new WC_Customer_Download();
		$download->set_user_id( $this->user );
		$download->set_order_id( $order->get_id() );
		$download->set_product_id( $product->get_id() );
		$download->set_download_id( $prod_download->get_id() );
		$download->save();

		$object = new WC_Customer_Download_Log();
		$object->set_permission_id( $download->get_id() );
		$object->set_user_id( $this->user );
		$object->set_user_ip_address( '1.2.3.4' );
		$id = $object->save();

		$time = time();
		$request = new WP_REST_Request( 'GET', $this->endpoint );
		$request->set_query_params(
			array(
				'before'   => date( 'Y-m-d 23:59:59', $time ),
				'after'    => date( 'Y-m-d H:00:00', $time - ( 7 * DAY_IN_SECONDS ) ),
				'interval' => 'day',
			)
		);
		$response = $this->server->dispatch( $request );
		$reports  = $response->get_data();

		$this->assertEquals( 200, $response->get_status() );

		$totals = array(
			'download_count' => 1,
		);
		$this->assertEquals( $totals, $reports['totals'] );

		$today_interval = array(
			'interval'       => date( 'Y-m-d', $time ),
			'date_start'     => date( 'Y-m-d 00:00:00', $time ),
			'date_start_gmt' => date( 'Y-m-d 00:00:00', $time ),
			'date_end'       => date( 'Y-m-d 23:59:59', $time ),
			'date_end_gmt'   => date( 'Y-m-d 23:59:59', $time ),
			'subtotals'      => (object) array(
				'download_count' => 1,
			),
		);
		$this->assertEquals( $today_interval, $reports['intervals'][0] );

		$this->assertEquals( 8, count( $reports['intervals'] ) );
		$this->assertEquals( 0, $reports['intervals'][1]['subtotals']->download_count );
	}

	/**
	 * Test getting reports without valid permissions.
	 */
	public function test_get_reports_without_permission() {
		wp_set_current_user( 0 );
		$response = $this->server->dispatch( new WP_REST_Request( 'GET', $this->endpoint ) );
		$this->assertEquals( 401, $response->get_status() );
	}

	/**
	 * Test reports schema.
	 */
	public function test_reports_schema() {
		wp_set_current_user( $this->user );

		$request    = new WP_REST_Request( 'OPTIONS', $this->endpoint );
		$response   = $this->server->dispatch( $request );
		$data       = $response->get_data();
		$properties = $data['schema']['properties'];

		$this->assertEquals( 2, count( $properties ) );
		$this->assertArrayHasKey( 'totals', $properties );
		$this->assertArrayHasKey( 'intervals', $properties );

		$totals = $properties['totals']['properties'];
		$this->assertEquals( 1, count( $totals ) );
		$this->assertArrayHasKey( 'downloads_count', $totals );

		$intervals = $properties['intervals']['items']['properties'];
		$this->assertEquals( 6, count( $intervals ) );
		$this->assertArrayHasKey( 'interval', $intervals );
		$this->assertArrayHasKey( 'date_start', $intervals );
		$this->assertArrayHasKey( 'date_start_gmt', $intervals );
		$this->assertArrayHasKey( 'date_end', $intervals );
		$this->assertArrayHasKey( 'date_end_gmt', $intervals );
		$this->assertArrayHasKey( 'subtotals', $intervals );

		$subtotals = $properties['intervals']['items']['properties']['subtotals']['properties'];
		$this->assertEquals( 1, count( $subtotals ) );
		$this->assertArrayHasKey( 'downloads_count', $subtotals );
	}
}
