import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  Sparkles,
  Shuffle,
  ArrowLeftRight
} from 'lucide-react';
import { SequencingTile } from '../../types/lessonEditor';

interface SequencingInteractiveProps {
  tile: SequencingTile;
  isPreview?: boolean;
}

interface DraggedItem {
  id: string;
  text: string;
  originalIndex: number;
}

type DragSource = 'pool' | 'sequence';

interface DragState {
  id: string;
  source: DragSource;
  index?: number;
}

export const SequencingInteractive: React.FC<SequencingInteractiveProps> = ({
  tile,
  isPreview = false
}) => {
  const [availableItems, setAvailableItems] = useState<DraggedItem[]>([]);
  const [placedItems, setPlacedItems] = useState<(DraggedItem | null)[]>([]);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [isPoolHighlighted, setIsPoolHighlighted] = useState(false);

  const canInteract = !isPreview && (!isChecked || !isCorrect || tile.content.allowMultipleAttempts);
  const sequenceComplete = placedItems.length > 0 && placedItems.every(item => item !== null);

  // Initialize with randomized order
  useEffect(() => {
    const shuffledItems = [...tile.content.items]
      .map((item, index) => ({
        id: item.id,
        text: item.text,
        originalIndex: index
      }))
      .sort(() => Math.random() - 0.5);

    setAvailableItems(shuffledItems);
    setPlacedItems(new Array(shuffledItems.length).fill(null));
    setIsChecked(false);
    setIsCorrect(null);
    setAttempts(0);
  }, [tile.content.items]);

  const resetCheckState = () => {
    if (isChecked) {
      setIsChecked(false);
      setIsCorrect(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, itemId: string, source: DragSource, index?: number) => {
    if (!canInteract) return;

    setDragState({
      id: itemId,
      source,
      index
    });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSlotDragOver = (e: React.DragEvent, index: number) => {
    if (!canInteract) return;

    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSlot(index);
  };

  const handleSlotDragLeave = () => {
    setDragOverSlot(null);
  };

  const handlePoolDragOver = (e: React.DragEvent) => {
    if (!canInteract || !dragState || dragState.source !== 'sequence') return;

    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsPoolHighlighted(true);
  };

  const handlePoolDragLeave = () => {
    setIsPoolHighlighted(false);
  };

  const handleDropToSlot = (e: React.DragEvent, targetIndex: number) => {
    if (!canInteract) return;

    e.preventDefault();
    setDragOverSlot(null);

    if (!dragState) return;

    if (dragState.source === 'pool') {
      const itemToPlace = availableItems.find(item => item.id === dragState.id);
      if (!itemToPlace) {
        setDragState(null);
        return;
      }

      const newPlaced = [...placedItems];
      const replacedItem = newPlaced[targetIndex];
      newPlaced[targetIndex] = itemToPlace;

      const newAvailable = availableItems.filter(item => item.id !== dragState.id);
      if (replacedItem) {
        newAvailable.push(replacedItem);
      }

      setPlacedItems(newPlaced);
      setAvailableItems(newAvailable);
      resetCheckState();
    } else if (dragState.source === 'sequence') {
      const originIndex = dragState.index ?? placedItems.findIndex(item => item?.id === dragState.id);
      if (originIndex === -1 || originIndex === targetIndex) {
        setDragState(null);
        return;
      }

      const newPlaced = [...placedItems];
      const movingItem = newPlaced[originIndex];
      if (!movingItem) {
        setDragState(null);
        return;
      }

      const targetItem = newPlaced[targetIndex];
      newPlaced[targetIndex] = movingItem;
      newPlaced[originIndex] = targetItem ?? null;

      setPlacedItems(newPlaced);
      resetCheckState();
    }

    setDragState(null);
  };

  const handleDropToPool = (e: React.DragEvent) => {
    if (!canInteract) return;

    e.preventDefault();
    setIsPoolHighlighted(false);

    if (!dragState || dragState.source !== 'sequence') {
      setDragState(null);
      return;
    }

    const originIndex = dragState.index ?? placedItems.findIndex(item => item?.id === dragState.id);
    if (originIndex === -1) {
      setDragState(null);
      return;
    }

    const newPlaced = [...placedItems];
    const itemToReturn = newPlaced[originIndex];
    if (!itemToReturn) {
      setDragState(null);
      return;
    }

    newPlaced[originIndex] = null;
    setPlacedItems(newPlaced);
    setAvailableItems(prev => [...prev, itemToReturn]);
    setDragState(null);
    resetCheckState();
  };

  const handleDragEnd = () => {
    setDragState(null);
    setDragOverSlot(null);
    setIsPoolHighlighted(false);
  };

  const checkSequence = () => {
    const isSequenceCorrect = placedItems.every((item, index) => {
      if (!item) return false;
      const originalItem = tile.content.items.find(original => original.id === item.id);
      return originalItem && originalItem.correctPosition === index;
    }) && placedItems.length === tile.content.items.length;

    setIsCorrect(isSequenceCorrect);
    setIsChecked(true);
    setAttempts(prev => prev + 1);
  };

  const resetSequence = () => {
    const shuffledItems = [...tile.content.items]
      .map((item, index) => ({
        id: item.id,
        text: item.text,
        originalIndex: index
      }))
      .sort(() => Math.random() - 0.5);

    setAvailableItems(shuffledItems);
    setPlacedItems(new Array(shuffledItems.length).fill(null));
    setIsChecked(false);
    setIsCorrect(null);
  };

  const getItemClasses = (itemId: string) => {
    let baseClasses = 'flex items-center justify-between gap-4 px-4 py-3 rounded-xl border border-slate-800/70 bg-slate-800/60 text-slate-100 shadow-sm shadow-slate-900/30 transition-transform duration-200 select-none';

    if (dragState?.id === itemId) {
      baseClasses += ' opacity-60 scale-[0.98]';
    }

    return baseClasses;
  };

  const getSlotClasses = (index: number, hasItem: boolean) => {
    let baseClasses = 'relative flex items-center gap-4 px-4 py-3 rounded-xl border-2 transition-all duration-200 min-h-[72px]';

    if (dragOverSlot === index) {
      baseClasses += ' border-emerald-400/70 bg-emerald-400/10 shadow-lg shadow-emerald-500/10';
    } else if (isChecked && isCorrect !== null) {
      const placedItem = placedItems[index];
      const originalItem = placedItem
        ? tile.content.items.find(item => item.id === placedItem.id)
        : null;
      const isInCorrectPosition = originalItem && originalItem.correctPosition === index;

      if (isInCorrectPosition) {
        baseClasses += ' border-emerald-400/60 bg-emerald-400/5';
      } else {
        baseClasses += ' border-rose-400/60 bg-rose-400/5';
      }
    } else if (hasItem) {
      baseClasses += ' border-slate-700/80 bg-slate-800/40';
    } else {
      baseClasses += ' border-dashed border-slate-700/80 bg-slate-900/30 hover:border-emerald-400/60 hover:bg-emerald-400/5';
    }

    return baseClasses;
  };

  return (
    <div className="w-full h-full">
      <div className="w-full h-full rounded-3xl border border-slate-800 bg-slate-950/80 text-slate-100 shadow-2xl shadow-slate-950/40 flex flex-col gap-6 p-6 overflow-hidden">
        {/* Question */}
        <div className="flex items-start justify-between gap-4">
          <div
            className="text-lg font-semibold leading-snug flex-1"
            style={{
              fontFamily: tile.content.fontFamily,
              fontSize: `${tile.content.fontSize}px`
            }}
            dangerouslySetInnerHTML={{
              __html: tile.content.richQuestion || tile.content.question
            }}
          />

          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <Sparkles className="w-4 h-4" />
            <span>Ćwiczenie sekwencyjne</span>
          </div>
        </div>

        {attempts > 0 && (
          <div className="text-xs uppercase tracking-[0.32em] text-slate-500">
            Próba #{attempts}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
          {/* Available items */}
          <div
            className={`flex flex-col rounded-2xl border transition-all duration-200 ${
              isPoolHighlighted
                ? 'border-emerald-400/70 bg-emerald-400/10 shadow-lg shadow-emerald-500/10'
                : 'border-slate-800/70 bg-slate-900/40'
            }`}
            onDragOver={handlePoolDragOver}
            onDragLeave={handlePoolDragLeave}
            onDrop={handleDropToPool}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                <Shuffle className="w-4 h-4" />
                <span>Pula elementów</span>
              </div>
              <span className="text-xs text-slate-400">{availableItems.length} pozostało</span>
            </div>

            <div className="flex-1 overflow-auto px-5 py-4 space-y-3">
              {availableItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 text-center text-sm text-slate-500 py-10">
                  <ArrowLeftRight className="w-5 h-5" />
                  <span>Przeciągnij elementy na prawą stronę</span>
                </div>
              ) : (
                availableItems.map((item, index) => (
                  <div
                    key={item.id}
                    draggable={canInteract}
                    onDragStart={(e) => handleDragStart(e, item.id, 'pool')}
                    onDragEnd={handleDragEnd}
                    className={getItemClasses(item.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-900/70 border border-white/5 flex items-center justify-center text-xs font-semibold text-slate-300">
                        {tile.content.showPositionNumbers ? index + 1 : '•'}
                      </div>
                      <span className="text-sm font-medium text-slate-100">{item.text}</span>
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.32em] text-slate-500">Przeciągnij</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sequence area */}
          <div className="flex flex-col rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
            <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-500/20">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
                <CheckCircle className="w-4 h-4" />
                <span>Twoja sekwencja</span>
              </div>
              <span className="text-xs text-emerald-200/70">{placedItems.filter(Boolean).length} / {tile.content.items.length}</span>
            </div>

            <div className="flex-1 overflow-auto px-5 py-4 space-y-3">
              {placedItems.map((item, index) => (
                <div
                  key={index}
                  className={getSlotClasses(index, Boolean(item))}
                  onDragOver={(e) => handleSlotDragOver(e, index)}
                  onDragLeave={handleSlotDragLeave}
                  onDrop={(e) => handleDropToSlot(e, index)}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-200 text-sm font-semibold border border-emerald-500/30">
                    {index + 1}
                  </div>
                  {item ? (
                    <div
                      className="flex-1 flex items-center justify-between gap-4"
                      draggable={canInteract}
                      onDragStart={(e) => handleDragStart(e, item.id, 'sequence', index)}
                      onDragEnd={handleDragEnd}
                    >
                      <span className="text-sm font-medium text-slate-100">{item.text}</span>
                      {!isPreview && (
                        <span className="text-[10px] uppercase tracking-[0.32em] text-emerald-200/70">Przenieś</span>
                      )}
                    </div>
                  ) : (
                    <span className="flex-1 text-sm text-slate-500 italic">
                      Upuść element w tym miejscu
                    </span>
                  )}

                  {isChecked && isCorrect !== null && item && (
                    (() => {
                      const originalItem = tile.content.items.find(original => original.id === item.id);
                      const isInCorrectPosition = originalItem && originalItem.correctPosition === index;

                      return isInCorrectPosition ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-400" />
                      );
                    })()
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feedback */}
        {isChecked && isCorrect !== null && (
          <div className={`rounded-2xl border px-6 py-4 flex items-center justify-between ${
            isCorrect
              ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'
              : 'border-rose-400/40 bg-rose-500/10 text-rose-100'
          }`}>
            <div className="flex items-center gap-3 text-sm font-medium">
              {isCorrect ? (
                <CheckCircle className="w-5 h-5 text-emerald-300" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-300" />
              )}
              <span>
                {isCorrect ? tile.content.correctFeedback : tile.content.incorrectFeedback}
              </span>
            </div>

            {!isCorrect && (
              <div className="text-xs text-slate-200/70">
                Spróbuj ponownie, przenosząc elementy.
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {!isPreview && (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-700/70 text-[10px] font-semibold text-slate-300">i</span>
              <span>Przeciągnij elementy z puli, aby ułożyć sekwencję w prawidłowej kolejności.</span>
            </div>

            <div className="flex items-center gap-3">
              {(!isChecked || (isChecked && !isCorrect && tile.content.allowMultipleAttempts)) && (
                <button
                  onClick={checkSequence}
                  disabled={!sequenceComplete}
                  className="px-6 py-2 rounded-xl bg-emerald-500 text-slate-950 font-semibold shadow-lg shadow-emerald-500/30 transition-transform duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5"
                >
                  Sprawdź kolejność
                </button>
              )}

              {(isChecked && !isCorrect && tile.content.allowMultipleAttempts) && (
                <button
                  onClick={resetSequence}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-100 font-medium border border-slate-700/80 hover:bg-slate-700 transition-colors flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Wymieszaj ponownie</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
);
};
