import React from 'react';

export type ValidationState = 'idle' | 'success' | 'error';

export interface ValidationButtonColorConfig {
  background: string;
  color: string;
  border?: string;
}

export type ValidationButtonColors = Partial<
  Record<ValidationState, Partial<ValidationButtonColorConfig>>
>;

export type ValidationButtonLabels = Partial<Record<ValidationState, React.ReactNode>>;

export interface ValidationButtonProps {
  state: ValidationState;
  onClick: () => void;
  onRetry?: () => void;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  colors?: ValidationButtonColors;
  labels?: ValidationButtonLabels;
  type?: 'button' | 'submit' | 'reset';
}

const DEFAULT_LABELS: Record<ValidationState, React.ReactNode> = {
  idle: 'Check answer',
  success: 'Correct!',
  error: 'Try again'
};

const DEFAULT_COLORS: Record<ValidationState, ValidationButtonColorConfig> = {
  idle: {
    background: '#0f172a',
    color: '#f8fafc',
    border: 'transparent'
  },
  success: {
    background: '#dcfce7',
    color: '#166534',
    border: '#86efac'
  },
  error: {
    background: '#fee2e2',
    color: '#b91c1c',
    border: '#fca5a5'
  }
};

const mergeColorConfig = (
  state: ValidationState,
  overrides?: ValidationButtonColors
): ValidationButtonColorConfig => {
  const base = DEFAULT_COLORS[state];
  if (!overrides || !overrides[state]) {
    return base;
  }

  const override = overrides[state]!;
  return {
    background: override.background ?? base.background,
    color: override.color ?? base.color,
    border: override.border ?? base.border
  };
};

export const ValidationButton: React.FC<ValidationButtonProps> = ({
  state,
  onClick,
  onRetry,
  disabled = false,
  className = '',
  style,
  colors,
  labels,
  type = 'button'
}) => {
  const label = labels?.[state] ?? DEFAULT_LABELS[state];
  const { background, color, border } = mergeColorConfig(state, colors);

  const handleClick = React.useCallback(() => {
    if (disabled) return;

    if (state === 'error' && onRetry) {
      onRetry();
      return;
    }

    onClick();
  }, [disabled, state, onRetry, onClick]);

  const buttonStyle: React.CSSProperties = {
    backgroundColor: background,
    color,
    borderColor: border ?? 'transparent',
    boxShadow: '0 16px 32px rgba(15, 23, 42, 0.18)',
    flexShrink: 0,
    ...style
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className={[
        'inline-flex h-11 min-w-[220px] w-full max-w-[360px] sm:w-[60%] items-center justify-center gap-2 rounded-xl border font-semibold text-sm transition-transform duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-900/20 disabled:cursor-not-allowed disabled:opacity-60 hover:-translate-y-0.5 active:translate-y-0',
        className
      ]
        .filter(Boolean)
        .join(' ')}
      style={buttonStyle}
      data-state={state}
    >
      {label}
    </button>
  );
};

export default ValidationButton;
