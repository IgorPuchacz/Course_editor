import React from 'react';
import { CanvasSettings, LessonTile } from 'tiles-core';
import { RuntimeTileRenderer } from 'tiles-runtime';
import { GridUtils } from 'tiles-core/utils';
import { TileContainer } from 'ui-primitives';

interface LessonRuntimeCanvasProps {
  tiles: LessonTile[];
  canvasSettings: CanvasSettings;
}

const getGridColumns = (canvasSettings: CanvasSettings): number => {
  return canvasSettings.width ?? GridUtils.GRID_COLUMNS;
};

export const LessonRuntimeCanvas: React.FC<LessonRuntimeCanvasProps> = ({ tiles, canvasSettings }) => {
  const columns = getGridColumns(canvasSettings);
  const cellSize = canvasSettings.gridSize + GridUtils.GRID_GAP;

  return (
    <div
      className="w-full rounded-3xl bg-slate-50 p-6 border border-slate-200 shadow-inner"
    >
      <div
        className="w-full"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gridAutoRows: `${cellSize}px`,
          gap: `${GridUtils.GRID_GAP}px`,
        }}
      >
        {tiles.map(tile => {
          const { col, row, colSpan, rowSpan } = tile.gridPosition;

          return (
            <TileContainer
              key={tile.id}
              className="relative flex"
              style={{
                gridColumn: `${col + 1} / span ${Math.max(colSpan, 1)}`,
                gridRow: `${row + 1} / span ${Math.max(rowSpan, 1)}`,
              }}
            >
              <RuntimeTileRenderer tile={tile} />
            </TileContainer>
          );
        })}
      </div>
    </div>
  );
};

export default LessonRuntimeCanvas;
