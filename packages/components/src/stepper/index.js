/** @format */
/**
 * External dependencies
 */
import classnames from 'classnames';
import { Component, Fragment } from '@wordpress/element';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import Spinner from '../spinner';
import CheckIcon from './check-icon';

/**
 * A stepper component to indicate progress in a set number of steps.
 */
class Stepper extends Component {
	render() {
		const { className, currentStep, steps, direction, isPending } = this.props;
		const currentIndex = steps.findIndex( s => currentStep === s.key );
		const content = steps[ currentIndex ].content;
		const stepperClassName = classnames( 'woocommerce-stepper', className, {
			'is-vertical': 'vertical' === direction,
		} );

		return (
			<div className={ stepperClassName }>
				<div className="woocommerce-stepper__steps">
					{ steps.map( ( step, i ) => {
						const { key, label, description, isComplete } = step;
						const stepClassName = classnames( 'woocommerce-stepper__step', {
							'is-active': key === currentStep,
							'is-complete': 'undefined' !== typeof isComplete ? isComplete : currentIndex > i,
						} );

						const icon = currentStep === key && isPending ? <Spinner /> : (
							<div className="woocommerce-stepper__step-icon">
								<span className="woocommerce-stepper__step-number">{ i + 1 }</span>
								<CheckIcon />
							</div>
						);

						return (
							<Fragment key={ key } >
								<div
									className={ stepClassName }
								>
									{ icon }
									<div className="woocommerce-stepper__step-text">
										<span className="woocommerce-stepper__step-label">
											{ label }
										</span>
										{ description &&
											<span className="woocommerce-stepper__step-description">
												{ description }
											</span>
										}
									</div>
								</div>
								<div className="woocommerce-stepper__step-divider" />
							</Fragment>
						);
					} ) }
				</div>

				{ content &&
					<div className="woocommerce-stepper_content">
						{ content }
					</div>
				}
			</div>
		);
	}
}

Stepper.propTypes = {
	/**
	 * Additional class name to style the component.
	 */
	className: PropTypes.string,
	/**
	 * The current step's key.
	 */
	currentStep: PropTypes.string.isRequired,
	/**
	 * An array of steps used.
	 */
	steps: PropTypes.arrayOf(
		PropTypes.shape( {
			/**
			 * Key used to identify step.
			 */
			key: PropTypes.string.isRequired,
			/**
			 * Label displayed in stepper.
			 */
			label: PropTypes.string.isRequired,
			/**
			 * Description displayed beneath the label.
			 */
			description: PropTypes.string,
			/**
			 * Optionally mark a step complete regardless of step index.
			 */
			isComplete: PropTypes.bool,
			/**
			 * Content displayed when the step is active.
			 */
			content: PropTypes.node,
		} )
	).isRequired,

	/**
	 * Direction of the stepper.
	 */
	direction: PropTypes.oneOf( [ 'horizontal', 'vertical' ] ),

	/**
	 * Optionally mark the current step as pending to show a spinner.
	 */
	isPending: PropTypes.bool,
};

Stepper.defaultProps = {
	direction: 'horizontal',
	isPending: false,
};

export default Stepper;
