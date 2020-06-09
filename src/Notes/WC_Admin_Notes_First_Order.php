<?php
/**
 * WooCommerce Admin First Order Note.
 *
 * Adds a note on first order creation.
 *
 * @package WooCommerce Admin
 */

namespace Automattic\WooCommerce\Admin\Notes;

defined( 'ABSPATH' ) || exit;

/**
 * WC_Admin_Notes_First_Order
 */
class WC_Admin_Notes_First_Order {
	/**
	 * Note traits.
	 */
	use NoteTraits;

	/**
	 * Name of the note for use in the database.
	 */
	const NOTE_NAME = 'wc-admin-first-order';

	/**
	 * Attach hooks.
	 */
	public function __construct() {
		add_action( 'woocommerce_checkout_create_order', array( __CLASS__, 'possibly_add_note' ) );
	}

	/**
	 * Get the note.
	 */
	public static function get_note() {
		// Only add this note if no previous orders exist.
		$query  = new \WC_Order_Query(
			array(
				'limit' => 1,
			)
		);
		$orders = $query->get_orders();

		if ( count( $orders ) > 0 ) {
			return;
		}

		$content = __( "Congratulations on getting your first order! Now it's a great time to learn how to manage your orders.", 'woocommerce-admin' );

		$note = new WC_Admin_Note();
		$note->set_title( __( 'First order received', 'woocommerce-admin' ) );
		$note->set_content( $content );
		$note->set_content_data( (object) array() );
		$note->set_type( WC_Admin_Note::E_WC_ADMIN_NOTE_INFORMATIONAL );
		$note->set_name( self::NOTE_NAME );
		$note->set_source( 'woocommerce-admin' );
		$note->add_action( 'learn-more', __( 'Learn more', 'woocommerce-admin' ), 'https://docs.woocommerce.com/document/managing-orders/?utm_source=inbox' );
		return $note;
	}
}
