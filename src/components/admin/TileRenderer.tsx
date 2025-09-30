import React from 'react';
import { Play, Code2 } from 'lucide-react';
import { GridUtils } from '../../utils/gridUtils';
import {
  getReadableTextColor,
  darkenColor,
  surfaceColor,
} from '../../utils/colorUtils';
import { Editor } from '@tiptap/react';
import { LessonTile, TextTile, ImageTile, QuizTile, ProgrammingTile, SequencingTile, MatchPairsTile } from '../../types/lessonEditor';
import { SequencingInteractive } from './SequencingInteractive';
import { MatchPairsInteractive } from './MatchPairsInteractive';
import { TaskInstructionPanel } from './common/TaskInstructionPanel';
import { QuizInteractive } from './QuizInteractive';
import { RichTextEditor, createRichTextAdapter, RichTextEditorProps } from './common/RichTextEditor';
import { TileFrame } from './tiles/TileFrame';

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
  matchPairs: MatchPairsTileRenderer,
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

  const handleDoubleClick =
    tile.type === 'sequencing' || tile.type === 'matchPairs' ? undefined : onDoubleClick;


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
      onDoubleClick={handleDoubleClick}
      onDelete={onDelete}
    >
      {() => (
        <div className="w-full h-full overflow-hidden">
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
