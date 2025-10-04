import React from 'react';
import { Editor } from '@tiptap/react';
import { LessonTile, ImageTile } from 'tiles-core';
import { TileFrame } from './TileFrame';
import { BaseTileRendererProps } from './shared';
import { BlanksTileRenderer } from '../tiles/blanks';
import { ImageTileRenderer } from '../tiles/image';
import { ProgrammingTileRenderer } from '../tiles/programming';
import { QuizTileRenderer } from '../tiles/quiz';
import { SequencingTileRenderer } from '../tiles/sequencing';
import { OpenTileRenderer } from '../tiles/open';
import { TextTileRenderer } from '../tiles/text';
import { PairingTileRenderer } from '../tiles/pairing';

interface TileRendererProps {
  tile: LessonTile;
  isSelected: boolean;
  isEditing: boolean;
  isEditingText: boolean;
  isImageEditing: boolean;
  isTestingMode?: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onImageMouseDown: (e: React.MouseEvent, tile?: ImageTile) => void;
  isDraggingImage: boolean;
  onDoubleClick: () => void;
  onUpdateTile: (tileId: string, updates: Partial<LessonTile>) => void;
  onDelete: (tileId: string) => void;
  onFinishTextEditing: () => void;
  showGrid: boolean;
  onEditorReady: (editor: Editor | null) => void;
}

const TILE_RENDERERS: Partial<Record<LessonTile['type'], React.ComponentType<any>>> = {
  text: TextTileRenderer,
  image: ImageTileRenderer,
  programming: ProgrammingTileRenderer,
  quiz: QuizTileRenderer,
  sequencing: SequencingTileRenderer,
  blanks: BlanksTileRenderer,
  open: OpenTileRenderer,
  pairing: PairingTileRenderer,
};

export const TileRenderer: React.FC<TileRendererProps> = ({
  tile,
  isSelected,
  isEditing,
  isImageEditing,
  isTestingMode = false,
  onMouseDown,
  onImageMouseDown,
  isDraggingImage,
  isEditingText,
  onDoubleClick,
  onUpdateTile,
  onDelete,
  onFinishTextEditing,
  showGrid,
  onEditorReady,
}) => {
  const tileContent = tile.content ?? {};
  const hasBackgroundColor =
    typeof tileContent.backgroundColor === 'string' && tileContent.backgroundColor.trim().length > 0;
  const backgroundColor = hasBackgroundColor ? tileContent.backgroundColor : '#ffffff';
  const showBorder = typeof tileContent.showBorder === 'boolean' ? tileContent.showBorder : true;

  const isFramelessTextTile = tile.type === 'text' && !showBorder;
  const Renderer = TILE_RENDERERS[tile.type];

  const rendererProps: BaseTileRendererProps = {
    tile,
    isSelected,
    isEditing,
    isEditingText,
    isImageEditing,
    isTestingMode,
    isDraggingImage,
    onDoubleClick,
    onUpdateTile,
    onFinishTextEditing,
    onEditorReady,
    backgroundColor,
    showBorder,
    onImageMouseDown,
  };

  return (
    <TileFrame
      tile={tile}
      isSelected={isSelected}
      isEditing={isEditing}
      isEditingText={isEditingText}
      isImageEditing={isImageEditing}
      isTestingMode={isTestingMode}
      isDraggingImage={isDraggingImage}
      showGrid={showGrid}
      isFramelessTextTile={isFramelessTextTile}
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      onDelete={onDelete}
    >
      {() => (
        <div className="w-full h-full overflow-hidden" style={{ borderRadius: 'inherit' }}>
          {Renderer ? (
            <Renderer {...rendererProps} />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                borderRadius: 'inherit',
                backgroundColor,
                border: showBorder ? '1px solid rgba(0, 0, 0, 0.08)' : 'none',
              }}
            >
              <span className="text-gray-500 text-sm">Nieznany typ kafelka</span>
            </div>
          )}
        </div>
      )}
    </TileFrame>
  );
};
