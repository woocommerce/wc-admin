<?php

use Symfony\Component\Console\Application as SymfonyApplication;
use Symfony\Component\Console\Formatter\OutputFormatterStyle;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * User interface for the changelogger tool.
 */
class Application extends SymfonyApplication {

	const VERSION = '0.0.1';

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct( 'Testing Instructions', self::VERSION );
	}

	/**
	 * Called when the application is run.
	 *
	 * @param InputInterface $input InputInterface.
	 * @param OutputInterface $output OutputInterface.
	 *
	 * @return int
	 * @throws Throwable
	 */
	public function doRun( InputInterface $input, OutputInterface $output ) {
		$output->getFormatter()->setStyle( 'warning', new OutputFormatterStyle( 'black', 'yellow' ) );
		return parent::doRun( $input, $output );
	}
}
