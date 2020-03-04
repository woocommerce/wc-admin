#!/bin/sh
#
# Build a installable plugin zip

output 2 "Creating archive... 🎁"

build_files=$(ls dist/*/*.{js,css})
ZIP_FILE=$1

zip -r ${ZIP_FILE} \
	woocommerce-admin.php \
	uninstall.php \
	includes/ \
	images/ \
	$build_files \
	languages/woocommerce-admin.pot \
	readme.txt \
	src/ \
	vendor/ \
     -x \
	vendor/bin/\* \
	vendor/dealerdirect/\* \
	vendor/doctrine/\* \
	vendor/phar-io/\* \
	vendor/phpcompatibility/\* \
	vendor/phpdocumentor/\* \
	vendor/phpspec/\* \
	vendor/phpunit/\* \
	vendor/sebastian/\* \
	vendor/squizlabs/\* \
	vendor/theseer/\* \
	vendor/webmozart/\* \
	vendor/woocommerce/\* \
	vendor/wp-coding-standards/\*
