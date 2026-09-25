import React from 'react';

const CheckoutSteps = ({ currentStep, setCurrentStep }) => {
    const steps = [
        { number: 1, title: 'Shipping Address', active: currentStep >= 1, completed: currentStep > 1 },
        { number: 2, title: 'Shipping Method', active: currentStep >= 2, completed: currentStep > 2 },
        { number: 3, title: 'Payment & Place Order', active: currentStep >= 3, completed: false }
    ];

    return (
        <div className="progress-steps flex items-center gap-3.5 max640:gap-2 pb-5 mb-7 border-b border-line text-xs tracking-eyebrow uppercase">
            {steps.map((step, index) => {
                const isCurrent = step.number === currentStep;
                const itemState = step.completed || isCurrent ? 'text-ink' : 'text-ink-2';
                const numberState = step.completed || isCurrent
                    ? 'bg-ink border-ink text-bg'
                    : 'bg-bg border-line text-ink-2';
                return (
                <React.Fragment key={step.number}>
                    <div
                        className={`step-item inline-flex items-center gap-2.5 [transition:color_120ms_ease] ${itemState}${isCurrent ? ' font-semibold' : ''} ${
                            step.number < currentStep ? 'cursor-pointer hover:text-ink' : 'cursor-default'
                        }`}
                        onClick={() => {
                            if (step.number < currentStep) {
                                setCurrentStep(step.number);
                            }
                        }}
                    >
                        <div className={`step-number w-[22px] h-[22px] rounded-pill inline-flex items-center justify-center text-xs font-medium tracking-normal border shrink-0 ${numberState}`}>
                            {step.completed ? '✓' : step.number}
                        </div>
                        <span className={`step-title ${isCurrent ? 'text-ink font-semibold max640:inline' : 'max640:hidden'}`}>
              {step.title}
            </span>
                    </div>
                    {index < steps.length - 1 && (
                        <div className={`step-connector grow-0 shrink-0 basis-12 max640:basis-4 h-px ${
                            currentStep > step.number ? 'bg-ink' : 'bg-line-strong'
                        }`} />
                    )}
                </React.Fragment>
                );
            })}
        </div>
    );
};

export default CheckoutSteps;
