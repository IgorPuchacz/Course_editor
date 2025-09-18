import { useState, useEffect, RefObject } from 'react';
import { LessonContent, LessonTile, GridPosition, EditorState, TextTile, ImageTile } from '../types/lessonEditor';
import { EditorAction } from '../state/editorReducer';
import { GridUtils } from '../utils/gridUtils';
import { logger } from '../utils/logger';

interface UseTileInteractionsProps {
  content: LessonContent;
  editorState: EditorState;
  dispatch: React.Dispatch<EditorAction>;
  onUpdateTile: (tileId: string, updates: Partial<LessonTile>) => void;
  onSelectTile: (tileId: string | null) => void;
  onDeleteTile: (tileId: string) => void;
  onAddTile: (tileType: string, position: { x: number; y: number }) => void;
  canvasRef: RefObject<HTMLDivElement>;
}

export const useTileInteractions = ({
  content,
  editorState,
  dispatch,
  onUpdateTile,
  onSelectTile,
  onDeleteTile,
  onAddTile,
  canvasRef
}: UseTileInteractionsProps) => {
  const [dragPreview, setDragPreview] = useState<GridPosition | null>(null);
  const [resizePreview, setResizePreview] = useState<{ tileId: string; gridPosition: GridPosition } | null>(null);

  const handleTileDoubleClick = (tile: LessonTile) => {
    if (tile.type === 'text' || tile.type === 'programming' || tile.type === 'sequencing') {
      dispatch({ type: 'startTextEditing', tileId: tile.id });
    } else if (tile.type === 'image') {
      dispatch({ type: 'startImageEditing', tileId: tile.id });
    } else {
      dispatch({ type: 'startEditing', tileId: tile.id });
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onSelectTile(null);
      dispatch({ type: 'stopEditing' });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragPreview(null);

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data.type === 'palette-tile') {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const pixelPosition = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        const desiredGridPos = GridUtils.pixelToGrid(pixelPosition, content.canvas_settings);
        const availableGridPos = GridUtils.findNextAvailablePosition(
          { ...desiredGridPos, colSpan: 2, rowSpan: 1 },
          content.canvas_settings,
          content.tiles
        );
        const finalPixelPos = GridUtils.gridToPixel(availableGridPos, content.canvas_settings);
        onAddTile(data.tileType, finalPixelPos);
        logger.info(`Dropped ${data.tileType} tile at grid position:`, availableGridPos);
      }
    } catch (err) {
      logger.error('Error handling drop:', err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const pixelPosition = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const gridPos = GridUtils.pixelToGrid(pixelPosition, content.canvas_settings);
    const previewPos = GridUtils.findNextAvailablePosition(
      { ...gridPos, colSpan: 2, rowSpan: 1 },
      content.canvas_settings,
      content.tiles
    );
    setDragPreview(previewPos);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragPreview(null);
    }
  };

  const handleTileMouseDown = (e: React.MouseEvent, tile: LessonTile) => {
    if (editorState.mode === 'textEditing' || editorState.mode === 'imageEditing') {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    onSelectTile(tile.id);
    if (tile.type === 'text' && !(tile as TextTile).content.showBorder) {
      const tileElement = e.currentTarget as HTMLElement;
      tileElement.style.outline = '2px dashed rgba(59, 130, 246, 0.5)';
      const removeOutline = () => {
        tileElement.style.outline = 'none';
        document.removeEventListener('mouseup', removeOutline);
      };
      document.addEventListener('mouseup', removeOutline);
    }
    dispatch({ type: 'startDrag', tile, offset: { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY } });
  };

  const handleImageMouseDown = (e: React.MouseEvent, tile: LessonTile) => {
    e.preventDefault();
    e.stopPropagation();
    if (tile.type !== 'image' || editorState.mode !== 'imageEditing') return;
    onSelectTile(tile.id);
    const imageTile = tile as ImageTile;
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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const interaction = editorState.interaction;
      if (interaction.type === 'drag') {
        const rect = canvasRef.current?.getBoundingClientRect();
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
          x: Math.min(0, interaction.start.imageX + deltaX),
          y: Math.min(0, interaction.start.imageY + deltaY)
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
        const gridUnit = content.canvas_settings.gridSize + GridUtils.GRID_GAP;
        const newGridPos = { ...interaction.startGridPosition };
        switch (interaction.handle) {
          case 'se': {
            const newColSpan = Math.max(
              1,
              interaction.startGridPosition.colSpan + Math.round(deltaX / gridUnit)
            );
            const newRowSpan = Math.max(
              1,
              interaction.startGridPosition.rowSpan + Math.round(deltaY / gridUnit)
            );
            newGridPos.colSpan = Math.min(newColSpan, GridUtils.GRID_COLUMNS - newGridPos.col);
            newGridPos.rowSpan = newRowSpan;
            break;
          }
          case 'e': {
            const eastColSpan = Math.max(
              1,
              interaction.startGridPosition.colSpan + Math.round(deltaX / gridUnit)
            );
            newGridPos.colSpan = Math.min(eastColSpan, GridUtils.GRID_COLUMNS - newGridPos.col);
            break;
          }
          case 's': {
            newGridPos.rowSpan = Math.max(
              1,
              interaction.startGridPosition.rowSpan + Math.round(deltaY / gridUnit)
            );
            break;
          }
          case 'n': {
            const bottom = interaction.startGridPosition.row + interaction.startGridPosition.rowSpan;
            const deltaRows = Math.round(deltaY / gridUnit);
            const newRow = Math.min(
              Math.max(0, interaction.startGridPosition.row + deltaRows),
              bottom - 1
            );
            newGridPos.row = newRow;
            newGridPos.rowSpan = bottom - newRow;
            break;
          }
          case 'w': {
            const right = interaction.startGridPosition.col + interaction.startGridPosition.colSpan;
            const deltaCols = Math.round(deltaX / gridUnit);
            const newCol = Math.min(
              Math.max(0, interaction.startGridPosition.col + deltaCols),
              right - 1
            );
            newGridPos.col = newCol;
            newGridPos.colSpan = right - newCol;
            break;
          }
          case 'ne': {
            const newColSpan = Math.max(
              1,
              interaction.startGridPosition.colSpan + Math.round(deltaX / gridUnit)
            );
            newGridPos.colSpan = Math.min(newColSpan, GridUtils.GRID_COLUMNS - newGridPos.col);
            const bottom = interaction.startGridPosition.row + interaction.startGridPosition.rowSpan;
            const deltaRows = Math.round(deltaY / gridUnit);
            const newRow = Math.min(
              Math.max(0, interaction.startGridPosition.row + deltaRows),
              bottom - 1
            );
            newGridPos.row = newRow;
            newGridPos.rowSpan = bottom - newRow;
            break;
          }
          case 'nw': {
            const right = interaction.startGridPosition.col + interaction.startGridPosition.colSpan;
            const deltaCols = Math.round(deltaX / gridUnit);
            const newCol = Math.min(
              Math.max(0, interaction.startGridPosition.col + deltaCols),
              right - 1
            );
            newGridPos.col = newCol;
            newGridPos.colSpan = right - newCol;
            const bottom = interaction.startGridPosition.row + interaction.startGridPosition.rowSpan;
            const deltaRows = Math.round(deltaY / gridUnit);
            const newRow = Math.min(
              Math.max(0, interaction.startGridPosition.row + deltaRows),
              bottom - 1
            );
            newGridPos.row = newRow;
            newGridPos.rowSpan = bottom - newRow;
            break;
          }
          case 'sw': {
            const right = interaction.startGridPosition.col + interaction.startGridPosition.colSpan;
            const deltaCols = Math.round(deltaX / gridUnit);
            const newCol = Math.min(
              Math.max(0, interaction.startGridPosition.col + deltaCols),
              right - 1
            );
            newGridPos.col = newCol;
            newGridPos.colSpan = right - newCol;
            newGridPos.rowSpan = Math.max(
              1,
              interaction.startGridPosition.rowSpan + Math.round(deltaY / gridUnit)
            );
            break;
          }
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
  }, [editorState.interaction, content, onUpdateTile, dispatch, editorState.selectedTileId, canvasRef]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && editorState.selectedTileId) {
        onDeleteTile(editorState.selectedTileId);
      }
      if (e.key === 'Escape') {
        onSelectTile(null);
        dispatch({ type: 'stopEditing' });
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editorState.selectedTileId, onDeleteTile, onSelectTile, dispatch]);

  return {
    dragPreview,
    resizePreview,
    handleTileDoubleClick,
    handleCanvasClick,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleTileMouseDown,
    handleImageMouseDown,
  };
};
