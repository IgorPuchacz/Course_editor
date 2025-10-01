import React from 'react';
import { getReadableTextColor } from '../../../utils/colorUtils';

export type ValidateButtonStatus = 'idle' | 'correct' | 'incorrect';

const STATUS_LABELS: Record<ValidateButtonStatus, string> = {
  idle: 'Check answer',
  correct: 'Correct!',
  incorrect: 'Try again'
};

const SUCCESS_COLOR = '#22c55e';
const ERROR_COLOR = '#ef4444';
const DEFAULT_ACCENT = '#0f172a';

export interface ValidateButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  status?: ValidateButtonStatus;
  accentColor?: string;
  textColor?: string;
}

export const ValidateButton: React.FC<ValidateButtonProps> = ({
  status = 'idle',
  accentColor = DEFAULT_ACCENT,
  textColor,
  disabled,
  className = '',
  style,
  children,
  ...props
}) => {
  const baseTextColor = textColor ?? getReadableTextColor(accentColor);
  const stylesByStatus: Record<ValidateButtonStatus, React.CSSProperties> = {
    idle: {
      backgroundColor: accentColor,
      color: baseTextColor
    },
    correct: {
      backgroundColor: SUCCESS_COLOR,
      color: getReadableTextColor(SUCCESS_COLOR)
    },
    incorrect: {
      backgroundColor: ERROR_COLOR,
      color: getReadableTextColor(ERROR_COLOR)
    }
  };

  const statusLabel = STATUS_LABELS[status];

  return (
    <button
      type="button"
      disabled={disabled}
      className={`inline-flex h-11 w-44 items-center justify-center rounded-xl text-sm font-semibold shadow-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black/20 disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
      style={{
        ...stylesByStatus[status],
        ...style
      }}
      {...props}
    >
      {children ?? statusLabel}
    </button>
  );
};

export default ValidateButton;
