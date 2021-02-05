<?php
/**
 * REST API Navigation Favorites controller
 *
 * Handles requests to the navigation favorites endpoint
 */

namespace Automattic\WooCommerce\Admin\API;

defined( 'ABSPATH' ) || exit;

use Automattic\WooCommerce\Admin\Features\Navigation\Favorites;

/**
 * REST API Favorites controller class.
 *
 * @extends WC_REST_CRUD_Controller
 */
class NavigationFavorites extends \WC_REST_Data_Controller {

	/**
	 * Endpoint namespace.
	 *
	 * @var string
	 */
	protected $namespace = 'wc-admin';

	/**
	 * Route base.
	 *
	 * @var string
	 */
	protected $rest_base = 'navigation/favorites';

	/**
	 * Register the routes
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
					'args'                => array(
						'user_id' => array(
							'required'          => false,
							'validate_callback' => function( $param, $request, $key ) {
								return is_numeric( $param );
							},
						),
					),
				),
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'add_item' ),
					'permission_callback' => array( $this, 'add_item_permissions_check' ),
					'args'                => array(
						'item_id' => array(
							'required' => true,
						),
						'user_id' => array(
							'required'          => false,
							'validate_callback' => function( $param, $request, $key ) {
								return is_numeric( $param );
							},
						),
					),
				),
				array(
					'methods'             => \WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_item' ),
					'permission_callback' => array( $this, 'delete_item_permissions_check' ),
					'args'                => array(
						'item_id' => array(
							'required' => true,
						),
						'user_id' => array(
							'required'          => false,
							'validate_callback' => function( $param, $request, $key ) {
								return is_numeric( $param );
							},
						),
					),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);

	}

	/**
	 * Get all favorites.
	 *
	 * @param WP_REST_Request $request Request data.
	 * @return WP_REST_Response
	 */
	public function get_items( $request ) {
		$user_id       = $request->get_param( 'user_id' );
		$all_favorites = Favorites::get_all( $user_id );

		return rest_ensure_response( array_map( 'stripslashes', $all_favorites ) );
	}

	/**
	 * Add a favorite.
	 *
	 * @param WP_REST_Request $request Request data.
	 * @return WP_REST_Response
	 */
	public function add_item( $request ) {
		$fav_id  = $request->get_param( 'item_id' );
		$user_id = $request->get_param( 'user_id' );

		try {
			$altered_favorites = Favorites::add_item( $fav_id, $user_id );
		} catch ( \Exception $e ) {
			$error_msg = $e->getMessage();

			if ( 'invalid_input' === $error_msg ) {
				return new \WP_Error(
					'woocommerce_favorites_invalid_request',
					__( 'Sorry, invalid request', 'woocommerce-admin' ),
					array( 'status' => 400 )
				);
			}

			if ( 'already_exists' === $error_msg ) {
				return new \WP_Error(
					'woocommerce_favorites_already_exists',
					__( 'Favorite already exists', 'woocommerce-admin' ),
					array( 'status' => 409 )
				);
			}
		}

		return rest_ensure_response( array_map( 'stripslashes', $altered_favorites ) );
	}

	/**
	 * Delete a favorite.
	 *
	 * @param WP_REST_Request $request Request data.
	 * @return WP_REST_Response
	 */
	public function delete_item( $request ) {
		$fav_id  = $request->get_param( 'item_id' );
		$user_id = $request->get_param( 'user_id' );

		try {
			$altered_favorites = Favorites::remove_item( $fav_id, $user_id );
		} catch ( \Exception $e ) {
			$error_msg = $e->getMessage();

			if ( 'invalid_input' === $error_msg ) {
				return new \WP_Error(
					'woocommerce_favorites_invalid_request',
					__( 'Sorry, invalid request', 'woocommerce-admin' ),
					array( 'status' => 400 )
				);
			}

			if ( 'does_not_exist' === $error_msg ) {
				return new \WP_Error(
					'woocommerce_favorites_does_not_exist',
					__( 'Favorite item not found', 'woocommerce-admin' ),
					array( 'status' => 404 )
				);
			}
		}

		return rest_ensure_response( array_map( 'stripslashes', $altered_favorites ) );
	}


	/**
	 * Check whether a given request has permission to create favorites.
	 *
	 * @param  WP_REST_Request $request Full details about the request.
	 * @return WP_Error|boolean
	 */
	public function add_item_permissions_check( $request ) {
		if ( ! wc_rest_check_manager_permissions( 'settings', 'edit' ) ) {
			return new \WP_Error( 'woocommerce_rest_cannot_view', __( 'Sorry, you cannot edit resources.', 'woocommerce-admin' ), array( 'status' => rest_authorization_required_code() ) );
		}

		return true;
	}

	/**
	 * Check whether a given request has permission to delete notes.
	 *
	 * @param  WP_REST_Request $request Full details about the request.
	 * @return WP_Error|boolean
	 */
	public function delete_item_permissions_check( $request ) {
		if ( ! wc_rest_check_manager_permissions( 'settings', 'edit' ) ) {
			return new \WP_Error( 'woocommerce_rest_cannot_view', __( 'Sorry, you cannot delete resources.', 'woocommerce-admin' ), array( 'status' => rest_authorization_required_code() ) );
		}

		return true;
	}

}
