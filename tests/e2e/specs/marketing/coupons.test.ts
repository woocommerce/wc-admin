/**
 * Internal dependencies
 */
 import { Coupons } from '../../pages/Coupons';
 import { Login } from '../../pages/Login';
import { resetWooCommerceState } from '../../utils/actions';
 
 describe( 'Coupons page', () => {
     const couponsPage = new Coupons( page );
     const login = new Login( page );
 
     beforeAll( async () => {
         await login.login();
		await resetWooCommerceState();
     } );
     afterAll( async () => {
         await login.logout();
     } );
 
     it( 'A user can view the coupons overview without it crashing', async () => {
         await couponsPage.navigate();
         await couponsPage.isDisplayed();
     } );
 } );
 
