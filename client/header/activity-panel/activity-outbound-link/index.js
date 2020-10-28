/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Gridicon from 'gridicons';
import { Link } from '@woocommerce/components';

/**
 * Internal dependencies
 */
import './style.scss';

const ActivityOutboundLink = ( props ) => {
	const { href, type, className, icon, children, ...restOfProps } = props;
	const classes = classnames(
		'woocommerce-layout__activity-panel-outbound-link',
		className
	);
	return (
		<Link
			href={ href }
			type={ type }
			className={ classes }
			{ ...restOfProps }
		>
			{ children }
			{ icon && <Gridicon icon="arrow-right" /> }
		</Link>
	);
};

ActivityOutboundLink.propTypes = {
	href: PropTypes.string.isRequired,
	type: PropTypes.oneOf( [ 'wp-admin', 'wc-admin', 'external' ] ).isRequired,
	className: PropTypes.string,
	icon: PropTypes.bool,
};

ActivityOutboundLink.defaultProps = {
	icon: true,
	type: 'wp-admin',
};

export default ActivityOutboundLink;
