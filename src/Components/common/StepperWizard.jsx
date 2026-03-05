import React from 'react';
import { Steps, Card, Button } from 'antd';

/**
 * StepperWizard — Reusable multi-step wizard component.
 *
 * Props:
 *  - steps: [{ title, description? }]           Step definitions
 *  - currentStep: number                         Active step index
 *  - onNext: () => void                          "Next Step" handler
 *  - onPrev: () => void                          "Previous" handler
 *  - onCancel: () => void                        "Cancel" handler
 *  - submitText: string                          Label for the final button
 *  - submitLoading: boolean                      Loading state for submit
 *  - lastStepLabel: string                       Optional label override for second-to-last Next button
 *  - children: ReactNode                         Step panels (one per step, shown/hidden by index)
 *  - stepBackgrounds: [{ background, border }]   Optional per-step card backgrounds
 *  - onStepClick: (step) => void                 Optional — makes step headers clickable
 *  - showCancel: boolean                         Whether to show the cancel button (default true)
 */
const DEFAULT_BACKGROUNDS = [
    { background: '#f8fafc', border: 'none' },
    { background: '#f0f9ff', border: '1px solid #bae6fd' },
    { background: '#f0fdf4', border: '1px solid #bbf7d0' },
    { background: '#e6f7ff', border: '1px solid #91d5ff' },
];

const StepperWizard = ({
    steps = [],
    currentStep = 0,
    onNext,
    onPrev,
    onCancel,
    submitText = 'Submit',
    submitLoading = false,
    lastStepLabel,
    children,
    stepBackgrounds,
    onStepClick,
    showCancel = true,
}) => {
    const totalSteps = steps.length;
    const lastStepIndex = totalSteps - 1;

    const backgrounds = stepBackgrounds || DEFAULT_BACKGROUNDS;
    const bg = backgrounds[currentStep] || backgrounds[0];

    // Wrap children in array so we can show/hide by index
    const panels = React.Children.toArray(children);

    const getNextLabel = () => {
        if (currentStep === lastStepIndex - 1 && lastStepLabel) {
            return lastStepLabel;
        }
        return 'Next Step';
    };

    return (
        <>
            <Card
                bordered={false}
                className="wizard-card"
                style={{
                    ...bg,
                    transition: 'background-color 0.3s ease, border 0.3s ease',
                    borderRadius: '12px',
                }}
            >
                <Steps
                    current={currentStep}
                    onChange={onStepClick}
                    style={{
                        marginBottom: '32px',
                        ...(onStepClick ? { cursor: 'pointer' } : {}),
                    }}
                    items={steps}
                />

                {panels.map((panel, index) => (
                    <div key={index} style={{ display: currentStep === index ? 'block' : 'none' }}>
                        {panel}
                    </div>
                ))}
            </Card>

            {/* Wizard Navigation Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                {showCancel && onCancel && (
                    <Button size="large" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                {currentStep > 0 && (
                    <Button onClick={onPrev} size="large">
                        Previous
                    </Button>
                )}
                {currentStep < lastStepIndex && (
                    <Button type="primary" onClick={onNext} size="large" style={{ background: '#1565c0' }}>
                        {getNextLabel()}
                    </Button>
                )}
                {currentStep === lastStepIndex && (
                    <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        loading={submitLoading}
                        style={{ background: '#1565c0' }}
                    >
                        {submitText}
                    </Button>
                )}
            </div>
        </>
    );
};

export default StepperWizard;
