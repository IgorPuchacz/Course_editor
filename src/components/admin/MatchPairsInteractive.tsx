import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  GripVertical,
  Puzzle,
  RotateCcw,
  Sparkles,
  XCircle
} from 'lucide-react';
import { MatchPairsTile } from '../../types/lessonEditor';
import { TaskInstructionPanel } from './common/TaskInstructionPanel';

interface MatchPairsInteractiveProps {
  tile: MatchPairsTile;
  isPreview?: boolean;
  isTestingMode?: boolean;
  onRequestTextEditing?: () => void;
  instructionContent?: React.ReactNode;
}

type EvaluationState = 'idle' | 'correct' | 'incorrect';

type DragSource = 'bank' | { type: 'blank'; id: string };

interface DragPayload {
  type: 'match-pairs-option';
  optionId: string;
  fromBlankId?: string;
}

interface TemplateSegment {
  type: 'text' | 'blank';
  value: string;
  blankId?: string;
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
  if (!rgb) return '#0f172a';

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

const surfaceColor = (
  accent: string,
  textColor: string,
  lightenAmount: number,
  darkenAmount: number
): string => (textColor === '#0f172a' ? lightenColor(accent, lightenAmount) : darkenColor(accent, darkenAmount));

const parseTemplate = (template: string, blanks: MatchPairsTile['content']['blanks']): TemplateSegment[] => {
  if (!template) {
    return [{ type: 'text', value: '' }];
  }

  const placeholderRegex = /\{\{\s*([^}]+?)\s*\}\}/g;
  const segments: TemplateSegment[] = [];
  let lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = placeholderRegex.exec(template)) !== null) {
    const [placeholder, placeholderIdRaw] = match;
    const placeholderId = placeholderIdRaw.trim();

    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: template.slice(lastIndex, match.index) });
    }

    const blankExists = blanks.some(blank => blank.id === placeholderId);
    if (blankExists) {
      segments.push({ type: 'blank', value: placeholder, blankId: placeholderId });
    } else {
      segments.push({ type: 'text', value: placeholder });
    }

    lastIndex = match.index + placeholder.length;
  }

  if (lastIndex < template.length) {
    segments.push({ type: 'text', value: template.slice(lastIndex) });
  }

  if (segments.length === 0) {
    segments.push({ type: 'text', value: template });
  }

  return segments;
};

const readDragPayload = (event: React.DragEvent): DragPayload | null => {
  const json = event.dataTransfer.getData('application/json') || event.dataTransfer.getData('text/plain');
  if (!json) return null;

  try {
    const parsed = JSON.parse(json);
    if (parsed && parsed.type === 'match-pairs-option' && typeof parsed.optionId === 'string') {
      return parsed as DragPayload;
    }
  } catch (error) {
    console.warn('Failed to parse drag payload', error);
  }

  return null;
};

export const MatchPairsInteractive: React.FC<MatchPairsInteractiveProps> = ({
  tile,
  isPreview = false,
  isTestingMode = false,
  onRequestTextEditing,
  instructionContent
}) => {
  const [placements, setPlacements] = useState<Record<string, string | null>>(() => {
    const initial: Record<string, string | null> = {};
    tile.content.blanks.forEach(blank => {
      initial[blank.id] = null;
    });
    return initial;
  });
  const [evaluationState, setEvaluationState] = useState<EvaluationState>('idle');
  const [draggingOption, setDraggingOption] = useState<{ id: string; source: DragSource } | null>(null);
  const [activeBlank, setActiveBlank] = useState<string | null>(null);
  const [isBankHighlighted, setIsBankHighlighted] = useState(false);
  const [optionOrder, setOptionOrder] = useState<string[]>(() => tile.content.options.map(option => option.id));

  useEffect(() => {
    const blankIds = new Set(tile.content.blanks.map(blank => blank.id));
    setPlacements(prev => {
      const next: Record<string, string | null> = {};
      tile.content.blanks.forEach(blank => {
        const previousValue = prev[blank.id] ?? null;
        next[blank.id] = blankIds.has(blank.id) ? previousValue : null;
      });
      return next;
    });
    setEvaluationState('idle');
  }, [tile.content.blanks, tile.content.template]);

  useEffect(() => {
    if (!tile.content.shuffleOptions) {
      setOptionOrder(tile.content.options.map(option => option.id));
      return;
    }

    const ids = tile.content.options.map(option => option.id);
    const shuffled = [...ids];

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    setOptionOrder(shuffled);
  }, [tile.content.options, tile.content.shuffleOptions, isTestingMode]);

  const optionMap = useMemo(() => {
    const map = new Map<string, MatchPairsTile['content']['options'][number]>();
    tile.content.options.forEach(option => {
      map.set(option.id, option);
    });
    return map;
  }, [tile.content.options]);

  const accentColor = tile.content.backgroundColor || '#1d4ed8';
  const textColor = useMemo(() => getReadableTextColor(accentColor), [accentColor]);
  const mutedTextColor = textColor === '#0f172a' ? '#475569' : '#dbeafe';
  const canInteract = !isPreview && isTestingMode;

  const panelBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.64, 0.45),
    [accentColor, textColor]
  );
  const panelBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.52, 0.58),
    [accentColor, textColor]
  );
  const iconBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.54, 0.48),
    [accentColor, textColor]
  );
  const templateBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.62, 0.4),
    [accentColor, textColor]
  );
  const templateBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.54, 0.5),
    [accentColor, textColor]
  );
  const bankBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.58, 0.42),
    [accentColor, textColor]
  );
  const bankBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.48, 0.58),
    [accentColor, textColor]
  );
  const chipBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.52, 0.48),
    [accentColor, textColor]
  );
  const chipBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.44, 0.56),
    [accentColor, textColor]
  );
  const chipHoverBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.64, 0.36),
    [accentColor, textColor]
  );

  const segments = useMemo(
    () => parseTemplate(tile.content.template, tile.content.blanks),
    [tile.content.template, tile.content.blanks]
  );

  const unplacedOptionIds = useMemo(() => {
    const placed = new Set(Object.values(placements).filter(Boolean) as string[]);
    return optionOrder.filter(id => optionMap.has(id) && !placed.has(id));
  }, [optionOrder, placements, optionMap]);

  const handleDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      if (isPreview || isTestingMode) return;

      event.preventDefault();
      event.stopPropagation();
      onRequestTextEditing?.();
    },
    [isPreview, isTestingMode, onRequestTextEditing]
  );

  const updatePlacements = useCallback(
    (blankId: string, optionId: string | null) => {
      setPlacements(prev => {
        const next: Record<string, string | null> = { ...prev };

        if (optionId) {
          Object.entries(prev).forEach(([existingBlankId, assignedOptionId]) => {
            if (existingBlankId !== blankId && assignedOptionId === optionId) {
              next[existingBlankId] = null;
            }
          });
        }

        next[blankId] = optionId;
        return next;
      });
      setEvaluationState('idle');
    },
    []
  );

  const handleDropToBlank = useCallback(
    (event: React.DragEvent, blankId: string) => {
      if (!canInteract) return;

      event.preventDefault();
      const payload = readDragPayload(event);
      setActiveBlank(null);

      if (!payload) return;

      updatePlacements(blankId, payload.optionId);

      if (payload.fromBlankId && payload.fromBlankId !== blankId) {
        updatePlacements(payload.fromBlankId, null);
      }

      setDraggingOption(null);
    },
    [canInteract, updatePlacements]
  );

  const handleDropToBank = useCallback(
    (event: React.DragEvent) => {
      if (!canInteract) return;

      event.preventDefault();
      setIsBankHighlighted(false);
      const payload = readDragPayload(event);
      if (!payload?.fromBlankId) return;

      updatePlacements(payload.fromBlankId, null);
      setDraggingOption(null);
    },
    [canInteract, updatePlacements]
  );

  const handleDragStart = useCallback(
    (event: React.DragEvent, optionId: string, source: DragSource) => {
      if (!canInteract) return;

      const payload: DragPayload = {
        type: 'match-pairs-option',
        optionId,
        fromBlankId: typeof source === 'object' ? source.id : undefined
      };

      try {
        event.dataTransfer.setData('application/json', JSON.stringify(payload));
      } catch {
        event.dataTransfer.setData('text/plain', JSON.stringify(payload));
      }

      event.dataTransfer.effectAllowed = 'move';
      setDraggingOption({ id: optionId, source });
      setEvaluationState('idle');
    },
    [canInteract]
  );

  const handleDragEnd = useCallback(() => {
    setDraggingOption(null);
    setActiveBlank(null);
    setIsBankHighlighted(false);
  }, []);

  const handleEvaluate = () => {
    if (!canInteract) return;

    const allFilled = tile.content.blanks.every(blank => placements[blank.id]);
    if (!allFilled) {
      setEvaluationState('incorrect');
      return;
    }

    const isCorrect = tile.content.blanks.every(
      blank => placements[blank.id] === blank.correctOptionId
    );

    setEvaluationState(isCorrect ? 'correct' : 'incorrect');
  };

  const handleReset = () => {
    if (!canInteract) return;

    setPlacements(() => {
      const reset: Record<string, string | null> = {};
      tile.content.blanks.forEach(blank => {
        reset[blank.id] = null;
      });
      return reset;
    });
    setEvaluationState('idle');
    setDraggingOption(null);
  };

  const renderInstructionContent = () => {
    if (instructionContent) return instructionContent;

    return (
      <div
        className="text-sm leading-relaxed"
        style={{
          fontFamily: tile.content.fontFamily,
          fontSize: `${tile.content.fontSize}px`
        }}
        dangerouslySetInnerHTML={{
          __html:
            tile.content.richInstructions ||
            `<p style="margin: 0;">${tile.content.instructions}</p>`
        }}
      />
    );
  };

  const renderOptionChip = (optionId: string, variant: 'bank' | 'blank', blankId?: string) => {
    const option = optionMap.get(optionId);
    if (!option) return null;

    const isDragging = draggingOption?.id === optionId;

    return (
      <div
        key={`${variant}-${optionId}-${blankId ?? 'bank'}`}
        draggable={canInteract}
        onDragStart={event => handleDragStart(event, optionId, variant === 'bank' ? 'bank' : { type: 'blank', id: blankId! })}
        onDragEnd={handleDragEnd}
        className={`group relative inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium shadow-sm transition-all select-none ${
          isDragging ? 'opacity-70 scale-95' : 'hover:shadow-md'
        } ${
          variant === 'bank'
            ? 'cursor-grab active:cursor-grabbing'
            : canInteract
              ? 'cursor-grab'
              : 'cursor-default'
        }`}
        style={{
          backgroundColor: variant === 'bank' ? chipBackground : surfaceColor(accentColor, textColor, 0.48, 0.56),
          borderColor: chipBorder,
          color: textColor
        }}
      >
        <GripVertical className="w-3 h-3 text-inherit/70" />
        <span>{option.text}</span>
        {variant === 'blank' && canInteract && (
          <button
            type="button"
            onClick={event => {
              event.stopPropagation();
              updatePlacements(blankId!, null);
            }}
            className="p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <XCircle className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  };

  const evaluationBadge = () => {
    if (evaluationState === 'correct') {
      return (
        <div className="flex items-center gap-2 text-sm font-medium" style={{ color: textColor }}>
          <CheckCircle2 className="w-4 h-4" />
          <span>Świetnie! Wszystkie odpowiedzi są poprawne.</span>
        </div>
      );
    }

    if (evaluationState === 'incorrect') {
      return (
        <div className="flex items-center gap-2 text-sm font-medium text-rose-100">
          <XCircle className="w-4 h-4" />
          <span>Sprawdź jeszcze raz. Niektóre luki zawierają niepoprawne odpowiedzi.</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-sm font-medium" style={{ color: mutedTextColor }}>
        <Sparkles className="w-4 h-4" />
        <span>Przeciągnij odpowiedzi do luk i kliknij „Sprawdź”.</span>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col gap-5" onDoubleClick={handleDoubleClick}>
      <TaskInstructionPanel
        icon={<Puzzle className="w-4 h-4" />}
        label="Instrukcja"
        className="flex-shrink-0 border rounded-3xl"
        style={{ backgroundColor: panelBackground, borderColor: panelBorder, color: textColor }}
        iconWrapperStyle={{ backgroundColor: iconBackground, color: textColor }}
        labelStyle={{ color: mutedTextColor }}
      >
        {renderInstructionContent()}
      </TaskInstructionPanel>

      <div className="flex-1 flex flex-col gap-4 rounded-3xl border p-5" style={{ borderColor: templateBorder, backgroundColor: templateBackground, color: textColor }}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em]" style={{ color: mutedTextColor }}>
              <Sparkles className="w-3 h-3" />
              <span>Tekst z lukami</span>
            </div>
            {isTestingMode && (
              <div className="text-[11px] font-medium px-2 py-1 rounded-full" style={{
                backgroundColor: surfaceColor(accentColor, textColor, 0.54, 0.5),
                color: textColor
              }}>
                Tryb testowania
              </div>
            )}
          </div>

          <div className="text-base leading-7 flex flex-wrap gap-y-2">
            {segments.map((segment, index) => {
              if (segment.type === 'text') {
                return (
                  <span key={`text-${index}`} className="whitespace-pre-wrap">
                    {segment.value}
                  </span>
                );
              }

              const blankId = segment.blankId!;
              const blank = tile.content.blanks.find(item => item.id === blankId);
              const assignedOptionId = placements[blankId];
              const assignedOption = assignedOptionId ? optionMap.get(assignedOptionId) : null;
              const label = blank?.label || `Luka ${index + 1}`;

              const isActive = activeBlank === blankId;
              const isCorrect =
                evaluationState !== 'idle' &&
                assignedOptionId &&
                assignedOptionId === blank?.correctOptionId;
              const isIncorrect =
                evaluationState === 'incorrect' &&
                assignedOptionId &&
                blank?.correctOptionId &&
                assignedOptionId !== blank.correctOptionId;

              return (
                <span
                  key={`blank-${blankId}-${index}`}
                  onDragOver={event => {
                    if (!canInteract) return;
                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'move';
                    setActiveBlank(blankId);
                  }}
                  onDragLeave={() => setActiveBlank(prev => (prev === blankId ? null : prev))}
                  onDrop={event => handleDropToBlank(event, blankId)}
                  className={`inline-flex items-center justify-center min-w-[120px] px-3 py-2 rounded-xl border text-sm font-medium transition-colors duration-200 ${
                    canInteract ? 'cursor-pointer select-none' : 'cursor-default'
                  } ${
                    isActive
                      ? 'ring-2 ring-offset-2 ring-offset-transparent'
                      : ''
                  }`}
                  style={{
                    backgroundColor: isActive
                      ? chipHoverBackground
                      : surfaceColor(accentColor, textColor, 0.6, 0.44),
                    borderColor: isCorrect
                      ? '#22c55e'
                      : isIncorrect
                        ? '#ef4444'
                        : chipBorder,
                    color: textColor
                  }}
                >
                  {assignedOption
                    ? renderOptionChip(assignedOption.id, 'blank', blankId)
                    : (
                      <span className="text-xs font-medium opacity-70 uppercase tracking-widest">
                        {label}
                      </span>
                    )}
                </span>
              );
            })}
          </div>
        </div>

        <div
          className={`rounded-2xl border px-5 py-4 transition-colors ${
            isBankHighlighted ? 'ring-2 ring-offset-2' : ''
          }`}
          style={{
            backgroundColor: isBankHighlighted
              ? surfaceColor(accentColor, textColor, 0.68, 0.36)
              : bankBackground,
            borderColor: bankBorder,
            color: textColor
          }}
          onDragOver={event => {
            if (!canInteract) return;
            if (draggingOption?.source === 'bank') return;

            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            setIsBankHighlighted(true);
          }}
          onDragLeave={() => setIsBankHighlighted(false)}
          onDrop={handleDropToBank}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em]" style={{ color: mutedTextColor }}>
              <Puzzle className="w-3 h-3" />
              <span>Bank odpowiedzi</span>
            </div>
            <span className="text-xs font-medium" style={{ color: mutedTextColor }}>
              {unplacedOptionIds.length} / {tile.content.options.length} dostępnych
            </span>
          </div>

          {unplacedOptionIds.length === 0 ? (
            <div className="text-sm font-medium opacity-70" style={{ color: mutedTextColor }}>
              Wszystkie wyrazy zostały użyte. Aby zwolnić miejsce, przenieś odpowiedź z powrotem do banku.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {unplacedOptionIds.map(optionId => renderOptionChip(optionId, 'bank'))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 mt-auto">
          <div className="flex items-center justify-between">
            {evaluationBadge()}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                disabled={!canInteract}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: surfaceColor(accentColor, textColor, 0.66, 0.38),
                  borderColor: surfaceColor(accentColor, textColor, 0.56, 0.46),
                  color: textColor
                }}
              >
                <RotateCcw className="w-4 h-4" />
                Resetuj
              </button>
              <button
                type="button"
                onClick={handleEvaluate}
                disabled={!canInteract}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold shadow-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: textColor === '#0f172a'
                    ? darkenColor(accentColor, 0.2)
                    : lightenColor(accentColor, 0.12),
                  color: getReadableTextColor(
                    textColor === '#0f172a' ? darkenColor(accentColor, 0.2) : lightenColor(accentColor, 0.12)
                  )
                }}
              >
                <CheckCircle2 className="w-4 h-4" />
                Sprawdź
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
