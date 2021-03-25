import { getElementByText, waitForElementByText } from '../../utils/actions';
import { BaseSection } from '../../pages/BaseSection';

export class ProductTypeSection extends BaseSection {
	async isDisplayed( productCount: number ) {
		await waitForElementByText(
			'h2',
			'What type of products will be listed?'
		);
		const length = await this.page.$$eval(
			'.components-checkbox-control__input',
			( items ) => items.length
		);
		expect( length === productCount ).toBeTruthy();
	}

	async uncheckProducts() {
		await this.unsetAllCheckboxes( '.components-checkbox-control__input' );
	}

	async selectProduct( productLabel: string ) {
		await this.setCheckboxWithLabel( productLabel );
	}
}
