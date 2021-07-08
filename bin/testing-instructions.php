<?php

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/testing-instructions/Application.php';
require_once __DIR__ . '/testing-instructions/AddCommand.php';
require_once __DIR__ . '/testing-instructions/WriteCommand.php';

$config = require_once __DIR__ . '/testing-instructions/config.php';

$app = new Application();
$app->add( new AddCommand( $config ) );
$app->add( new WriteCommand( $config ) );
exit( $app->run() );