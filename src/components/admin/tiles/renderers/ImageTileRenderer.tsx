import React from 'react';
import { ImageTile } from '../../../../types/lessonEditor';
import { BaseTileRendererProps } from '../shared';

export interface ImageTileRendererProps extends BaseTileRendererProps<ImageTile> {
  onImageMouseDown: (e: React.MouseEvent, tile?: ImageTile) => void;
}

export const ImageTileRenderer: React.FC<ImageTileRendererProps> = ({
  tile,
  isSelected,
  isImageEditing,
  isDraggingImage,
  onImageMouseDown,
  onUpdateTile,
  backgroundColor,
  showBorder,
}) => {
  const imageTile = tile;
  const imagePosition = imageTile.content.position || { x: 0, y: 0 };
  const imageScale = imageTile.content.scale || 1;

  const wrapperStyle: React.CSSProperties = {
    borderRadius: 'inherit',
    backgroundColor,
    border: showBorder ? '1px solid rgba(0, 0, 0, 0.08)' : 'none',
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!isSelected || !isImageEditing) return;

    e.preventDefault();
    e.stopPropagation();

    const currentScale = imageTile.content.scale || 1;
    const zoomSpeed = 0.1;
    const zoomDirection = e.deltaY > 0 ? -1 : 1;
    const newScale = Math.max(0.1, Math.min(3, currentScale + zoomDirection * zoomSpeed));

    onUpdateTile(tile.id, {
      content: {
        ...imageTile.content,
        scale: newScale,
      },
    });
  };

  return (
    <div className="w-full h-full overflow-hidden relative" style={wrapperStyle}>
      <div className="w-full h-full overflow-hidden relative" style={{ cursor: isSelected && isImageEditing ? 'grab' : 'default' }}>
        <img
          src={imageTile.content.url}
          alt={imageTile.content.alt}
          className={`absolute select-none ${isSelected && isImageEditing ? 'cursor-grab active:cursor-grabbing' : ''}`}
          style={{
            left: imagePosition.x,
            top: imagePosition.y,
            transform: `scale(${imageScale})`,
            transformOrigin: '0 0',
            maxWidth: 'none',
            maxHeight: 'none',
            cursor: isSelected && isImageEditing ? (isDraggingImage ? 'grabbing' : 'grab') : 'default',
          }}
          onMouseDown={isSelected && isImageEditing ? (e) => {
            onImageMouseDown(e, imageTile);
          } : undefined}
          onWheel={isSelected && isImageEditing ? handleWheel : undefined}
          draggable={false}
          onError={(e) => {
            console.error('Image failed to load:', imageTile.content.url.substring(0, 100));
            (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400';
          }}
        />
      </div>
      {imageTile.content.caption && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white text-xs p-3">
          {imageTile.content.caption}
        </div>
      )}
    </div>
  );
};
