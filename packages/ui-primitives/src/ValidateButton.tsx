import React from 'react';

export type ValidateButtonState = 'idle' | 'success' | 'error';

interface ValidateButtonProps {
  state: ValidateButtonState;
  onClick: () => void;
  onRetry?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const LABELS: Record<ValidateButtonState, string> = {
  idle: 'Sprawdź odpowiedź',
  success: 'Dobrze!',
  error: 'Spróbuj ponownie'
};

const COLORS: Record<ValidateButtonState, { background: string; color: string; border: string }> = {
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

export const ValidateButton: React.FC<ValidateButtonProps> = ({
  state,
  onClick,
  onRetry,
  disabled = false,
  type = 'button'
}) => {
  const label = LABELS[state];
  const { background, color, border } = COLORS[state];

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
    borderColor: border,
    boxShadow: '0 16px 32px rgba(15, 23, 42, 0.18)',
    flexShrink: 0
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className="inline-flex h-11 min-w-[220px] w-full max-w-[360px] sm:w-[60%] items-center justify-center gap-2 rounded-xl border font-semibold text-sm transition-transform duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-900/20 disabled:cursor-not-allowed disabled:opacity-60 hover:-translate-y-0.5 active:translate-y-0"
      style={buttonStyle}
      data-state={state}
    >
      {label}
    </button>
  );
};

export default ValidateButton;
