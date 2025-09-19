import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface TileInstructionPanelProps {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  iconBackground?: string;
  iconColor?: string;
  labelColor?: string;
  meta?: React.ReactNode;
}

const combineClasses = (...classes: Array<string | undefined>) =>
  classes.filter(Boolean).join(' ');

export const TileInstructionPanel: React.FC<TileInstructionPanelProps> = ({
  icon: Icon,
  label,
  children,
  className,
  contentClassName,
  iconBackground,
  iconColor,
  labelColor,
  meta
}) => {
  return (
    <div className={combineClasses('flex flex-col', className)}>
      <div className="flex items-start justify-between gap-4 pb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
            style={{ backgroundColor: iconBackground, color: iconColor }}
          >
            <Icon className="w-4 h-4" />
          </div>
          <span
            className="text-lg uppercase tracking-[0.10em] font-semibold"
            style={{ color: labelColor }}
          >
            {label}
          </span>
        </div>
        {meta ? <div className="flex-shrink-0">{meta}</div> : null}
      </div>

      <div className={combineClasses('leading-relaxed', contentClassName)}>{children}</div>
    </div>
  );
};
