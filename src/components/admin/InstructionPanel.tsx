import React from 'react';

interface InstructionPanelProps {
  icon: React.ReactNode;
  title: string;
  className?: string;
  containerStyle?: React.CSSProperties;
  chipStyle?: React.CSSProperties;
  titleStyle?: React.CSSProperties;
  contentClassName?: string;
  children: React.ReactNode;
}

const combineClassNames = (...classes: Array<string | undefined>): string =>
  classes.filter(Boolean).join(' ');

export const InstructionPanel: React.FC<InstructionPanelProps> = ({
  icon,
  title,
  className,
  containerStyle,
  chipStyle,
  titleStyle,
  contentClassName,
  children
}) => {
  return (
    <div
      className={combineClassNames(
        'flex flex-col rounded-2xl border transition-colors duration-300 overflow-hidden',
        className
      )}
      style={containerStyle}
    >
      <div className="px-5 pt-5 pb-3 flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
          style={chipStyle}
        >
          {icon}
        </div>
        <div className="flex flex-col">
          <span
            className="text-lg uppercase tracking-[0.10em] font-semibold"
            style={titleStyle}
          >
            {title}
          </span>
        </div>
      </div>
      <div className={combineClassNames('px-5 pb-5 h-full', contentClassName)}>
        {children}
      </div>
    </div>
  );
};
