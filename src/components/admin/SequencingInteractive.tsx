import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  Sparkles,
  Shuffle,
  ArrowLeftRight,
  GripVertical
} from 'lucide-react';
import { SequencingTile } from '../../types/lessonEditor';

interface SequencingInteractiveProps {
  tile: SequencingTile;
  isPreview?: boolean;
  onRequestTextEditing?: () => void;
  headerSlot?: React.ReactNode;
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

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  if (!hex) return null;

  let normalized = hex.replace('#', '').trim();
  if (normalized.length === 3) {
    normalized = normalized
      .split('')
      .map(char => `${char}${char}`)
      .join('');
  }

  if (normalized.length !== 6) return null;

  const intValue = Number.parseInt(normalized, 16);
  if (Number.isNaN(intValue)) return null;

  return {
    r: (intValue >> 16) & 255,
    g: (intValue >> 8) & 255,
    b: intValue & 255
  };
};

const channelToLinear = (value: number): number => {
  const scaled = value / 255;
  return scaled <= 0.03928 ? scaled / 12.92 : Math.pow((scaled + 0.055) / 1.055, 2.4);
};

const getReadableTextColor = (hex: string): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#f8fafc';

  const luminance =
    0.2126 * channelToLinear(rgb.r) +
    0.7152 * channelToLinear(rgb.g) +
    0.0722 * channelToLinear(rgb.b);

  return luminance > 0.6 ? '#0f172a' : '#f8fafc';
};

const lightenColor = (hex: string, amount: number): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const lightenChannel = (channel: number) => Math.round(channel + (255 - channel) * amount);
  return `rgb(${lightenChannel(rgb.r)}, ${lightenChannel(rgb.g)}, ${lightenChannel(rgb.b)})`;
};

const darkenColor = (hex: string, amount: number): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const darkenChannel = (channel: number) => Math.round(channel * (1 - amount));
  return `rgb(${darkenChannel(rgb.r)}, ${darkenChannel(rgb.g)}, ${darkenChannel(rgb.b)})`;
};

const withAlpha = (hex: string, alpha: number): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(15, 23, 42, ${alpha})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
};

export const SequencingInteractive: React.FC<SequencingInteractiveProps> = ({
  tile,
  isPreview = false,
  onRequestTextEditing,
  headerSlot
}) => {
  const [availableItems, setAvailableItems] = useState<DraggedItem[]>([]);
  const [placedItems, setPlacedItems] = useState<(DraggedItem | null)[]>([]);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [isPoolHighlighted, setIsPoolHighlighted] = useState(false);
  const [isModePromptVisible, setIsModePromptVisible] = useState(false);
  const [isTestingMode, setIsTestingMode] = useState(false);
  const modePromptRef = useRef<HTMLDivElement>(null);

  const canInteract = !isPreview && isTestingMode;
  const sequenceComplete = placedItems.length > 0 && placedItems.every(item => item !== null);

  const accentColor = tile.content.backgroundColor || '#0f172a';
  const textColor = useMemo(() => getReadableTextColor(accentColor), [accentColor]);
  const gradientStart = useMemo(() => lightenColor(accentColor, 0.08), [accentColor]);
  const gradientEnd = useMemo(() => darkenColor(accentColor, 0.08), [accentColor]);
  const borderColor = useMemo(
    () => withAlpha(textColor, textColor === '#0f172a' ? 0.16 : 0.32),
    [textColor]
  );
  const showBorder = tile.content.showBorder !== false;

  const isDarkBackground = textColor === '#f8fafc';
  const surfaceTone = useCallback(
    (lightAmount: number, darkAmount: number) =>
      isDarkBackground ? lightenColor(accentColor, lightAmount) : darkenColor(accentColor, darkAmount),
    [accentColor, isDarkBackground]
  );

  const baseSurface = useMemo(() => surfaceTone(0.14, 0.1), [surfaceTone]);
  const raisedSurface = useMemo(() => surfaceTone(0.22, 0.18), [surfaceTone]);
  const mutedSurface = useMemo(() => surfaceTone(0.28, 0.26), [surfaceTone]);
  const strongBorder = useMemo(() => surfaceTone(0.08, 0.22), [surfaceTone]);
  const subtleBorder = useMemo(() => surfaceTone(0.18, 0.16), [surfaceTone]);
  const highlightSurface = useMemo(() => surfaceTone(0.34, 0.32), [surfaceTone]);
  const mutedTextColor = useMemo(
    () => (isDarkBackground ? lightenColor(accentColor, 0.48) : darkenColor(accentColor, 0.36)),
    [accentColor, isDarkBackground]
  );
  const softTextColor = useMemo(
    () => (isDarkBackground ? lightenColor(accentColor, 0.42) : darkenColor(accentColor, 0.42)),
    [accentColor, isDarkBackground]
  );
  const badgeBackground = useMemo(() => surfaceTone(0.3, 0.28), [surfaceTone]);
  const badgeBorder = useMemo(() => surfaceTone(0.24, 0.26), [surfaceTone]);
  const badgeTextColor = useMemo(() => (isDarkBackground ? '#0f172a' : '#f8fafc'), [isDarkBackground]);
  const buttonPrimaryBackground = useMemo(() => surfaceTone(0.32, 0.34), [surfaceTone]);
  const buttonPrimaryText = useMemo(() => (isDarkBackground ? '#0f172a' : '#f8fafc'), [isDarkBackground]);
  const buttonSecondaryBackground = useMemo(() => surfaceTone(0.24, 0.26), [surfaceTone]);
  const buttonSecondaryBorder = useMemo(() => surfaceTone(0.18, 0.2), [surfaceTone]);
  const positiveAccent = useMemo(() => surfaceTone(0.26, 0.24), [surfaceTone]);
  const negativeAccent = useMemo(() => surfaceTone(0.12, 0.3), [surfaceTone]);
  const positiveIconColor = useMemo(
    () => (isDarkBackground ? lightenColor(accentColor, 0.46) : darkenColor(accentColor, 0.46)),
    [accentColor, isDarkBackground]
  );
  const negativeIconColor = useMemo(
    () => (isDarkBackground ? lightenColor(accentColor, 0.2) : darkenColor(accentColor, 0.54)),
    [accentColor, isDarkBackground]
  );

  useEffect(() => {
    if (isPreview) {
      setIsTestingMode(false);
    }
  }, [isPreview]);

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

  useEffect(() => {
    const shuffledItems = buildInitialPool();

    setAvailableItems(shuffledItems);
    setPlacedItems(new Array(shuffledItems.length).fill(null));
    setIsChecked(false);
    setIsCorrect(null);
    setAttempts(0);
  }, [buildInitialPool]);

  useEffect(() => {
    if (!isModePromptVisible) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (modePromptRef.current && !modePromptRef.current.contains(event.target as Node)) {
        setIsModePromptVisible(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsModePromptVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isModePromptVisible]);

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
      'flex items-center gap-4 px-4 py-3 rounded-xl border transition-transform duration-200 select-none shadow-sm';

    baseClasses += canInteract ? ' cursor-grab active:cursor-grabbing' : ' cursor-default';

    if (dragState?.id === itemId) {
      baseClasses += ' scale-[0.98]';
    }

    return baseClasses;
  };

  const getSlotClasses = (index: number) => {
    let baseClasses = 'relative flex items-center gap-4 px-4 py-3 rounded-xl border-2 transition-all duration-200 min-h-[72px] shadow-sm';

    if (dragOverSlot === index) {
      baseClasses += ' shadow-lg';
    }

    return baseClasses;
  };

  const getSlotStyle = (index: number, hasItem: boolean) => {
    if (dragOverSlot === index) {
      return {
        backgroundColor: highlightSurface,
        borderColor: strongBorder
      };
    }

    if (isChecked && isCorrect !== null) {
      const placedItem = placedItems[index];
      const originalItem = placedItem ? tile.content.items.find(item => item.id === placedItem.id) : null;
      const isInCorrectPosition = originalItem && originalItem.correctPosition === index;

      if (isInCorrectPosition) {
        return {
          backgroundColor: raisedSurface,
          borderColor: strongBorder
        };
      }

      return {
        backgroundColor: baseSurface,
        borderColor: strongBorder
      };
    }

    if (hasItem) {
      return {
        backgroundColor: raisedSurface,
        borderColor: subtleBorder
      };
    }

    return {
      backgroundColor: mutedSurface,
      borderColor: subtleBorder,
      borderStyle: 'dashed' as const
    };
  };

  const getItemStyle = (itemId: string) => ({
    backgroundColor: raisedSurface,
    borderColor: subtleBorder,
    color: textColor,
    opacity: dragState?.id === itemId ? 0.85 : 1,
    boxShadow: isDarkBackground ? '0 10px 24px rgba(8, 15, 26, 0.28)' : '0 10px 24px rgba(15, 23, 42, 0.16)'
  });

  const stopPropagationInTesting = (event: React.MouseEvent) => {
    if (isTestingMode) {
      event.stopPropagation();
    }
  };

  const handleTileDoubleClick = (event: React.MouseEvent) => {
    if (isPreview) return;

    event.preventDefault();
    event.stopPropagation();
    if (!onRequestTextEditing) {
      return;
    }

    setIsModePromptVisible(true);
  };

  const handleEditSelection = () => {
    setIsModePromptVisible(false);
    onRequestTextEditing?.();
  };

  const handleStartTesting = () => {
    setIsModePromptVisible(false);
    setIsTestingMode(true);
    resetSequence();
    setAttempts(0);
  };

  const handleContinueTesting = () => {
    setIsModePromptVisible(false);
    setIsTestingMode(true);
  };

  const handleStopTesting = () => {
    setIsModePromptVisible(false);
    setIsTestingMode(false);
    resetSequence();
    setAttempts(0);
  };

  return (
    <div className="relative w-full h-full" onDoubleClick={handleTileDoubleClick}>
      <div
        className={`w-full h-full rounded-3xl ${showBorder ? 'border' : ''} shadow-2xl shadow-slate-950/40 flex flex-col gap-6 p-6 overflow-hidden`}
        style={{
          backgroundColor: accentColor,
          backgroundImage: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
          color: textColor,
          borderColor: showBorder ? borderColor : undefined
        }}
      >
        {headerSlot ? (
          headerSlot
        ) : (
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

            <div className="flex items-center gap-2 text-xs font-medium" style={{ color: softTextColor }}>
              <Sparkles className="w-4 h-4" />
              <span>Ćwiczenie sekwencyjne</span>
            </div>
          </div>
        )}

        {attempts > 0 && (
          <div className="text-xs uppercase tracking-[0.32em]" style={{ color: mutedTextColor }}>
            Próba #{attempts}
          </div>
        )}

        {isTestingMode && !isPreview && (
          <div
            className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3 border"
            style={{ backgroundColor: raisedSurface, borderColor: strongBorder, color: textColor }}
          >
            <div className="text-sm font-medium">Tryb testowy aktywny</div>
            <button
              type="button"
              onClick={handleStopTesting}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide"
              style={{
                backgroundColor: buttonSecondaryBackground,
                border: `1px solid ${buttonSecondaryBorder}`,
                color: textColor,
                letterSpacing: '0.08em'
              }}
            >
              Zakończ testowanie
            </button>
          </div>
        )}

        {!isTestingMode && !isPreview && (
          <div
            className="rounded-2xl border px-4 py-3 text-sm"
            style={{ backgroundColor: baseSurface, borderColor: subtleBorder, color: mutedTextColor }}
          >
            Dwukrotnie kliknij kafelek, aby uruchomić tryb testowy i sprawdzić zadanie.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
          <div
            className="flex flex-col rounded-2xl border transition-all duration-200 shadow-sm"
            onDragOver={handlePoolDragOver}
            onDragLeave={handlePoolDragLeave}
            onDrop={handleDropToPool}
            style={{
              backgroundColor: isPoolHighlighted ? highlightSurface : baseSurface,
              borderColor: isPoolHighlighted ? strongBorder : subtleBorder,
              boxShadow: isPoolHighlighted
                ? isDarkBackground
                  ? '0 18px 36px rgba(8, 15, 26, 0.3)'
                  : '0 18px 36px rgba(15, 23, 42, 0.18)'
                : undefined
            }}
          >
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: subtleBorder, color: textColor }}
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Shuffle className="w-4 h-4" />
                <span>Pula elementów</span>
              </div>
            </div>

            <div className="flex-1 overflow-auto px-5 py-4 space-y-3">
              {availableItems.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center gap-2 text-center text-sm py-10"
                  style={{ color: mutedTextColor }}
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
                    onMouseDown={stopPropagationInTesting}
                    className={getItemClasses(item.id)}
                    style={getItemStyle(item.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-lg border"
                        style={{
                          backgroundColor: mutedSurface,
                          borderColor: subtleBorder,
                          color: softTextColor
                        }}
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
            className="flex flex-col rounded-2xl border shadow-sm"
            style={{ backgroundColor: baseSurface, borderColor: subtleBorder }}
          >
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: subtleBorder, color: textColor }}
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CheckCircle className="w-4 h-4" />
                <span>Twoja sekwencja</span>
              </div>
              <span className="text-xs font-medium" style={{ color: mutedTextColor }}>
                {placedItems.filter(Boolean).length} / {tile.content.items.length}
              </span>
            </div>

            <div className="flex-1 overflow-auto px-5 py-4 space-y-3">
              {placedItems.map((item, index) => (
                <div
                  key={index}
                  className={getSlotClasses(index)}
                  style={getSlotStyle(index, Boolean(item))}
                  onDragOver={e => handleSlotDragOver(e, index)}
                  onDragLeave={handleSlotDragLeave}
                  onDrop={e => handleDropToSlot(e, index)}
                  onMouseDown={stopPropagationInTesting}
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
                      className={`flex-1 flex items-center justify-between gap-4 transition-transform duration-200 ${
                        canInteract ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
                      }`}
                      draggable={canInteract}
                      onDragStart={e => handleDragStart(e, item.id, 'sequence', index)}
                      onDragEnd={handleDragEnd}
                      onMouseDown={stopPropagationInTesting}
                      style={{ color: textColor, opacity: dragState?.id === item.id ? 0.85 : 1 }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-lg border"
                          style={{
                            backgroundColor: mutedSurface,
                            borderColor: subtleBorder,
                            color: softTextColor
                          }}
                        >
                          <GripVertical className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-left break-words" style={{ color: textColor }}>
                          {item.text}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="flex-1 text-sm italic" style={{ color: mutedTextColor }}>
                      Upuść element w tym miejscu
                    </span>
                  )}

                  {isChecked && isCorrect !== null && item && (() => {
                    const originalItem = tile.content.items.find(original => original.id === item.id);
                    const isInCorrectPosition = originalItem && originalItem.correctPosition === index;

                    return isInCorrectPosition ? (
                      <CheckCircle className="w-5 h-5" style={{ color: positiveIconColor }} />
                    ) : (
                      <XCircle className="w-5 h-5" style={{ color: negativeIconColor }} />
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
              backgroundColor: isCorrect ? positiveAccent : negativeAccent,
              borderColor: isCorrect ? strongBorder : strongBorder,
              color: textColor
            }}
          >
            <div className="flex items-center gap-3 text-sm font-medium">
              {isCorrect ? (
                <CheckCircle className="w-5 h-5" style={{ color: positiveIconColor }} />
              ) : (
                <XCircle className="w-5 h-5" style={{ color: negativeIconColor }} />
              )}
              <span>{isCorrect ? tile.content.correctFeedback : tile.content.incorrectFeedback}</span>
            </div>

            {!isCorrect && (
              <div className="text-xs" style={{ color: softTextColor }}>
                Spróbuj ponownie, przenosząc elementy.
              </div>
            )}
          </div>
        )}

        {!isPreview && isTestingMode && (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={checkSequence}
                disabled={!sequenceComplete || (isChecked && isCorrect)}
                className="px-6 py-2 rounded-xl font-semibold transition-transform duration-200 disabled:cursor-not-allowed hover:-translate-y-0.5"
                style={{
                  backgroundColor: buttonPrimaryBackground,
                  color: buttonPrimaryText,
                  opacity: !sequenceComplete || (isChecked && isCorrect) ? 0.5 : 1,
                  boxShadow: isDarkBackground
                    ? '0 14px 32px rgba(8, 15, 26, 0.28)'
                    : '0 14px 32px rgba(15, 23, 42, 0.18)'
                }}
              >
                {isChecked && isCorrect ? 'Sekwencja sprawdzona' : 'Sprawdź kolejność'}
              </button>

              {isChecked && !isCorrect && (
                <button
                  onClick={resetSequence}
                  className="px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors"
                  style={{
                    backgroundColor: buttonSecondaryBackground,
                    border: `1px solid ${buttonSecondaryBorder}`,
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

      {isModePromptVisible && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div
            ref={modePromptRef}
            className="w-full max-w-md mx-4 rounded-2xl bg-white shadow-2xl border border-slate-200 p-6 space-y-4"
          >
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-slate-900">Co chcesz zrobić?</h3>
              <p className="text-sm text-slate-500">
                Możesz przetestować zadanie jak uczeń lub przejść do edycji polecenia w trybie RichText.
              </p>
            </div>

            <div className="grid gap-3">
              <button
                type="button"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors duration-200 flex items-center justify-between"
                onClick={isTestingMode ? handleContinueTesting : handleStartTesting}
              >
                <span className="font-medium">{isTestingMode ? 'Kontynuuj testowanie' : 'Przetestuj zadanie'}</span>
                <Sparkles className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 hover:bg-slate-100 transition-colors duration-200 flex items-center justify-between"
                onClick={handleEditSelection}
              >
                <span className="font-medium">Edytuj polecenie</span>
                <Shuffle className="w-4 h-4 text-slate-400" />
              </button>

              {isTestingMode && (
                <button
                  type="button"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors duration-200"
                  onClick={handleStopTesting}
                >
                  Zakończ testowanie
                </button>
              )}
            </div>

            <button
              type="button"
              className="w-full text-sm text-slate-400 hover:text-slate-600 transition-colors duration-200"
              onClick={() => setIsModePromptVisible(false)}
            >
              Anuluj
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
