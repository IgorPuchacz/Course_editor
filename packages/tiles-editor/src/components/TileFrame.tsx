import React, { useCallback, useEffect, useState } from 'react';
import { Move, Trash2 } from 'lucide-react';
import { LessonTile } from 'tiles-core';
import { TileContainer } from 'ui-primitives';

const RESIZE_HANDLES = [
  { handle: 'nw', position: { x: 0, y: 0 }, cursor: 'nw-resize' },
  { handle: 'ne', position: { x: 1, y: 0 }, cursor: 'ne-resize' },
  { handle: 'sw', position: { x: 0, y: 1 }, cursor: 'sw-resize' },
  { handle: 'se', position: { x: 1, y: 1 }, cursor: 'se-resize' },
  { handle: 'n', position: { x: 0.5, y: 0 }, cursor: 'n-resize' },
  { handle: 's', position: { x: 0.5, y: 1 }, cursor: 's-resize' },
  { handle: 'w', position: { x: 0, y: 0.5 }, cursor: 'w-resize' },
  { handle: 'e', position: { x: 1, y: 0.5 }, cursor: 'e-resize' }
] as const;

const TILE_CORNER = 'rounded-3xl';

export interface TileFrameProps {
  tile: LessonTile;
  isSelected: boolean;
  isEditing: boolean;
  isEditingText: boolean;
  isImageEditing: boolean;
  isDraggingImage: boolean;
  showGrid: boolean;
  isFramelessTextTile?: boolean;
  onMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void;
  onDoubleClick?: () => void;
  onDelete: (tileId: string) => void;
  children: (props: { isHovered: boolean }) => React.ReactNode;
}

export const TileFrame: React.FC<TileFrameProps> = ({
  tile,
  isSelected,
  isEditing,
  isEditingText,
  isImageEditing,
  isDraggingImage,
  showGrid,
  isFramelessTextTile = false,
  onMouseDown,
  onDoubleClick,
  onDelete,
  children
}) => {
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isEditingText) {
      setIsHovered(false);
    }
  }, [isEditingText]);

  const handleMouseEnter = useCallback(() => {
    if (!isEditingText) {
      setIsHovered(true);
    }
  }, [isEditingText]);

  const handleMouseLeave = useCallback(() => {
    if (!isEditingText) {
      setIsHovered(false);
    }
  }, [isEditingText]);

  const handleResizeStart = useCallback((event: React.MouseEvent, handle: string) => {
    event.preventDefault();
    event.stopPropagation();

    const resizeEvent = new CustomEvent('tileResizeStart', {
      detail: { tileId: tile.id, handle, startEvent: event }
    });

    document.dispatchEvent(resizeEvent);
  }, [tile.id]);

  const renderResizeHandles = useCallback(() => {
    if (!isSelected || isEditingText || isImageEditing) {
      return null;
    }

    return (
      <>
        {RESIZE_HANDLES.map(({ handle, position, cursor }) => (
          <div
            key={handle}
            className={`absolute w-3 h-3 rounded-full transition-colors ${
              isFramelessTextTile
                ? 'bg-blue-500 border-2 border-white shadow-lg hover:bg-blue-600 opacity-90 hover:opacity-100'
                : 'bg-blue-500 border-2 border-white shadow-md hover:bg-blue-600'
            }`}
            style={{
              left: `${position.x * 100}%`,
              top: `${position.y * 100}%`,
              transform: 'translate(-50%, -50%)',
              cursor,
              zIndex: 10
            }}
            onMouseDown={(e) => handleResizeStart(e, handle)}
          />
        ))}
      </>
    );
  }, [handleResizeStart, isEditingText, isFramelessTextTile, isImageEditing, isSelected, tile.gridPosition]);

  const allowMouseDown = !isDraggingImage;

  return (
    <div
      className={`absolute select-none transition-all duration-200 ${TILE_CORNER} ${
        isEditing || isImageEditing || isEditingText ? 'z-20' : 'z-10'
      } ${
        isSelected ? 'ring-2 ring-blue-500 ring-opacity-75' : ''
      }`}
      style={{
        left: tile.position.x,
        top: tile.position.y,
        width: tile.size.width,
        height: tile.size.height
      }}
      onMouseDown={allowMouseDown ? onMouseDown : undefined}
      onDoubleClick={onDoubleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <TileContainer
        radius="3xl"
        elevation="lg"
        className={`relative h-full w-full transition-shadow duration-200 ${
          isFramelessTextTile ? 'bg-transparent' : ''
        }`}
        backgroundColor={isFramelessTextTile ? 'transparent' : undefined}
      >
        {children({ isHovered })}
      </TileContainer>

      {(isSelected || isHovered) && !isEditingText && !isImageEditing && (
        <div
          className="absolute -top-8 left-0 flex items-center space-x-1 bg-white rounded-md shadow-md border border-gray-200 px-2 py-1"
          onMouseDown={(event) => {
            event.stopPropagation();
          }}
        >
          <span className="text-xs text-gray-600 capitalize">{tile.type}</span>
          <button
            onClick={(event) => {
              event.stopPropagation();
              onDelete(tile.id);
            }}
            onMouseDown={(event) => {
              event.stopPropagation();
            }}
            className="ml-2 inline-flex items-center justify-center p-1.5 text-red-500 bg-red-50 rounded-full border border-transparent hover:text-red-700 hover:bg-red-100 hover:border-red-200 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1 transition-colors"
            title="Usuń kafelek"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}

      {isSelected && isImageEditing && tile.type === 'image' && (
        <div className="absolute -top-8 left-0 flex items-center space-x-1 bg-blue-100 rounded-md shadow-md border border-blue-300 px-2 py-1">
          <Move className="w-3 h-3 text-blue-600" />
          <span className="text-xs text-blue-700 font-medium">Przeciągnij obraz aby zmienić pozycję</span>
        </div>
      )}

      {showGrid && isSelected && (
        <div className="absolute -bottom-6 left-0 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
          {tile.gridPosition.col},{tile.gridPosition.row}({tile.gridPosition.colSpan}×{tile.gridPosition.rowSpan})
        </div>
      )}

      {!isEditingText && !isImageEditing && renderResizeHandles()}
    </div>
  );
};
