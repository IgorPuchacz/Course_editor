import React from 'react';
import { CanvasSettings, LessonTile } from 'tiles-core';
import { RuntimeTileRenderer } from 'tiles-runtime';
import { GridUtils } from 'tiles-editor';

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
            <div
              key={tile.id}
              className="relative flex"
              style={{
                gridColumn: `${col + 1} / span ${Math.max(colSpan, 1)}`,
                gridRow: `${row + 1} / span ${Math.max(rowSpan, 1)}`,
                borderRadius: '1.5rem',
                overflow: 'hidden',
                boxShadow: '0 16px 32px rgba(15, 23, 42, 0.12)',
                backgroundColor: '#ffffff',
              }}
            >
              <RuntimeTileRenderer tile={tile} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LessonRuntimeCanvas;
