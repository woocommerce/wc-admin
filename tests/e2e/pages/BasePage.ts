import { ElementHandle, Page } from 'puppeteer';
import { BaseElement } from '../elements/BaseElement';
import { DropdownField } from '../elements/DropdownField';
import { DropdownTypeaheadField } from '../elements/DropdownTypeaheadField';
import { getElementByText } from '../utils/actions';

const config = require( 'config' );
const baseUrl = config.get( 'url' );

// Represents a page that can be navigated to
export abstract class BasePage {
	protected page: Page;
	protected url: string = '';
	protected baseUrl: string = baseUrl;

	// cache of elements that have been setup, note that they are unique per page/ per selector
	private elements: Record< string, BaseElement >;

	constructor( page: Page ) {
		this.page = page;
		this.elements = {};
	}

	getDropdownField( selector: string ) {
		if ( ! this.elements[ selector ] ) {
			this.elements[ selector ] = new DropdownField( page, selector );
		}

		return this.elements[ selector ] as DropdownField;
	}

	getDropdownTypeahead( selector: string ) {
		if ( ! this.elements[ selector ] ) {
			this.elements[ selector ] = new DropdownField( page, selector );
		}

		return this.elements[ selector ] as DropdownTypeaheadField;
	}

	async click( selector: string ) {
		await this.page.waitForSelector( selector );
		await this.page.click( selector );
	}

	async clickButtonWithText( text: string ) {
		const el = await getElementByText( 'button', text );
		await el?.click();
	}

	async setCheckboxWithLabel( labelText: string ) {
		const checkbox = await getElementByText( 'label', labelText );

		if ( checkbox ) {
			const checkboxStatus = await (
				await checkbox.getProperty( 'checked' )
			 ).jsonValue();

			if ( checkboxStatus !== true ) {
				await checkbox.click();
			}
		} else {
			throw new Error(
				`Could not find checkbox with label "${ labelText }"`
			);
		}
	}

	async unsetAllCheckboxes( selector: string ) {
		const checkboxes = await page.$$( selector );
		// Uncheck all checkboxes, to avoid installing plugins
		for ( const checkbox of checkboxes ) {
			this.toggleCheckbox( checkbox, false );
		}
	}

	async setAllCheckboxes( selector: string ) {
		const checkboxes = await page.$$( selector );
		// Uncheck all checkboxes, to avoid installing plugins
		for ( const checkbox of checkboxes ) {
			this.toggleCheckbox( checkbox, true );
		}
	}

	// Set or unset a checkbox based on `checked` value passed.
	async toggleCheckbox(
		checkbox: ElementHandle< Element >,
		checked: boolean
	) {
		const checkboxStatus = await (
			await checkbox.getProperty( 'checked' )
		 ).jsonValue();

		if ( checkboxStatus !== checked ) {
			await checkbox.click();
		}
	}

	async navigate() {
		if ( ! this.url ) {
			throw new Error( 'You must define a url for the page object' );
		}

		await this.goto( baseUrl + this.url );
	}

	// useful if you need to do something different from the default navigation to this.url
	protected async goto( url: string ) {
		await this.page.goto( url, {
			waitUntil: 'networkidle0',
		} );
	}
}
