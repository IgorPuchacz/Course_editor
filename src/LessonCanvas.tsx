import React, { forwardRef } from 'react';
import type { Editor } from '@tiptap/react';
import { Type } from 'lucide-react';
import { LessonContent, LessonTile, EditorState } from './types/lessonEditor';
import { EditorAction } from './state/editorReducer';
import { TileRenderer } from './components/admin/TileRenderer';
import { GridUtils } from './utils/gridUtils';
import { useTileInteractions } from './hooks/useTileInteractions';

interface LessonCanvasProps {
  content: LessonContent;
  editorState: EditorState;
  dispatch: React.Dispatch<EditorAction>;
  onUpdateTile: (tileId: string, updates: Partial<LessonTile>) => void;
  onSelectTile: (tileId: string | null) => void;
  onDeleteTile: (tileId: string) => void;
  onAddTile: (tileType: string, position: { x: number; y: number }) => void;
  onFinishTextEditing: () => void;
  showGrid?: boolean;
  onEditorMount?: (editor: Editor | null) => void;
}

export const LessonCanvas = forwardRef<HTMLDivElement, LessonCanvasProps>(({ 
  content,
  editorState,
  dispatch,
  onUpdateTile,
  onSelectTile,
  onDeleteTile,
  onAddTile,
  onFinishTextEditing,
  showGrid = true,
  onEditorMount,
}, ref) => {
  const {
    dragPreview,
    handleTileDoubleClick,
    handleCanvasClick,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleTileMouseDown,
    handleImageMouseDown,
  } = useTileInteractions({
    content,
    editorState,
    dispatch,
    onUpdateTile,
    onSelectTile,
    onDeleteTile,
    onAddTile,
    canvasRef: ref as React.RefObject<HTMLDivElement>,
  });

  // Calculate canvas dimensions
  const canvasStyle = {
    width: GridUtils.GRID_COLUMNS * (content.canvas_settings.gridSize + GridUtils.GRID_GAP) - GridUtils.GRID_GAP,
    minHeight: content.canvas_settings.height * (content.canvas_settings.gridSize + GridUtils.GRID_GAP) - GridUtils.GRID_GAP
  };

  const renderGridBackground = () => {
    if (!showGrid) return null;
    
    const cellSize = content.canvas_settings.gridSize + GridUtils.GRID_GAP;
    
    return (
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, #e5e7eb 1px, transparent 1px),
            linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
          `,
          backgroundSize: `${cellSize}px ${cellSize}px`
        }}
      />
    );
  };

  const renderDragPreview = () => {
    if (!dragPreview) return null;
    
    const position = GridUtils.gridToPixel(dragPreview, content.canvas_settings);
    const size = GridUtils.gridSizeToPixel(dragPreview, content.canvas_settings);
    
    return (
      <div
        className="absolute bg-blue-200 border-2 border-blue-400 border-dashed rounded-lg pointer-events-none opacity-75"
        style={{
          left: position.x,
          top: position.y,
          width: size.width,
          height: size.height,
          zIndex: 5
        }}
      >
        <div className="w-full h-full flex items-center justify-center text-blue-600 text-sm font-medium">
          Nowy kafelek
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      <div
        ref={ref}
        className="relative bg-white border-2 border-gray-300 border-dashed rounded-lg mx-auto"
        style={canvasStyle}
        onClick={handleCanvasClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* Grid Background */}
        {renderGridBackground()}
        
        {/* Drag Preview */}
        {renderDragPreview()}

        {/* Render Tiles */}
        {content.tiles.map((tile) => (
          <TileRenderer
            key={`${tile.id}-${tile.updated_at}`}
            tile={tile}
            isSelected={editorState.selectedTileId === tile.id}
            isEditing={editorState.mode === 'editing' && editorState.selectedTileId === tile.id}
            isEditingText={editorState.mode === 'textEditing' && editorState.selectedTileId === tile.id}
            isImageEditing={editorState.mode === 'imageEditing' && editorState.selectedTileId === tile.id}
            onMouseDown={(e) => handleTileMouseDown(e, tile)}
            onImageMouseDown={(e) => handleImageMouseDown(e, tile)}
            isDraggingImage={editorState.interaction.type === 'imageDrag'}
            onDoubleClick={() => handleTileDoubleClick(tile)}
            onUpdateTile={onUpdateTile}
            onDelete={onDeleteTile}
            onFinishTextEditing={onFinishTextEditing}
            onEditorMount={onEditorMount}
            showGrid={showGrid}
          />
        ))}

        {/* Empty State */}
        {content.tiles.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <Type className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Rozpocznij tworzenie lekcji</h3>
              <p className="text-sm max-w-md">Przeciągnij kafelki z lewego panelu na planszę lub kliknij je, aby dodać zawartość</p>
            </div>
          </div>
        )}
      </div>

      {/* Canvas Info */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          Siatka: {GridUtils.GRID_COLUMNS} × {content.canvas_settings.height} kafelków
          {showGrid && ' • Siatka włączona'}
        </p>
      </div>
    </div>
  );
});

LessonCanvas.displayName = 'LessonCanvas';