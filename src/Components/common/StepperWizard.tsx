'use client';
import React, { type ReactNode } from 'react';
import { Card, Button } from 'antd';
import './StepperWizard.css';

interface StepDefinition {
  title: string;
  /** @deprecated Prefer `content` — mapped as the step subtitle. */
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
  { background: 'var(--bg-card)', border: 'none' },
  { background: 'var(--bg-card)', border: 'none' },
  { background: 'var(--bg-card)', border: 'none' },
  { background: 'var(--bg-card)', border: 'none' },
  { background: 'var(--bg-card)', border: 'none' },
  { background: 'var(--bg-card)', border: 'none' },
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
  const lastStepIndex = Math.max(totalSteps - 1, 0);
  const safeStep = Math.min(Math.max(currentStep, 0), lastStepIndex);
  const active = steps[safeStep];
  const subtitle = active?.content || active?.description;
  const progress = totalSteps > 0 ? ((safeStep + 1) / totalSteps) * 100 : 0;

  const backgrounds = stepBackgrounds || DEFAULT_BACKGROUNDS;
  const bg = backgrounds[safeStep] || backgrounds[0];

  const panels = React.Children.toArray(children);

  const getNextLabel = () => {
    if (safeStep === lastStepIndex - 1 && lastStepLabel) {
      return lastStepLabel;
    }
    return 'Next';
  };

  const handleDotClick = (index: number) => {
    if (!onStepClick) return;
    // Only allow jumping back to completed steps
    if (index <= safeStep) onStepClick(index);
  };

  return (
    <>
      <Card
        variant="borderless"
        className="wizard-card"
        style={{
          ...bg,
          transition: 'background-color 0.3s ease, border 0.3s ease',
        }}
      >
        <header className="wizard-progress" aria-label="Form progress">
          <div className="wizard-progress-meta">
            <span className="wizard-progress-count">
              Step {safeStep + 1} of {totalSteps}
            </span>
            <span className="wizard-progress-pct" aria-hidden="true">
              {Math.round(progress)}%
            </span>
          </div>

          <div
            className="wizard-progress-track"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={totalSteps}
            aria-valuenow={safeStep + 1}
            aria-valuetext={`Step ${safeStep + 1} of ${totalSteps}: ${active?.title ?? ''}`}
          >
            <div className="wizard-progress-fill" style={{ width: `${progress}%` }} />
          </div>

          <div className="wizard-step-heading">
            <h3 className="wizard-step-title">{active?.title}</h3>
            {subtitle ? <p className="wizard-step-subtitle">{subtitle}</p> : null}
          </div>

          {totalSteps > 1 && (
            <div className="wizard-dots" role="list" aria-label="Steps">
              {steps.map((step, index) => {
                const state =
                  index < safeStep ? 'done' : index === safeStep ? 'current' : 'upcoming';
                const clickable = Boolean(onStepClick) && index <= safeStep;
                return (
                  <button
                    key={`${step.title}-${index}`}
                    type="button"
                    role="listitem"
                    className={`wizard-dot wizard-dot--${state}${clickable ? ' wizard-dot--clickable' : ''}`}
                    aria-label={`${step.title}${state === 'current' ? ' (current)' : ''}`}
                    aria-current={state === 'current' ? 'step' : undefined}
                    disabled={!clickable}
                    onClick={() => handleDotClick(index)}
                  />
                );
              })}
            </div>
          )}
        </header>

        <div className="wizard-panel">
          {panels.map((panel, index) => (
            <div
              key={index}
              className="wizard-panel-step"
              hidden={safeStep !== index}
              aria-hidden={safeStep !== index}
            >
              {panel}
            </div>
          ))}
        </div>

        <div className="wizard-actions">
          <div className="wizard-actions-group">
            {safeStep > 0 && (
              <Button className="wizard-action-prev" onClick={onPrev} size="large">
                Previous
              </Button>
            )}
            {showCancel && onCancel && (
              <Button className="wizard-action-cancel" size="large" onClick={onCancel}>
                Cancel
              </Button>
            )}
            {safeStep < lastStepIndex && (
              <Button
                className="wizard-action-next"
                type="primary"
                onClick={onNext}
                size="large"
              >
                {getNextLabel()}
              </Button>
            )}
            {safeStep === lastStepIndex && (
              <Button
                className="wizard-action-next"
                type="primary"
                htmlType="submit"
                size="large"
                loading={submitLoading}
              >
                {submitText}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </>
  );
};

export default StepperWizard;
