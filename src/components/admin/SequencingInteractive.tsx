import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, RotateCcw, GripVertical, Inbox } from 'lucide-react';
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

type DragSource =
  | { type: 'available'; index: number }
  | { type: 'placed'; index: number };

export const SequencingInteractive: React.FC<SequencingInteractiveProps> = ({
  tile,
  isPreview = false
}) => {
  const [availableItems, setAvailableItems] = useState<DraggedItem[]>([]);
  const [placedItems, setPlacedItems] = useState<(DraggedItem | null)[]>([]);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [draggedItem, setDraggedItem] = useState<DragSource | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);
  const [isOverAvailable, setIsOverAvailable] = useState(false);

  const canInteract = !isPreview && (!isChecked || !isCorrect || tile.content.allowMultipleAttempts);

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
    setPlacedItems(Array(tile.content.items.length).fill(null));
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

  const handleDragStart = (e: React.DragEvent, source: DragSource) => {
    if (!canInteract) return;
    setDraggedItem(source);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverSlot = (e: React.DragEvent, index: number) => {
    if (!canInteract) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setHoveredSlot(index);
  };

  const handleDragLeave = () => {
    setHoveredSlot(null);
    setIsOverAvailable(false);
  };

  const handleDropOnSlot = (e: React.DragEvent, targetIndex: number) => {
    if (!canInteract) return;
    e.preventDefault();
    setHoveredSlot(null);

    if (!draggedItem) return;

    if (draggedItem.type === 'available') {
      const newAvailable = [...availableItems];
      const [item] = newAvailable.splice(draggedItem.index, 1);

      if (!item) return;

      const newPlaced = [...placedItems];
      const displacedItem = newPlaced[targetIndex];
      newPlaced[targetIndex] = item;

      setAvailableItems(displacedItem ? [...newAvailable, displacedItem] : newAvailable);
      setPlacedItems(newPlaced);
    } else {
      const newPlaced = [...placedItems];
      const item = newPlaced[draggedItem.index];

      if (!item || draggedItem.index === targetIndex) {
        setDraggedItem(null);
        return;
      }

      const targetItem = newPlaced[targetIndex];
      newPlaced[draggedItem.index] = targetItem ?? null;
      newPlaced[targetIndex] = item;
      setPlacedItems(newPlaced);
    }

    setDraggedItem(null);
    resetCheckState();
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setHoveredSlot(null);
    setIsOverAvailable(false);
  };

  const handleAvailableDragOver = (e: React.DragEvent) => {
    if (!canInteract) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsOverAvailable(true);
  };

  const handleDropOnAvailable = (e: React.DragEvent) => {
    if (!canInteract) return;
    e.preventDefault();

    if (!draggedItem || draggedItem.type !== 'placed') {
      setIsOverAvailable(false);
      return;
    }

    const newPlaced = [...placedItems];
    const item = newPlaced[draggedItem.index];

    if (!item) {
      setIsOverAvailable(false);
      setDraggedItem(null);
      return;
    }

    newPlaced[draggedItem.index] = null;
    setPlacedItems(newPlaced);
    setAvailableItems(prev => [...prev, item]);

    setIsOverAvailable(false);
    setDraggedItem(null);
    resetCheckState();
  };

  const checkSequence = () => {
    const isSequenceCorrect = placedItems.every((item, index) => {
      if (!item) return false;
      const originalItem = tile.content.items.find(original => original.id === item.id);
      return originalItem && originalItem.correctPosition === index;
    });

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
    setPlacedItems(Array(tile.content.items.length).fill(null));
    setIsChecked(false);
    setIsCorrect(null);
  };

  const getSlotClasses = (index: number, item: DraggedItem | null) => {
    let baseClasses = 'relative flex h-16 items-center gap-3 rounded-xl border-2 border-slate-700 bg-slate-900/60 px-4 py-3 transition-all duration-200';

    if (!item) {
      baseClasses += ' border-dashed bg-slate-900/30 text-slate-400';
    }

    if (hoveredSlot === index && canInteract) {
      baseClasses += ' border-blue-400 bg-blue-500/10';
    }

    if (isChecked && isCorrect !== null) {
      const originalItem = item ? tile.content.items.find(original => original.id === item.id) : null;
      const isInCorrectPosition = originalItem ? originalItem.correctPosition === index : false;

      if (item && isInCorrectPosition) {
        baseClasses += ' border-green-500/80 bg-green-500/10 shadow-[0_0_0_1px_rgba(34,197,94,0.35)]';
      } else if (item) {
        baseClasses += ' border-red-500/80 bg-red-500/10 shadow-[0_0_0_1px_rgba(248,113,113,0.35)]';
      }
    }

    return baseClasses;
  };

  const isSequenceComplete = placedItems.every(Boolean);

  return (
    <div className="flex h-full w-full flex-col gap-6 overflow-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 text-slate-100">
      {/* Question */}
      <div className="rounded-2xl border border-white/5 bg-white/5 p-6 shadow-lg backdrop-blur">
        <div
          className="text-lg font-semibold leading-snug text-white"
          style={{
            fontFamily: tile.content.fontFamily,
            fontSize: `${tile.content.fontSize}px`
          }}
          dangerouslySetInnerHTML={{
            __html: tile.content.richQuestion || tile.content.question
          }}
        />
        {attempts > 0 && (
          <div className="mt-3 inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
            Próba: {attempts}
          </div>
        )}
      </div>

      <div className="grid flex-1 gap-6 lg:grid-cols-2">
        {/* Available Items */}
        <div className="flex h-full flex-col gap-4 rounded-2xl border border-white/5 bg-white/5 p-5 shadow-inner">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold uppercase tracking-wide text-slate-300">
              Elementy do wykorzystania
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Inbox className="h-4 w-4" />
              <span>{availableItems.length}</span>
            </div>
          </div>

          <div
            className={`flex flex-1 flex-col gap-3 rounded-xl border border-dashed border-white/10 p-4 transition-colors ${
              isOverAvailable ? 'border-blue-400/60 bg-blue-500/10' : 'bg-slate-900/20'
            }`}
            onDragOver={handleAvailableDragOver}
            onDrop={handleDropOnAvailable}
            onDragLeave={handleDragLeave}
          >
            {availableItems.length === 0 ? (
              <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
                Wszystkie elementy zostały użyte w sekwencji
              </div>
            ) : (
              availableItems.map((item, index) => (
                <div
                  key={item.id}
                  draggable={canInteract}
                  onDragStart={(e) => handleDragStart(e, { type: 'available', index })}
                  onDragEnd={handleDragEnd}
                  className={`group flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm font-medium shadow-sm transition-all duration-200 ${
                    canInteract ? 'cursor-grab active:cursor-grabbing hover:border-blue-400/60 hover:bg-blue-500/10' : 'cursor-not-allowed opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {canInteract && <GripVertical className="h-4 w-4 text-slate-500" />}
                    <span>{item.text}</span>
                  </div>
                  {tile.content.showPositionNumbers && (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/10 text-xs font-semibold text-slate-200">
                      {item.originalIndex + 1}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Drop Zone */}
        <div className="flex h-full flex-col gap-4 rounded-2xl border border-blue-500/40 bg-blue-500/10 p-5 shadow-lg">
          <div className="flex items-baseline justify-between">
            <div className="text-sm font-semibold uppercase tracking-wide text-blue-100">
              Ułóż poprawną sekwencję
            </div>
            {tile.content.showPositionNumbers && (
              <span className="text-xs text-blue-200/80">Pola są ponumerowane od góry</span>
            )}
          </div>

          <div className="flex flex-1 flex-col gap-3">
            {placedItems.map((item, index) => (
              <div
                key={index}
                className={getSlotClasses(index, item)}
                onDragOver={(e) => handleDragOverSlot(e, index)}
                onDrop={(e) => handleDropOnSlot(e, index)}
                onDragLeave={handleDragLeave}
              >
                <div className="flex items-center gap-3">
                  {tile.content.showPositionNumbers && (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-400/30 bg-blue-500/10 text-xs font-semibold text-blue-100">
                      {index + 1}
                    </span>
                  )}

                  {item ? (
                    <div
                      draggable={canInteract}
                      onDragStart={(e) => handleDragStart(e, { type: 'placed', index })}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center gap-3 text-sm font-medium ${
                        canInteract ? 'cursor-grab active:cursor-grabbing' : 'cursor-not-allowed'
                      }`}
                    >
                      <span>{item.text}</span>
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-slate-400">
                      Przeciągnij element tutaj
                    </span>
                  )}
                </div>

                {item && isChecked && isCorrect !== null && (
                  <div className="ml-auto">
                    {(() => {
                      const originalItem = tile.content.items.find(original => original.id === item.id);
                      const isInCorrectPosition = originalItem && originalItem.correctPosition === index;

                      return isInCorrectPosition ? (
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-400" />
                      );
                    })()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feedback */}
      {isChecked && isCorrect !== null && (
        <div className={`rounded-2xl border px-6 py-4 text-center text-sm font-medium shadow-lg ${
          isCorrect
            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100'
            : 'border-rose-500/40 bg-rose-500/10 text-rose-100'
        }`}>
          <div className="flex items-center justify-center gap-2">
            {isCorrect ? (
              <CheckCircle className="h-5 w-5 text-emerald-300" />
            ) : (
              <XCircle className="h-5 w-5 text-rose-300" />
            )}
            <span>{isCorrect ? tile.content.correctFeedback : tile.content.incorrectFeedback}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!isPreview && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {(!isChecked || (isChecked && !isCorrect && tile.content.allowMultipleAttempts)) && (
            <button
              onClick={checkSequence}
              disabled={!isSequenceComplete}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Sprawdź kolejność
            </button>
          )}

          {(isChecked && !isCorrect && tile.content.allowMultipleAttempts) && (
            <button
              onClick={resetSequence}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition-colors hover:border-white/20 hover:bg-white/10"
            >
              <RotateCcw className="h-4 w-4" />
              Wymieszaj ponownie
            </button>
          )}
        </div>
      )}

      {/* Instructions */}
      {!isPreview && !isChecked && (
        <div className="rounded-xl border border-white/5 bg-white/5 p-4 text-center text-xs text-slate-300">
          💡 Przeciągaj elementy z lewej strony, aby ułożyć je w odpowiedniej kolejności po prawej, a następnie kliknij „Sprawdź kolejność”.
        </div>
      )}
    </div>
  );
};