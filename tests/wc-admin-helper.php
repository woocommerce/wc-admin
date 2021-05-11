<?php
/**
 * WCAdminHelper tests
 *
 * @package WooCommerce\Admin\Tests\WCAdminHelper
 */

use \Automattic\WooCommerce\Admin\WCAdminHelper;

/**
 * WC_Admin_Tests_Plugin_Helper Class
 *
 * @package WooCommerce\Admin\Tests\PluginHelper
 */
class WC_Admin_Tests_Admin_Helper extends WP_UnitTestCase {

	/**
	 * Test wc_admin_active_for one hour
	 */
	public function test_is_wc_admin_active_for_one_hour() {
		update_option( WCAdminHelper::WC_ADMIN_TIMESTAMP_OPTION, time() - ( HOUR_IN_SECONDS * 10 ) );

		// Active for one hour - true.
		$active_for = WCAdminHelper::is_wc_admin_active_for( HOUR_IN_SECONDS );
		$this->assertEquals( true, $active_for );
	}

	/**
	 * Test wc_admin_active_for one hour
	 */
	public function test_is_wc_admin_active_for_7_days() {
		update_option( WCAdminHelper::WC_ADMIN_TIMESTAMP_OPTION, time() - ( HOUR_IN_SECONDS * 10 ) );
		// Active for 7 days - false.
		$active_for = WCAdminHelper::is_wc_admin_active_for( DAY_IN_SECONDS * 7 );
		$this->assertEquals( false, $active_for );
	}

	/**
	 * @dataProvider range_provider
	 * Test wc_admin_active_in_date_range 1 week if 1 day old
	 *
	 * @param number  $store_age age in seconds of store.
	 * @param string  $range expected store range.
	 * @param boolean $expected expected boolean value.
	 */
	public function test_is_wc_admin_active_in_date_range( $store_age, $range, $expected ) {
		// 1 day.
		update_option( WCAdminHelper::WC_ADMIN_TIMESTAMP_OPTION, time() - $store_age );

		$active_for = WCAdminHelper::is_wc_admin_active_in_date_range( $range );
		$this->assertEquals( $expected, $active_for );
	}

	/**
	 * @return array[]
	 */
	public function range_provider() {
		return array(
			'1 day old store within week?'             => array( DAY_IN_SECONDS, 'week-1', true ),
			'10 day old store not within week?'        => array( 10 * DAY_IN_SECONDS, 'week-1', false ),
			'10 day old store within 1-4 weeks?'       => array( 10 * DAY_IN_SECONDS, 'week-2-4', true ),
			'1 day old store not within 1-4 weeks?'    => array( DAY_IN_SECONDS, 'week-2-4', false ),
			'2 month old store within 1-3 months?'     => array( 2 * MONTH_IN_SECONDS, 'month-1-3', true ),
			'5 month old store not within 1-3 months?' => array( 5 * MONTH_IN_SECONDS, 'month-1-3', false ),
			'5 month old store within 3-6 months?'     => array( 5 * MONTH_IN_SECONDS, 'month-3-6', true ),
			'7 month old store not within 3-6 months?' => array( 7 * MONTH_IN_SECONDS, 'month-3-6', false ),
			'9 month old store within 6+ months?'      => array( 9 * MONTH_IN_SECONDS, 'month-6+', true ),
			'2 month old store not within 6+ months?'  => array( 2 * MONTH_IN_SECONDS, 'month-6+', false ),
		);
	}
}