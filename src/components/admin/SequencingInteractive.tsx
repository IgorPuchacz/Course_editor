import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CheckCircle, XCircle, RotateCcw, Sparkles, GripVertical, Shuffle, ArrowLeftRight } from 'lucide-react';
import { SequencingTile } from '../../types/lessonEditor';
import { useTileAccentPalette } from '../../utils/colorUtils';
import { TaskInstructionPanel } from './common/TaskInstructionPanel';
import { RichTextEditor, RichTextEditorProps } from './common/RichTextEditor';

interface SequencingInteractiveProps {
  tile: SequencingTile;
  isPreview?: boolean;
  isTestingMode?: boolean;
  onRequestTextEditing?: () => void;
  instructionEditorProps?: RichTextEditorProps;
  variant?: 'standalone' | 'embedded';
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
  isPreview = false,
  isTestingMode = false,
  onRequestTextEditing,
  instructionEditorProps,
  variant = 'embedded'
}) => {
  const [availableItems, setAvailableItems] = useState<DraggedItem[]>([]);
  const [placedItems, setPlacedItems] = useState<(DraggedItem | null)[]>([]);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [isPoolHighlighted, setIsPoolHighlighted] = useState(false);
  const canInteract = !isPreview;
  const sequenceComplete = placedItems.length > 0 && placedItems.every(item => item !== null);

  const accentColor = tile.content.backgroundColor || '#0f172a';
  const {
    textColor,
    shared: { testingCaptionColor },
    buttons,
    feedback,
    sequencing: {
      gradientStart,
      gradientEnd,
      frameBorderColor,
      panelBackground,
      panelBorder,
      iconBackground,
      poolBackground,
      poolBorder,
      poolHighlightBackground,
      poolHighlightBorder,
      itemBackground,
      itemBorder,
      gripBackground,
      gripBorder,
      sequenceBackground,
      sequenceBorder,
      sequenceHeaderBorder,
      badgeBackground,
      badgeBorder,
      slotEmptyBackground,
      slotEmptyBorder,
      slotHoverBackground,
      slotHoverBorder,
      slotFilledBackground,
      slotFilledBorder,
      slotCorrectBackground,
      slotCorrectBorder,
      successIconColor,
    },
  } = useTileAccentPalette(accentColor);
  const mutedLabelColor = textColor === '#0f172a' ? '#475569' : '#dbeafe';
  const subtleCaptionColor = textColor === '#0f172a' ? '#64748b' : '#e2e8f0';
  const badgeTextColor = textColor === '#0f172a' ? '#1f2937' : '#f8fafc';
  const successFeedbackBackground = feedback.successBackground;
  const successFeedbackBorder = feedback.successBorder;
  const failureFeedbackBackground = feedback.failureBackground;
  const failureFeedbackBorder = feedback.failureBorder;
  const primaryButtonBackground = buttons.primary.background;
  const primaryButtonTextColor = buttons.primary.text;
  const secondaryButtonBackground = buttons.secondary.background;
  const secondaryButtonBorder = buttons.secondary.border;
  const showBorder = tile.content.showBorder !== false;
  const isEmbedded = variant === 'embedded';

  const correctOrderIds = useMemo(
    () =>
      [...tile.content.items]
        .sort((a, b) => a.correctPosition - b.correctPosition)
        .map(item => item.id),
    [tile.content.items]
  );

  const buildInitialPool = useCallback((): DraggedItem[] => {
    const normalized = [...tile.content.items]
      .sort((a, b) => a.correctPosition - b.correctPosition)
      .map(item => ({
        id: item.id,
        text: item.text,
        originalIndex: item.correctPosition
      }));

    if (normalized.length <= 1) {
      return normalized;
    }

    const maxAttempts = 20;
    let attemptsCount = 0;
    let shuffled = [...normalized];

    const isCorrectSequence = (items: DraggedItem[]) =>
      items.every((item, index) => item.id === correctOrderIds[index]);

    do {
      shuffled = [...normalized].sort(() => Math.random() - 0.5);
      attemptsCount += 1;
    } while (attemptsCount < maxAttempts && isCorrectSequence(shuffled));

    if (isCorrectSequence(shuffled)) {
      const [first, ...rest] = shuffled;
      shuffled = [...rest, first];
    }

    return shuffled;
  }, [correctOrderIds, tile.content.items]);

  const initializeExercise = useCallback(() => {
    const shuffledItems = buildInitialPool();

    setAvailableItems(shuffledItems);
    setPlacedItems(new Array(shuffledItems.length).fill(null));
    setIsChecked(false);
    setIsCorrect(null);
    setAttempts(0);
  }, [buildInitialPool]);

  useEffect(() => {
    initializeExercise();
  }, [initializeExercise]);

  useEffect(() => {
    if (isTestingMode) {
      initializeExercise();
    }
  }, [isTestingMode, initializeExercise]);

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
    try {
      e.dataTransfer.setData('text/plain', itemId);
    } catch {
      // Some browsers may throw when setting data with unsupported formats; ignore.
    }
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
    const isSequenceCorrect =
      placedItems.every((item, index) => {
        if (!item) return false;
        const originalItem = tile.content.items.find(original => original.id === item.id);
        return originalItem && originalItem.correctPosition === index;
      }) && placedItems.length === tile.content.items.length;

    setIsCorrect(isSequenceCorrect);
    setIsChecked(true);
    setAttempts(prev => prev + 1);
  };

  const resetSequence = () => {
    const shuffledItems = buildInitialPool();

    setAvailableItems(shuffledItems);
    setPlacedItems(new Array(shuffledItems.length).fill(null));
    setIsChecked(false);
    setIsCorrect(null);
  };

  const getItemClasses = (itemId: string) => {
    let baseClasses =
      'flex items-center gap-4 px-4 py-3 rounded-xl border shadow-sm transition-transform duration-200 select-none cursor-grab active:cursor-grabbing';

    if (dragState?.id === itemId) {
      baseClasses += ' opacity-60 scale-[0.98]';
    }

    return baseClasses;
  };

  const getSlotClasses = (hasItem: boolean) =>
    `relative flex items-center gap-4 px-4 py-3 rounded-xl border-2 transition-all duration-200 min-h-[72px] ${
      hasItem ? '' : 'border-dashed'
    }`;

  const getSlotStyles = (index: number, hasItem: boolean): React.CSSProperties => {
    if (dragOverSlot === index) {
      return {
        backgroundColor: slotHoverBackground,
        borderColor: slotHoverBorder,
        boxShadow: '0 18px 36px rgba(15, 23, 42, 0.25)'
      };
    }

    if (isChecked && isCorrect !== null) {
      const placedItem = placedItems[index];
      const originalItem = placedItem ? tile.content.items.find(item => item.id === placedItem.id) : null;
      const isInCorrectPosition = originalItem && originalItem.correctPosition === index;

      if (isInCorrectPosition) {
        return {
          backgroundColor: slotCorrectBackground,
          borderColor: slotCorrectBorder
        };
      }

      return {
        backgroundColor: '#fee2e2',
        borderColor: '#f87171'
      };
    }

    if (hasItem) {
      return {
        backgroundColor: slotFilledBackground,
        borderColor: slotFilledBorder
      };
    }

    return {
      backgroundColor: slotEmptyBackground,
      borderColor: slotEmptyBorder
    };
  };

  const handleTileDoubleClick = (event: React.MouseEvent) => {
    if (isPreview || isTestingMode) return;

    event.preventDefault();
    event.stopPropagation();
    onRequestTextEditing?.();
  };

  return (
    <div className="relative w-full h-full" onDoubleClick={handleTileDoubleClick}>
      <div
        className={`w-full h-full flex flex-col gap-6 transition-all duration-300 ${
          isEmbedded
            ? 'p-6'
            : `rounded-3xl ${showBorder ? 'border' : ''} shadow-2xl shadow-slate-950/40 p-6 overflow-hidden`
        }`}
        style={{
          backgroundColor: isEmbedded ? 'transparent' : accentColor,
          backgroundImage: isEmbedded ? undefined : `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
          color: textColor,
          borderColor: !isEmbedded && showBorder ? frameBorderColor : undefined
        }}
      >
        <TaskInstructionPanel
          icon={<Sparkles className="w-4 h-4" />}
          label="Zadanie"
          className="border"
          style={{
            backgroundColor: panelBackground,
            borderColor: panelBorder,
            color: textColor
          }}
          iconWrapperClassName="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
          iconWrapperStyle={{
            backgroundColor: iconBackground,
            color: textColor
          }}
          labelStyle={{ color: mutedLabelColor }}
          bodyClassName="px-5 pb-5"
        >
          {instructionEditorProps ? (
            <RichTextEditor {...instructionEditorProps} />
          ) : (
            <div
              className="text-base leading-relaxed"
              style={{
                fontFamily: tile.content.fontFamily,
                fontSize: `${tile.content.fontSize}px`
              }}
              dangerouslySetInnerHTML={{
                __html: tile.content.richQuestion || tile.content.question
              }}
            />
          )}
        </TaskInstructionPanel>

        {isTestingMode && (
          <div className="text-[11px] uppercase tracking-[0.32em]" style={{ color: testingCaptionColor }}>
            Tryb testowania
          </div>
        )}

        {attempts > 0 && (
          <div className="text-xs uppercase tracking-[0.32em]" style={{ color: testingCaptionColor }}>
            Próba #{attempts}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
          <div
            className="flex flex-col rounded-2xl border transition-all duration-200"
            style={{
              backgroundColor: isPoolHighlighted ? poolHighlightBackground : poolBackground,
              borderColor: isPoolHighlighted ? poolHighlightBorder : poolBorder,
              boxShadow: isPoolHighlighted ? '0 22px 44px rgba(15, 23, 42, 0.22)' : undefined
            }}
            onDragOver={handlePoolDragOver}
            onDragLeave={handlePoolDragLeave}
            onDrop={handleDropToPool}
          >
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: itemBorder, color: subtleCaptionColor }}
            >
              <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: subtleCaptionColor }}>
                <Shuffle className="w-4 h-4" />
                <span>Pula elementów</span>
              </div>
            </div>

            <div className="flex-1 overflow-auto px-5 py-4 space-y-3">
              {availableItems.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center gap-2 text-center text-sm py-10"
                  style={{ color: subtleCaptionColor }}
                >
                  <ArrowLeftRight className="w-5 h-5" />
                  <span>Przeciągnij elementy na prawą stronę</span>
                </div>
              ) : (
                availableItems.map(item => (
                  <div
                    key={item.id}
                    draggable={canInteract}
                    onDragStart={e => handleDragStart(e, item.id, 'pool')}
                    onDragEnd={handleDragEnd}
                    className={getItemClasses(item.id)}
                    style={{ backgroundColor: itemBackground, borderColor: itemBorder, color: textColor }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-lg border"
                        style={{ backgroundColor: gripBackground, borderColor: gripBorder, color: mutedLabelColor }}
                      >
                        <GripVertical className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium" style={{ color: textColor }}>
                        {item.text}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div
            className="flex flex-col rounded-2xl border"
            style={{ backgroundColor: sequenceBackground, borderColor: sequenceBorder }}
          >
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: sequenceHeaderBorder, color: subtleCaptionColor }}
            >
              <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: subtleCaptionColor }}>
                <CheckCircle className="w-4 h-4" style={{ color: subtleCaptionColor }} />
                <span>Twoja sekwencja</span>
              </div>
              <span className="text-xs" style={{ color: subtleCaptionColor }}>
                {placedItems.filter(Boolean).length} / {tile.content.items.length}
              </span>
            </div>

            <div className="flex-1 overflow-auto px-5 py-4 space-y-3">
              {placedItems.map((item, index) => (
                <div
                  key={index}
                  className={getSlotClasses(Boolean(item))}
                  style={getSlotStyles(index, Boolean(item))}
                  onDragOver={e => handleSlotDragOver(e, index)}
                  onDragLeave={handleSlotDragLeave}
                  onDrop={e => handleDropToSlot(e, index)}
                >
                  <div
                    className="flex items-center justify-center w-8 h-8 rounded-lg border text-sm font-semibold"
                    style={{
                      backgroundColor: badgeBackground,
                      borderColor: badgeBorder,
                      color: badgeTextColor
                    }}
                  >
                    {index + 1}
                  </div>
                  {item ? (
                    <div
                      className={`flex-1 flex items-center justify-between gap-4 cursor-grab active:cursor-grabbing ${
                        dragState?.id === item.id ? 'opacity-60 scale-[0.98]' : ''
                      }`}
                      draggable={canInteract}
                      onDragStart={e => handleDragStart(e, item.id, 'sequence', index)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-lg border"
                          style={{ backgroundColor: gripBackground, borderColor: gripBorder, color: mutedLabelColor }}
                        >
                          <GripVertical className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-left break-words" style={{ color: textColor }}>
                          {item.text}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="flex-1 text-sm italic" style={{ color: subtleCaptionColor }}>
                      Upuść element w tym miejscu
                    </span>
                  )}

                  {isChecked && isCorrect !== null && item && (() => {
                    const originalItem = tile.content.items.find(original => original.id === item.id);
                    const isInCorrectPosition = originalItem && originalItem.correctPosition === index;

                    return isInCorrectPosition ? (
                      <CheckCircle className="w-5 h-5" style={{ color: successIconColor }} />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-400" />
                    );
                  })()}
                </div>
              ))}
            </div>
          </div>
        </div>

        {isChecked && isCorrect !== null && (
          <div
            className="rounded-2xl border px-6 py-4 flex items-center justify-between"
            style={{
              backgroundColor: isCorrect ? successFeedbackBackground : failureFeedbackBackground,
              borderColor: isCorrect ? successFeedbackBorder : failureFeedbackBorder,
              color: isCorrect ? textColor : '#7f1d1d'
            }}
          >
            <div className="flex items-center gap-3 text-sm font-medium">
              {isCorrect ? (
                <CheckCircle className="w-5 h-5" style={{ color: successIconColor }} />
              ) : (
                <XCircle className="w-5 h-5 text-rose-300" />
              )}
              <span>{isCorrect ? tile.content.correctFeedback : tile.content.incorrectFeedback}</span>
            </div>

            {!isCorrect && (
              <div className="text-xs" style={{ color: '#7f1d1d' }}>
                Spróbuj ponownie, przenosząc elementy.
              </div>
            )}
          </div>
        )}

        {!isPreview && (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={checkSequence}
                disabled={!sequenceComplete || (isChecked && isCorrect)}
                className="px-6 py-2 rounded-xl font-semibold shadow-lg transition-transform duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5"
                style={{
                  backgroundColor: primaryButtonBackground,
                  color: primaryButtonTextColor,
                  boxShadow: '0 16px 32px rgba(15, 23, 42, 0.22)'
                }}
              >
                {isChecked && isCorrect ? 'Sekwencja sprawdzona' : 'Sprawdź kolejność'}
              </button>

              {isChecked && !isCorrect && (
                <button
                  onClick={resetSequence}
                  className="px-4 py-2 rounded-xl font-medium border transition-colors flex items-center gap-2"
                  style={{
                    backgroundColor: secondaryButtonBackground,
                    borderColor: secondaryButtonBorder,
                    color: textColor
                  }}
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
