<?php

use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Question\Question;

/**
 * Class AddCommand
 */
class AddCommand extends Command {

	/**
	 * The default command name
	 *
	 * @var string|null
	 */
	protected static $defaultName = 'add';

	/**
	 * Configuration.
	 *
	 * @var array
	 */
	private $config;

	/**
	 * AddCommand constructor.
	 *
	 * @param array $config
	 */
	public function __construct( array $config ) {
		parent::__construct();
		$this->config = $config;
	}

	/**
	 * Configures the command.
	 */
	protected function configure() {
		$this->setDescription( 'Adds a change file' );
		$this->addOption( 'pr', null, InputOption::VALUE_REQUIRED, 'Your PR #' );
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
		$pr      = $input->getOption( 'pr' );
		$content = '';

		// PR # specified, retrieve name and the testing instructions from the PR.
		if ( $pr ) {
			$pr_info = $this->parse_pr( $pr );
			if ( false === $pr_info ) {
				$output->writeln( ( "Unable to retrieve PR #{$pr}." ) );
				return 404;
			}
			$name      = $pr_info->title;
			$pr_number = $pr;
			$content   = $pr_info->test_instructions;
			// Otherwise, ask the user.
		} else {
			$question_helper = $this->getHelper( 'question' );

			$name_question = new Question( 'Name your testing instruction: ' );
			$name          = $question_helper->ask( $input, $output, $name_question );
			if ( null === $name ) {
				$output->writeln( 'Got EOF when attempting to query user, aborting.' );
				return 400;
			}

			$pr_question = new Question( 'What is the PR #? ' );
			$pr_number   = $question_helper->ask( $input, $output, $pr_question );
		}

		if ( ! is_dir( $this->config['segment_file_dir'] ) ) {
			$output->writeln( "Semgent file directory `{$this->config['segment_file_dir']} does not exist, aborting" );
			return 400;
		}

		$segment_filename = "{$pr_number}.md";
		$heading          = "### {$name} #{$pr_number}\n\n";

		file_put_contents( $this->config['segment_file_dir'] . '/' . $segment_filename, $heading . $content );

		$output->writeln( $segment_filename . ' has been created.' );
	}

	/**
	 * Retrieve PR information.
	 *
	 * @param string $pr PR # to retrieve.
	 *
	 * @return object Object containing PR information.
	 */
	private function parse_pr( $pr ) {
		$url  = 'https://api.github.com/repos/woocommerce/woocommerce-admin/pulls/' . $pr;
		$curl = curl_init( $url );
		curl_setopt( $curl, CURLOPT_URL, $url );
		curl_setopt( $curl, CURLOPT_RETURNTRANSFER, true );
		$headers = array(
			'Accept: application/vnd.github.v3+json',
			'User-Agent: curl',
		);
		curl_setopt( $curl, CURLOPT_HTTPHEADER, $headers );
		$response = json_decode( curl_exec( $curl ) );
		curl_close( $curl );

		if ( isset( $response->message ) && $response->message === 'Not Found' ) {
			return false;
		}

		$response->test_instructions = $this->get_test_instructions( $response->body );
		return $response;
	}

	/**
	 * Extract testing instructions from the PR description.
	 *
	 * @param string $body PR description body.
	 *
	 * @return string Testing instructions.
	 */
	private function get_test_instructions( $body ) {
		// add additinal ### to make the regex working.
		$body   .= "\n###";
		$pattern = '/### (Detailed test instructions:)\R+(.+?)(?=\R+###)/s';
		preg_match( $pattern, $body, $matches );

		if ( 3 === count( $matches ) ) {
			//Remove <!-- --> or <!--- ---> comments.
			return preg_replace('/(?=<!--)([\s\S]*?)-->/', '', $matches[2]);
		}

		return '';
	}
}
