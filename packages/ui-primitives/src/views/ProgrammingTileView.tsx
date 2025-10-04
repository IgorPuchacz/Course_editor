import React from 'react';
import { ProgrammingTile } from 'tiles-core';
import { TaskInstructionPanel } from '../../../ui-primitives';
import { darkenColor, getReadableTextColor, surfaceColor } from 'tiles-core/utils';
import { TileChrome } from '../TileChrome';

export interface ProgrammingTileViewProps {
  tile: ProgrammingTile;
  className?: string;
  style?: React.CSSProperties;
  contentClassName?: string;
  contentStyle?: React.CSSProperties;
}

const joinClassNames = (...values: Array<string | undefined | false>) =>
  values.filter(Boolean).join(' ');

export const ProgrammingTileView: React.FC<ProgrammingTileViewProps> = ({
  tile,
  className,
  style,
  contentClassName,
  contentStyle,
}) => {
  const accentColor = tile.content.backgroundColor || '#0f172a';
  const textColor = getReadableTextColor(accentColor);
  const panelBackground = surfaceColor(accentColor, textColor, 0.6, 0.4);
  const panelBorder = surfaceColor(accentColor, textColor, 0.5, 0.55);
  const iconBackground = surfaceColor(accentColor, textColor, 0.52, 0.48);

  const codeLines = [
    tile.content.startingCode,
    tile.content.code,
    tile.content.endingCode,
  ]
    .filter(Boolean)
    .join('\n\n');

  return (
    <TileChrome
      backgroundColor={accentColor}
      showBorder={tile.content.showBorder !== false}
      padding="1.5rem"
      className={className}
      style={style}
      contentClassName={joinClassNames('flex flex-col gap-5', contentClassName)}
      contentStyle={{
        color: textColor,
        ...contentStyle,
      }}
    >
      <TaskInstructionPanel
        icon={<span className="text-xs font-semibold">{tile.content.language?.toUpperCase() ?? 'CODE'}</span>}
        label="Opis zadania"
        className="border"
        style={{
          backgroundColor: panelBackground,
          borderColor: panelBorder,
          color: textColor,
        }}
        iconWrapperClassName="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
        iconWrapperStyle={{
          backgroundColor: iconBackground,
          color: textColor,
        }}
        labelStyle={{ color: textColor === '#0f172a' ? '#475569' : '#dbeafe' }}
      >
        <div
          className="text-sm leading-relaxed"
          style={{
            fontFamily: tile.content.fontFamily,
            fontSize: `${tile.content.fontSize}px`,
          }}
          dangerouslySetInnerHTML={{
            __html: tile.content.richDescription || `<p>${tile.content.description}</p>`
          }}
        />
      </TaskInstructionPanel>

      <div
        className="flex-1 min-h-0 rounded-xl border overflow-hidden"
        style={{
          borderColor: darkenColor(accentColor, textColor === '#0f172a' ? 0.35 : 0.6),
          backgroundColor: darkenColor(accentColor, textColor === '#0f172a' ? 0.6 : 0.78),
        }}
      >
        <pre className="h-full w-full overflow-auto p-5 text-sm font-mono" style={{ color: '#f8fafc' }}>
          {codeLines || 'Przykładowy kod pojawi się tutaj.'}
        </pre>
      </div>
    </TileChrome>
  );
};

export default ProgrammingTileView;
