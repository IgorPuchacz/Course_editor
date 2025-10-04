import React from 'react';
import { CanvasSettings, LessonTile } from 'tiles-core';
import { GridUtils } from 'tiles-core/utils';
import { TileContainer } from 'ui-primitives';
import { RuntimeTileRenderer } from '../RuntimeTileRenderer';

interface LessonRuntimeCanvasProps {
  tiles: LessonTile[];
  canvasSettings: CanvasSettings;
}

const getGridColumns = (canvasSettings: CanvasSettings): number => {
  return canvasSettings.width ?? GridUtils.GRID_COLUMNS;
};

export const LessonRuntimeCanvas: React.FC<LessonRuntimeCanvasProps> = ({ tiles, canvasSettings }) => {
  const columns = Math.max(getGridColumns(canvasSettings), 1);
  const rows = Math.max(canvasSettings.height, 1);
  const cellSize = canvasSettings.gridSize;
  const gap = GridUtils.GRID_GAP;

  const canvasWidth = columns * cellSize + (columns - 1) * gap;
  const canvasMinHeight = rows * cellSize + (rows - 1) * gap;

  return (
    <div className="w-full rounded-3xl bg-slate-50 p-6 border border-slate-200 shadow-inner">
      <div
        className="mx-auto"
        style={{
          width: canvasWidth,
          minHeight: canvasMinHeight,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, ${cellSize}px)`,
            gridAutoRows: `${cellSize}px`,
            gap: `${gap}px`,
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
    </div>
  );
};

export default LessonRuntimeCanvas;
