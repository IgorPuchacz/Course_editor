import React, { useEffect, useState } from 'react';
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  GripVertical,
  ListOrdered,
  ArrowRightCircle
} from 'lucide-react';
import { SequencingTile } from '../../types/lessonEditor';

interface SequencingInteractiveProps {
  tile: SequencingTile;
  isPreview?: boolean;
}

interface SequencingItem {
  id: string;
  text: string;
  originalIndex: number;
}

type DragSource =
  | { source: 'available'; index: number }
  | { source: 'slot'; index: number };

export const SequencingInteractive: React.FC<SequencingInteractiveProps> = ({
  tile,
  isPreview = false
}) => {
  const [availableItems, setAvailableItems] = useState<SequencingItem[]>([]);
  const [slots, setSlots] = useState<(SequencingItem | null)[]>([]);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [draggedItem, setDraggedItem] = useState<DragSource | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [isPoolHighlighted, setIsPoolHighlighted] = useState(false);

  const canInteract = !isPreview && (!isChecked || !isCorrect || tile.content.allowMultipleAttempts);

  const initializeSequence = () => {
    const shuffledItems = tile.content.items
      .map((item, index) => ({
        id: item.id,
        text: item.text,
        originalIndex: index
      }))
      .sort(() => Math.random() - 0.5);

    setAvailableItems(shuffledItems);
    setSlots(Array(tile.content.items.length).fill(null));
    setIsChecked(false);
    setIsCorrect(null);
    setAttempts(0);
  };

  useEffect(() => {
    initializeSequence();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tile.content.items]);

  const resetCheckState = () => {
    if (isChecked) {
      setIsChecked(false);
      setIsCorrect(null);
    }
  };

  const handleAvailableDragStart = (e: React.DragEvent, index: number) => {
    if (!canInteract) return;
    setDraggedItem({ source: 'available', index });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSlotDragStart = (e: React.DragEvent, index: number) => {
    if (!canInteract || !slots[index]) return;
    setDraggedItem({ source: 'slot', index });
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

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverSlot(null);
    setIsPoolHighlighted(false);
  };

  const handleSlotDrop = (e: React.DragEvent, targetIndex: number) => {
    if (!canInteract) return;
    e.preventDefault();
    setDragOverSlot(null);

    if (!draggedItem) return;

    const newSlots = [...slots];
    const newAvailable = [...availableItems];

    if (draggedItem.source === 'available') {
      const [item] = newAvailable.splice(draggedItem.index, 1);
      if (!item) {
        setDraggedItem(null);
        return;
      }

      const displaced = newSlots[targetIndex];
      newSlots[targetIndex] = item;

      if (displaced) {
        newAvailable.push(displaced);
      }

      setAvailableItems(newAvailable);
      setSlots(newSlots);
      resetCheckState();
      setDraggedItem(null);
      return;
    }

    if (draggedItem.source === 'slot') {
      const sourceIndex = draggedItem.index;
      if (sourceIndex === targetIndex) {
        setDraggedItem(null);
        return;
      }

      const movingItem = newSlots[sourceIndex];
      if (!movingItem) {
        setDraggedItem(null);
        return;
      }

      const targetItem = newSlots[targetIndex];
      newSlots[targetIndex] = movingItem;
      newSlots[sourceIndex] = targetItem ?? null;

      setSlots(newSlots);
      resetCheckState();
      setDraggedItem(null);
    }
  };

  const handlePoolDragOver = (e: React.DragEvent) => {
    if (!canInteract) return;
    e.preventDefault();
    setIsPoolHighlighted(true);
  };

  const handlePoolDragLeave = () => {
    setIsPoolHighlighted(false);
  };

  const handlePoolDrop = (e: React.DragEvent) => {
    if (!canInteract) return;
    e.preventDefault();
    setIsPoolHighlighted(false);

    if (!draggedItem || draggedItem.source !== 'slot') {
      setDraggedItem(null);
      return;
    }

    const newSlots = [...slots];
    const item = newSlots[draggedItem.index];

    if (!item) {
      setDraggedItem(null);
      return;
    }

    newSlots[draggedItem.index] = null;
    setSlots(newSlots);
    setAvailableItems(prev => [...prev, item]);
    resetCheckState();
    setDraggedItem(null);
  };

  const checkSequence = () => {
    const isSequenceCorrect = slots.every((slotItem, index) => {
      if (!slotItem) return false;
      const originalItem = tile.content.items.find(original => original.id === slotItem.id);
      return originalItem ? originalItem.correctPosition === index : false;
    });

    setIsCorrect(isSequenceCorrect);
    setIsChecked(true);
    setAttempts(prev => prev + 1);
  };

  const resetSequence = () => {
    initializeSequence();
  };

  const isReadyToCheck = slots.every(slotItem => slotItem !== null);

  const renderFeedback = () => {
    if (!isChecked || isCorrect === null) {
      return null;
    }

    return (
      <div
        className={`rounded-2xl border px-5 py-4 text-sm font-medium transition-all ${
          isCorrect
            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
            : 'border-rose-500/40 bg-rose-500/10 text-rose-200'
        }`}
      >
        <div className="flex items-center justify-center gap-3">
          {isCorrect ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          <span>{isCorrect ? tile.content.correctFeedback : tile.content.incorrectFeedback}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-slate-950/95 text-slate-100 rounded-3xl shadow-[0_0_35px_rgba(15,23,42,0.45)] overflow-hidden flex flex-col">
      <div className="border-b border-slate-900/70">
        <div className="px-6 pt-6 pb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center">
              <ListOrdered className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.32em] text-slate-500">Ćwiczenie sekwencyjne</p>
              <h2 className="text-lg font-semibold text-slate-100">Ułóż poprawną kolejność</h2>
            </div>
          </div>

          {attempts > 0 && (
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
              Próba <span className="ml-2 text-slate-200">{attempts}</span>
            </div>
          )}
        </div>

        <div
          className="px-6 pb-6 text-sm leading-relaxed text-slate-200"
          style={{
            fontFamily: tile.content.fontFamily,
            fontSize: `${tile.content.fontSize}px`
          }}
          dangerouslySetInnerHTML={{
            __html: tile.content.richQuestion || tile.content.question
          }}
        />
      </div>

      <div className="flex-1 px-6 py-6 overflow-hidden">
        <div className="flex h-full flex-col gap-6 lg:flex-row">
          <div className="lg:w-1/2">
            <div
              className={`h-full rounded-2xl border bg-slate-900/50 p-5 transition-colors ${
                isPoolHighlighted ? 'border-emerald-400/60 bg-emerald-500/10' : 'border-slate-900/60'
              }`}
              onDragOver={handlePoolDragOver}
              onDragLeave={handlePoolDragLeave}
              onDrop={handlePoolDrop}
            >
              <div className="flex items-center justify-between gap-3 pb-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Dostępne elementy</p>
                  <h3 className="text-sm font-semibold text-slate-100">Przeciągnij, aby umieścić po prawej stronie</h3>
                </div>
                <ArrowRightCircle className="hidden h-5 w-5 text-emerald-300 lg:block" />
              </div>

              <div className="space-y-3 overflow-y-auto pr-1">
                {availableItems.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-800/80 bg-slate-900/40 px-4 py-6 text-center text-xs text-slate-500">
                    Wszystkie elementy zostały przypisane do sekwencji.
                  </div>
                ) : (
                  availableItems.map((item, index) => (
                    <div
                      key={item.id}
                      draggable={canInteract}
                      onDragStart={(e) => handleAvailableDragStart(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`group flex items-center gap-4 rounded-xl border bg-slate-900/80 px-4 py-3 text-sm font-medium shadow-sm transition-all ${
                        canInteract
                          ? 'cursor-grab border-slate-800/80 hover:border-emerald-400/50 hover:bg-slate-900'
                          : 'border-slate-900/60 cursor-default'
                      }`}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950/60 text-slate-500 group-hover:text-emerald-300">
                        <GripVertical className="h-4 w-4" />
                      </div>
                      <span className="flex-1 text-slate-200 leading-relaxed">{item.text}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex h-full flex-col rounded-2xl border border-slate-900/60 bg-slate-900/50 p-5">
              <div className="flex items-center justify-between gap-3 pb-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Docelowa kolejność</p>
                  <h3 className="text-sm font-semibold text-slate-100">Upuść elementy w odpowiednich miejscach</h3>
                </div>
                {tile.content.showPositionNumbers && (
                  <span className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Numery pozycji włączone</span>
                )}
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {slots.map((slotItem, index) => {
                  const originalItem = slotItem
                    ? tile.content.items.find(item => item.id === slotItem.id)
                    : null;
                  const isInCorrectPosition =
                    isChecked && isCorrect !== null && slotItem && originalItem
                      ? originalItem.correctPosition === index
                      : null;

                  return (
                    <div
                      key={index}
                      onDragOver={(e) => handleSlotDragOver(e, index)}
                      onDragLeave={handleSlotDragLeave}
                      onDrop={(e) => handleSlotDrop(e, index)}
                      className={`rounded-2xl border-2 border-dashed transition-all ${
                        dragOverSlot === index
                          ? 'border-emerald-400/70 bg-emerald-500/10'
                          : slotItem
                            ? 'border-transparent bg-slate-900/80'
                            : 'border-slate-800/70 bg-slate-900/30'
                      }`}
                    >
                      <div
                        className={`flex min-h-[72px] items-center gap-4 px-4 py-3 ${
                          slotItem && canInteract ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
                        }`}
                        draggable={canInteract && !!slotItem}
                        onDragStart={(e) => handleSlotDragStart(e, index)}
                        onDragEnd={handleDragEnd}
                      >
                        {tile.content.showPositionNumbers && (
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950/60 text-xs font-semibold text-slate-400">
                            {index + 1}
                          </div>
                        )}

                        {slotItem ? (
                          <div className="flex flex-1 items-center gap-4">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950/60 text-slate-500">
                              <GripVertical className="h-4 w-4" />
                            </div>
                            <p className="flex-1 text-sm font-medium leading-relaxed text-slate-100">{slotItem.text}</p>

                            {isChecked && isCorrect !== null && (
                              <div className="flex items-center text-sm">
                                {isInCorrectPosition ? (
                                  <CheckCircle className="h-5 w-5 text-emerald-300" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-rose-300" />
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-1 items-center justify-between gap-3 text-sm text-slate-500">
                            <span>Upuść element tutaj</span>
                            <ArrowRightCircle className="h-5 w-5 text-slate-700" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-900/70 px-6 py-5">
        <div className="flex flex-col gap-4">
          {renderFeedback()}

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {!isPreview && !isChecked && (
              <div className="rounded-2xl border border-slate-900/60 bg-slate-900/40 px-4 py-3 text-sm text-slate-300">
                💡 Przeciągnij element z lewej strony i upuść go w odpowiednim miejscu po prawej, aby zbudować sekwencję.
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-3">
              {(!isChecked || (isChecked && !isCorrect && tile.content.allowMultipleAttempts)) && (
                <button
                  onClick={checkSequence}
                  disabled={!isReadyToCheck || !canInteract}
                  className="rounded-xl bg-emerald-500 px-6 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Sprawdź kolejność
                </button>
              )}

              {isChecked && !isCorrect && tile.content.allowMultipleAttempts && (
                <button
                  onClick={resetSequence}
                  className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-emerald-400/50 hover:text-emerald-200"
                >
                  <RotateCcw className="h-4 w-4" />
                  Wymieszaj ponownie
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};