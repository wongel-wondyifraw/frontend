'use client';

import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DownOutlined, CheckOutlined } from '@ant-design/icons';
import './CustomSelect.css';

export interface CustomSelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

export interface CustomSelectProps {
  name?: string;
  id?: string;
  value?: string;
  defaultValue?: string;
  options: CustomSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onChange?: (value: string) => void;
}

export default function CustomSelect({
  name,
  id,
  value,
  defaultValue,
  options = [],
  placeholder = 'Select an option',
  disabled = false,
  className = '',
  onChange,
}: CustomSelectProps) {
  const generatedId = useId();
  const selectId = id || generatedId;

  // Controlled vs Uncontrolled state
  const isControlled = value !== undefined;
  const initialValue = defaultValue !== undefined ? defaultValue : options[0]?.value || '';
  const [internalValue, setInternalValue] = useState<string>(initialValue);
  const currentValue = isControlled ? value : internalValue;

  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find((opt) => opt.value === currentValue);

  // Sync internal state if defaultValue changes
  useEffect(() => {
    if (!isControlled && defaultValue !== undefined) {
      setInternalValue(defaultValue);
    }
  }, [defaultValue, isControlled]);

  // Form reset listener
  useEffect(() => {
    const form = containerRef.current?.closest('form');
    if (!form) return;

    const handleReset = () => {
      const resetVal = defaultValue !== undefined ? defaultValue : options[0]?.value || '';
      if (!isControlled) {
        setInternalValue(resetVal);
      }
      onChange?.(resetVal);
    };

    form.addEventListener('reset', handleReset);
    return () => form.removeEventListener('reset', handleReset);
  }, [defaultValue, options, onChange, isControlled]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = useCallback(
    (val: string) => {
      if (disabled) return;
      if (!isControlled) {
        setInternalValue(val);
      }
      onChange?.(val);
      setIsOpen(false);
      triggerRef.current?.focus();
    },
    [disabled, isControlled, onChange]
  );

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'Escape') {
      setIsOpen(false);
      return;
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        const idx = options.findIndex((opt) => opt.value === currentValue);
        setHighlightedIndex(idx >= 0 ? idx : 0);
      } else if (highlightedIndex >= 0 && highlightedIndex < options.length) {
        handleSelect(options[highlightedIndex].value);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        const idx = options.findIndex((opt) => opt.value === currentValue);
        setHighlightedIndex(idx >= 0 ? idx : 0);
      } else {
        setHighlightedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        const idx = options.findIndex((opt) => opt.value === currentValue);
        setHighlightedIndex(idx >= 0 ? idx : options.length - 1);
      } else {
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`custom-select-container ${isOpen ? 'custom-select-container--open' : ''} ${
        disabled ? 'custom-select-container--disabled' : ''
      } ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Hidden input for native form serialization */}
      {name && <input type="hidden" name={name} value={currentValue} />}

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        id={selectId}
        className="custom-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
      >
        <span className="custom-select-current">
          {selectedOption ? (
            <span className="custom-select-label-wrap">
              {selectedOption.icon && (
                <span className="custom-select-icon">{selectedOption.icon}</span>
              )}
              <span className="custom-select-text">{selectedOption.label}</span>
            </span>
          ) : (
            <span className="custom-select-placeholder">{placeholder}</span>
          )}
        </span>

        <span className="custom-select-arrow" aria-hidden="true">
          <DownOutlined className="custom-select-chevron" />
        </span>
      </button>

      {/* Animated Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="custom-select-menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
          >
            <ul
              ref={listboxRef}
              role="listbox"
              aria-labelledby={selectId}
              className="custom-select-options"
            >
              {options.map((option, idx) => {
                const isSelected = option.value === currentValue;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    className={`custom-select-option ${
                      isSelected ? 'custom-select-option--selected' : ''
                    } ${isHighlighted ? 'custom-select-option--highlighted' : ''}`}
                    onClick={() => handleSelect(option.value)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                  >
                    <div className="custom-select-option-content">
                      {option.icon && (
                        <span className="custom-select-option-icon">{option.icon}</span>
                      )}
                      <div className="custom-select-option-texts">
                        <span className="custom-select-option-label">{option.label}</span>
                        {option.description && (
                          <span className="custom-select-option-desc">{option.description}</span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <span className="custom-select-check" aria-hidden="true">
                        <CheckOutlined />
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
