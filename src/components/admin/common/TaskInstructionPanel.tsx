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
    <div className={`rounded-2xl ${className}`} style={style}>
      <div className={headerClassName ?? 'px-5 pt-5 pb-3 flex items-center gap-3'}>
        <div
          className={iconWrapperClassName ?? 'w-9 h-9 rounded-xl flex items-center justify-center shadow-sm'}
          style={iconWrapperStyle}
        >
          {icon}
        </div>
        <div className="flex flex-col">
          <span
            className={labelClassName ?? 'text-lg uppercase tracking-[0.10em] font-semibold'}
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
