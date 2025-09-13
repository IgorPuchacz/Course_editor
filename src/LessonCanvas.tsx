import React, { forwardRef, useEffect, useState } from 'react';
import { Type } from 'lucide-react';
import { LessonContent, LessonTile, EditorState, GridPosition } from './types/lessonEditor';
import { EditorAction } from './state/editorReducer';
import { TileRenderer } from './components/admin/TileRenderer';
import { GridUtils } from './utils/gridUtils';
import { logger } from './utils/logger';

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
  showGrid = true
}, ref) => {
  const [dragPreview, setDragPreview] = useState<GridPosition | null>(null);
  const [resizePreview, setResizePreview] = useState<{ tileId: string; gridPosition: GridPosition } | null>(null);

  // Handle tile double click (start editing)
  const handleTileDoubleClick = (tile: LessonTile) => {
    if (tile.type === 'text') {
      dispatch({ type: 'startTextEditing', tileId: tile.id });
    } else {
      dispatch({ type: 'startEditing', tileId: tile.id });
    }
  };

  // Handle canvas click (deselect tiles)
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onSelectTile(null);
    }
  };

  // Handle drop from palette
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragPreview(null);
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      
      if (data.type === 'palette-tile') {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const pixelPosition = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
        
        // Convert to grid position and find available spot
        const desiredGridPos = GridUtils.pixelToGrid(pixelPosition, content.canvas_settings);
        const availableGridPos = GridUtils.findNextAvailablePosition(
          { ...desiredGridPos, colSpan: 2, rowSpan: 1 }, // Default size
          content.canvas_settings,
          content.tiles
        );
        
        const finalPixelPos = GridUtils.gridToPixel(availableGridPos, content.canvas_settings);
        onAddTile(data.tileType, finalPixelPos);
        logger.info(`Dropped ${data.tileType} tile at grid position:`, availableGridPos);
      }
    } catch (error) {
      logger.error('Error handling drop:', error);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    
    // Show drag preview
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const pixelPosition = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    const gridPos = GridUtils.pixelToGrid(pixelPosition, content.canvas_settings);
    const previewPos = GridUtils.findNextAvailablePosition(
      { ...gridPos, colSpan: 2, rowSpan: 1 },
      content.canvas_settings,
      content.tiles
    );
    
    setDragPreview(previewPos);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only hide preview if leaving the canvas entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragPreview(null);
    }
  };

  // Handle tile mouse down (start dragging)
  const handleTileMouseDown = (e: React.MouseEvent, tile: LessonTile) => {
    // Don't allow dragging when editing text
    if (editorState.mode === 'textEditing') {
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    onSelectTile(tile.id);
    
    // For frameless text tiles, provide visual feedback during interaction
    if (tile.type === 'text' && !(tile as any).content.showBorder) {
      // Add temporary visual indicator for frameless tiles during drag
      const tileElement = e.currentTarget as HTMLElement;
      tileElement.style.outline = '2px dashed rgba(59, 130, 246, 0.5)';
      
      // Remove outline after drag ends
      const removeOutline = () => {
        tileElement.style.outline = 'none';
        document.removeEventListener('mouseup', removeOutline);
      };
      document.addEventListener('mouseup', removeOutline);
    }
    
    dispatch({
      type: 'startDrag',
      tile,
      offset: { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY }
    });

    if (tile.type === 'text') {
      dispatch({ type: 'startTextEditing', tileId: tile.id });
    } else {
      dispatch({ type: 'startEditing', tileId: tile.id });
    }
  };

  // Handle image mouse down (start image dragging)
  const handleImageMouseDown = (e: React.MouseEvent, tile: LessonTile) => {
    e.preventDefault();
    e.stopPropagation();

    if (tile.type !== 'image') return;

    onSelectTile(tile.id);

    const imageTile = tile as any;
    const imagePosition = imageTile.content.position || { x: 0, y: 0 };

    dispatch({
      type: 'startImageDrag',
      start: {
        x: e.clientX,
        y: e.clientY,
        imageX: imagePosition.x,
        imageY: imagePosition.y
      }
    });
  };

  // Handle tile resize start
  useEffect(() => {
    const handleResizeStart = (e: CustomEvent) => {
      const { tileId, handle, startEvent } = e.detail;
      const tile = content.tiles.find(t => t.id === tileId);
      if (!tile) return;

      dispatch({
        type: 'startResize',
        tileId,
        handle,
        startPosition: { x: startEvent.clientX, y: startEvent.clientY },
        startSize: { ...tile.size },
        startGridPosition: { ...tile.gridPosition }
      });
    };

    document.addEventListener('tileResizeStart', handleResizeStart as EventListener);
    return () => document.removeEventListener('tileResizeStart', handleResizeStart as EventListener);
  }, [content.tiles, dispatch]);

  // Handle mouse move and interactions
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const interaction = editorState.interaction;

      if (interaction.type === 'drag') {
        const rect = (ref as React.RefObject<HTMLDivElement>).current?.getBoundingClientRect();
        if (!rect) return;

        const pixelPosition = {
          x: e.clientX - rect.left - interaction.offset.x,
          y: e.clientY - rect.top - interaction.offset.y
        };

        const snappedPosition = GridUtils.snapToGrid(pixelPosition, content.canvas_settings);
        const gridPos = GridUtils.pixelToGrid(snappedPosition, content.canvas_settings);

        const maxCol = GridUtils.GRID_COLUMNS - interaction.tile.gridPosition.colSpan;
        const boundedGridPos = {
          ...interaction.tile.gridPosition,
          col: Math.max(0, Math.min(maxCol, gridPos.col)),
          row: Math.max(0, gridPos.row)
        };

        if (GridUtils.isValidGridPosition(boundedGridPos, content.canvas_settings, content.tiles, interaction.tile.id)) {
          const finalPixelPos = GridUtils.gridToPixel(boundedGridPos, content.canvas_settings);
          onUpdateTile(interaction.tile.id, {
            position: finalPixelPos,
            gridPosition: boundedGridPos
          });
        }
      }

      if (interaction.type === 'imageDrag' && interaction.start) {
        const deltaX = e.clientX - interaction.start.x;
        const deltaY = e.clientY - interaction.start.y;
        const newPosition = {
          x: interaction.start.imageX + deltaX,
          y: interaction.start.imageY + deltaY
        };
        const draggedTile = content.tiles.find(t => t.id === editorState.selectedTileId);
        if (draggedTile && draggedTile.type === 'image') {
          onUpdateTile(draggedTile.id, {
            content: {
              ...draggedTile.content,
              position: newPosition
            }
          });
        }
      }

      if (interaction.type === 'resize') {
        const tile = content.tiles.find(t => t.id === interaction.tileId);
        if (!tile) return;

        const deltaX = e.clientX - interaction.startPosition.x;
        const deltaY = e.clientY - interaction.startPosition.y;

        let newGridPos = { ...interaction.startGridPosition };

        switch (interaction.handle) {
          case 'se':
            const newColSpan = Math.max(1, interaction.startGridPosition.colSpan + Math.round(deltaX / (content.canvas_settings.gridSize + GridUtils.GRID_GAP)));
            const newRowSpan = Math.max(1, interaction.startGridPosition.rowSpan + Math.round(deltaY / (content.canvas_settings.gridSize + GridUtils.GRID_GAP)));
            newGridPos.colSpan = Math.min(newColSpan, GridUtils.GRID_COLUMNS - newGridPos.col);
            newGridPos.rowSpan = newRowSpan;
            break;
          case 'e':
            const eastColSpan = Math.max(1, interaction.startGridPosition.colSpan + Math.round(deltaX / (content.canvas_settings.gridSize + GridUtils.GRID_GAP)));
            newGridPos.colSpan = Math.min(eastColSpan, GridUtils.GRID_COLUMNS - newGridPos.col);
            break;
          case 's':
            newGridPos.rowSpan = Math.max(1, interaction.startGridPosition.rowSpan + Math.round(deltaY / (content.canvas_settings.gridSize + GridUtils.GRID_GAP)));
            break;
        }

        if (GridUtils.isValidGridPosition(newGridPos, content.canvas_settings, content.tiles, tile.id)) {
          const newPixelPos = GridUtils.gridToPixel(newGridPos, content.canvas_settings);
          const newPixelSize = GridUtils.gridSizeToPixel(newGridPos, content.canvas_settings);
          onUpdateTile(tile.id, {
            position: newPixelPos,
            size: newPixelSize,
            gridPosition: newGridPos
          });
          setResizePreview({ tileId: tile.id, gridPosition: newGridPos });
        }
      }
    };

    const handleMouseUp = () => {
      if (editorState.interaction.type !== 'idle') {
        dispatch({ type: 'endInteraction' });
        setResizePreview(null);
      }
    };

    if (editorState.interaction.type !== 'idle') {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [editorState.interaction, content, onUpdateTile, dispatch, editorState.selectedTileId, ref]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && editorState.selectedTileId) {
        onDeleteTile(editorState.selectedTileId);
      }
      if (e.key === 'Escape') {
        onSelectTile(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editorState.selectedTileId, onDeleteTile, onSelectTile]);

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
            onMouseDown={(e) => handleTileMouseDown(e, tile)}
            onImageMouseDown={(e) => handleImageMouseDown(e, tile)}
            isDraggingImage={editorState.interaction.type === 'imageDrag'}
            onDoubleClick={() => handleTileDoubleClick(tile)}
            onUpdateTile={onUpdateTile}
            onDelete={onDeleteTile}
            onFinishTextEditing={onFinishTextEditing}
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