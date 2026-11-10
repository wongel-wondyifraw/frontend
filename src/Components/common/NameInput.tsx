'use client';

import React, { forwardRef } from 'react';
import { Input, type InputProps, type InputRef } from 'antd';
import {
  normalizePersonName,
  normalizeTitleInitials,
} from '@/lib/name-normalizer';

export interface NameInputProps extends InputProps {
  /** 'person' normalizes all-caps/lowercase names; 'title' preserves short acronyms like IT/NGO. */
  mode?: 'person' | 'title';
}

const NameInput = forwardRef<InputRef, NameInputProps>(
  ({ mode = 'person', onBlur, onChange, ...rest }, ref) => {
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const normalized =
        mode === 'title'
          ? normalizeTitleInitials(raw)
          : normalizePersonName(raw);

      if (normalized !== raw) {
        const clonedTarget = e.target.cloneNode(false) as HTMLInputElement;
        clonedTarget.value = normalized;
        if (rest.value === undefined) {
          e.target.value = normalized;
          e.currentTarget.value = normalized;
        }
        const changeEvent = Object.create(e, {
          type: { value: 'change' },
          target: { value: clonedTarget },
          currentTarget: { value: clonedTarget },
        }) as React.ChangeEvent<HTMLInputElement>;
        onChange?.(changeEvent);
      }

      onBlur?.(e);
    };

    return (
      <Input
        ref={ref}
        onBlur={handleBlur}
        onChange={onChange}
        {...rest}
      />
    );
  },
);

NameInput.displayName = 'NameInput';

export default NameInput;
