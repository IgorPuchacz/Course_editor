import React from 'react';
import { CheckCircle2, ShieldCheck, XCircle } from 'lucide-react';
import { getReadableTextColor, lightenColor, darkenColor } from '../../../utils/colorUtils';

export type ValidationStatus = 'idle' | 'correct' | 'incorrect';

interface ValidateButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  status?: ValidationStatus;
  accentColor?: string;
  textColor?: string;
}

const STATUS_LABELS: Record<ValidationStatus, string> = {
  idle: 'Check answer',
  correct: 'Correct!',
  incorrect: 'Try again'
};

const STATUS_ICONS: Record<ValidationStatus, React.ReactNode> = {
  idle: <ShieldCheck className="w-4 h-4" aria-hidden="true" />,
  correct: <CheckCircle2 className="w-4 h-4" aria-hidden="true" />,
  incorrect: <XCircle className="w-4 h-4" aria-hidden="true" />
};

export const ValidateButton: React.FC<ValidateButtonProps> = ({
  status = 'idle',
  accentColor = '#0f172a',
  textColor,
  disabled,
  className = '',
  onClick,
  ...props
}) => {
  const baseTextColor = textColor ?? getReadableTextColor(accentColor);

  const getBackgroundColor = (): string => {
    switch (status) {
      case 'correct':
        return lightenColor('#22c55e', 0.15);
      case 'incorrect':
        return lightenColor('#f97316', 0.35);
      default:
        return lightenColor(accentColor, 0.06);
    }
  };

  const getBorderColor = (): string => {
    switch (status) {
      case 'correct':
        return '#15803d';
      case 'incorrect':
        return '#ea580c';
      default:
        return darkenColor(accentColor, 0.12);
    }
  };

  const getTextColor = (): string => {
    switch (status) {
      case 'correct':
        return '#14532d';
      case 'incorrect':
        return '#7c2d12';
      default:
        return baseTextColor;
    }
  };

  const combinedClassName = `inline-flex min-w-[160px] items-center justify-center gap-2 rounded-xl border px-5 py-2 text-sm font-semibold shadow-sm transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 hover:-translate-y-0.5 hover:shadow-md ${className}`;

  return (
    <button
      type="button"
      onClick={onClick}
      className={combinedClassName}
      style={{
        backgroundColor: getBackgroundColor(),
        borderColor: getBorderColor(),
        color: getTextColor()
      }}
      disabled={disabled}
      {...props}
    >
      {STATUS_ICONS[status]}
      <span>{STATUS_LABELS[status]}</span>
    </button>
  );
};

export default ValidateButton;
