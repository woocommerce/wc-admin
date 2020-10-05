#!/bin/sh
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
STORYBOOK_WORDPRESS_DIR="$DIR/../storybook/wordpress";
STORY_BOOK_CSS_PATH="$DIR/../storybook/wordpress/css";
TMP_DIR="$DIR/../storybook/wordpress/tmp";
ARCHIVE_CSS_PATH="wordpress/wp-admin/css";

mkdir -p $STORY_BOOK_CSS_PATH;
mkdir -p $TMP_DIR;

function downloads_and_extract_css {
    curl -o $1/wordpress-latest.zip https://wordpress.org/nightly-builds/wordpress-latest.zip;
    unzip -qq "$1/wordpress-latest.zip" "$ARCHIVE_CSS_PATH/*" -d $TMP_DIR;
    rsync -a "$TMP_DIR/$ARCHIVE_CSS_PATH" $STORYBOOK_WORDPRESS_DIR;
    rm -fr $TMP_DIR;
}

if [ -z "$(find $STORY_BOOK_CSS_PATH -iname '*.css')" ] || [ "$1" == "-f" ]
then
    # The directory is not empty, import css
    downloads_and_extract_css $STORYBOOK_WORDPRESS_DIR;
else
    echo "Wordpress CSS already exists at that path, pass -f to force update";
fi
