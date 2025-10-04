import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { VisualizationTile } from 'tiles-core';
import { VisualizationTileView } from '../views';

type VisualizationMode = 'preview' | 'student';

interface VisualizationInteractiveProps {
  tile: VisualizationTile;
  mode?: VisualizationMode;
  onRequestContentEditing?: () => void;
}

export const VisualizationInteractive: React.FC<VisualizationInteractiveProps> = ({
  tile,
  mode = 'preview',
  onRequestContentEditing,
}) => {
  const isStudentMode = mode === 'student';
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  useEffect(() => {
    setIsVideoPlaying(false);
  }, [tile.id, tile.content.contentType]);

  const handleDoubleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (isStudentMode) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      onRequestContentEditing?.();
    },
    [isStudentMode, onRequestContentEditing],
  );

  const handleToggleVideo = useCallback(() => {
    if (!isStudentMode || tile.content.contentType !== 'video') {
      return;
    }

    setIsVideoPlaying((previous) => !previous);
  }, [isStudentMode, tile.content.contentType]);

  const overlay = useMemo(() => {
    const modeBadge = (
      <div
        className={`absolute top-5 right-5 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide shadow-sm ${
          isStudentMode ? 'bg-emerald-500/90 text-white' : 'bg-slate-900/80 text-white/90 backdrop-blur'
        }`}
      >
        {isStudentMode ? 'Tryb ucznia' : 'Podgląd'}
      </div>
    );

    if (tile.content.contentType === 'video') {
      return (
        <>
          {modeBadge}
          {isVideoPlaying ? (
            <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-emerald-400/10" />
          ) : null}
          <button
            type="button"
            onClick={handleToggleVideo}
            aria-pressed={isVideoPlaying}
            aria-label={isVideoPlaying ? 'Wstrzymaj podgląd wideo' : 'Odtwórz podgląd wideo'}
            className={`absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-[inherit] transition duration-200 ${
              isStudentMode
                ? 'bg-transparent hover:bg-slate-950/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50'
                : 'cursor-default'
            }`}
            style={{ pointerEvents: isStudentMode ? 'auto' : 'none' }}
          >
            <span
              className={`flex h-20 w-20 items-center justify-center rounded-full border border-white/40 bg-white/10 backdrop-blur transition ${
                isVideoPlaying ? 'scale-105 bg-white/20 border-white/60' : ''
              }`}
            >
              <span className="ml-1 border-l-[18px] border-l-white border-y-[12px] border-y-transparent" />
            </span>
            <span className="text-sm font-medium text-white drop-shadow-lg">
              {isStudentMode ? (isVideoPlaying ? 'Wstrzymaj' : 'Odtwórz wideo') : 'Podgląd w edytorze'}
            </span>
          </button>
        </>
      );
    }

    return (
      <>
        {modeBadge}
        {!isStudentMode ? (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/85 px-4 py-2 text-xs font-medium text-slate-600 shadow-sm">
            Kliknij dwukrotnie, aby edytować dane
          </div>
        ) : null}
      </>
    );
  }, [handleToggleVideo, isStudentMode, isVideoPlaying, tile.content.contentType]);

  return (
    <div className="relative h-full w-full" onDoubleClick={handleDoubleClick}>
      <VisualizationTileView tile={tile} overlay={overlay} />
    </div>
  );
};

export default VisualizationInteractive;
