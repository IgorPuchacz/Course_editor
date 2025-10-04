import React from 'react';
import { TextTile } from 'tiles-core';
import { getReadableTextColor } from 'tiles-core/utils';
import { TileChrome } from '../TileChrome';

export interface TextTileViewProps {
  tile: TextTile;
  className?: string;
  style?: React.CSSProperties;
  contentClassName?: string;
  contentStyle?: React.CSSProperties;
}

const joinClassNames = (...values: Array<string | undefined | false>) =>
  values.filter(Boolean).join(' ');

export const TextTileView: React.FC<TextTileViewProps> = ({
  tile,
  className,
  style,
  contentClassName,
  contentStyle,
}) => {
  const textColor = getReadableTextColor(tile.content.backgroundColor || '#ffffff');
  const verticalAlign = tile.content.verticalAlign ?? 'top';

  return (
    <TileChrome
      backgroundColor={tile.content.backgroundColor || '#ffffff'}
      showBorder={tile.content.showBorder !== false}
      padding="1rem"
      className={className}
      style={style}
      contentClassName={joinClassNames('overflow-hidden flex flex-col', contentClassName)}
      contentStyle={{
        color: textColor,
        fontFamily: tile.content.fontFamily,
        fontSize: `${tile.content.fontSize}px`,
        justifyContent:
          verticalAlign === 'center'
            ? 'center'
            : verticalAlign === 'bottom'
              ? 'flex-end'
              : 'flex-start',
        ...contentStyle,
      }}
    >
      <div
        className="rich-text-content break-words"
        style={{ minHeight: '1em' }}
        dangerouslySetInnerHTML={{
          __html: tile.content.richText || `<p>${tile.content.text}</p>`
        }}
      />
    </TileChrome>
  );
};

export default TextTileView;
