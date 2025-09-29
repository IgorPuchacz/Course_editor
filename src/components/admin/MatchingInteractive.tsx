import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, CheckCircle, GripVertical, Link2, RotateCcw, Shuffle, Sparkles, XCircle } from 'lucide-react';
import { MatchingTile } from '../../types/lessonEditor';
import { TaskInstructionPanel } from './common/TaskInstructionPanel';

interface MatchingInteractiveProps {
  tile: MatchingTile;
  isPreview?: boolean;
  isTestingMode?: boolean;
  onRequestTextEditing?: () => void;
  instructionContent?: React.ReactNode;
  variant?: 'standalone' | 'embedded';
}

interface MatchItem {
  id: string;
  text: string;
  originalIndex: number;
}

type DragSource = 'pool' | 'slot';

interface DragState {
  id: string;
  source: DragSource;
  slotIndex?: number;
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

const surfaceColor = (accent: string, textColor: string, lightenAmount: number, darkenAmount: number): string =>
  textColor === '#0f172a' ? lightenColor(accent, lightenAmount) : darkenColor(accent, darkenAmount);

export const MatchingInteractive: React.FC<MatchingInteractiveProps> = ({
  tile,
  isPreview = false,
  isTestingMode = false,
  onRequestTextEditing,
  instructionContent,
  variant = 'embedded'
}) => {
  const [availableMatches, setAvailableMatches] = useState<MatchItem[]>([]);
  const [assignedMatches, setAssignedMatches] = useState<(MatchItem | null)[]>([]);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [isPoolHighlighted, setIsPoolHighlighted] = useState(false);

  const canInteract = !isPreview;
  const matchesComplete =
    tile.content.pairs.length > 0 && assignedMatches.length === tile.content.pairs.length && assignedMatches.every(Boolean);

  const accentColor = tile.content.backgroundColor || '#0f172a';
  const textColor = useMemo(() => getReadableTextColor(accentColor), [accentColor]);
  const gradientStart = useMemo(() => lightenColor(accentColor, 0.08), [accentColor]);
  const gradientEnd = useMemo(() => darkenColor(accentColor, 0.08), [accentColor]);
  const frameBorderColor = useMemo(
    () => surfaceColor(accentColor, textColor, 0.52, 0.6),
    [accentColor, textColor]
  );
  const panelBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.64, 0.45),
    [accentColor, textColor]
  );
  const panelBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.5, 0.58),
    [accentColor, textColor]
  );
  const iconBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.56, 0.5),
    [accentColor, textColor]
  );
  const mutedLabelColor = textColor === '#0f172a' ? '#475569' : '#dbeafe';
  const subtleCaptionColor = textColor === '#0f172a' ? '#64748b' : '#e2e8f0';
  const testingCaptionColor = useMemo(
    () => surfaceColor(accentColor, textColor, 0.42, 0.4),
    [accentColor, textColor]
  );
  const poolBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.6, 0.4),
    [accentColor, textColor]
  );
  const poolBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.5, 0.56),
    [accentColor, textColor]
  );
  const poolHighlightBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.7, 0.3),
    [accentColor, textColor]
  );
  const poolHighlightBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.6, 0.45),
    [accentColor, textColor]
  );
  const itemBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.52, 0.46),
    [accentColor, textColor]
  );
  const itemBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.42, 0.58),
    [accentColor, textColor]
  );
  const gripBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.48, 0.52),
    [accentColor, textColor]
  );
  const gripBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.42, 0.6),
    [accentColor, textColor]
  );
  const pairCardBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.58, 0.42),
    [accentColor, textColor]
  );
  const pairCardBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.48, 0.6),
    [accentColor, textColor]
  );
  const slotEmptyBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.6, 0.42),
    [accentColor, textColor]
  );
  const slotEmptyBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.52, 0.58),
    [accentColor, textColor]
  );
  const slotFilledBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.5, 0.5),
    [accentColor, textColor]
  );
  const slotFilledBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.44, 0.62),
    [accentColor, textColor]
  );
  const slotHoverBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.68, 0.32),
    [accentColor, textColor]
  );
  const slotHoverBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.58, 0.5),
    [accentColor, textColor]
  );
  const slotCorrectBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.72, 0.26),
    [accentColor, textColor]
  );
  const slotCorrectBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.62, 0.36),
    [accentColor, textColor]
  );
  const successIconColor = textColor === '#0f172a' ? darkenColor(accentColor, 0.2) : lightenColor(accentColor, 0.32);
  const successFeedbackBackground = surfaceColor(accentColor, textColor, 0.7, 0.34);
  const successFeedbackBorder = surfaceColor(accentColor, textColor, 0.6, 0.44);
  const failureFeedbackBackground = '#fee2e2';
  const failureFeedbackBorder = '#fca5a5';
  const primaryButtonBackground = textColor === '#0f172a' ? darkenColor(accentColor, 0.25) : lightenColor(accentColor, 0.28);
  const primaryButtonTextColor = textColor === '#0f172a' ? '#f8fafc' : '#0f172a';
  const secondaryButtonBackground = surfaceColor(accentColor, textColor, 0.52, 0.5);
  const secondaryButtonBorder = surfaceColor(accentColor, textColor, 0.46, 0.58);
  const badgeBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.54, 0.48),
    [accentColor, textColor]
  );
  const badgeBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.46, 0.58),
    [accentColor, textColor]
  );
  const badgeTextColor = textColor === '#0f172a' ? '#1f2937' : '#f8fafc';

  const correctPairIds = useMemo(() => tile.content.pairs.map(pair => pair.id), [tile.content.pairs]);

  const buildInitialPool = useCallback((): MatchItem[] => {
    const normalized = tile.content.pairs.map((pair, index) => ({
      id: pair.id,
      text: pair.right,
      originalIndex: index
    }));

    if (normalized.length <= 1) {
      return normalized;
    }

    const isAligned = (items: MatchItem[]) => items.every((item, index) => item.id === correctPairIds[index]);

    let shuffled = [...normalized];
    const maxAttempts = 20;
    let attempt = 0;

    do {
      shuffled = [...normalized].sort(() => Math.random() - 0.5);
      attempt += 1;
    } while (attempt < maxAttempts && isAligned(shuffled));

    if (isAligned(shuffled)) {
      const [first, ...rest] = shuffled;
      shuffled = [...rest, first];
    }

    return shuffled;
  }, [correctPairIds, tile.content.pairs]);

  const initializeExercise = useCallback(() => {
    const poolItems = buildInitialPool();
    setAvailableMatches(poolItems);
    setAssignedMatches(new Array(tile.content.pairs.length).fill(null));
    setIsChecked(false);
    setIsCorrect(null);
    setAttempts(0);
  }, [buildInitialPool, tile.content.pairs.length]);

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

  const handleDragStart = (e: React.DragEvent, itemId: string, source: DragSource, slotIndex?: number) => {
    if (!canInteract) return;

    setDragState({
      id: itemId,
      source,
      slotIndex
    });

    try {
      e.dataTransfer.setData('text/plain', itemId);
    } catch {
      // Ignore potential errors when the browser prevents setting drag data.
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

  const handleDropToSlot = (e: React.DragEvent, slotIndex: number) => {
    if (!canInteract || !dragState) return;

    e.preventDefault();

    const newAssigned = [...assignedMatches];
    const newPool = [...availableMatches];

    let movingItem: MatchItem | null = null;

    if (dragState.source === 'pool') {
      const poolIndex = newPool.findIndex(item => item.id === dragState.id);
      if (poolIndex === -1) return;
      [movingItem] = newPool.splice(poolIndex, 1);
    } else if (dragState.source === 'slot') {
      const originIndex = dragState.slotIndex;
      if (originIndex === undefined || originIndex === slotIndex) {
        setDragState(null);
        setDragOverSlot(null);
        return;
      }

      movingItem = newAssigned[originIndex];
      if (!movingItem) {
        setDragState(null);
        setDragOverSlot(null);
        return;
      }

      const targetItem = newAssigned[slotIndex];
      newAssigned[originIndex] = targetItem ?? null;
    }

    if (!movingItem) {
      setDragState(null);
      setDragOverSlot(null);
      return;
    }

    if (dragState.source === 'pool') {
      const displaced = newAssigned[slotIndex];
      if (displaced) {
        newPool.push(displaced);
      }
    }

    newAssigned[slotIndex] = movingItem;

    setAssignedMatches(newAssigned);
    setAvailableMatches(newPool);
    setDragState(null);
    setDragOverSlot(null);
    setIsPoolHighlighted(false);
    resetCheckState();
  };

  const handlePoolDragOver = (e: React.DragEvent) => {
    if (!canInteract || !dragState) return;
    if (dragState.source !== 'slot') return;

    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsPoolHighlighted(true);
  };

  const handlePoolDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsPoolHighlighted(false);
    }
  };

  const handleDropToPool = (e: React.DragEvent) => {
    if (!canInteract || !dragState || dragState.source !== 'slot') return;

    e.preventDefault();

    const originIndex = dragState.slotIndex;
    if (originIndex === undefined) {
      setDragState(null);
      setIsPoolHighlighted(false);
      return;
    }

    const newAssigned = [...assignedMatches];
    const itemToReturn = newAssigned[originIndex];

    if (!itemToReturn) {
      setDragState(null);
      setIsPoolHighlighted(false);
      return;
    }

    newAssigned[originIndex] = null;

    setAssignedMatches(newAssigned);
    setAvailableMatches(prev => [...prev, itemToReturn]);
    setDragState(null);
    setIsPoolHighlighted(false);
    setDragOverSlot(null);
    resetCheckState();
  };

  const handleDragEnd = () => {
    setDragState(null);
    setDragOverSlot(null);
    setIsPoolHighlighted(false);
  };

  const handleSlotDoubleClick = (slotIndex: number) => {
    if (!canInteract) return;
    const item = assignedMatches[slotIndex];
    if (!item) return;

    const newAssigned = [...assignedMatches];
    newAssigned[slotIndex] = null;

    setAssignedMatches(newAssigned);
    setAvailableMatches(prev => [...prev, item]);
    resetCheckState();
  };

  const checkMatches = () => {
    const allCorrect = tile.content.pairs.every((pair, index) => assignedMatches[index]?.id === pair.id);
    setIsCorrect(allCorrect);
    setIsChecked(true);
    setAttempts(prev => prev + 1);
  };

  const resetMatches = () => {
    initializeExercise();
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
      const assignedItem = assignedMatches[index];
      if (!assignedItem) {
        return {
          backgroundColor: slotEmptyBackground,
          borderColor: slotEmptyBorder
        };
      }

      const isInCorrectSlot = assignedItem.id === tile.content.pairs[index].id;
      if (isInCorrectSlot) {
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

  const getItemClasses = (itemId: string) => {
    let baseClasses =
      'flex items-center gap-4 px-4 py-3 rounded-xl border shadow-sm transition-transform duration-200 select-none cursor-grab active:cursor-grabbing';

    if (dragState?.id === itemId) {
      baseClasses += ' opacity-60 scale-[0.98]';
    }

    return baseClasses;
  };

  const handleTileDoubleClick = (event: React.MouseEvent) => {
    if (isPreview || isTestingMode) return;

    event.preventDefault();
    event.stopPropagation();
    onRequestTextEditing?.();
  };

  const matchedCount = assignedMatches.filter(Boolean).length;
  const isEmbedded = variant === 'embedded';
  const showBorder = tile.content.showBorder !== false;

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
          {instructionContent ?? (
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

        <div className="flex-1 flex flex-col xl:flex-row gap-6 min-h-0">
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: subtleCaptionColor }}>
                <Link2 className="w-4 h-4" />
                <span>
                  Sparowane: {matchedCount} / {tile.content.pairs.length}
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-auto pr-1">
              {tile.content.pairs.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-sm" style={{ color: subtleCaptionColor }}>
                  <ArrowLeftRight className="w-5 h-5" />
                  <span>Dodaj pary w panelu edycji, aby rozpocząć ćwiczenie.</span>
                </div>
              ) : (
                tile.content.pairs.map((pair, index) => {
                  const assignedItem = assignedMatches[index];
                  const isSlotCorrect = isChecked && assignedItem && assignedItem.id === pair.id;
                  const isSlotIncorrect = isChecked && assignedItem && assignedItem.id !== pair.id;
                  const slotStyles = getSlotStyles(index, Boolean(assignedItem));

                  return (
                    <div
                      key={pair.id}
                      className="p-4 rounded-2xl border transition-all duration-200"
                      style={{
                        backgroundColor: pairCardBackground,
                        borderColor: pairCardBorder,
                        color: textColor
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="flex items-center justify-center w-8 h-8 rounded-lg border text-sm font-semibold"
                          style={{
                            backgroundColor: badgeBackground,
                            borderColor: badgeBorder,
                            color: badgeTextColor
                          }}
                        >
                          {String.fromCharCode(65 + index)}
                        </div>

                        <div className="flex-1">
                          <div className="text-sm font-semibold" style={{ color: textColor }}>
                            {pair.left}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3" onDoubleClick={() => handleSlotDoubleClick(index)}>
                        <div
                          className={getSlotClasses(Boolean(assignedItem))}
                          style={slotStyles}
                          onDragOver={e => handleSlotDragOver(e, index)}
                          onDragLeave={handleSlotDragLeave}
                          onDrop={e => handleDropToSlot(e, index)}
                        >
                          {assignedItem ? (
                            <div
                              className={`flex-1 flex items-center justify-between gap-4 ${
                                dragState?.id === assignedItem.id ? 'opacity-60 scale-[0.98]' : ''
                              }`}
                              draggable={canInteract}
                              onDragStart={e => handleDragStart(e, assignedItem.id, 'slot', index)}
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
                                  {assignedItem.text}
                                </span>
                              </div>

                              {isChecked && isCorrect !== null && (
                                <div className="flex items-center gap-2">
                                  {isSlotCorrect ? (
                                    <CheckCircle className="w-5 h-5" style={{ color: successIconColor }} />
                                  ) : (
                                    <XCircle className="w-5 h-5 text-rose-400" />
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="flex-1 text-sm italic" style={{ color: subtleCaptionColor }}>
                              Przeciągnij dopasowanie tutaj
                            </span>
                          )}
                        </div>

                        {!assignedItem && (
                          <div className="mt-2 text-xs" style={{ color: subtleCaptionColor }}>
                            Wybierz element z listy dopasowań i przeciągnij do tej pary.
                          </div>
                        )}

                        {isSlotIncorrect && (
                          <div className="mt-2 text-xs text-rose-500">
                            To połączenie jest niepoprawne. Spróbuj ponownie.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div
            className="xl:w-[320px] flex flex-col rounded-2xl border transition-all duration-200"
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
                <span>Pula dopasowań</span>
              </div>
              <span className="text-xs" style={{ color: subtleCaptionColor }}>
                {availableMatches.length}
              </span>
            </div>

            <div className="flex-1 overflow-auto px-5 py-4 space-y-3">
              {availableMatches.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 text-center text-sm py-10" style={{ color: subtleCaptionColor }}>
                  <ArrowLeftRight className="w-5 h-5" />
                  <span>Wszystkie dopasowania zostały użyte</span>
                </div>
              ) : (
                availableMatches.map(item => (
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
                      <span className="text-sm font-medium text-left" style={{ color: textColor }}>
                        {item.text}
                      </span>
                    </div>
                  </div>
                ))
              )}
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
                Spróbuj ponownie, dobierając właściwe pary.
              </div>
            )}
          </div>
        )}

        {!isPreview && (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={checkMatches}
                disabled={!matchesComplete || (isChecked && isCorrect)}
                className="px-6 py-2 rounded-xl font-semibold shadow-lg transition-transform duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5"
                style={{
                  backgroundColor: primaryButtonBackground,
                  color: primaryButtonTextColor,
                  boxShadow: '0 16px 32px rgba(15, 23, 42, 0.22)'
                }}
              >
                {isChecked && isCorrect ? 'Pary sprawdzone' : 'Sprawdź połączenia'}
              </button>

              {isChecked && !isCorrect && (
                <button
                  onClick={resetMatches}
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

