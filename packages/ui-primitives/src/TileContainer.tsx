import React from 'react';

const joinClassNames = (...values: Array<string | undefined | false>) =>
  values.filter(Boolean).join(' ');

const radiusClassNames = {
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
} as const;

type Radius = keyof typeof radiusClassNames;

type OverflowBehavior = 'hidden' | 'clip' | 'visible';

const overflowClassNames: Record<OverflowBehavior, string> = {
  hidden: 'overflow-hidden',
  clip: 'overflow-clip',
  visible: 'overflow-visible',
};

type Elevation = 'none' | 'sm' | 'md' | 'lg';

const elevationClassNames: Record<Elevation, string> = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-[0_16px_32px_rgba(15,23,42,0.12)]',
};

export interface TileContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  radius?: Radius;
  overflowBehavior?: OverflowBehavior;
  elevation?: Elevation;
  backgroundColor?: string;
  showBorder?: boolean;
  borderColor?: string;
}

export const TileContainer = React.forwardRef<HTMLDivElement, TileContainerProps>(
  (
    {
      radius = '3xl',
      overflowBehavior = 'hidden',
      elevation = 'lg',
      backgroundColor = '#ffffff',
      showBorder = false,
      borderColor = 'rgba(15, 23, 42, 0.08)',
      className,
      style,
      children,
      ...rest
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={joinClassNames(
          'w-full h-full',
          radiusClassNames[radius],
          overflowClassNames[overflowBehavior],
          elevationClassNames[elevation],
          showBorder && 'border',
          className,
        )}
        style={{
          backgroundColor,
          border: showBorder ? `1px solid ${borderColor}` : 'none',
          ...style,
        }}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

TileContainer.displayName = 'TileContainer';

export default TileContainer;
