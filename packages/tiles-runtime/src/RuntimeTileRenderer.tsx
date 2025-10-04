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
import type { TileChromeProps } from 'ui-primitives';
import { TileChrome, TaskInstructionPanel } from 'ui-primitives';
import { TextTileView, ImageTileView, ProgrammingTileView } from './views';
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

type RuntimeMode = 'preview' | 'student';

interface RuntimeTileRendererProps {
  tile: LessonTile;
  mode?: RuntimeMode;
}

const deriveChromeAppearance = (
  tile: LessonTile,
): Pick<TileChromeProps, 'backgroundColor' | 'showBorder'> => {
  const content = tile.content as {
    backgroundColor?: string;
    showBorder?: boolean;
  };

  return {
    backgroundColor: content.backgroundColor ?? '#ffffff',
    showBorder: content.showBorder !== false,
  };
};

export const RuntimeTileRenderer: React.FC<RuntimeTileRendererProps> = ({ tile, mode = 'preview' }) => {
  switch (tile.type) {
    case 'text':
      return <TextTileView tile={tile as TextTile} />;
    case 'image':
      return <ImageTileView tile={tile as ImageTile} />;
    case 'quiz':
      return (
        <TileChrome {...deriveChromeAppearance(tile)}>
          <QuizInteractive tile={tile as QuizTile} isPreview />
        </TileChrome>
      );
    case 'blanks':
      return (
        <TileChrome {...deriveChromeAppearance(tile)}>
          <BlanksInteractive tile={tile as BlanksTile} isPreview />
        </TileChrome>
      );
    case 'open':
      return (
        <TileChrome {...deriveChromeAppearance(tile)}>
          <OpenInteractive tile={tile as OpenTile} isPreview />
        </TileChrome>
      );
    case 'sequencing':
      return (
        <TileChrome {...deriveChromeAppearance(tile)}>
          <SequencingInteractive tile={tile as SequencingTile} isPreview={mode !== 'student'} />
        </TileChrome>
      );
    case 'pairing':
      return (
        <TileChrome {...deriveChromeAppearance(tile)}>
          <PairingInteractive tile={tile as PairingTile} isPreview />
        </TileChrome>
      );
    case 'programming':
      return <ProgrammingTileView tile={tile as ProgrammingTile} />;
    default:
      return (
        <TileChrome {...deriveChromeAppearance(tile)} contentClassName="flex items-center justify-center">
          <div className="text-sm text-slate-500 p-4 text-center w-full">
            Podgląd dla tego typu kafelka nie jest jeszcze dostępny.
          </div>
        </TileChrome>
      );
  }
};

export default RuntimeTileRenderer;
