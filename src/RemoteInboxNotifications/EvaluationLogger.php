<?php

namespace Automattic\WooCommerce\Admin\RemoteInboxNotifications;

/**
 * Class EvaluationLogger
 *
 * @package Automattic\WooCommerce\Admin\RemoteInboxNotifications
 */
class EvaluationLogger {
	/**
	 * Slug of the spec.
	 *
	 * @var string
	 */
	private $slug;

	/**
	 * Results of rules in the given spec.
	 *
	 * @var array
	 */
	private $results = array();

	/**
	 * Logger class to use.
	 *
	 * @var WC_Logger_Interface|null
	 */
	private $logger;

	/**
	 * EvaluationLogger constructor.
	 *
	 * @param string                   $slug Slug of a spec that is being evaluated.
	 * @param WC_Logger_Interface|null $logger Logger class to use.
	 */
	public function __construct( $slug, \WC_Logger_Interface $logger = null ) {
		$this->slug = $slug;
		if ( null === $logger ) {
			$logger = wc_get_logger();
		}

		$this->logger = $logger;
	}

	/**
	 * Add evaluation result of a rule.
	 *
	 * @param string  $rule_type name of the rule being tested.
	 * @param boolean $result result of a given rule.
	 */
	public function add_result( $rule_type, $result ) {
		array_push(
			$this->results,
			array(
				'rule'   => $rule_type,
				'result' => $result ? 'passed' : 'failed',
			)
		);
	}

	/**
	 * Format the results into json.
	 *
	 * @return string
	 */
	public function format() {
		return wp_json_encode(
			array(
				'slug'    => $this->slug,
				'results' => $this->results,
			)
		);
	}

	/**
	 * Log the results.
	 */
	public function log() {
		$this->logger->debug( $this->format(), array( 'source' => 'remote-inbox-notifications' ) );
	}
}
