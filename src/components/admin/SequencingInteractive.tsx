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

export const SequencingInteractive: React.FC<SequencingInteractiveProps> = ({
  tile,
  isPreview = false,
  onRequestTextEditing,
  headerSlot
}) => {
  const isEditorUsage = Boolean(onRequestTextEditing);
  const [availableItems, setAvailableItems] = useState<DraggedItem[]>([]);
  const [placedItems, setPlacedItems] = useState<(DraggedItem | null)[]>([]);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [isPoolHighlighted, setIsPoolHighlighted] = useState(false);
  const [isModePromptVisible, setIsModePromptVisible] = useState(false);
  const [isTesting, setIsTesting] = useState(() => !isEditorUsage);
  const modePromptRef = useRef<HTMLDivElement>(null);

  const canInteract = !isPreview && (!isEditorUsage || isTesting);
  const sequenceComplete = placedItems.length > 0 && placedItems.every(item => item !== null);

  const accentColor = tile.content.backgroundColor || '#0f172a';
  const textColor = useMemo(() => getReadableTextColor(accentColor), [accentColor]);
  const gradientStart = useMemo(() => lightenColor(accentColor, 0.08), [accentColor]);
  const gradientEnd = useMemo(() => darkenColor(accentColor, 0.08), [accentColor]);
  const palette = useMemo(() => {
    const isDark = textColor === '#f8fafc';
    const lighten = (amount: number) => lightenColor(accentColor, amount);
    const darken = (amount: number) => darkenColor(accentColor, amount);

    const surface = isDark ? lighten(0.1) : darken(0.05);
    const elevated = isDark ? lighten(0.18) : darken(0.1);
    const highest = isDark ? lighten(0.26) : darken(0.16);
    const borderSubtle = isDark ? lighten(0.32) : darken(0.12);
    const borderStrong = isDark ? lighten(0.4) : darken(0.2);
    const highlight = isDark ? lighten(0.48) : darken(0.26);
    const mutedText = isDark ? lighten(0.52) : darken(0.32);
    const subtleText = isDark ? lighten(0.45) : darken(0.28);
    const contrastSurface = isDark ? darkenColor(accentColor, 0.2) : lighten(0.3);
    const shadow = isDark ? 'rgba(8, 15, 35, 0.35)' : 'rgba(15, 23, 42, 0.18)';

    return {
      surface,
      elevated,
      highest,
      borderSubtle,
      borderStrong,
      highlight,
      mutedText,
      subtleText,
      contrastSurface,
      shadow
    };
  }, [accentColor, textColor]);
  const frameBorderColor = useMemo(() => {
    const isDark = textColor === '#f8fafc';
    return isDark ? lightenColor(accentColor, 0.32) : darkenColor(accentColor, 0.16);
  }, [accentColor, textColor]);
  const showBorder = tile.content.showBorder !== false;

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

  const initializeSequence = useCallback(() => {
    const shuffledItems = buildInitialPool();

    setAvailableItems(shuffledItems);
    setPlacedItems(new Array(shuffledItems.length).fill(null));
    setIsChecked(false);
    setIsCorrect(null);
    setAttempts(0);
  }, [buildInitialPool]);

  useEffect(() => {
    initializeSequence();
  }, [initializeSequence]);

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

  useEffect(() => {
    if (canInteract) return;

    setDragState(null);
    setDragOverSlot(null);
    setIsPoolHighlighted(false);
  }, [canInteract]);

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

  const itemContainerStyle = useMemo<React.CSSProperties>(
    () => ({
      backgroundColor: palette.highest,
      borderColor: palette.borderStrong,
      color: textColor,
      boxShadow: `0 12px 30px ${palette.shadow}`
    }),
    [palette.borderStrong, palette.highest, palette.shadow, textColor]
  );

  const getItemClasses = (itemId: string, options?: { fullWidth?: boolean }) => {
    const fullWidth = options?.fullWidth ?? false;
    let baseClasses =
      `${fullWidth ? 'flex-1 ' : ''}flex items-center gap-4 px-4 py-3 rounded-xl border shadow-sm transition-transform duration-200 select-none`;

    baseClasses += canInteract ? ' cursor-grab active:cursor-grabbing' : ' cursor-default';

    if (dragState?.id === itemId) {
      baseClasses += ' opacity-70 scale-[0.98]';
    }

    return baseClasses;
  };

  const getSlotClasses = (hasItem: boolean) => {
    let baseClasses =
      'relative flex items-center gap-4 px-4 py-3 rounded-xl border-2 transition-all duration-200 min-h-[72px]';

    if (!hasItem) {
      baseClasses += ' border-dashed';
    }

    return baseClasses;
  };

  const getSlotStyle = (index: number, hasItem: boolean): React.CSSProperties => {
    const style: React.CSSProperties = {
      borderColor: palette.borderSubtle,
      backgroundColor: hasItem ? palette.elevated : palette.surface,
      borderStyle: hasItem ? 'solid' : 'dashed'
    };

    if (dragOverSlot === index) {
      style.borderColor = palette.highlight;
      style.backgroundColor = palette.highest;
      style.boxShadow = `0 12px 30px ${palette.shadow}`;
    } else if (isChecked && isCorrect !== null) {
      const placedItem = placedItems[index];
      const originalItem = placedItem ? tile.content.items.find(item => item.id === placedItem.id) : null;
      const isInCorrectPosition = originalItem && originalItem.correctPosition === index;

      style.borderColor = isInCorrectPosition ? palette.highlight : palette.borderStrong;
      style.backgroundColor = isInCorrectPosition ? palette.highest : palette.elevated;
    }

    return style;
  };

  const finishTesting = useCallback(() => {
    initializeSequence();
    setIsTesting(false);
  }, [initializeSequence]);

  const handleTileDoubleClick = (event: React.MouseEvent) => {
    if (isPreview || !isEditorUsage) return;

    event.preventDefault();
    event.stopPropagation();
    setIsModePromptVisible(true);
  };

  const handleTestSelection = () => {
    if (!isTesting) {
      initializeSequence();
      setIsTesting(true);
    }

    setIsModePromptVisible(false);
  };

  const handleExitTesting = () => {
    finishTesting();
    setIsModePromptVisible(false);
  };

  const handleEditSelection = () => {
    setIsModePromptVisible(false);
    onRequestTextEditing?.();
  };

  return (
    <div
      className="relative w-full h-full"
      onDoubleClick={handleTileDoubleClick}
      onMouseDownCapture={event => {
        if (isEditorUsage && isTesting && !isPreview) {
          event.stopPropagation();
        }
      }}
    >
      <div
        className={`w-full h-full rounded-3xl ${showBorder ? 'border' : ''} flex flex-col gap-6 p-6 overflow-hidden`}
        style={{
          backgroundColor: accentColor,
          backgroundImage: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
          color: textColor,
          borderColor: showBorder ? frameBorderColor : undefined,
          boxShadow: `0 32px 60px ${palette.shadow}`
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

            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 text-xs font-medium" style={{ color: palette.mutedText }}>
                <Sparkles className="w-4 h-4" />
                <span>Ćwiczenie sekwencyjne</span>
              </div>

              {isEditorUsage && (
                <div
                  className="flex items-center gap-2 text-[11px] font-medium px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: palette.surface,
                    color: textColor,
                    border: `1px solid ${palette.borderSubtle}`
                  }}
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>{isTesting ? 'Tryb testowania' : 'Tryb edytora'}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {attempts > 0 && (
          <div className="text-xs uppercase tracking-[0.32em]" style={{ color: palette.subtleText }}>
            Próba #{attempts}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
          <div
            className="flex flex-col rounded-2xl border transition-all duration-200"
            style={{
              borderColor: isPoolHighlighted ? palette.highlight : palette.borderSubtle,
              backgroundColor: isPoolHighlighted ? palette.highest : palette.surface,
              boxShadow: isPoolHighlighted ? `0 24px 48px ${palette.shadow}` : undefined
            }}
            onDragOver={handlePoolDragOver}
            onDragLeave={handlePoolDragLeave}
            onDrop={handleDropToPool}
          >
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: palette.borderSubtle }}
            >
              <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: textColor }}>
                <Shuffle className="w-4 h-4" />
                <span>Pula elementów</span>
              </div>
            </div>

            <div className="flex-1 overflow-auto px-5 py-4 space-y-3">
              {availableItems.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center gap-2 text-center text-sm py-10"
                  style={{ color: palette.mutedText }}
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
                    style={itemContainerStyle}
                    onMouseDown={event => {
                      if (canInteract) {
                        event.stopPropagation();
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-lg border"
                        style={{
                          backgroundColor: palette.surface,
                          borderColor: palette.borderSubtle,
                          color: palette.mutedText
                        }}
                      >
                        <GripVertical className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium break-words" style={{ color: textColor }}>
                        {item.text}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div
            className="flex flex-col rounded-2xl border transition-all duration-200"
            style={{
              borderColor: palette.borderSubtle,
              backgroundColor: palette.surface
            }}
          >
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: palette.borderSubtle }}
            >
              <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: textColor }}>
                <ArrowLeftRight className="w-4 h-4" />
                <span>Twoja sekwencja</span>
              </div>
              <span className="text-xs font-medium" style={{ color: palette.mutedText }}>
                {placedItems.filter(Boolean).length} / {tile.content.items.length}
              </span>
            </div>

            <div className="flex-1 overflow-auto px-5 py-4 space-y-3">
              {placedItems.map((item, index) => (
                <div
                  key={index}
                  className={getSlotClasses(Boolean(item))}
                  style={getSlotStyle(index, Boolean(item))}
                  onDragOver={e => handleSlotDragOver(e, index)}
                  onDragLeave={handleSlotDragLeave}
                  onDrop={e => handleDropToSlot(e, index)}
                >
                  <div
                    className="flex items-center justify-center w-8 h-8 rounded-lg border text-sm font-semibold"
                    style={{
                      backgroundColor: palette.contrastSurface,
                      color: textColor,
                      borderColor: palette.borderStrong
                    }}
                  >
                    {index + 1}
                  </div>
                  {item ? (
                    <div
                      className={getItemClasses(item.id, { fullWidth: true })}
                      style={itemContainerStyle}
                      draggable={canInteract}
                      onDragStart={e => handleDragStart(e, item.id, 'sequence', index)}
                      onDragEnd={handleDragEnd}
                      onMouseDown={event => {
                        if (canInteract) {
                          event.stopPropagation();
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-lg border"
                          style={{
                            backgroundColor: palette.surface,
                            borderColor: palette.borderSubtle,
                            color: palette.mutedText
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
                    <span className="flex-1 text-sm italic" style={{ color: palette.mutedText }}>
                      Upuść element w tym miejscu
                    </span>
                  )}

                  {isChecked && isCorrect !== null && item && (() => {
                    const originalItem = tile.content.items.find(original => original.id === item.id);
                    const isInCorrectPosition = originalItem && originalItem.correctPosition === index;

                    return isInCorrectPosition ? (
                      <CheckCircle className="w-5 h-5" style={{ color: palette.highlight }} />
                    ) : (
                      <XCircle className="w-5 h-5" style={{ color: palette.borderStrong }} />
                    );
                  })()}
                </div>
              ))}
            </div>
          </div>
        </div>

        {isChecked && isCorrect !== null && (
          <div
            className="rounded-2xl border px-6 py-4 flex items-center justify-between gap-4"
            style={{
              borderColor: palette.borderStrong,
              backgroundColor: palette.surface,
              color: textColor
            }}
          >
            <div className="flex items-center gap-3 text-sm font-medium">
              {isCorrect ? (
                <CheckCircle className="w-5 h-5" style={{ color: palette.highlight }} />
              ) : (
                <XCircle className="w-5 h-5" style={{ color: palette.borderStrong }} />
              )}
              <span>{isCorrect ? tile.content.correctFeedback : tile.content.incorrectFeedback}</span>
            </div>

            {!isCorrect && (
              <div className="text-xs" style={{ color: palette.mutedText }}>
                Spróbuj ponownie, przenosząc elementy.
              </div>
            )}
          </div>
        )}

        {!isPreview && (
          <div className="flex flex-wrap items-center justify-between gap-4">
            {isEditorUsage && !isTesting ? (
              <div className="text-sm" style={{ color: palette.mutedText }}>
                Dwukrotnie kliknij kafelek i wybierz „Przetestuj zadanie”, aby sprawdzić kolejność jak uczeń.
              </div>
            ) : (
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={event => {
                    event.stopPropagation();
                    checkSequence();
                  }}
                  disabled={!sequenceComplete || (isChecked && isCorrect) || !canInteract}
                  className="px-6 py-2 rounded-xl font-semibold transition-transform duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: palette.highest,
                    color: textColor,
                    border: `1px solid ${palette.borderStrong}`,
                    boxShadow: `0 18px 40px ${palette.shadow}`
                  }}
                >
                  {isChecked && isCorrect ? 'Sekwencja sprawdzona' : 'Sprawdź kolejność'}
                </button>

                {isChecked && !isCorrect && (
                  <button
                    onClick={event => {
                      event.stopPropagation();
                      resetSequence();
                    }}
                    className="px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors duration-200"
                    style={{
                      backgroundColor: palette.surface,
                      color: textColor,
                      border: `1px solid ${palette.borderSubtle}`
                    }}
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Wymieszaj ponownie</span>
                  </button>
                )}
              </div>
            )}

            {isEditorUsage && isTesting && (
              <button
                onClick={event => {
                  event.stopPropagation();
                  finishTesting();
                }}
                className="px-4 py-2 rounded-xl font-medium transition-colors duration-200"
                style={{
                  backgroundColor: palette.surface,
                  color: textColor,
                  border: `1px solid ${palette.borderSubtle}`
                }}
              >
                Zakończ testowanie
              </button>
            )}
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
                Możesz włączyć tryb testowania, aby sprawdzić ćwiczenie tak jak uczeń, albo przejść do edycji polecenia.
              </p>
            </div>

            <div className="grid gap-3">
              <button
                type="button"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors duration-200 flex items-center justify-between"
                onClick={handleTestSelection}
              >
                <span className="font-medium">{isTesting ? 'Kontynuuj testowanie' : 'Przetestuj zadanie'}</span>
                <Sparkles className="w-4 h-4 text-slate-400" />
              </button>

              {isTesting && (
                <button
                  type="button"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition-colors duration-200 flex items-center justify-between"
                  onClick={handleExitTesting}
                >
                  <span className="font-medium">Zakończ testowanie</span>
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 text-white hover:bg-slate-700 transition-colors duration-200 flex items-center justify-between"
                onClick={handleEditSelection}
              >
                <span className="font-medium">Edytuj polecenie</span>
                <Shuffle className="w-4 h-4 text-white/80" />
              </button>
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
