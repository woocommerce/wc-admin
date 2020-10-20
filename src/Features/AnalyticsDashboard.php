<?php
/**
 * WooCommerce Analytics Dashboard.
 * NOTE: DO NOT edit this file in WooCommerce core, this is generated from woocommerce-admin.
 */

namespace Automattic\WooCommerce\Admin\Features;

use Automattic\WooCommerce\Admin\Loader;

/**
 * Contains backend logic for the dashboard feature.
 */
class AnalyticsDashboard {
	/**
	 * Menu slug.
	 */
	const MENU_SLUG = 'wc-admin';

	/**
	 * Class instance.
	 *
	 * @var AnalyticsDashboard instance
	 */
	protected static $instance = null;

	/**
	 * Get class instance.
	 */
	public static function get_instance() {
		if ( ! self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Hook into WooCommerce.
	 */
	public function __construct() {
		add_filter( 'woocommerce_component_settings_preload_endpoints', array( $this, 'add_preload_endpoints' ) );
		add_filter( 'woocommerce_admin_get_user_data_fields', array( $this, 'add_user_data_fields' ) );
		add_action( 'admin_menu', array( $this, 'register_page' ) );
		// priority is 20 to run after https://github.com/woocommerce/woocommerce/blob/a55ae325306fc2179149ba9b97e66f32f84fdd9c/includes/admin/class-wc-admin-menus.php#L165.
		add_action( 'admin_head', array( $this, 'update_link_structure' ), 20 );
		add_filter( 'woocommerce_admin_plugins_whitelist', array( $this, 'get_homescreen_allowed_plugins' ) );
	}

	/**
	 * Preload data from API endpoints.
	 *
	 * @param array $endpoints Array of preloaded endpoints.
	 * @return array
	 */
	public function add_preload_endpoints( $endpoints ) {
		$endpoints['performanceIndicators'] = '/wc-analytics/reports/performance-indicators/allowed';
		$endpoints['leaderboards']          = '/wc-analytics/leaderboards/allowed';
		return $endpoints;
	}

	/**
	 * Adds fields so that we can store performance indicators, row settings, and chart type settings for users.
	 *
	 * @param array $user_data_fields User data fields.
	 * @return array
	 */
	public function add_user_data_fields( $user_data_fields ) {
		return array_merge(
			$user_data_fields,
			array(
				'dashboard_sections',
				'dashboard_chart_type',
				'dashboard_chart_interval',
				'dashboard_leaderboard_rows',
				'homepage_stats',
			)
		);
	}

	/**
	 * Registers home page.
	 */
	public function register_page() {
		wc_admin_register_page(
			array(
				'id'           => 'woocommerce-home',
				'title'        => __( 'Home', 'woocommerce-admin' ),
				'parent'       => 'woocommerce',
				'path'         => self::MENU_SLUG,
				'is_top_level' => true,
				'order'        => 0,
			)
		);
	}

	/**
	 * Update the WooCommerce menu structure to make our main dashboard/handler
	 * the top level link for 'WooCommerce'.
	 */
	public function update_link_structure() {
		global $submenu;
		// User does not have capabilites to see the submenu.
		if ( ! current_user_can( 'manage_woocommerce' ) || empty( $submenu['woocommerce'] ) ) {
			return;
		}

		$wc_admin_key = null;
		foreach ( $submenu['woocommerce'] as $submenu_key => $submenu_item ) {
			if ( self::MENU_SLUG === $submenu_item[2] ) {
				$wc_admin_key = $submenu_key;
				break;
			}
		}

		if ( ! $wc_admin_key ) {
			return;
		}

		$menu = $submenu['woocommerce'][ $wc_admin_key ];

		// Move menu item to top of array.
		unset( $submenu['woocommerce'][ $wc_admin_key ] );
		array_unshift( $submenu['woocommerce'], $menu );
	}

	/**
	 * Gets an array of plugins that can be installed & activated via the home screen.
	 *
	 * @param array $plugins Array of plugin slugs to be allowed.
	 *
	 * @return array
	 */
	public static function get_homescreen_allowed_plugins( $plugins ) {
		$homescreen_plugins = array(
			'jetpack' => 'jetpack/jetpack.php',
		);

		return array_merge( $plugins, $homescreen_plugins );
	}
}
