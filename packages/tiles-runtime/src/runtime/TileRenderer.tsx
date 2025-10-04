import React from 'react';
import { LessonTile } from 'tiles-core';
import { QuizInteractive } from '../quiz/Interactive';
import { BlanksInteractive } from '../blanks/Interactive';
import { OpenInteractive } from '../open/Interactive';
import { PairingInteractive } from '../pairing/Interactive';
import { SequencingInteractive } from '../sequencing/Interactive';
import { TextTileInteractive } from '../text/Interactive';
import { ImageTileInteractive } from '../image/Interactive';
import { ProgrammingTileInteractive } from '../programming/Interactive';

const TILE_RENDERERS: Partial<Record<LessonTile['type'], React.ComponentType<any>>> = {
  text: TextTileInteractive,
  image: ImageTileInteractive,
  programming: ProgrammingTileInteractive,
  quiz: QuizInteractive,
  sequencing: SequencingInteractive,
  blanks: BlanksInteractive,
  open: OpenInteractive,
  pairing: PairingInteractive
};

export interface RuntimeTileRendererProps {
  tile: LessonTile;
  isTestingMode?: boolean;
}

export const RuntimeTileRenderer: React.FC<RuntimeTileRendererProps> = ({
  tile,
  isTestingMode = false
}) => {
  const tileContent = tile.content ?? {} as Record<string, any>;
  const backgroundColor =
    typeof tileContent.backgroundColor === 'string' && tileContent.backgroundColor.trim().length > 0
      ? tileContent.backgroundColor
      : '#ffffff';
  const showBorder =
    typeof tileContent.showBorder === 'boolean' ? tileContent.showBorder : true;
  const Renderer = TILE_RENDERERS[tile.type];

  if (!Renderer) {
    return (
      <div
        className="w-full h-full flex items-center justify-center"
        style={{
          borderRadius: 'inherit',
          backgroundColor,
          border: showBorder ? '1px solid rgba(0, 0, 0, 0.08)' : 'none'
        }}
      >
        <span className="text-gray-500 text-sm">Nieznany typ kafelka</span>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full overflow-hidden"
      style={{
        borderRadius: 'inherit',
        backgroundColor,
        border: showBorder ? '1px solid rgba(0, 0, 0, 0.08)' : 'none'
      }}
    >
      <Renderer tile={tile} isPreview={!isTestingMode} isTestingMode={isTestingMode} />
    </div>
  );
};

export default RuntimeTileRenderer;
