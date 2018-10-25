/**
 * External dependencies
 *
 * @format
 */

/**
 * Internal dependencies
 */
import SectionHeader from '../';

describe( 'SectionHeader', () => {
	test( 'should have correct title', () => {
		const sectionHeader = <SectionHeader title="A SectionHeader Example" />;
		expect( sectionHeader.props.title ).toBe( 'A SectionHeader Example' );
	} );
} );
