import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle, XCircle, RotateCcw, GripVertical, Sparkles } from 'lucide-react';
import { SequencingTile } from '../../types/lessonEditor';

interface SequencingInteractiveProps {
  tile: SequencingTile;
  isPreview?: boolean;
}

interface SequencingItem {
  id: string;
  text: string;
  correctPosition: number;
}

type DragSource =
  | { type: 'available'; index: number }
  | { type: 'placed'; index: number };

export const SequencingInteractive: React.FC<SequencingInteractiveProps> = ({
  tile,
  isPreview = false
}) => {
  const [availableItems, setAvailableItems] = useState<SequencingItem[]>([]);
  const [placedItems, setPlacedItems] = useState<Array<SequencingItem | null>>([]);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [dragSource, setDragSource] = useState<DragSource | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [isOverAvailable, setIsOverAvailable] = useState(false);

  const canInteract = useMemo(
    () => !isPreview && (!isChecked || !isCorrect || tile.content.allowMultipleAttempts),
    [isPreview, isChecked, isCorrect, tile.content.allowMultipleAttempts]
  );

  // Initialize state with randomized available items and empty slots
  useEffect(() => {
    const shuffledItems = [...tile.content.items]
      .map((item) => ({
        id: item.id,
        text: item.text,
        correctPosition: item.correctPosition
      }))
      .sort(() => Math.random() - 0.5);

    setAvailableItems(shuffledItems);
    setPlacedItems(Array(tile.content.items.length).fill(null));
    setIsChecked(false);
    setIsCorrect(null);
    setAttempts(0);
  }, [tile.content.items]);

  const resetValidationState = () => {
    if (isChecked) {
      setIsChecked(false);
      setIsCorrect(null);
    }
  };

  const handleDragStart = (source: DragSource) => (event: React.DragEvent) => {
    if (!canInteract) return;

    setDragSource(source);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', 'sequencing-item');
  };

  const handleDragEnd = () => {
    setDragSource(null);
    setDragOverSlot(null);
    setIsOverAvailable(false);
  };

  const handleSlotDragOver = (event: React.DragEvent, slotIndex: number) => {
    if (!canInteract) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverSlot(slotIndex);
  };

  const handleSlotDragLeave = (slotIndex: number) => {
    if (dragOverSlot === slotIndex) {
      setDragOverSlot(null);
    }
  };

  const handleSlotDrop = (slotIndex: number) => (event: React.DragEvent) => {
    if (!canInteract || !dragSource) return;

    event.preventDefault();

    setDragOverSlot(null);

    const updatedAvailable = [...availableItems];
    const updatedPlaced = [...placedItems];

    if (dragSource.type === 'available') {
      const draggedItem = availableItems[dragSource.index];
      if (!draggedItem) {
        setDragSource(null);
        return;
      }

      updatedAvailable.splice(dragSource.index, 1);

      const replacedItem = updatedPlaced[slotIndex];
      updatedPlaced[slotIndex] = draggedItem;

      if (replacedItem) {
        updatedAvailable.push(replacedItem);
      }

      setAvailableItems(updatedAvailable);
      setPlacedItems(updatedPlaced);
      resetValidationState();
      setDragSource(null);
      return;
    }

    const fromIndex = dragSource.index;
    if (fromIndex === slotIndex) {
      setDragSource(null);
      return;
    }

    const draggedItem = placedItems[fromIndex];
    if (!draggedItem) {
      setDragSource(null);
      return;
    }

    const targetItem = updatedPlaced[slotIndex];
    updatedPlaced[slotIndex] = draggedItem;
    updatedPlaced[fromIndex] = targetItem ?? null;

    setPlacedItems(updatedPlaced);
    resetValidationState();
    setDragSource(null);
  };

  const handleAvailableDragOver = (event: React.DragEvent) => {
    if (!canInteract || !dragSource) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    if (dragSource.type === 'placed') {
      setIsOverAvailable(true);
    }
  };

  const handleAvailableDrop = (event: React.DragEvent) => {
    if (!canInteract || !dragSource || dragSource.type !== 'placed') return;

    event.preventDefault();

    const sourceIndex = dragSource.index;
    const itemToReturn = placedItems[sourceIndex];
    if (!itemToReturn) {
      setIsOverAvailable(false);
      setDragSource(null);
      return;
    }

    const updatedPlaced = [...placedItems];
    updatedPlaced[sourceIndex] = null;
    const updatedAvailable = [...availableItems, itemToReturn];

    setPlacedItems(updatedPlaced);
    setAvailableItems(updatedAvailable);
    resetValidationState();
    setIsOverAvailable(false);
    setDragSource(null);
  };

  const handleAvailableDragLeave = () => {
    setIsOverAvailable(false);
  };

  const checkSequence = () => {
    const allSlotsFilled = placedItems.every(Boolean);

    const isSequenceCorrect = allSlotsFilled && placedItems.every((item, index) => item?.correctPosition === index);

    setIsCorrect(isSequenceCorrect);
    setIsChecked(true);
    setAttempts((prev) => prev + 1);
  };

  const resetSequence = () => {
    const shuffledItems = [...tile.content.items]
      .map((item) => ({
        id: item.id,
        text: item.text,
        correctPosition: item.correctPosition
      }))
      .sort(() => Math.random() - 0.5);

    setAvailableItems(shuffledItems);
    setPlacedItems(Array(tile.content.items.length).fill(null));
    setIsChecked(false);
    setIsCorrect(null);
  };

  const getSlotClasses = (index: number) => {
    const baseClasses = 'group rounded-2xl border-2 border-dashed transition-all duration-200 flex items-center gap-3 px-4 py-4 bg-slate-50/40 backdrop-blur-sm shadow-sm';

    if (!canInteract) {
      return `${baseClasses} border-slate-200 bg-slate-50/60`;
    }

    if (dragOverSlot === index) {
      return `${baseClasses} border-blue-400 bg-blue-50/70`;
    }

    if (isChecked && placedItems[index]) {
      const isSlotCorrect = placedItems[index]?.correctPosition === index;
      return `${baseClasses} ${
        isSlotCorrect
          ? 'border-emerald-400 bg-emerald-50/70'
          : 'border-rose-300 bg-rose-50/70'
      }`;
    }

    return `${baseClasses} border-slate-200 hover:border-blue-300 hover:bg-blue-50/50`;
  };

  const getAvailableItemClasses = (isDragging: boolean) => {
    const baseClasses = 'flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white/90 shadow-sm transition-all duration-200 cursor-grab active:cursor-grabbing';

    if (!canInteract) {
      return `${baseClasses} opacity-60 cursor-not-allowed`;
    }

    if (isDragging) {
      return `${baseClasses} opacity-60 scale-[0.98]`;
    }

    return `${baseClasses} hover:border-blue-300 hover:shadow-md`;
  };

  const interactionDisabledTooltip = !canInteract && isChecked && isCorrect
    ? 'Gratulacje! Zadanie zostało rozwiązane poprawnie.'
    : undefined;

  const allSlotsFilled = placedItems.every(Boolean);

  return (
    <div className="w-full h-full overflow-auto bg-slate-50/70">
      <div className="max-w-5xl mx-auto h-full p-6 flex flex-col gap-6">
        <div
          className="rounded-3xl border border-slate-200 bg-white/90 shadow-lg shadow-slate-200/60"
          style={{
            fontFamily: tile.content.fontFamily,
            fontSize: `${tile.content.fontSize}px`
          }}
        >
          <div className="px-6 py-5 flex items-center gap-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-[0.3em] text-slate-400 font-semibold">
                Zadanie sekwencyjne
              </span>
              <span className="text-lg font-semibold text-slate-800">Ułóż elementy we właściwej kolejności</span>
            </div>
            {attempts > 0 && (
              <div className="ml-auto text-sm font-medium text-slate-500">
                Próba: {attempts}
              </div>
            )}
          </div>
          <div
            className="px-6 py-5 text-slate-700 leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: tile.content.richQuestion || tile.content.question
            }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
          <div
            className={`rounded-3xl border bg-white/90 backdrop-blur shadow-inner transition-all duration-200 ${
              isOverAvailable ? 'border-blue-300 shadow-blue-200/60' : 'border-slate-200'
            }`}
            onDragOver={handleAvailableDragOver}
            onDrop={handleAvailableDrop}
            onDragLeave={handleAvailableDragLeave}
            title={interactionDisabledTooltip}
          >
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-semibold">
                  Dostępne elementy
                </p>
                <h3 className="text-lg font-semibold text-slate-800">Przeciągnij elementy na planszę</h3>
              </div>
              <span className="text-sm text-slate-400">
                {availableItems.length} z {tile.content.items.length}
              </span>
            </div>
            <div className="px-6 py-5 space-y-3 overflow-y-auto max-h-[360px]">
              {availableItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 text-slate-400 text-sm px-4 py-8 text-center">
                  Wszystkie elementy zostały przeniesione na planszę.
                  <br />
                  Jeśli chcesz coś zmienić, przeciągnij element z powrotem w to miejsce.
                </div>
              ) : (
                availableItems.map((item, index) => (
                  <div
                    key={item.id}
                    draggable={canInteract}
                    onDragStart={handleDragStart({ type: 'available', index })}
                    onDragEnd={handleDragEnd}
                    className={getAvailableItemClasses(
                      dragSource?.type === 'available' && dragSource.index === index
                    )}
                  >
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                      <GripVertical className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-base font-medium text-slate-700">
                      {item.text}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-900/95 text-slate-100 shadow-xl flex flex-col">
            <div className="px-6 py-5 border-b border-slate-700/60 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-semibold">
                  Plansza zadania
                </p>
                <h3 className="text-lg font-semibold text-white">Uporządkuj elementy we właściwej kolejności</h3>
              </div>
              {tile.content.showPositionNumbers && (
                <span className="text-xs font-medium text-slate-400 bg-slate-800/80 border border-slate-700 px-3 py-1 rounded-full">
                  Numeracja pozycji włączona
                </span>
              )}
            </div>
            <div className="px-6 py-6 flex-1 overflow-y-auto space-y-4">
              {placedItems.map((item, index) => (
                <div
                  key={`slot-${index}`}
                  className={getSlotClasses(index)}
                  onDragOver={(event) => handleSlotDragOver(event, index)}
                  onDragLeave={() => handleSlotDragLeave(index)}
                  onDrop={handleSlotDrop(index)}
                  title={interactionDisabledTooltip}
                >
                  <div className="flex h-full items-center gap-3 w-full">
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-10 h-10 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-center text-slate-400">
                        {tile.content.showPositionNumbers ? (
                          <span className="font-semibold text-sm">{index + 1}</span>
                        ) : (
                          <GripVertical className="w-4 h-4" />
                        )}
                      </div>

                      <div className="flex-1 min-h-[48px] flex items-center">
                        {item ? (
                          <div
                            className="flex items-center gap-3 w-full"
                            draggable={canInteract}
                            onDragStart={handleDragStart({ type: 'placed', index })}
                            onDragEnd={handleDragEnd}
                          >
                            <div className="flex-1 text-base font-medium text-slate-900">
                              <span className="inline-flex items-center px-3 py-2 rounded-xl bg-white text-slate-900 shadow-sm">
                                {item.text}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">
                            Przeciągnij element w to miejsce
                          </span>
                        )}
                      </div>

                      {isChecked && placedItems[index] && (
                        placedItems[index]?.correctPosition === index ? (
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-400" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {isChecked && isCorrect !== null && (
          <div
            className={`rounded-2xl border px-6 py-4 flex items-center justify-center gap-3 text-base font-medium ${
              isCorrect
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-rose-50 border-rose-300 text-rose-700'
            }`}
          >
            {isCorrect ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span>
              {isCorrect ? tile.content.correctFeedback : tile.content.incorrectFeedback}
            </span>
          </div>
        )}

        {!isPreview && (
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={checkSequence}
                disabled={!canInteract || !allSlotsFilled}
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-white font-semibold shadow-lg shadow-blue-500/30 transition-all duration-200 hover:bg-blue-700 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed"
              >
                Sprawdź kolejność
              </button>

              {isChecked && !isCorrect && tile.content.allowMultipleAttempts && (
                <button
                  onClick={resetSequence}
                  disabled={!canInteract}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-slate-600 font-semibold shadow-sm transition-all duration-200 hover:border-blue-300 hover:text-blue-600 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-4 h-4" />
                  Wymieszaj ponownie
                </button>
              )}
            </div>

            {!isChecked && (
              <div className="text-sm text-slate-500 bg-white/80 border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
                💡 Przeciągnij element z lewej strony na planszę i ustaw go w odpowiednim miejscu.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};