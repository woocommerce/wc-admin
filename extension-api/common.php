<?php
/**
 * Provides a wrapper around the WordPress hook system so we can register new hooks to be outputted.
 * 
 * TODO Handle priorities correctly.
 * TODO Track in a way these can also be unregistered via PHP.
 * 
 * function dashboard_pending_orders() {
 *		return array(
 *			'count'           => '5',
 *			'singular_string' => 'pending order',
 *			'plural_string'   => 'pending orders',
 *		);
 *	}
 * add_woocommerce_hook( 'dashboard_total_widgets', 'dashboard_pending_orders' );
 **/
class WooCommerce_Hooks {

	protected static $instance = null;
	protected $registered = array();

	/**
	 * Adds a hook to the registered list of WooCommerce hooks.
	 */
	function add_hook( $hook_name, $callback, $priority = 10 ) {
		$hook_name = 'woocommerce_extension_hook_' . $hook_name;
		if ( empty( $this->registered[ $hook_name ] ) ) {
			add_filter( $hook_name, array( $this, 'callback' ), $priority );
			$this->registered[ $hook_name ] = array();
		}

		$this->registered[ $hook_name ][] = $callback;
	}

	/**
	 * Takes all of the registered callbacks and returns them on `add_filter`.
	 */
	function callback( $hooks ) {
		$hook_name = current_filter();

		foreach ( $this->registered[ $hook_name ] as $callback ) {
			$hooks[] = $callback();
		}

		return $hooks;
	}
	
	/**
	 * Class instance.
	 */
	public static function instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}

		return self::$instance;
	}
}

WooCommerce_Hooks::instance();

/**
 * Helper function that matches a pattern WordPress developers are familair with.
 */
function add_woocommerce_hook( $hook_name, $callback, $priority = 10 ) {
	$woocommerce_hooks = WooCommerce_Hooks::instance();
	$woocommerce_hooks->add_hook( $hook_name, $callback, $priority );
}
