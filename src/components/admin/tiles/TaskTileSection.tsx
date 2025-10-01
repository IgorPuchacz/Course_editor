import React from 'react';

export interface TaskTileSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: React.ReactNode;
  headerRight?: React.ReactNode;
  backgroundColor: string;
  borderColor: string;
  headerBorderColor?: string;
  headerTextColor?: string;
  className?: string;
  headerClassName?: string;
  headerContentClassName?: string;
  headerRightClassName?: string;
  contentClassName?: string;
  contentStyle?: React.CSSProperties;
  contentProps?: React.HTMLAttributes<HTMLDivElement>;
}

export const TaskTileSection: React.FC<TaskTileSectionProps> = ({
  icon,
  title,
  headerRight,
  backgroundColor,
  borderColor,
  headerBorderColor,
  headerTextColor,
  className = '',
  headerClassName = '',
  headerContentClassName = '',
  headerRightClassName = '',
  contentClassName = '',
  contentStyle,
  contentProps,
  style,
  children,
  ...rest
}) => {
  const headerTextStyles = headerTextColor ? { color: headerTextColor } : undefined;
  const mergedStyle = {
    backgroundColor,
    borderColor,
    ...(style ?? {})
  } satisfies React.CSSProperties;

  const {
    className: contentClassNameProp = '',
    style: contentStyleProp,
    ...contentRest
  } = contentProps ?? {};

  const mergedContentClassName = [
    'px-5 py-4',
    contentClassName,
    contentClassNameProp
  ].filter(Boolean).join(' ');

  const mergedContentStyle = {
    ...(contentStyle ?? {}),
    ...(contentStyleProp ?? {})
  } as React.CSSProperties;

  return (
    <div
      {...rest}
      className={['flex flex-col rounded-2xl border', className].filter(Boolean).join(' ')}
      style={mergedStyle}
    >
      <div
        className={[
          'flex items-center justify-between px-5 py-4 border-b',
          headerClassName
        ].filter(Boolean).join(' ')}
        style={{ borderColor: headerBorderColor ?? borderColor, ...headerTextStyles }}
      >
        <div
          className={['flex items-center gap-2 text-sm font-semibold', headerContentClassName].filter(Boolean).join(' ')}
          style={headerTextStyles}
        >
          {icon ? <span className="flex items-center justify-center">{icon}</span> : null}
          {typeof title === 'string' ? <span>{title}</span> : title}
        </div>

        {headerRight ? (
          <div
            className={['text-xs', headerRightClassName].filter(Boolean).join(' ')}
            style={headerTextStyles}
          >
            {headerRight}
          </div>
        ) : null}
      </div>

      <div
        {...contentRest}
        className={mergedContentClassName}
        style={mergedContentStyle}
      >
        {children}
      </div>
    </div>
  );
};

export default TaskTileSection;
