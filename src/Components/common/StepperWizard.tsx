'use client';
import React, { type ReactNode } from 'react';
import { Steps, Card, Button } from 'antd';

interface StepDefinition {
  title: string;
  /** @deprecated Prefer `content` — mapped for Ant Design v6 Steps. */
  description?: string;
  content?: string;
}

interface StepBackground {
  background: string;
  border: string;
}

interface StepperWizardProps {
  steps?: StepDefinition[];
  currentStep?: number;
  onNext?: () => void;
  onPrev?: () => void;
  onCancel?: () => void;
  submitText?: string;
  submitLoading?: boolean;
  lastStepLabel?: string;
  children?: ReactNode;
  stepBackgrounds?: StepBackground[];
  onStepClick?: (step: number) => void;
  showCancel?: boolean;
}

const DEFAULT_BACKGROUNDS: StepBackground[] = [
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
}: StepperWizardProps) => {
  const totalSteps = steps.length;
  const lastStepIndex = totalSteps - 1;

  const backgrounds = stepBackgrounds || DEFAULT_BACKGROUNDS;
  const bg = backgrounds[currentStep] || backgrounds[0];

  const panels = React.Children.toArray(children);

  const stepItems = steps.map(({ title, description, content }) => ({
    title,
    ...(content || description ? { content: content ?? description } : {}),
  }));

  const getNextLabel = () => {
    if (currentStep === lastStepIndex - 1 && lastStepLabel) {
      return lastStepLabel;
    }
    return 'Next Step';
  };

  return (
    <>
      <Card
        variant="borderless"
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
          items={stepItems}
        />

        {panels.map((panel, index) => (
          <div key={index} style={{ display: currentStep === index ? 'block' : 'none' }}>
            {panel}
          </div>
        ))}
      </Card>

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
