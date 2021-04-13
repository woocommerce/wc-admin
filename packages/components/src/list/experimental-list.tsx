/**
 * External dependencies
 */
import { Children, cloneElement, isValidElement } from '@wordpress/element';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

type ListProps = {
	component?: string;
} & React.HTMLAttributes< HTMLElement >;

export const ExperimentalList: React.FC< ListProps > = ( {
	children,
	component = 'nav',
	// Allow passing any other property overrides that are legal on an HTML element
	...otherProps
} ) => {
	return (
		<TransitionGroup
			component={ component }
			className="woocommerce-list"
			{ ...otherProps }
		>
			{ /* Wrapping all children in a CSS Transition means no invalid props are passed to children and that anything can be animated. */ }
			{ Children.map( children, ( child ) => {
				if ( isValidElement( child ) ) {
					const {
						onExited,
						in: inTransition,
						enter,
						exit,
						...remainingProps
					} = child.props;
					return (
						<CSSTransition
							timeout={ 500 }
							onExited={ onExited }
							in={ inTransition }
							enter={ enter }
							exit={ exit }
						>
							{ cloneElement( child, { ...remainingProps } ) }
						</CSSTransition>
					);
				}

				return child;
			} ) }
		</TransitionGroup>
	);
};