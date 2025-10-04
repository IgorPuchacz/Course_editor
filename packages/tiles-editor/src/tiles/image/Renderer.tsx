import React from 'react';
import { ImageTile } from 'tiles-core';
import { ImageTileView } from 'ui-primitives';
import { BaseTileRendererProps } from '../shared.ts';

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
}) => {
  const imageTile = tile;
  const imagePosition = imageTile.content.position || { x: 0, y: 0 };
  const imageScale = imageTile.content.scale || 1;

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

  if (isSelected && isImageEditing) {
    return (
      <ImageTileView
        tile={imageTile}
        useContainLayout={false}
        contentClassName="relative"
        imageWrapperProps={{
          style: {
            cursor: isDraggingImage ? 'grabbing' : 'grab',
          },
        }}
        imageProps={{
          draggable: false,
          className: `select-none ${isSelected ? 'cursor-grab active:cursor-grabbing' : ''}`,
          style: {
            left: imagePosition.x,
            top: imagePosition.y,
            transform: `scale(${imageScale})`,
            transformOrigin: '0 0',
            maxWidth: 'none',
            maxHeight: 'none',
            cursor: isSelected && isImageEditing ? (isDraggingImage ? 'grabbing' : 'grab') : 'default',
          },
          onMouseDown: (e) => {
            if (isSelected && isImageEditing) {
              onImageMouseDown(e, imageTile);
            }
          },
          onWheel: isSelected && isImageEditing ? handleWheel : undefined,
          onError: (e) => {
            console.error('Image failed to load:', imageTile.content.url.substring(0, 100));
            (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400';
          },
        }}
        captionProps={
          imageTile.content.caption
            ? {
                className:
                  'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white text-xs p-3',
              }
            : undefined
        }
      />
    );
  }

  return <ImageTileView tile={imageTile} />;
};
