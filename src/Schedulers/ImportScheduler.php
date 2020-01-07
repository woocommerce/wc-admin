<?php
/**
 * Import related functions and actions.
 *
 * @package WooCommerce Admin/Classes
 */

namespace Automattic\WooCommerce\Admin\Schedulers;

defined( 'ABSPATH' ) || exit;

use \Automattic\WooCommerce\Admin\API\Reports\Cache as ReportsCache;
use \Automattic\WooCommerce\Admin\Schedulers\SchedulerTraits;

/**
 * ImportScheduler class.
 */
abstract class ImportScheduler {
	/**
	 * Scheduler traits.
	 */
	use SchedulerTraits {
		get_batch_sizes as get_scheduler_batch_sizes;
	}

	/**
	 * Returns true if an import is in progress.
	 *
	 * @return bool
	 */
	public static function is_importing() {
		$pending_jobs = self::queue()->search(
			array(
				'status'   => 'pending',
				'per_page' => 1,
				'claimed'  => false,
				'search'   => 'import',
				'group'    => self::$group,
			)
		);
		if ( empty( $pending_jobs ) ) {
			$in_progress = self::queue()->search(
				array(
					'status'   => 'in-progress',
					'per_page' => 1,
					'search'   => 'import',
					'group'    => self::$group,
				)
			);
		}

		return ! empty( $pending_jobs ) || ! empty( $in_progress );
	}

	/**
	 * Get batch sizes.
	 *
	 * @retun array
	 */
	public static function get_batch_sizes() {
		return array_merge(
			self::get_scheduler_batch_sizes(),
			array(
				'delete' => 10,
				'import' => 25,
				'queue'  => 100,
			)
		);

	}

	/**
	 * Get all available scheduling actions.
	 * Used to determine action hook names and clear events.
	 *
	 * @return array
	 */
	public static function get_scheduler_actions() {
		return array(
			'import_batch_init' => 'wc-admin_import_batch_init_' . static::$name,
			'import_batch'      => 'wc-admin_import_batch_' . static::$name,
			'delete_batch_init' => 'wc-admin_delete_batch_init_' . static::$name,
			'delete_batch'      => 'wc-admin_delete_batch_' . static::$name,
			'import'            => 'wc-admin_import_' . static::$name,
		);
	}

	/**
	 * Get items based on query and return IDs along with total available.
	 *
	 * @param int      $limit Number of records to retrieve.
	 * @param int      $page  Page number.
	 * @param int|bool $days Number of days prior to current date to limit search results.
	 * @param bool     $skip_existing Skip already imported items.
	 */
	abstract public static function get_items( $limit, $page, $days, $skip_existing );

	/**
	 * Get total number of items already imported.
	 *
	 * @return null
	 */
	abstract public static function get_total_imported();

	/**
	 * Queue the imports into multiple batches.
	 *
	 * @param integer|boolean $days Number of days to import.
	 * @param boolean         $skip_existing Skip exisiting records.
	 */
	public static function import_batch_init( $days, $skip_existing ) {
		$batch_size = static::get_batch_size( 'import' );
		$items      = static::get_items( 1, 1, $days, $skip_existing );

		if ( 0 === $items->total ) {
			return;
		}

		$num_batches = ceil( $items->total / $batch_size );

		self::queue_batches( 1, $num_batches, 'import_batch', array( $days, $skip_existing ) );
	}

	/**
	 * Imports a batch of items to update.
	 *
	 * @param int      $batch_number Batch number to import (essentially a query page number).
	 * @param int|bool $days Number of days to import.
	 * @param bool     $skip_existing Skip exisiting records.
	 * @return void
	 */
	public static function import_batch( $batch_number, $days, $skip_existing ) {
		$batch_size = static::get_batch_size( 'import' );

		$properties = array(
			'batch_number' => $batch_number,
			'batch_size'   => $batch_size,
			'type'         => static::$name,
		);
		wc_admin_record_tracks_event( 'import_job_start', $properties );

		// When we are skipping already imported items, the table of items to import gets smaller in
		// every batch, so we want to always import the first page.
		$page  = $skip_existing ? 1 : $batch_number;
		$items = static::get_items( $batch_size, $page, $days, $skip_existing );

		foreach ( $items->ids as $id ) {
			static::import( $id );
		}

		$import_stats                              = get_option( 'wc_admin_import_stats', array() );
		$imported_count                            = absint( $import_stats[ static::$name ]['imported'] ) + count( $items->ids );
		$import_stats[ static::$name ]['imported'] = $imported_count;
		update_option( 'wc_admin_import_stats', $import_stats );

		$properties['imported_count'] = $imported_count;

		wc_admin_record_tracks_event( 'import_job_complete', $properties );
	}

	/**
	 * Queue item deletion in batches.
	 */
	public static function delete_batch_init() {
		global $wpdb;
		$batch_size = static::get_batch_size( 'delete' );
		$count      = static::get_total_imported();

		if ( 0 === $count ) {
			return;
		}

		$num_batches = ceil( $count / $batch_size );

		self::queue_batches( 1, $num_batches, 'delete_batch' );
	}

	/**
	 * Delete a batch by passing the count to be deleted to the child delete method.
	 *
	 * @return void
	 */
	public static function delete_batch() {
		wc_admin_record_tracks_event( 'delete_import_data_job_start', array( 'type' => static::$name ) );

		$batch_size = static::get_batch_size( 'delete' );
		static::delete( $batch_size );

		ReportsCache::invalidate();

		wc_admin_record_tracks_event( 'delete_import_data_job_complete', array( 'type' => static::$name ) );
	}
}
