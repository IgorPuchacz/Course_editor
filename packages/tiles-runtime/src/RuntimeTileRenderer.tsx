import React from 'react';
import {
  LessonTile,
  TextTile,
  ImageTile,
  ProgrammingTile,
  QuizTile,
  BlanksTile,
  OpenTile,
  SequencingTile,
  PairingTile
} from 'tiles-core';
import { TaskInstructionPanel } from 'ui-primitives';
import {
  getReadableTextColor,
  surfaceColor,
  darkenColor
} from 'tiles-core/utils';
import { QuizInteractive } from './quiz';
import { BlanksInteractive } from './blanks';
import { OpenInteractive } from './open';
import { SequencingInteractive } from './sequencing';
import { PairingInteractive } from './pairing';

interface RuntimeTileRendererProps {
  tile: LessonTile;
}

const TextTileView: React.FC<{ tile: TextTile }> = ({ tile }) => {
  const textColor = getReadableTextColor(tile.content.backgroundColor || '#ffffff');
  const verticalAlign = tile.content.verticalAlign ?? 'top';

  return (
    <div
      className="w-full h-full overflow-hidden"
      style={{
        borderRadius: 'inherit',
        backgroundColor: tile.content.backgroundColor || '#ffffff',
        border: tile.content.showBorder ? '1px solid rgba(0, 0, 0, 0.08)' : 'none',
      }}
    >
      <div
        className="w-full h-full p-4 overflow-hidden"
        style={{
          color: textColor,
          fontFamily: tile.content.fontFamily,
          fontSize: `${tile.content.fontSize}px`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent:
            verticalAlign === 'center'
              ? 'center'
              : verticalAlign === 'bottom'
                ? 'flex-end'
                : 'flex-start',
        }}
      >
        <div
          className="rich-text-content"
          style={{ minHeight: '1em' }}
          dangerouslySetInnerHTML={{
            __html: tile.content.richText || `<p>${tile.content.text}</p>`
          }}
        />
      </div>
    </div>
  );
};

const ImageTileView: React.FC<{ tile: ImageTile }> = ({ tile }) => {
  return (
    <div
      className="w-full h-full overflow-hidden flex flex-col"
      style={{
        borderRadius: 'inherit',
        backgroundColor: '#ffffff',
        border: '1px solid rgba(15, 23, 42, 0.08)',
      }}
    >
      <div className="flex-1 relative bg-slate-100">
        <img
          src={tile.content.url}
          alt={tile.content.alt}
          className="absolute inset-0 h-full w-full object-contain"
        />
      </div>
      {tile.content.caption && (
        <div className="px-4 py-3 text-sm text-slate-600 border-t border-slate-200 bg-white">
          {tile.content.caption}
        </div>
      )}
    </div>
  );
};

const ProgrammingTileView: React.FC<{ tile: ProgrammingTile }> = ({ tile }) => {
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
    <div
      className="w-full h-full overflow-hidden"
      style={{
        borderRadius: 'inherit',
        backgroundColor: accentColor,
        border: tile.content.showBorder ? '1px solid rgba(15, 23, 42, 0.12)' : 'none',
      }}
    >
      <div className="w-full h-full flex flex-col gap-5 p-6" style={{ color: textColor }}>
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
            style={{ fontFamily: tile.content.fontFamily, fontSize: `${tile.content.fontSize}px` }}
            dangerouslySetInnerHTML={{
              __html: tile.content.richDescription || `<p>${tile.content.description}</p>`
            }}
          />
        </TaskInstructionPanel>

        <div className="flex-1 min-h-0 rounded-xl border overflow-hidden" style={{
          borderColor: darkenColor(accentColor, textColor === '#0f172a' ? 0.35 : 0.6),
          backgroundColor: darkenColor(accentColor, textColor === '#0f172a' ? 0.6 : 0.78),
        }}>
          <pre
            className="h-full w-full overflow-auto p-5 text-sm font-mono"
            style={{ color: '#f8fafc' }}
          >
            {codeLines || 'Przykładowy kod pojawi się tutaj.'}
          </pre>
        </div>
      </div>
    </div>
  );
};

const TileWrapper: React.FC<{ tile: LessonTile; children: React.ReactNode }> = ({ tile, children }) => {
  const backgroundColor =
    'backgroundColor' in (tile.content as Record<string, unknown>)
      ? (tile.content as { backgroundColor?: string }).backgroundColor ?? '#ffffff'
      : '#ffffff';
  const showBorder =
    'showBorder' in (tile.content as Record<string, unknown>)
      ? (tile.content as { showBorder?: boolean }).showBorder !== false
      : true;

  return (
    <div
      className="w-full h-full overflow-hidden"
      style={{
        borderRadius: 'inherit',
        backgroundColor,
        border: showBorder ? '1px solid rgba(15, 23, 42, 0.08)' : 'none',
      }}
    >
      {children}
    </div>
  );
};

export const RuntimeTileRenderer: React.FC<RuntimeTileRendererProps> = ({ tile }) => {
  switch (tile.type) {
    case 'text':
      return <TextTileView tile={tile} />;
    case 'image':
      return <ImageTileView tile={tile} />;
    case 'quiz':
      return (
        <TileWrapper tile={tile}>
          <QuizInteractive tile={tile as QuizTile} isPreview />
        </TileWrapper>
      );
    case 'blanks':
      return (
        <TileWrapper tile={tile}>
          <BlanksInteractive tile={tile as BlanksTile} isPreview />
        </TileWrapper>
      );
    case 'open':
      return (
        <TileWrapper tile={tile}>
          <OpenInteractive tile={tile as OpenTile} isPreview />
        </TileWrapper>
      );
    case 'sequencing':
      return (
        <TileWrapper tile={tile}>
          <SequencingInteractive tile={tile as SequencingTile} isPreview />
        </TileWrapper>
      );
    case 'pairing':
      return (
        <TileWrapper tile={tile}>
          <PairingInteractive tile={tile as PairingTile} isPreview />
        </TileWrapper>
      );
    case 'programming':
      return <ProgrammingTileView tile={tile as ProgrammingTile} />;
    default:
      return (
        <TileWrapper tile={tile}>
          <div className="w-full h-full flex items-center justify-center text-sm text-slate-500 p-4 text-center">
            Podgląd dla tego typu kafelka nie jest jeszcze dostępny.
          </div>
        </TileWrapper>
      );
  }
};

export default RuntimeTileRenderer;
