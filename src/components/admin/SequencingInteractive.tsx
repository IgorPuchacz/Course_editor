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

  useEffect(() => {
    if (isPreview) {
      setIsTestingMode(false);
    } else {
      setIsTestingMode(true);
    }
  }, [isPreview]);

  const canInteract = isTestingMode || !isPreview;
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

  const palette = useMemo(() => {
    const isDarkText = textColor === '#0f172a';

    const baseSurface = isDarkText ? darkenColor(accentColor, 0.08) : lightenColor(accentColor, 0.08);
    const elevatedSurface = isDarkText ? darkenColor(accentColor, 0.16) : lightenColor(accentColor, 0.16);
    const strongSurface = isDarkText ? darkenColor(accentColor, 0.24) : lightenColor(accentColor, 0.24);
    const highlightSurface = isDarkText ? darkenColor(accentColor, 0.28) : lightenColor(accentColor, 0.28);

    return {
      isDarkText,
      containerShadow: `0 30px 88px -48px ${withAlpha(textColor, isDarkText ? 0.32 : 0.58)}`,
      panelBackground: baseSurface,
      panelBorder: withAlpha(textColor, isDarkText ? 0.2 : 0.26),
      panelHeaderBackground: isDarkText ? darkenColor(accentColor, 0.12) : lightenColor(accentColor, 0.12),
      panelHeaderDivider: withAlpha(textColor, isDarkText ? 0.16 : 0.2),
      panelShadow: `0 22px 60px -44px ${withAlpha(textColor, isDarkText ? 0.36 : 0.5)}`,
      mutedText: withAlpha(textColor, isDarkText ? 0.68 : 0.72),
      softerText: withAlpha(textColor, isDarkText ? 0.48 : 0.55),
      placeholderText: withAlpha(textColor, isDarkText ? 0.42 : 0.5),
      itemBackground: elevatedSurface,
      itemBorder: withAlpha(textColor, isDarkText ? 0.24 : 0.3),
      itemShadow: `0 20px 48px -36px ${withAlpha(textColor, isDarkText ? 0.5 : 0.58)}`,
      itemHandleBackground: isDarkText ? darkenColor(accentColor, 0.22) : lightenColor(accentColor, 0.2),
      itemHandleBorder: withAlpha(textColor, isDarkText ? 0.26 : 0.32),
      itemHandleIcon: withAlpha(textColor, isDarkText ? 0.76 : 0.58),
      slotEmptyBackground: baseSurface,
      slotFilledBackground: elevatedSurface,
      slotHoverBackground: highlightSurface,
      slotBorder: withAlpha(textColor, isDarkText ? 0.26 : 0.32),
      slotDashedBorder: withAlpha(textColor, isDarkText ? 0.22 : 0.26),
      slotShadow: `inset 0 1px 0 ${withAlpha(textColor, isDarkText ? 0.08 : 0.12)}`,
      highlightBackground: strongSurface,
      highlightBorder: withAlpha(textColor, isDarkText ? 0.48 : 0.52),
      highlightShadow: `0 26px 64px -48px ${withAlpha(textColor, isDarkText ? 0.52 : 0.6)}`,
      correctBackground: strongSurface,
      correctBorder: withAlpha(textColor, isDarkText ? 0.52 : 0.5),
      incorrectBackground: isDarkText ? darkenColor(accentColor, 0.04) : lightenColor(accentColor, 0.04),
      incorrectBorder: withAlpha(textColor, isDarkText ? 0.32 : 0.34),
      correctIcon: withAlpha(textColor, isDarkText ? 0.92 : 0.75),
      incorrectIcon: withAlpha(textColor, isDarkText ? 0.7 : 0.6),
      badgeBackground: strongSurface,
      badgeBorder: withAlpha(textColor, isDarkText ? 0.3 : 0.36),
      primaryButtonBackground: isDarkText ? darkenColor(accentColor, 0.32) : '#f8fafc',
      primaryButtonText: isDarkText ? '#f8fafc' : '#0f172a',
      primaryButtonShadow: `0 20px 52px -36px ${withAlpha(textColor, isDarkText ? 0.6 : 0.42)}`,
      primaryButtonDisabledBackground: isDarkText ? darkenColor(accentColor, 0.18) : lightenColor(accentColor, 0.18),
      secondaryButtonBackground: isDarkText ? darkenColor(accentColor, 0.2) : lightenColor(accentColor, 0.2),
      secondaryButtonBorder: withAlpha(textColor, isDarkText ? 0.28 : 0.32),
      secondaryButtonText: textColor,
      secondaryButtonShadow: `0 18px 46px -36px ${withAlpha(textColor, isDarkText ? 0.45 : 0.5)}`,
      dividerColor: withAlpha(textColor, isDarkText ? 0.2 : 0.24),
      infoChipBackground: isDarkText ? darkenColor(accentColor, 0.2) : lightenColor(accentColor, 0.2),
      infoChipText: textColor,
      feedbackHintText: withAlpha(textColor, isDarkText ? 0.62 : 0.64)
    };
  }, [accentColor, textColor]);

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

  const getItemStyles = (itemId: string): React.CSSProperties => {
    const isDragging = dragState?.id === itemId;

    return {
      backgroundColor: palette.itemBackground,
      border: `1px solid ${palette.itemBorder}`,
      color: textColor,
      boxShadow: palette.itemShadow,
      opacity: isDragging ? 0.6 : 1,
      transform: `scale(${isDragging ? 0.98 : 1})`,
      transition: 'transform 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease'
    };
  };

  const getSlotStyles = (index: number, hasItem: boolean): React.CSSProperties => {
    const style: React.CSSProperties = {
      backgroundColor: hasItem ? palette.slotFilledBackground : palette.slotEmptyBackground,
      border: `1px ${hasItem ? 'solid' : 'dashed'} ${hasItem ? palette.slotBorder : palette.slotDashedBorder}`,
      boxShadow: palette.slotShadow,
      transition: 'all 0.2s ease',
      color: textColor
    };

    if (dragOverSlot === index) {
      style.backgroundColor = palette.highlightBackground;
      style.border = `1px solid ${palette.highlightBorder}`;
      style.boxShadow = palette.highlightShadow;
      return style;
    }

    if (isChecked && isCorrect !== null) {
      const placedItem = placedItems[index];
      const originalItem = placedItem ? tile.content.items.find(item => item.id === placedItem.id) : null;
      const isInCorrectPosition = Boolean(originalItem && originalItem.correctPosition === index);

      if (isInCorrectPosition) {
        style.backgroundColor = palette.correctBackground;
        style.border = `1px solid ${palette.correctBorder}`;
        style.boxShadow = palette.highlightShadow;
      } else {
        style.backgroundColor = palette.incorrectBackground;
        style.border = `1px solid ${palette.incorrectBorder}`;
      }
    }

    return style;
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

  const handleTestSelection = () => {
    setIsModePromptVisible(false);
    if (isPreview) {
      resetSequence();
    }
    setIsTestingMode(true);
  };

  const handleEditSelection = () => {
    setIsTestingMode(false);
    setIsModePromptVisible(false);
    onRequestTextEditing?.();
  };

  return (
    <div className="relative w-full h-full" onDoubleClick={handleTileDoubleClick}>
      <div
        className="w-full h-full rounded-3xl flex flex-col gap-6 p-6 overflow-hidden"
        style={{
          backgroundColor: accentColor,
          backgroundImage: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
          color: textColor,
          border: showBorder ? `1px solid ${borderColor}` : 'none',
          boxShadow: palette.containerShadow
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

            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: palette.infoChipBackground,
                color: palette.infoChipText
              }}
            >
              <Sparkles className="w-4 h-4" />
              <span>Ćwiczenie sekwencyjne</span>
            </div>
          </div>
        )}

        {attempts > 0 && (
          <div className="text-xs uppercase tracking-[0.32em]" style={{ color: palette.softerText }}>
            Próba #{attempts}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
          <div
            className="flex flex-col rounded-2xl transition-all duration-200"
            style={{
              backgroundColor: isPoolHighlighted ? palette.highlightBackground : palette.panelBackground,
              border: `1px solid ${isPoolHighlighted ? palette.highlightBorder : palette.panelBorder}`,
              boxShadow: isPoolHighlighted ? palette.highlightShadow : palette.panelShadow
            }}
            onDragOver={handlePoolDragOver}
            onDragLeave={handlePoolDragLeave}
            onDrop={handleDropToPool}
          >
            <div
              className="flex items-center justify-between px-5 py-4 rounded-t-2xl"
              style={{
                borderBottom: `1px solid ${palette.panelHeaderDivider}`,
                backgroundColor: palette.panelHeaderBackground
              }}
            >
              <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: palette.mutedText }}>
                <Shuffle className="w-4 h-4" style={{ color: palette.infoChipText }} />
                <span>Pula elementów</span>
              </div>
            </div>

            <div className="flex-1 overflow-auto px-5 py-4 space-y-3">
              {availableItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 text-center text-sm py-10" style={{ color: palette.placeholderText }}>
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
                    className="flex items-center gap-4 px-4 py-3 rounded-xl select-none cursor-grab active:cursor-grabbing"
                    style={getItemStyles(item.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-lg"
                        style={{
                          backgroundColor: palette.itemHandleBackground,
                          border: `1px solid ${palette.itemHandleBorder}`,
                          color: palette.itemHandleIcon
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
            className="flex flex-col rounded-2xl transition-all duration-200"
            style={{
              backgroundColor: palette.panelBackground,
              border: `1px solid ${palette.panelBorder}`,
              boxShadow: palette.panelShadow
            }}
          >
            <div
              className="flex items-center justify-between px-5 py-4 rounded-t-2xl"
              style={{
                borderBottom: `1px solid ${palette.panelHeaderDivider}`,
                backgroundColor: palette.panelHeaderBackground
              }}
            >
              <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: palette.mutedText }}>
                <CheckCircle className="w-4 h-4" style={{ color: palette.infoChipText }} />
                <span>Twoja sekwencja</span>
              </div>
              <span className="text-xs" style={{ color: palette.softerText }}>
                {placedItems.filter(Boolean).length} / {tile.content.items.length}
              </span>
            </div>

            <div className="flex-1 overflow-auto px-5 py-4 space-y-3">
              {placedItems.map((item, index) => (
                <div
                  key={index}
                  className="relative flex items-center gap-4 px-4 py-3 rounded-xl min-h-[72px]"
                  style={getSlotStyles(index, Boolean(item))}
                  onDragOver={e => handleSlotDragOver(e, index)}
                  onDragLeave={handleSlotDragLeave}
                  onDrop={e => handleDropToSlot(e, index)}
                >
                  <div
                    className="flex items-center justify-center w-8 h-8 rounded-lg text-sm font-semibold"
                    style={{
                      backgroundColor: palette.badgeBackground,
                      border: `1px solid ${palette.badgeBorder}`,
                      color: textColor
                    }}
                  >
                    {index + 1}
                  </div>
                  {item ? (
                    <div
                      className="flex-1 flex items-center justify-between gap-4 cursor-grab active:cursor-grabbing px-3 py-2 rounded-lg"
                      draggable={canInteract}
                      onDragStart={e => handleDragStart(e, item.id, 'sequence', index)}
                      onDragEnd={handleDragEnd}
                      style={{
                        ...getItemStyles(item.id),
                        margin: 0,
                        width: '100%'
                      }}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-lg"
                          style={{
                            backgroundColor: palette.itemHandleBackground,
                            border: `1px solid ${palette.itemHandleBorder}`,
                            color: palette.itemHandleIcon
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
                    <span className="flex-1 text-sm italic" style={{ color: palette.placeholderText }}>
                      Upuść element w tym miejscu
                    </span>
                  )}

                  {isChecked && isCorrect !== null && item && (() => {
                    const originalItem = tile.content.items.find(original => original.id === item.id);
                    const isInCorrectPosition = originalItem && originalItem.correctPosition === index;

                    return isInCorrectPosition ? (
                      <CheckCircle className="w-5 h-5" style={{ color: palette.correctIcon }} />
                    ) : (
                      <XCircle className="w-5 h-5" style={{ color: palette.incorrectIcon }} />
                    );
                  })()}
                </div>
              ))}
            </div>
          </div>
        </div>

        {isChecked && isCorrect !== null && (
          <div
            className="rounded-2xl px-6 py-4 flex items-center justify-between"
            style={{
              border: `1px solid ${isCorrect ? palette.correctBorder : palette.incorrectBorder}`,
              backgroundColor: isCorrect ? palette.correctBackground : palette.incorrectBackground,
              color: textColor
            }}
          >
            <div className="flex items-center gap-3 text-sm font-medium">
              {isCorrect ? (
                <CheckCircle className="w-5 h-5" style={{ color: palette.correctIcon }} />
              ) : (
                <XCircle className="w-5 h-5" style={{ color: palette.incorrectIcon }} />
              )}
              <span>{isCorrect ? tile.content.correctFeedback : tile.content.incorrectFeedback}</span>
            </div>

            {!isCorrect && (
              <div className="text-xs" style={{ color: palette.feedbackHintText }}>
                Spróbuj ponownie, przenosząc elementy.
              </div>
            )}
          </div>
        )}

        {canInteract && (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={checkSequence}
                disabled={!sequenceComplete || (isChecked && isCorrect)}
                className="px-6 py-2 rounded-xl font-semibold transition-all duration-200 disabled:cursor-not-allowed hover:-translate-y-0.5"
                style={{
                  backgroundColor:
                    !sequenceComplete || (isChecked && isCorrect)
                      ? palette.primaryButtonDisabledBackground
                      : palette.primaryButtonBackground,
                  color: palette.primaryButtonText,
                  boxShadow:
                    !sequenceComplete || (isChecked && isCorrect) ? 'none' : palette.primaryButtonShadow
                }}
              >
                {isChecked && isCorrect ? 'Sekwencja sprawdzona' : 'Sprawdź kolejność'}
              </button>

              {isChecked && !isCorrect && (
                <button
                  onClick={resetSequence}
                  className="px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2"
                  style={{
                    backgroundColor: palette.secondaryButtonBackground,
                    border: `1px solid ${palette.secondaryButtonBorder}`,
                    color: palette.secondaryButtonText,
                    boxShadow: palette.secondaryButtonShadow
                  }}
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Wymieszaj ponownie</span>
                </button>
              )}
            </div>

            {isPreview && isTestingMode && (
              <button
                type="button"
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  backgroundColor: palette.secondaryButtonBackground,
                  border: `1px solid ${palette.secondaryButtonBorder}`,
                  color: palette.secondaryButtonText
                }}
                onClick={() => setIsTestingMode(false)}
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
                Możesz przetestować zadanie jak uczeń lub przejść do edycji polecenia w trybie RichText.
              </p>
            </div>

            <div className="grid gap-3">
              <button
                type="button"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors duration-200 flex items-center justify-between"
                onClick={handleTestSelection}
              >
                <span className="font-medium">Przetestuj zadanie</span>
                <Sparkles className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                className="w-full px-4 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-colors duration-200 flex items-center justify-between"
                onClick={handleEditSelection}
              >
                <span className="font-medium">Edytuj polecenie</span>
                <Shuffle className="w-4 h-4 text-white/90" />
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
