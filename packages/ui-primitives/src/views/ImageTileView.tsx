import React from 'react';
import { ImageTile } from 'tiles-core';
import { TileChrome } from '../TileChrome';

export interface ImageTileViewProps {
  tile: ImageTile;
  className?: string;
  style?: React.CSSProperties;
  contentClassName?: string;
  imageWrapperProps?: React.HTMLAttributes<HTMLDivElement>;
  imageProps?: React.ImgHTMLAttributes<HTMLImageElement>;
  captionProps?: React.HTMLAttributes<HTMLDivElement>;
  useContainLayout?: boolean;
}

const joinClassNames = (...values: Array<string | undefined | false>) =>
  values.filter(Boolean).join(' ');

export const ImageTileView: React.FC<ImageTileViewProps> = ({
  tile,
  className,
  style,
  contentClassName,
  imageWrapperProps,
  imageProps,
  captionProps,
  useContainLayout = true,
}) => {
  const caption = tile.content.caption;
  const baseImageClassName = useContainLayout
    ? 'absolute inset-0 h-full w-full object-contain'
    : 'absolute';

  return (
    <TileChrome
      backgroundColor={(tile.content as { backgroundColor?: string }).backgroundColor || '#ffffff'}
      showBorder={(tile.content as { showBorder?: boolean }).showBorder !== false}
      className={className}
      style={style}
      contentClassName={joinClassNames('flex flex-col', contentClassName)}
    >
      <div
        {...imageWrapperProps}
        className={joinClassNames('flex-1 relative bg-slate-100', imageWrapperProps?.className)}
        style={{
          ...imageWrapperProps?.style,
        }}
      >
        <img
          {...imageProps}
          src={imageProps?.src ?? tile.content.url}
          alt={imageProps?.alt ?? tile.content.alt}
          className={joinClassNames(baseImageClassName, imageProps?.className)}
          style={{
            ...imageProps?.style,
          }}
        />
      </div>
      {caption ? (
        <div
          {...captionProps}
          className={joinClassNames(
            'px-4 py-3 text-sm text-slate-600 border-t border-slate-200 bg-white',
            captionProps?.className,
          )}
          style={{
            ...captionProps?.style,
          }}
        >
          {caption}
        </div>
      ) : null}
    </TileChrome>
  );
};

export default ImageTileView;
