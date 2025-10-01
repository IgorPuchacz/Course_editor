import React, { useMemo } from 'react';

export type ValidateButtonStatus = 'idle' | 'success' | 'error';

interface StatusColorConfig {
  background: string;
  text: string;
}

interface ValidateButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  status?: ValidateButtonStatus;
  accentColor?: string;
  idleTextColor?: string;
  statusColors?: Partial<Record<ValidateButtonStatus, StatusColorConfig>>;
}

const DEFAULT_SUCCESS_COLOR = '#16a34a';
const DEFAULT_SUCCESS_TEXT = '#ecfdf5';
const DEFAULT_ERROR_COLOR = '#dc2626';
const DEFAULT_ERROR_TEXT = '#fee2e2';
const DEFAULT_IDLE_COLOR = '#2563eb';
const DEFAULT_IDLE_TEXT = '#f8fafc';

export const ValidateButton: React.FC<ValidateButtonProps> = ({
  status = 'idle',
  accentColor = DEFAULT_IDLE_COLOR,
  idleTextColor,
  statusColors,
  disabled,
  className = '',
  style,
  onClick,
  ...buttonProps
}) => {
  const { label, background, text } = useMemo(() => {
    const overrides = statusColors?.[status];

    if (status === 'success') {
      return {
        label: 'Correct!',
        background: overrides?.background ?? DEFAULT_SUCCESS_COLOR,
        text: overrides?.text ?? DEFAULT_SUCCESS_TEXT
      };
    }

    if (status === 'error') {
      return {
        label: 'Try again',
        background: overrides?.background ?? DEFAULT_ERROR_COLOR,
        text: overrides?.text ?? DEFAULT_ERROR_TEXT
      };
    }

    return {
      label: 'Check answer',
      background: overrides?.background ?? accentColor ?? DEFAULT_IDLE_COLOR,
      text: overrides?.text ?? idleTextColor ?? DEFAULT_IDLE_TEXT
    };
  }, [status, statusColors, accentColor, idleTextColor]);

  const baseClasses =
    'inline-flex items-center justify-center px-6 py-2 rounded-xl font-semibold shadow-lg transition-all duration-200 min-w-[168px] disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent';

  return (
    <button
      type="button"
      {...buttonProps}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`${baseClasses} ${className}`.trim()}
      style={{
        backgroundColor: background,
        color: text,
        boxShadow: '0 16px 32px rgba(15, 23, 42, 0.22)',
        ...style
      }}
      data-validation-status={status}
    >
      {label}
    </button>
  );
};

export default ValidateButton;
