import React from 'react';

type PaddingValue = React.CSSProperties['padding'];

type Elevation = 'none' | 'sm' | 'md';

const elevationClassNames: Record<Elevation, string> = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
};

export interface TileChromeProps {
  backgroundColor?: string;
  showBorder?: boolean;
  borderColor?: string;
  padding?: PaddingValue;
  className?: string;
  contentClassName?: string;
  style?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
  elevation?: Elevation;
  children?: React.ReactNode;
}

const joinClassNames = (...values: Array<string | undefined | false>) =>
  values.filter(Boolean).join(' ');

export const TileChrome: React.FC<TileChromeProps> = ({
  backgroundColor = '#ffffff',
  showBorder = true,
  borderColor = 'rgba(15, 23, 42, 0.08)',
  padding,
  className,
  contentClassName,
  style,
  contentStyle,
  elevation = 'none',
  children,
}) => {
  return (
    <div
      className={joinClassNames(
        'w-full h-full overflow-hidden rounded-xl',
        elevationClassNames[elevation],
        className,
      )}
      style={{
        borderRadius: 'inherit',
        backgroundColor,
        border: showBorder ? `1px solid ${borderColor}` : 'none',
        ...style,
      }}
    >
      <div
        className={joinClassNames('w-full h-full', contentClassName)}
        style={{
          padding,
          ...contentStyle,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default TileChrome;
