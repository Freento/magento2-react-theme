import React from 'react';

const CheckoutSteps = ({ currentStep, setCurrentStep }) => {
    const steps = [
        { number: 1, title: 'Shipping Address', active: currentStep >= 1, completed: currentStep > 1 },
        { number: 2, title: 'Shipping Method', active: currentStep >= 2, completed: currentStep > 2 },
        { number: 3, title: 'Payment & Place Order', active: currentStep >= 3, completed: false }
    ];

    return (
        <div className="progress-steps">
            {steps.map((step, index) => (
                <React.Fragment key={step.number}>
                    <div
                        className={`step-item ${
                            step.completed ? 'completed' :
                                step.number === currentStep ? 'current' : 'inactive'
                        } ${
                            step.number < currentStep ? 'clickable' : 'non-clickable'
                        }`}
                        onClick={() => {
                            if (step.number < currentStep) {
                                setCurrentStep(step.number);
                            }
                        }}
                    >
                        <div className={`step-number ${
                            step.completed ? 'completed' :
                                step.number === currentStep ? 'current' : 'inactive'
                        }`}>
                            {step.completed ? '✓' : step.number}
                        </div>
                        <span className={`step-title ${
                            step.completed ? 'completed' :
                                step.number === currentStep ? 'current' : 'inactive'
                        }`}>
              {step.title}
            </span>
                    </div>
                    {index < steps.length - 1 && (
                        <div className={`step-connector ${
                            currentStep > step.number ? 'active' : 'inactive'
                        }`} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

export default CheckoutSteps;