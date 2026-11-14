import React, { useState } from 'react';
import {
  SKYLEARN_COLORS,
  SKYLEARN_RADII,
  SKYLEARN_TYPOGRAPHY,
} from '../tokens/skylearnTokens';
import { AlertTriangleIcon } from '../icons/SkylearnIcons';
import { useAccessibility } from '../context/AccessibilityContext';

export interface SkylearnInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const SkylearnInput = React.forwardRef<HTMLInputElement, SkylearnInputProps>(
  (
    {
      label,
      helperText,
      errorMessage,
      leftIcon,
      rightIcon,
      fullWidth = true,
      disabled = false,
      className = '',
      style,
      onFocus,
      onBlur,
      id,
      ...rest
    },
    ref
  ) => {
    const { highContrast } = useAccessibility();
    const [isFocused, setIsFocused] = useState(false);

    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
    const hasError = Boolean(errorMessage);

    const getBorder = () => {
      if (highContrast) {
        if (hasError) return `2px solid ${SKYLEARN_COLORS.ink}`;
        if (isFocused) return `2px solid ${SKYLEARN_COLORS.ink}`;
        return `1px solid ${SKYLEARN_COLORS.ink}`;
      }
      if (hasError) return `1.5px solid ${SKYLEARN_COLORS.coral}`;
      if (isFocused) return `1.5px solid ${SKYLEARN_COLORS.sky}`;
      return `1px solid ${SKYLEARN_COLORS.outline}`;
    };

    const getRing = () => {
      if (highContrast) return 'none';
      if (hasError && isFocused) return `0 0 0 4px ${SKYLEARN_COLORS.coralSoft}`;
      if (isFocused) return `0 0 0 4px ${SKYLEARN_COLORS.skySoft}`;
      return 'none';
    };

    return (
      <div
        className={`skylearn-input-wrapper ${fullWidth ? 'is-full-width' : ''} ${className}`}
        style={{
          display: fullWidth ? 'flex' : 'inline-flex',
          flexDirection: 'column',
          width: fullWidth ? '100%' : 'auto',
          boxSizing: 'border-box',
          ...style,
        }}
      >
        {label && (
          <label
            htmlFor={inputId}
            style={{
              fontFamily: SKYLEARN_TYPOGRAPHY.fonts.body,
              fontSize: '15px',
              fontWeight: 600,
              color: highContrast ? SKYLEARN_COLORS.ink : SKYLEARN_COLORS.ink,
              marginBottom: '6px',
            }}
          >
            {label}
          </label>
        )}

        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            width: '100%',
          }}
        >
          {leftIcon && (
            <div
              style={{
                position: 'absolute',
                left: '16px',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none',
                color: hasError ? SKYLEARN_COLORS.coral : SKYLEARN_COLORS.inkMuted,
              }}
            >
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={
              hasError && inputId
                ? `${inputId}-error`
                : helperText && inputId
                ? `${inputId}-helper`
                : undefined
            }
            onFocus={(e) => {
              setIsFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.(e);
            }}
            style={{
              width: '100%',
              minHeight: '56px', // 56px minimum tap target
              padding: '16px 20px',
              paddingLeft: leftIcon ? '48px' : '20px',
              paddingRight: rightIcon ? '48px' : '20px',
              borderRadius: SKYLEARN_RADII.md,
              backgroundColor: disabled
                ? SKYLEARN_COLORS.surfaceSunken
                : highContrast
                ? SKYLEARN_COLORS.background
                : SKYLEARN_COLORS.surface,
              border: getBorder(),
              boxShadow: getRing(),
              fontFamily: SKYLEARN_TYPOGRAPHY.fonts.body,
              fontSize: '18px',
              lineHeight: '24px',
              color: highContrast ? SKYLEARN_COLORS.ink : SKYLEARN_COLORS.ink,
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 160ms ease-out, box-shadow 160ms ease-out',
            }}
            {...rest}
          />

          {rightIcon && (
            <div
              style={{
                position: 'absolute',
                right: '16px',
                display: 'flex',
                alignItems: 'center',
                color: hasError ? SKYLEARN_COLORS.coral : SKYLEARN_COLORS.inkMuted,
              }}
            >
              {rightIcon}
            </div>
          )}
        </div>

        {/* Gentle Coral Inline Error or Helper */}
        {hasError ? (
          <div
            id={inputId ? `${inputId}-error` : undefined}
            role="alert"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '6px',
              fontFamily: SKYLEARN_TYPOGRAPHY.fonts.body,
              fontSize: '14px',
              color: '#B91C1C',
              fontWeight: 500,
            }}
          >
            <AlertTriangleIcon size={14} color={SKYLEARN_COLORS.coral} />
            <span>{errorMessage}</span>
          </div>
        ) : helperText ? (
          <div
            id={inputId ? `${inputId}-helper` : undefined}
            style={{
              marginTop: '6px',
              fontFamily: SKYLEARN_TYPOGRAPHY.fonts.body,
              fontSize: '14px',
              color: SKYLEARN_COLORS.inkMuted,
            }}
          >
            {helperText}
          </div>
        ) : null}
      </div>
    );
  }
);

SkylearnInput.displayName = 'SkylearnInput';

export default SkylearnInput;
