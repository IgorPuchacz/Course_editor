import React from 'react';

interface TaskInstructionPanelProps {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  headerClassName?: string;
  iconWrapperClassName?: string;
  iconWrapperStyle?: React.CSSProperties;
  labelClassName?: string;
  labelStyle?: React.CSSProperties;
  bodyClassName?: string;
}

export const TaskInstructionPanel: React.FC<TaskInstructionPanelProps> = ({
  icon,
  label,
  children,
  className = '',
  style,
  headerClassName,
  iconWrapperClassName,
  iconWrapperStyle,
  labelClassName,
  labelStyle,
  bodyClassName
}) => {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm ${className}`}
      style={style}
    >
      <div className={headerClassName ?? 'px-5 pt-5 pb-3 flex items-center gap-3'}>
        <div
          className={
            iconWrapperClassName ?? 'w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 text-slate-600 shadow-sm'
          }
          style={iconWrapperStyle}
        >
          {icon}
        </div>
        <div className="flex flex-col">
          <span
            className={labelClassName ?? 'text-sm font-semibold uppercase tracking-[0.18em] text-slate-500'}
            style={labelStyle}
          >
            {label}
          </span>
        </div>
      </div>
      <div className={bodyClassName ?? 'px-5 pb-5 h-full'}>{children}</div>
    </div>
  );
};
