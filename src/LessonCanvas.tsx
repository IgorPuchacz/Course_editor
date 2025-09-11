import React, { forwardRef, useRef, useEffect, useState } from 'react';
import { Type } from 'lucide-react';
import { LessonContent, LessonTile, EditorState, GridPosition } from './types/lessonEditor';
import { TileRenderer } from './components/admin/TileRenderer';
import { GridUtils } from './utils/gridUtils';
import { logger } from './utils/logger';

interface LessonCanvasProps {
  content: LessonContent;
  editorState: EditorState;
  onUpdateTile: (tileId: string, updates: Partial<LessonTile>) => void;
  onSelectTile: (tileId: string | null) => void;
  onStartEditing: (tileId: string) => void;
  onDeleteTile: (tileId: string) => void;
  onAddTile: (tileType: string, position: { x: number; y: number }) => void;
  onUpdateEditorState: (updater: (prev: EditorState) => EditorState) => void;
  showGrid?: boolean;
}

export const LessonCanvas = forwardRef<HTMLDivElement, LessonCanvasProps>(({
  content,
  editorState,
  onUpdateTile,
  onSelectTile,
  onStartEditing,
  onDeleteTile,
  onAddTile,
  onUpdateEditorState,
  showGrid = true
}, ref) => {
  const [dragPreview, setDragPreview] = useState<GridPosition | null>(null);
  const [resizePreview, setResizePreview] = useState<{ tileId: string; gridPosition: GridPosition } | null>(null);

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
    
    onUpdateEditorState(prev => ({
      ...prev,
      dragState: {
        isDragging: true,
        draggedTile: tile,
        dragOffset: {
          x: e.nativeEvent.offsetX,
          y: e.nativeEvent.offsetY
        },
        isFromPalette: false,
        isDraggingImage: false,
        imageDragStart: null
        isDraggingImage: false,
        imageDragStart: null
      }
    }));
  };

  // Handle image mouse down (start image dragging)
  const handleImageMouseDown = (e: React.MouseEvent, tile: LessonTile) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🖱️ Image drag start in LessonCanvas - clientX:', e.clientX, 'clientY:', e.clientY);
    
    if (tile.type !== 'image') return;
    
    const imageTile = tile as any; // ImageTile
    const imagePosition = imageTile.content.position || { x: 0, y: 0 };
    
    console.log('🖱️ Setting isDraggingImage to true in LessonCanvas, current position:', imagePosition);
    
    onUpdateEditorState(prev => ({
      ...prev,
      dragState: {
        ...prev.dragState,
        isDraggingImage: true,
        imageDragStart: {
          x: e.clientX,
          y: e.clientY,
          imageX: imagePosition.x,
          imageY: imagePosition.y
        }
      }
    }));
    
    console.log('🖱️ Image drag state set in LessonCanvas');
  };

  // Handle tile resize start
  useEffect(() => {
    const handleResizeStart = (e: CustomEvent) => {
      const { tileId, handle, startEvent } = e.detail;
      const tile = content.tiles.find(t => t.id === tileId);
      if (!tile) return;

      onUpdateEditorState(prev => ({
        ...prev,
        resizeState: {
          isResizing: true,
          resizingTileId: tileId,
          resizeHandle: handle,
          startPosition: { x: startEvent.clientX, y: startEvent.clientY },
          startSize: { ...tile.size },
          startGridPosition: { ...tile.gridPosition }
        }
      }));
    };

    document.addEventListener('tileResizeStart', handleResizeStart as EventListener);
    return () => document.removeEventListener('tileResizeStart', handleResizeStart as EventListener);
  }, [content.tiles, onUpdateEditorState]);

  // Handle mouse move (dragging)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { dragState, resizeState } = editorState;
      
      // Handle tile dragging
      if (dragState.isDragging && dragState.draggedTile) {
        const rect = (ref as React.RefObject<HTMLDivElement>).current?.getBoundingClientRect();
        if (!rect) return;

        const pixelPosition = {
          x: e.clientX - rect.left - dragState.dragOffset.x,
          y: e.clientY - rect.top - dragState.dragOffset.y
        };

        // Snap to grid
        const snappedPosition = GridUtils.snapToGrid(pixelPosition, content.canvas_settings);
        const gridPos = GridUtils.pixelToGrid(snappedPosition, content.canvas_settings);
        
        // Ensure the tile stays within bounds
        const maxCol = GridUtils.GRID_COLUMNS - dragState.draggedTile.gridPosition.colSpan;
        const boundedGridPos = {
          ...dragState.draggedTile.gridPosition,
          col: Math.max(0, Math.min(maxCol, gridPos.col)),
          row: Math.max(0, gridPos.row)
        };
        
        // Check if position is valid (no overlaps)
        if (GridUtils.isValidGridPosition(boundedGridPos, content.canvas_settings, content.tiles, dragState.draggedTile.id)) {
          const finalPixelPos = GridUtils.gridToPixel(boundedGridPos, content.canvas_settings);
          onUpdateTile(dragState.draggedTile.id, { 
            position: finalPixelPos,
            gridPosition: boundedGridPos
          });
        }
      }
      
      // Handle image dragging
      if (dragState.isDraggingImage && dragState.imageDragStart) {
        console.log('🖱️ Image drag move in LessonCanvas - clientX:', e.clientX, 'clientY:', e.clientY);
        
        const deltaX = e.clientX - dragState.imageDragStart.x;
        const deltaY = e.clientY - dragState.imageDragStart.y;
        
        const newPosition = {
          x: dragState.imageDragStart.imageX + deltaX,
          y: dragState.imageDragStart.imageY + deltaY
        };
        
        console.log('🖱️ New image position in LessonCanvas:', newPosition, 'delta:', { deltaX, deltaY });
        
        // Find the tile being dragged (should be the selected one)
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
      
      // Handle tile resizing
      if (resizeState.isResizing && resizeState.resizingTileId) {
        const tile = content.tiles.find(t => t.id === resizeState.resizingTileId);
        if (!tile) return;

        const deltaX = e.clientX - resizeState.startPosition.x;
        const deltaY = e.clientY - resizeState.startPosition.y;
        
        let newGridPos = { ...resizeState.startGridPosition };
        
        // Calculate new grid size based on resize handle
        switch (resizeState.resizeHandle) {
          case 'se': // Southeast - resize width and height
            const newColSpan = Math.max(1, resizeState.startGridPosition.colSpan + Math.round(deltaX / (content.canvas_settings.gridSize + GridUtils.GRID_GAP)));
            const newRowSpan = Math.max(1, resizeState.startGridPosition.rowSpan + Math.round(deltaY / (content.canvas_settings.gridSize + GridUtils.GRID_GAP)));
            newGridPos.colSpan = Math.min(newColSpan, GridUtils.GRID_COLUMNS - newGridPos.col);
            newGridPos.rowSpan = newRowSpan;
            break;
          case 'e': // East - resize width only
            const eastColSpan = Math.max(1, resizeState.startGridPosition.colSpan + Math.round(deltaX / (content.canvas_settings.gridSize + GridUtils.GRID_GAP)));
            newGridPos.colSpan = Math.min(eastColSpan, GridUtils.GRID_COLUMNS - newGridPos.col);
            break;
          case 's': // South - resize height only
            newGridPos.rowSpan = Math.max(1, resizeState.startGridPosition.rowSpan + Math.round(deltaY / (content.canvas_settings.gridSize + GridUtils.GRID_GAP)));
            break;
        }
        
        // Validate new position
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
      if (editorState.dragState.isDragging || editorState.dragState.isDraggingImage || editorState.resizeState.isResizing) {
        console.log('🖱️ Mouse up in LessonCanvas - cleaning up drag states');
        onUpdateEditorState(prev => ({
          ...prev,
          dragState: {
            isDragging: false,
            draggedTile: null,
            dragOffset: { x: 0, y: 0 },
            isFromPalette: false,
            isDraggingImage: false,
            imageDragStart: null
          },
          resizeState: {
            isResizing: false,
            resizingTileId: null,
            resizeHandle: null,
            startPosition: { x: 0, y: 0 },
            startSize: { width: 0, height: 0 },
            startGridPosition: { col: 0, row: 0, colSpan: 1, rowSpan: 1 }
          }
        }));
        setResizePreview(null);
      }
    };

    if (editorState.dragState.isDragging || editorState.dragState.isDraggingImage || editorState.resizeState.isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [editorState.dragState, editorState.resizeState, content, onUpdateTile, onUpdateEditorState, ref, editorState.selectedTileId]);

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
            isEditing={editorState.isEditing && editorState.selectedTileId === tile.id}
            onMouseDown={(e) => handleTileMouseDown(e, tile)}
            onImageMouseDown={(e) => handleImageMouseDown(e, tile)}
            isDraggingImage={editorState.dragState.isDraggingImage}
            onDoubleClick={() => onStartEditing(tile.id)}
            onUpdateTile={onUpdateTile}
            onDelete={onDeleteTile}
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