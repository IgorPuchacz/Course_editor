import React, { useEffect, useMemo, useState } from 'react';
import { Lesson } from 'tiles-core';
import { GridUtils } from '../../../../src/utils/gridUtils.ts';
import { RuntimeTileRenderer } from './TileRenderer';

interface LessonRuntimeViewProps {
  lesson: Lesson | null;
  isLoading?: boolean;
}

export const LessonRuntimeView: React.FC<LessonRuntimeViewProps> = ({ lesson, isLoading = false }) => {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [lesson?.id]);

  const totalPages = lesson?.total_pages ?? 1;
  const tilesForPage = useMemo(() => {
    if (!lesson) return [];
    return lesson.tiles.filter(tile => (tile.page ?? 1) === page);
  }, [lesson, page]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-24">
        <div className="text-sm text-gray-500">Ładowanie lekcji...</div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex items-center justify-center h-full py-24">
        <div className="text-sm text-gray-500">Brak dostępnej zawartości lekcji.</div>
      </div>
    );
  }

  const canvasSettings = lesson.canvas_settings;
  const canvasWidth =
    GridUtils.GRID_COLUMNS * (canvasSettings.gridSize + GridUtils.GRID_GAP) - GridUtils.GRID_GAP;
  const canvasHeight =
    canvasSettings.height * (canvasSettings.gridSize + GridUtils.GRID_GAP) - GridUtils.GRID_GAP;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{lesson.title}</h2>
          <p className="text-sm text-slate-500">Strona {page} z {totalPages}</p>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg border text-sm text-slate-600 disabled:opacity-50"
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page === 1}
            >
              Poprzednia strona
            </button>
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg border text-sm text-slate-600 disabled:opacity-50"
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
            >
              Następna strona
            </button>
          </div>
        )}
      </div>

      <div
        className="relative mx-auto bg-white border border-slate-200 rounded-3xl shadow-sm"
        style={{ width: canvasWidth, minHeight: canvasHeight, backgroundColor: '#f8fafc' }}
      >
        {tilesForPage.map(tile => {
          const position = GridUtils.gridToPixel(tile.gridPosition, canvasSettings);
          const size = GridUtils.gridSizeToPixel(tile.gridPosition, canvasSettings);

          return (
            <div
              key={tile.id}
              className="absolute"
              style={{
                left: position.x,
                top: position.y,
                width: size.width,
                height: size.height,
                padding: 4
              }}
            >
              <div className="w-full h-full" style={{ borderRadius: 24 }}>
                <RuntimeTileRenderer tile={tile} />
              </div>
            </div>
          );
        })}

        {tilesForPage.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
            Brak kafelków na tej stronie.
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonRuntimeView;
