import React from 'react';
import { Code2, LucideIcon } from 'lucide-react';

interface TaskInstructionPanelProps {
  icon?: LucideIcon;
  title?: string;
  textColor: string;
  mutedTextColor?: string;
  chipBackground?: string;
  containerStyle?: React.CSSProperties;
  className?: string;
  metaSlot?: React.ReactNode;
  onDoubleClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  children: React.ReactNode;
}

export const TaskInstructionPanel: React.FC<TaskInstructionPanelProps> = ({
  icon: Icon = Code2,
  title = 'Zadanie',
  textColor,
  mutedTextColor,
  chipBackground,
  containerStyle,
  className = '',
  metaSlot,
  onDoubleClick,
  children
}) => {
  const resolvedMuted =
    mutedTextColor ?? (textColor === '#0f172a' ? 'rgba(15, 23, 42, 0.65)' : 'rgba(248, 250, 252, 0.82)');
  const resolvedChipBackground =
    chipBackground ?? (textColor === '#0f172a' ? 'rgba(15, 23, 42, 0.12)' : 'rgba(248, 250, 252, 0.18)');

  return (
    <div
      className={`flex-shrink-0 overflow-hidden rounded-2xl border transition-colors duration-300 ${className}`}
      style={containerStyle}
      onDoubleClick={onDoubleClick}
    >
      <div className="px-5 pt-5 pb-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
            style={{ backgroundColor: resolvedChipBackground, color: textColor }}
          >
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg uppercase tracking-[0.10em] font-semibold" style={{ color: resolvedMuted }}>
              {title}
            </span>
          </div>
        </div>
        {metaSlot ? <div className="flex-shrink-0 text-xs font-medium" style={{ color: resolvedMuted }}>{metaSlot}</div> : null}
      </div>
      <div className="px-5 pb-5 h-full" style={{ color: textColor }}>
        {children}
      </div>
    </div>
  );
};
