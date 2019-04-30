<?php
/**
 * Register the scripts, styles, and includes needed for pieces of the WooCommerce Admin experience.
 * NOTE: DO NOT edit this file in WooCommerce core, this is generated from woocommerce-admin.
 *
 * @package Woocommerce Admin
 */

if ( ! function_exists( 'wc_admin_register_page' ) ) {
	/**
	 * Add a single page to a given parent top-level-item.
	 *
	 * @param array $options {
	 *     Array describing the menu item.
	 *
	 *     @type string $title Menu title
	 *     @type string $parent Parent path or menu ID
	 *     @type string $path Path for this page, full path in app context; ex /analytics/report
	 * }
	 */
	function wc_admin_register_page( $options ) {
		$defaults = array(
			'parent' => '/analytics',
		);
		$options  = wp_parse_args( $options, $defaults );
		add_submenu_page(
			'/' === $options['parent'][0] ? "wc-admin#{$options['parent']}" : $options['parent'],
			$options['title'],
			$options['title'],
			'manage_options',
			"wc-admin#{$options['path']}",
			array( 'WC_Admin_Loader', 'page_wrapper' )
		);
	}
}

/**
 * WC_Admin_Loader Class.
 */
class WC_Admin_Loader {

	/**
	 * Class instance.
	 *
	 * @var WC_Admin_Loader instance
	 */
	protected static $instance = null;

	/**
	 * An array of classes to load from the includes folder.
	 *
	 * @var array
	 */
	protected static $classes = array();

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
	 * Constructor.
	 * Hooks added here should be removed in `wc_admin_initialize` via the feature plugin.
	 */
	public function __construct() {
		add_action( 'init', array( 'WC_Admin_Loader', 'load_features' ) );
		add_action( 'admin_enqueue_scripts', array( 'WC_Admin_Loader', 'register_scripts' ) );
		add_action( 'admin_enqueue_scripts', array( 'WC_Admin_Loader', 'load_scripts' ), 15 );
		add_action( 'woocommerce_components_settings', array( 'WC_Admin_Loader', 'add_component_settings' ) );
		add_filter( 'admin_body_class', array( 'WC_Admin_Loader', 'add_admin_body_classes' ) );
		add_action( 'admin_menu', array( 'WC_Admin_Loader', 'register_page_handler' ) );
		add_filter( 'admin_title', array( 'WC_Admin_Loader', 'update_admin_title' ) );
		add_action( 'rest_api_init', array( 'WC_Admin_Loader', 'register_user_data' ) );
		add_action( 'in_admin_header', array( 'WC_Admin_Loader', 'embed_page_header' ) );
		add_filter( 'woocommerce_settings_groups', array( 'WC_Admin_Loader', 'add_settings_group' ) );
		add_filter( 'woocommerce_settings-wc_admin', array( 'WC_Admin_Loader', 'add_settings' ) );
		add_action( 'admin_head', array( 'WC_Admin_Loader', 'remove_notices' ) );
		add_action( 'admin_notices', array( 'WC_Admin_Loader', 'inject_before_notices' ) );
		add_action( 'admin_notices', array( 'WC_Admin_Loader', 'inject_after_notices' ), PHP_INT_MAX );

		// priority is 20 to run after https://github.com/woocommerce/woocommerce/blob/a55ae325306fc2179149ba9b97e66f32f84fdd9c/includes/admin/class-wc-admin-menus.php#L165.
		add_action( 'admin_head', array( 'WC_Admin_Loader', 'update_link_structure' ), 20 );
	}

	/**
	 * Gets an array of enabled WooCommerce Admin features/sections.
	 *
	 * @return bool Enabled Woocommerce Admin features/sections.
	 */
	public static function get_features() {
		return apply_filters( 'woocommerce_admin_features', array() );
	}

	/**
	 * Returns if a specific wc-admin feature is enabled.
	 *
	 * @param  string $feature Feature slug.
	 * @return bool Returns true if the feature is enabled.
	 */
	public static function is_feature_enabled( $feature ) {
		$features = self::get_features();
		return in_array( $feature, $features );
	}

	/**
	 * Gets the URL to an asset file.
	 *
	 * @param  string $file name.
	 * @return string URL to asset.
	 */
	public static function get_url( $file ) {
		return plugins_url( self::get_path( $file ) . $file, WC_ADMIN_PLUGIN_FILE );
	}

	/**
	 * Gets the file modified time as a cache buster if we're in dev mode, or the plugin version otherwise.
	 *
	 * @param string $file Local path to the file.
	 * @return string The cache buster value to use for the given file.
	 */
	public static function get_file_version( $file ) {
		if ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) {
			$file = trim( $file, '/' );
			return filemtime( WC_ADMIN_ABSPATH . self::get_path( $file ) );
		}
		return WC_ADMIN_VERSION_NUMBER;
	}

	/**
	 * Gets the path for the asset depending on file type.
	 *
	 * @param  string $file name.
	 * @return string Folder path of asset.
	 */
	private static function get_path( $file ) {
		return '.css' === substr( $file, -4 ) ? WC_ADMIN_DIST_CSS_FOLDER : WC_ADMIN_DIST_JS_FOLDER;
	}

	/**
	 * Class loader for enabled WooCommerce Admin features/sections.
	 */
	public static function load_features() {
		$features = self::get_features();
		foreach ( $features as $feature ) {
			$feature = strtolower( $feature );
			$file    = WC_ADMIN_FEATURES_PATH . $feature . '/class-wc-admin-' . $feature . '.php';
			if ( file_exists( $file ) ) {
				require_once $file;
				$feature         = ucfirst( $feature );
				self::$classes[] = 'WC_Admin_' . $feature;
			}
		}
	}

	/**
	 * Registers a basic page handler for the app entry point.
	 *
	 * @todo The entry point for the embed needs moved to this class as well.
	 */
	public static function register_page_handler() {
		$page_title = null;
		$menu_title = null;

		if ( self::is_feature_enabled( 'dashboard' ) ) {
			$page_title = __( 'WooCommerce Dashboard', 'woocommerce-admin' );
			$menu_title = __( 'Dashboard', 'woocommerce-admin' );
		}

		add_submenu_page(
			'woocommerce',
			$page_title,
			$menu_title,
			'manage_options',
			'wc-admin',
			array( 'WC_Admin_Loader', 'page_wrapper' )
		);
	}

	/**
	 * Update the WooCommerce menu structure to make our main dashboard/handler the top level link for 'WooCommerce'.
	 */
	public static function update_link_structure() {
		global $submenu;
		// User does not have capabilites to see the submenu.
		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			return;
		}

		$wc_admin_key = null;
		foreach ( $submenu['woocommerce'] as $submenu_key => $submenu_item ) {
			if ( 'wc-admin' === $submenu_item[2] ) {
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
	 * Registers all the neccessary scripts and styles to show the admin experience.
	 */
	public static function register_scripts() {
		if ( ! function_exists( 'wp_set_script_translations' ) ) {
			return;
		}

		wp_register_script(
			'wc-csv',
			self::get_url( 'csv-export/index.js' ),
			array(),
			self::get_file_version( 'csv-export/index.js' ),
			true
		);

		wp_register_script(
			'wc-currency',
			self::get_url( 'currency/index.js' ),
			array( 'wc-number' ),
			self::get_file_version( 'currency/index.js' ),
			true
		);

		wp_set_script_translations( 'wc-currency', 'woocommerce-admin' );

		wp_register_script(
			'wc-navigation',
			self::get_url( 'navigation/index.js' ),
			array(),
			self::get_file_version( 'navigation/index.js' ),
			true
		);

		wp_register_script(
			'wc-number',
			self::get_url( 'number/index.js' ),
			array(),
			self::get_file_version( 'number/index.js' ),
			true
		);

		wp_register_script(
			'wc-date',
			self::get_url( 'date/index.js' ),
			array( 'wp-date', 'wp-i18n' ),
			self::get_file_version( 'date/index.js' ),
			true
		);

		wp_set_script_translations( 'wc-date', 'woocommerce-admin' );

		wp_register_script(
			'wc-components',
			self::get_url( 'components/index.js' ),
			array(
				'wp-components',
				'wp-data',
				'wp-element',
				'wp-hooks',
				'wp-i18n',
				'wp-keycodes',
				'wc-csv',
				'wc-currency',
				'wc-date',
				'wc-navigation',
				'wc-number',
			),
			self::get_file_version( 'components/index.js' ),
			true
		);

		wp_set_script_translations( 'wc-components', 'woocommerce-admin' );

		wp_register_style(
			'wc-components',
			self::get_url( 'components/style.css' ),
			array( 'wp-edit-blocks' ),
			self::get_file_version( 'components/style.css' )
		);
		wp_style_add_data( 'wc-components', 'rtl', 'replace' );

		wp_register_style(
			'wc-components-ie',
			self::get_url( 'components/ie.css' ),
			array( 'wp-edit-blocks' ),
			self::get_file_version( 'components/ie.css' )
		);
		wp_style_add_data( 'wc-components-ie', 'rtl', 'replace' );

		$entry = 'app';
		if ( self::is_embed_page() ) {
			$entry = 'embedded';
		}

		wp_register_script(
			WC_ADMIN_APP,
			self::get_url( "{$entry}/index.js" ),
			array( 'wc-components', 'wc-navigation', 'wp-date', 'wp-html-entities', 'wp-keycodes', 'wp-i18n' ),
			self::get_file_version( "{$entry}/index.js" ),
			true
		);

		wp_set_script_translations( WC_ADMIN_APP, 'woocommerce-admin' );

		wp_register_style(
			WC_ADMIN_APP,
			self::get_url( "{$entry}/style.css" ),
			array( 'wc-components' ),
			self::get_file_version( "{$entry}/style.css" )
		);
		wp_style_add_data( WC_ADMIN_APP, 'rtl', 'replace' );
	}

	/**
	 * Loads the required scripts on the correct pages.
	 */
	public static function load_scripts() {
		if ( ! self::is_admin_page() && ! self::is_embed_page() ) {
			return;
		}

		wp_enqueue_script( WC_ADMIN_APP );
		wp_enqueue_style( WC_ADMIN_APP );

		// Use server-side detection to prevent unneccessary stylesheet loading in other browsers.
		$user_agent = isset( $_SERVER['HTTP_USER_AGENT'] ) ? $_SERVER['HTTP_USER_AGENT'] : ''; // WPCS: sanitization ok.
		preg_match( '/MSIE (.*?);/', $user_agent, $matches );
		if ( count( $matches ) < 2 ) {
			preg_match( '/Trident\/\d{1,2}.\d{1,2}; rv:([0-9]*)/', $user_agent, $matches );
		}
		if ( count( $matches ) > 1 ) {
			wp_enqueue_style( 'wc-components-ie' );
		}

	}

	/**
	 * Returns true if we are on a JS powered admin page.
	 */
	public static function is_admin_page() {
		global $hook_suffix;
		if ( in_array( $hook_suffix, array( 'woocommerce_page_wc-admin' ) ) ) {
			return true;
		}
		return false;
	}

	/**
	 *  Returns true if we are on a "classic" (non JS app) powered admin page.
	 *
	 * @todo See usage in `admin.php`. This needs refactored and implemented properly in core.
	 */
	public static function is_embed_page() {
		$is_embed  = false;
		$screen_id = self::get_current_screen_id();
		if ( ! $screen_id ) {
			return false;
		}

		$screens = self::get_embed_enabled_screen_ids();

		if ( in_array( $screen_id, $screens, true ) ) {
			$is_embed = true;
		}

		return apply_filters( 'woocommerce_page_is_embed_page', $is_embed );
	}

	/**
	 * Returns the current screen ID.
	 * This is slightly different from WP's get_current_screen, in that it attaches an action,
	 * so certain pages like 'add new' pages can have different breadcrumbs or handling.
	 * It also catches some more unique dynamic pages like taxonomy/attribute management.
	 *
	 * Format: {$current_screen->action}-{$current_screen->action}, or just {$current_screen->action} if no action is found
	 *
	 * @todo Refactor: https://github.com/woocommerce/woocommerce-admin/issues/1432.
	 * @return string Current screen ID.
	 */
	public static function get_current_screen_id() {
		$current_screen = get_current_screen();
		if ( ! $current_screen ) {
			return false;
		}
		$current_screen_id = $current_screen->action ? $current_screen->action . '-' . $current_screen->id : $current_screen->id;

		if ( ! empty( $_GET['taxonomy'] ) && ! empty( $_GET['post_type'] ) && 'product' === $_GET['post_type'] ) {
			$current_screen_id = 'product_page_product_attributes';
		}

		return $current_screen_id;
	}

	/**
	 * `WC_Admin_Loader::get_embed_enabled_screen_ids`,  `WC_Admin_Loader::get_embed_enabled_plugin_screen_ids`,
	 * `WC_Admin_Loader::get_embed_enabled_screen_ids` should be considered temporary functions for the feature plugin.
	 *  This is separate from WC's screen_id functions so that extensions explictly have to opt-in to the feature plugin.
	 *
	 * @todo Refactor: https://github.com/woocommerce/woocommerce-admin/issues/1432.
	 */
	public static function get_embed_enabled_core_screen_ids() {
		$screens = array(
			'edit-shop_order',
			'shop_order',
			'add-shop_order',
			'edit-shop_coupon',
			'shop_coupon',
			'add-shop_coupon',
			'woocommerce_page_wc-reports',
			'woocommerce_page_wc-settings',
			'woocommerce_page_wc-status',
			'woocommerce_page_wc-addons',
			'edit-product',
			'product_page_product_importer',
			'product_page_product_exporter',
			'add-product',
			'product',
			'edit-product_cat',
			'edit-product_tag',
			'product_page_product_attributes',
		);
		return apply_filters( 'wc_admin_get_embed_enabled_core_screens_ids', $screens );
	}

	/**
	 * If any extensions want to show the new header, they can register their screen ids.
	 * Separate so extensions can register support for the feature plugin separately.
	 *
	 * @todo Refactor: https://github.com/woocommerce/woocommerce-admin/issues/1432.
	 */
	public static function get_embed_enabled_plugin_screen_ids() {
		$screens = array();
		return apply_filters( 'wc_admin_get_embed_enabled_plugin_screens_ids', $screens );
	}

	/**
	 * Returns core and plugin screen IDs for a list of screens the new header should be enabled on.
	 */
	public static function get_embed_enabled_screen_ids() {
		return array_merge( self::get_embed_enabled_core_screen_ids(), self::get_embed_enabled_plugin_screen_ids() );
	}

	/**
	 * Returns breadcrumbs for the current page.
	 *
	 * @todo Refactor: https://github.com/woocommerce/woocommerce-admin/issues/1432.
	 */
	private static function get_embed_breadcrumbs() {
		$current_screen_id = self::get_current_screen_id();

		// If a page has a tab, we can append that to the screen ID and show another pagination level.
		$pages_with_tabs = array(
			'wc-reports'  => 'orders',
			'wc-settings' => 'general',
			'wc-status'   => 'status',
		);
		$tab             = '';
		$get_tab         = isset( $_GET['tab'] ) ? sanitize_text_field( wp_unslash( $_GET['tab'] ) ) : '';
		if ( isset( $_GET['page'] ) ) {
			$page = sanitize_text_field( wp_unslash( $_GET['page'] ) );
			if ( in_array( $page, array_keys( $pages_with_tabs ) ) ) {
				$tab = ! empty( $get_tab ) ? $get_tab . '-' : $pages_with_tabs[ $page ] . '-';
			}
		}

		$breadcrumbs = apply_filters(
			'wc_admin_get_breadcrumbs',
			array(
				'edit-shop_order'                       => __( 'Orders', 'woocommerce-admin' ),
				'add-shop_order'                        => array(
					array( '/edit.php?post_type=shop_order', __( 'Orders', 'woocommerce-admin' ) ),
					__( 'Add New', 'woocommerce-admin' ),
				),
				'shop_order'                            => array(
					array( '/edit.php?post_type=shop_order', __( 'Orders', 'woocommerce-admin' ) ),
					__( 'Edit Order', 'woocommerce-admin' ),
				),
				'edit-shop_coupon'                      => __( 'Coupons', 'woocommerce-admin' ),
				'add-shop_coupon'                       => array(
					array( 'edit.php?post_type=shop_coupon', __( 'Coupons', 'woocommerce-admin' ) ),
					__( 'Add New', 'woocommerce-admin' ),
				),
				'shop_coupon'                           => array(
					array( 'edit.php?post_type=shop_coupon', __( 'Coupons', 'woocommerce-admin' ) ),
					__( 'Edit Coupon', 'woocommerce-admin' ),
				),
				'woocommerce_page_wc-reports'           => array(
					array( 'admin.php?page=wc-reports', __( 'Reports', 'woocommerce-admin' ) ),
				),
				'orders-woocommerce_page_wc-reports'    => array(
					array( 'admin.php?page=wc-reports', __( 'Reports', 'woocommerce-admin' ) ),
					__( 'Orders', 'woocommerce-admin' ),
				),
				'customers-woocommerce_page_wc-reports' => array(
					array( 'admin.php?page=wc-reports', __( 'Reports', 'woocommerce-admin' ) ),
					__( 'Customers', 'woocommerce-admin' ),
				),
				'stock-woocommerce_page_wc-reports'     => array(
					array( 'admin.php?page=wc-reports', __( 'Reports', 'woocommerce-admin' ) ),
					__( 'Stock', 'woocommerce-admin' ),
				),
				'taxes-woocommerce_page_wc-reports'     => array(
					array( 'admin.php?page=wc-reports', __( 'Reports', 'woocommerce-admin' ) ),
					__( 'Taxes', 'woocommerce-admin' ),
				),
				'woocommerce_page_wc-settings'          => array(
					array( 'admin.php?page=wc-settings', __( 'Settings', 'woocommerce-admin' ) ),
				),
				'general-woocommerce_page_wc-settings'  => array(
					array( 'admin.php?page=wc-settings', __( 'Settings', 'woocommerce-admin' ) ),
					__( 'General', 'woocommerce-admin' ),
				),
				'products-woocommerce_page_wc-settings' => array(
					array( 'admin.php?page=wc-settings', __( 'Settings', 'woocommerce-admin' ) ),
					__( 'Products', 'woocommerce-admin' ),
				),
				'tax-woocommerce_page_wc-settings'      => array(
					array( 'admin.php?page=wc-settings', __( 'Settings', 'woocommerce-admin' ) ),
					__( 'Tax', 'woocommerce-admin' ),
				),
				'shipping-woocommerce_page_wc-settings' => array(
					array( 'admin.php?page=wc-settings', __( 'Settings', 'woocommerce-admin' ) ),
					__( 'Shipping', 'woocommerce-admin' ),
				),
				'checkout-woocommerce_page_wc-settings' => array(
					array( 'admin.php?page=wc-settings', __( 'Settings', 'woocommerce-admin' ) ),
					__( 'Payments', 'woocommerce-admin' ),
				),
				'email-woocommerce_page_wc-settings'    => array(
					array( 'admin.php?page=wc-settings', __( 'Settings', 'woocommerce-admin' ) ),
					__( 'Emails', 'woocommerce-admin' ),
				),
				'advanced-woocommerce_page_wc-settings' => array(
					array( 'admin.php?page=wc-settings', __( 'Settings', 'woocommerce-admin' ) ),
					__( 'Advanced', 'woocommerce-admin' ),
				),
				'woocommerce_page_wc-status'            => array(
					__( 'Status', 'woocommerce-admin' ),
				),
				'status-woocommerce_page_wc-status'     => array(
					array( 'admin.php?page=wc-status', __( 'Status', 'woocommerce-admin' ) ),
					__( 'System Status', 'woocommerce-admin' ),
				),
				'tools-woocommerce_page_wc-status'      => array(
					array( 'admin.php?page=wc-status', __( 'Status', 'woocommerce-admin' ) ),
					__( 'Tools', 'woocommerce-admin' ),
				),
				'logs-woocommerce_page_wc-status'       => array(
					array( 'admin.php?page=wc-status', __( 'Status', 'woocommerce-admin' ) ),
					__( 'Logs', 'woocommerce-admin' ),
				),
				'connect-woocommerce_page_wc-status'    => array(
					array( 'admin.php?page=wc-status', __( 'Status', 'woocommerce-admin' ) ),
					__( 'WooCommerce Services Status', 'woocommerce-admin' ),
				),
				'woocommerce_page_wc-addons'            => __( 'Extensions', 'woocommerce-admin' ),
				'edit-product'                          => __( 'Products', 'woocommerce-admin' ),
				'product_page_product_importer'         => array(
					array( 'edit.php?post_type=product', __( 'Products', 'woocommerce-admin' ) ),
					__( 'Import', 'woocommerce-admin' ),
				),
				'product_page_product_exporter'         => array(
					array( 'edit.php?post_type=product', __( 'Products', 'woocommerce-admin' ) ),
					__( 'Export', 'woocommerce-admin' ),
				),
				'add-product'                           => array(
					array( 'edit.php?post_type=product', __( 'Products', 'woocommerce-admin' ) ),
					__( 'Add New', 'woocommerce-admin' ),
				),
				'product'                               => array(
					array( 'edit.php?post_type=product', __( 'Products', 'woocommerce-admin' ) ),
					__( 'Edit Product', 'woocommerce-admin' ),
				),
				'edit-product_cat'                      => array(
					array( 'edit.php?post_type=product', __( 'Products', 'woocommerce-admin' ) ),
					__( 'Categories', 'woocommerce-admin' ),
				),
				'edit-product_tag'                      => array(
					array( 'edit.php?post_type=product', __( 'Products', 'woocommerce-admin' ) ),
					__( 'Tags', 'woocommerce-admin' ),
				),
				'product_page_product_attributes'       => array(
					array( 'edit.php?post_type=product', __( 'Products', 'woocommerce-admin' ) ),
					__( 'Attributes', 'woocommerce-admin' ),
				),
			)
		);

		if ( ! empty( $breadcrumbs[ $tab . $current_screen_id ] ) ) {
			return $breadcrumbs[ $tab . $current_screen_id ];
		} elseif ( ! empty( $breadcrumbs[ $current_screen_id ] ) ) {
			return $breadcrumbs[ $current_screen_id ];
		} else {
			return '';
		}
	}

	/**
	 * Outputs breadcrumbs via PHP for the initial load of an embedded page.
	 *
	 * @param array $section Section to create breadcrumb from.
	 */
	private static function output_breadcrumbs( $section ) {
		?>
		<span>
		<?php if ( is_array( $section ) ) : ?>
			<a href="<?php echo esc_url( admin_url( $section[0] ) ); ?>">
				<?php echo esc_html( $section[1] ); ?>
			</a>
		<?php else : ?>
			<?php echo esc_html( $section ); ?>
		<?php endif; ?>
		</span>
		<?php
	}

	/**
	 * Set up a div for the header embed to render into.
	 * The initial contents here are meant as a place loader for when the PHP page initialy loads.
	 */
	public static function embed_page_header() {
		if ( ! self::is_embed_page() ) {
			return;
		}

		$sections = self::get_embed_breadcrumbs();
		$sections = is_array( $sections ) ? $sections : array( $sections );
		?>
		<div id="woocommerce-embedded-root">
			<div class="woocommerce-layout">
				<div class="woocommerce-layout__header is-embed-loading">
					<h1 class="woocommerce-layout__header-breadcrumbs">
						<span><a href="<?php echo esc_url( admin_url( 'admin.php?page=wc-admin#/' ) ); ?>">WooCommerce</a></span>
						<?php foreach ( $sections as $section ) : ?>
							<?php self::output_breadcrumbs( $section ); ?>
						<?php endforeach; ?>
					</h1>
				</div>
			</div>
			<div class="woocommerce-layout__primary is-embed-loading" id="woocommerce-layout__primary">
				<div id="woocommerce-layout__notice-list" class="woocommerce-layout__notice-list"></div>
			</div>
		</div>
		<?php
	}

	/**
	 * Adds body classes to the main wp-admin wrapper, allowing us to better target elements in specific scenarios.
	 *
	 * @param string $admin_body_class Body class to add.
	 */
	public static function add_admin_body_classes( $admin_body_class = '' ) {
		global $hook_suffix;

		if ( ! self::is_admin_page() && ! self::is_embed_page() ) {
			return $admin_body_class;
		}

		$classes   = explode( ' ', trim( $admin_body_class ) );
		$classes[] = 'woocommerce-page';
		if ( self::is_embed_page() ) {
			$classes[] = 'woocommerce-embed-page';
		}

		$features = self::get_features();
		foreach ( $features as $feature_key ) {
			$classes[] = sanitize_html_class( 'woocommerce-feature-enabled-' . $feature_key );
		}

		$admin_body_class = implode( ' ', array_unique( $classes ) );
		return " $admin_body_class ";
	}


	/**
	 * Removes notices that should not be displayed on WC Admin pages.
	 */
	public static function remove_notices() {
		if ( ! self::is_admin_page() && ! self::is_embed_page() ) {
			return;
		}

		// Hello Dolly.
		if ( function_exists( 'hello_dolly' ) ) {
			remove_action( 'admin_notices', 'hello_dolly' );
		}
	}

	/**
	 * Runs before admin notices action and hides them.
	 */
	public static function inject_before_notices() {
		if ( ( ! self::is_admin_page() && ! self::is_embed_page() ) ) {
			return;
		}
		echo '<div class="woocommerce-layout__notice-list-hide" id="wp__notice-list">';
		echo '<div class="wp-header-end" id="woocommerce-layout__notice-catcher"></div>'; // https://github.com/WordPress/WordPress/blob/f6a37e7d39e2534d05b9e542045174498edfe536/wp-admin/js/common.js#L737.
	}

	/**
	 * Runs after admin notices and closes div.
	 */
	public static function inject_after_notices() {
		if ( ( ! self::is_admin_page() && ! self::is_embed_page() ) ) {
			return;
		}
		echo '</div>';
	}

	/**
	 * Edits Admin title based on section of wc-admin.
	 *
	 * @param string $admin_title Modifies admin title.
	 * @todo Can we do some URL rewriting so we can figure out which page they are on server side?
	 */
	public static function update_admin_title( $admin_title ) {
		if ( ! self::is_admin_page() && ! self::is_embed_page() ) {
			return $admin_title;
		}

		if ( self::is_embed_page() ) {
			$sections = self::get_embed_breadcrumbs();
			$sections = is_array( $sections ) ? $sections : array( $sections );
			$pieces   = array();

			foreach ( $sections as $section ) {
				$pieces[] = is_array( $section ) ? $section[1] : $section;
			}

			$pieces = array_reverse( $pieces );
			$title  = implode( ' &lsaquo; ', $pieces );
		} else {
			$title = __( 'Dashboard', 'woocommerce-admin' );
		}
		/* translators: %1$s: updated title, %2$s: blog info name */
		return sprintf( __( '%1$s &lsaquo; %2$s &#8212; WooCommerce', 'woocommerce-admin' ), $title, get_bloginfo( 'name' ) );
	}

	/**
	 * Set up a div for the app to render into.
	 */
	public static function page_wrapper() {
		?>
		<div class="wrap">
			<div id="root"></div>
		</div>
		<?php
	}

	/**
	 * Hooks extra neccessary data into the component settings array already set in WooCommerce core.
	 *
	 * @param array $settings Array of component settings.
	 * @return array Array of component settings.
	 */
	public static function add_component_settings( $settings ) {
		$preload_data_endpoints = apply_filters( 'woocommerce_component_settings_preload_endpoints', array( '/wc/v3' ) );
		if ( ! empty( $preload_data_endpoints ) ) {
			$preload_data = array_reduce(
				array_values( $preload_data_endpoints ),
				'rest_preload_api_request'
			);
		}

		$current_user_data = array();
		foreach ( self::get_user_data_fields() as $user_field ) {
			$current_user_data[ $user_field ] = json_decode( get_user_meta( get_current_user_id(), 'wc_admin_' . $user_field, true ) );
		}

		$settings['orderStatuses']     = self::get_order_statuses( wc_get_order_statuses() );
		$settings['currentUserData']   = $current_user_data;
		$settings['currency']          = self::get_currency_settings();
		$settings['reviewsEnabled']    = get_option( 'woocommerce_enable_reviews' );
		$settings['manageStock']       = get_option( 'woocommerce_manage_stock' );
		$settings['commentModeration'] = get_option( 'comment_moderation' );
		// @todo On merge, once plugin images are added to core WooCommerce, `wcAdminAssetUrl` can be retired,
		// and `wcAssetUrl` can be used in its place throughout the codebase.
		$settings['wcAdminAssetUrl'] = plugins_url( 'images/', plugin_dir_path( dirname( __FILE__ ) ) . 'woocommerce-admin.php' );

		if ( ! empty( $preload_data_endpoints ) ) {
			foreach ( $preload_data_endpoints as $key => $endpoint ) {
				$settings['dataEndpoints'][ $key ] = $preload_data[ $endpoint ]['body'];
			}
		}
		$settings = self::get_custom_settings( $settings );

		if ( self::is_embed_page() ) {
			$settings['embedBreadcrumbs'] = self::get_embed_breadcrumbs();
		}

		return $settings;
	}

	/**
	 * Format order statuses by removing a leading 'wc-' if present.
	 *
	 * @param array $statuses Order statuses.
	 * @return array formatted statuses.
	 */
	public static function get_order_statuses( $statuses ) {
		$formatted_statuses = array();
		foreach ( $statuses as $key => $value ) {
			$formatted_key                        = preg_replace( '/^wc-/', '', $key );
			$formatted_statuses[ $formatted_key ] = $value;
		}
		return $formatted_statuses;
	}

	/**
	 * Register the admin settings for use in the WC REST API
	 *
	 * @param array $groups Array of setting groups.
	 * @return array
	 */
	public static function add_settings_group( $groups ) {
		$groups[] = array(
			'id'          => 'wc_admin',
			'label'       => __( 'WooCommerce Admin', 'woocommerce-admin' ),
			'description' => __( 'Settings for WooCommerce admin reporting.', 'woocommerce-admin' ),
		);
		return $groups;
	}

	/**
	 * Add WC Admin specific settings
	 *
	 * @param array $settings Array of settings in wc admin group.
	 * @return array
	 */
	public static function add_settings( $settings ) {
		$statuses   = self::get_order_statuses( wc_get_order_statuses() );
		$settings[] = array(
			'id'          => 'woocommerce_excluded_report_order_statuses',
			'option_key'  => 'woocommerce_excluded_report_order_statuses',
			'label'       => __( 'Excluded report order statuses', 'woocommerce-admin' ),
			'description' => __( 'Statuses that should not be included when calculating report totals.', 'woocommerce-admin' ),
			'default'     => array( 'pending', 'cancelled', 'failed' ),
			'type'        => 'multiselect',
			'options'     => $statuses,
		);
		$settings[] = array(
			'id'          => 'woocommerce_actionable_order_statuses',
			'option_key'  => 'woocommerce_actionable_order_statuses',
			'label'       => __( 'Actionable order statuses', 'woocommerce-admin' ),
			'description' => __( 'Statuses that require extra action on behalf of the store admin.', 'woocommerce-admin' ),
			'default'     => array( 'processing', 'on-hold' ),
			'type'        => 'multiselect',
			'options'     => $statuses,
		);
		return $settings;
	}

	/**
	 * Gets custom settings used for WC Admin.
	 *
	 * @param array $settings Array of settings to merge into.
	 * @return array
	 */
	public static function get_custom_settings( $settings ) {
		$wc_rest_settings_options_controller = new WC_REST_Setting_Options_Controller();
		$wc_admin_group_settings             = $wc_rest_settings_options_controller->get_group_settings( 'wc_admin' );
		$settings['wcAdminSettings']         = array();

		foreach ( $wc_admin_group_settings as $setting ) {
			if ( ! empty( $setting['id'] ) && ! empty( $setting['value'] ) ) {
				$settings['wcAdminSettings'][ $setting['id'] ] = $setting['value'];
			}
		}
		return $settings;
	}

	/**
	 * Return an object defining the currecy options for the site's current currency
	 *
	 * @return  array  Settings for the current currency {
	 *     Array of settings.
	 *
	 *     @type string $code       Currency code.
	 *     @type string $precision  Number of decimals.
	 *     @type string $symbol     Symbol for currency.
	 * }
	 */
	public static function get_currency_settings() {
		$code = get_woocommerce_currency();

		return apply_filters(
			'wc_currency_settings',
			array(
				'code'               => $code,
				'precision'          => wc_get_price_decimals(),
				'symbol'             => html_entity_decode( get_woocommerce_currency_symbol( $code ) ),
				'position'           => get_option( 'woocommerce_currency_pos' ),
				'decimal_separator'  => wc_get_price_decimal_separator(),
				'thousand_separator' => wc_get_price_thousand_separator(),
				'price_format'       => html_entity_decode( get_woocommerce_price_format() ),
			)
		);
	}

	/**
	 * Registers WooCommerce specific user data to the WordPress user API.
	 */
	public static function register_user_data() {
		register_rest_field(
			'user',
			'woocommerce_meta',
			array(
				'get_callback'    => array( 'WC_Admin_Loader', 'get_user_data_values' ),
				'update_callback' => array( 'WC_Admin_Loader', 'update_user_data_values' ),
				'schema'          => null,
			)
		);
	}

	/**
	 * For all the registered user data fields (  WC_Admin_Loader::get_user_data_fields ), fetch the data
	 * for returning via the REST API.
	 *
	 * @param WP_User $user Current user.
	 */
	public static function get_user_data_values( $user ) {
		$values = array();
		foreach ( self::get_user_data_fields() as $field ) {
			$values[ $field ] = get_user_meta( $user['id'], 'wc_admin_' . $field, true );
		}
		return $values;
	}

	/**
	 * For all the registered user data fields ( WC_Admin_Loader::get_user_data_fields ), update the data
	 * for the REST API.
	 *
	 * @param array   $values   The new values for the meta.
	 * @param WP_User $user     The current user.
	 * @param string  $field_id The field id for the user meta.
	 */
	public static function update_user_data_values( $values, $user, $field_id ) {
		if ( empty( $values ) || ! is_array( $values ) || 'woocommerce_meta' !== $field_id ) {
			return;
		}
		$fields  = self::get_user_data_fields();
		$updates = array();
		foreach ( $values as $field => $value ) {
			if ( in_array( $field, $fields, true ) ) {
				$updates[ $field ] = $value;
				update_user_meta( $user->ID, 'wc_admin_' . $field, $value );
			}
		}
		return $updates;
	}

	/**
	 * We store some WooCommerce specific user meta attached to users endpoint,
	 * so that we can track certain preferences or values such as the inbox activity panel last open time.
	 * Additional fields can be added in the function below, and then used via wc-admin's currentUser data.
	 *
	 * @return array Fields to expose over the WP user endpoint.
	 */
	public static function get_user_data_fields() {
		return apply_filters( 'wc_admin_get_user_data_fields', array() );
	}
}

new WC_Admin_Loader();
