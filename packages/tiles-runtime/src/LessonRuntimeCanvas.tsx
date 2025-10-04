import React from 'react';
import { Lesson, LessonTile } from 'tiles-core';
import { GridUtils } from 'tiles-core/utils';
import { TileRuntimeRenderer } from './TileRenderer';

interface LessonRuntimeCanvasProps {
  content: Lesson;
  page: number;
}

const getTilesForPage = (tiles: LessonTile[], page: number) =>
  tiles.filter(tile => (tile.page ?? 1) === page);

export const LessonRuntimeCanvas: React.FC<LessonRuntimeCanvasProps> = ({ content, page }) => {
  const tiles = getTilesForPage(content.tiles, page);

  const canvasStyle: React.CSSProperties = {
    width:
      GridUtils.GRID_COLUMNS * (content.canvas_settings.gridSize + GridUtils.GRID_GAP) -
      GridUtils.GRID_GAP,
    minHeight:
      content.canvas_settings.height * (content.canvas_settings.gridSize + GridUtils.GRID_GAP) -
      GridUtils.GRID_GAP
  };

  return (
    <div className="relative bg-white border border-slate-200 rounded-2xl shadow-sm mx-auto" style={canvasStyle}>
      {tiles.map(tile => {
        const position = GridUtils.gridToPixel(tile.gridPosition, content.canvas_settings);
        const size = GridUtils.gridSizeToPixel(tile.gridPosition, content.canvas_settings);

        return (
          <div
            key={tile.id}
            className="absolute"
            style={{
              left: position.x,
              top: position.y,
              width: size.width,
              height: size.height,
              borderRadius: '18px',
              overflow: 'hidden'
            }}
          >
            <TileRuntimeRenderer tile={tile} />
          </div>
        );
      })}

      {tiles.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
          Brak kafelków na tej stronie.
        </div>
      )}
    </div>
  );
};

export default LessonRuntimeCanvas;
