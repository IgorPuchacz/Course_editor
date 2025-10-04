import React from 'react';

export interface TileSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title: React.ReactNode;
  icon?: React.ReactNode;
  headerClassName?: string;
  headerStyle?: React.CSSProperties;
  titleClassName?: string;
  titleStyle?: React.CSSProperties;
  contentClassName?: string;
  contentStyle?: React.CSSProperties;
}

export const TileSection: React.FC<TileSectionProps> = ({
  title,
  icon,
  className = '',
  headerClassName,
  headerStyle,
  titleClassName,
  titleStyle,
  contentClassName,
  contentStyle,
  children,
  ...rest
}) => {
  const containerClassName = [`flex flex-col rounded-2xl border`, className].filter(Boolean).join(' ');

  const headerBaseClasses = [
    'flex items-center',
    headerClassName ?? 'px-5 py-4 border-b'
  ]
    .filter(Boolean)
    .join(' ');

  const titleClasses = ['flex items-center gap-2 text-sm font-semibold', titleClassName]
    .filter(Boolean)
    .join(' ');

  const contentClasses = contentClassName ?? 'flex-1 px-5 py-4';

  return (
    <div className={containerClassName} {...rest}>
      <div className={headerBaseClasses} style={headerStyle}>
        <div className={titleClasses} style={titleStyle}>
          {icon && <span className="flex items-center justify-center">{icon}</span>}
          {typeof title === 'string' ? <span>{title}</span> : title}
        </div>
      </div>
      <div className={contentClasses} style={contentStyle}>
        {children}
      </div>
    </div>
  );
};

export default TileSection;
