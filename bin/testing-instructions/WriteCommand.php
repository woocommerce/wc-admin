<?php

use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * Class WriteCommand
 */
class WriteCommand extends Command {

	/**
	 * The default command name
	 *
	 * @var string|null
	 */
	protected static $defaultName = 'write';

	/**
	 * Configuration.
	 *
	 * @var array
	 */
	private $config;

	/**
	 * WriteCommand constructor.
	 *
	 * @param array $config configuration object.
	 */
	public function __construct( array $config ) {
		parent::__construct();
		$this->config = $config;
	}

	/**
	 * Configures the command.
	 */
	protected function configure() {
		$this->setDescription( 'Updates the TESTING-INSTRUCTIONS.md from segment files' );
		$this->addArgument( 'version', InputArgument::REQUIRED );
	}


	/**
	 * Executes the command.
	 *
	 * @param InputInterface  $input InputInterface.
	 * @param OutputInterface $output OutputInterface.
	 *
	 * @return int
	 */
	protected function execute( InputInterface $input, OutputInterface $output ) {
		$file    = $this->config['index_file'];
		$version = $input->getArgument( 'version' );

		$contents = $this->mergeSegmentFiles();

		$pattern     = '/^# Testing instructions((?:(?!^##).)+)/ms';
		$replacement = "# Testing instructions\n\n## {$version}\n" . $contents . "\n\n";

		$readme       = file_get_contents( $file );
		$new_contents = preg_replace( $pattern, $replacement, $readme );
		if ( strlen( $new_contents ) === strlen( $readme ) || null === $new_contents ) {
			$output->writeln( 'Failed to write the changelog: please check readme.txt format.' );
			return 500;
		}

		file_put_contents( $file, $new_contents );
		$this->deleteSegments();
		$output->writeln( "Index file has been updated with version {$version}." );
	}

	/**
	 * Merge segment files into a single string.
	 *
	 * @return string
	 */
	protected function mergeSegmentFiles() {
		$segment_dir = $this->config['segment_file_dir'];
		$files       = glob( $segment_dir . '/*.md' );
		$contents    = '';
		foreach ( $files as $file ) {
			$content   = file_get_contents( $file );
			$contents .= "\n\n{$content}";
		}

		return $contents;
	}

	/**
	 * Delete segment files.
	 */
	protected function deleteSegments() {
		$segment_dir = $this->config['segment_file_dir'];
		$files       = glob( $segment_dir . '/*.md' );
		foreach ( $files as $file ) {
			unlink( $file );
		}
	}
}
