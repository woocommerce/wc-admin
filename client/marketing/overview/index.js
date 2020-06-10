/**
 * WooCommerce dependencies
 */
import { getSetting } from '@woocommerce/wc-admin-settings';

/**
 * Internal dependencies
 */
import './style.scss';
import InstalledExtensions from './installed-extensions';
import RecommendedExtensions from '../components/recommended-extensions';
import KnowledgeBase from '../components/knowledge-base';
import WelcomeCard from './welcome-card';
import '../data';

const MarketingOverview = () => {
	const allowMarketplaceSuggestions = getSetting( 'allowMarketplaceSuggestions', false );

	return (
		<div className="woocommerce-marketing-overview">
			<WelcomeCard />
			<InstalledExtensions />
			{ allowMarketplaceSuggestions && <RecommendedExtensions category="marketing" /> }
			<KnowledgeBase category="marketing" />
		</div>
	);
};

export default MarketingOverview;
