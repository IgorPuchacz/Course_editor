import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Puzzle,
  PackageOpen,
  Sparkles,
  CheckCircle,
  XCircle,
  RotateCcw,
  X,
  ArrowLeftRight
} from 'lucide-react';
import { MatchPairsTile, MatchPairsOption } from '../../types/lessonEditor';
import { TaskInstructionPanel } from './common/TaskInstructionPanel';

interface MatchPairsInteractiveProps {
  tile: MatchPairsTile;
  isPreview?: boolean;
  isTestingMode?: boolean;
  onRequestTextEditing?: () => void;
  instructionContent?: React.ReactNode;
  variant?: 'embedded' | 'standalone';
}

interface DragData {
  type: 'match-option';
  optionId: string;
  source: 'pool' | 'blank';
  blankId?: string;
}

type TemplateSegment =
  | { type: 'text'; value: string }
  | { type: 'blank'; blankId: string };

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

const surfaceColor = (accent: string, textColor: string, lightenAmount: number, darkenAmount: number): string =>
  textColor === '#0f172a' ? lightenColor(accent, lightenAmount) : darkenColor(accent, darkenAmount);

// Convert the author-facing template string (with [[blank-id]] placeholders)
// into a renderable sequence of text and interactive blank segments.
const parseTemplate = (template: string): TemplateSegment[] => {
  if (!template) return [];

  const segments: TemplateSegment[] = [];
  const regex = /\[\[([^\]]+)\]\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(template)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: template.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'blank', blankId: match[1].trim() });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < template.length) {
    segments.push({ type: 'text', value: template.slice(lastIndex) });
  }

  if (segments.length === 0) {
    segments.push({ type: 'text', value: template });
  }

  return segments;
};

// Ensure we never render duplicate options in the bank while keeping the
// original author defined ordering (and a graceful alphabetical fallback).
const dedupeAndSortOptions = (
  options: MatchPairsOption[],
  referenceOrder: string[],
  locale: string
): MatchPairsOption[] => {
  const seen = new Set<string>();
  const filtered: MatchPairsOption[] = [];

  for (const option of options) {
    if (!seen.has(option.id)) {
      seen.add(option.id);
      filtered.push(option);
    }
  }

  return filtered.sort((a, b) => {
    const indexA = referenceOrder.indexOf(a.id);
    const indexB = referenceOrder.indexOf(b.id);

    if (indexA === -1 && indexB === -1) {
      return a.text.localeCompare(b.text, locale);
    }

    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
};

export const MatchPairsInteractive: React.FC<MatchPairsInteractiveProps> = ({
  tile,
  isPreview = false,
  isTestingMode = false,
  onRequestTextEditing,
  instructionContent,
  variant = 'embedded'
}) => {
  const canInteract = !isPreview;

  const optionOrder = useMemo(() => tile.content.options.map(option => option.id), [tile.content.options]);
  const [availableOptions, setAvailableOptions] = useState<MatchPairsOption[]>(() =>
    dedupeAndSortOptions(tile.content.options, optionOrder, 'pl')
  );
  // Store which option is currently placed in every blank. This makes it easy
  // to validate the task and to return options to the bank without mutation.
  const [assignments, setAssignments] = useState<Record<string, MatchPairsOption | null>>(() => {
    const initial: Record<string, MatchPairsOption | null> = {};
    tile.content.blanks.forEach(blank => {
      initial[blank.id] = null;
    });
    return initial;
  });
  const [draggingOptionId, setDraggingOptionId] = useState<string | null>(null);
  const [dragOverBlankId, setDragOverBlankId] = useState<string | null>(null);
  const [isBankHighlighted, setIsBankHighlighted] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [wasIncompleteAttempt, setWasIncompleteAttempt] = useState(false);

  // Reset drag & drop state whenever the author changes the exercise content
  // (or when the editor toggles testing mode).
  const initializeState = useCallback(() => {
    setAvailableOptions(dedupeAndSortOptions(tile.content.options, optionOrder, 'pl'));
    setAssignments(() => {
      const initial: Record<string, MatchPairsOption | null> = {};
      tile.content.blanks.forEach(blank => {
        initial[blank.id] = null;
      });
      return initial;
    });
    setDraggingOptionId(null);
    setDragOverBlankId(null);
    setIsBankHighlighted(false);
    setIsChecked(false);
    setIsCorrect(null);
    setWasIncompleteAttempt(false);
    setAttempts(0);
  }, [optionOrder, tile.content.blanks, tile.content.options]);

  useEffect(() => {
    initializeState();
  }, [initializeState]);

  // Fast lookup map for the option metadata, used every time the user drops a tile.
  const optionMap = useMemo(() => {
    const map = new Map<string, MatchPairsOption>();
    tile.content.options.forEach(option => {
      map.set(option.id, option);
    });
    return map;
  }, [tile.content.options]);

  const accentColor = tile.content.backgroundColor || '#2563eb';
  const textColor = useMemo(() => getReadableTextColor(accentColor), [accentColor]);
  const gradientStart = useMemo(() => lightenColor(accentColor, 0.06), [accentColor]);
  const gradientEnd = useMemo(() => darkenColor(accentColor, 0.06), [accentColor]);
  const frameBorderColor = useMemo(() => surfaceColor(accentColor, textColor, 0.45, 0.6), [accentColor, textColor]);
  const panelBackground = useMemo(() => surfaceColor(accentColor, textColor, 0.65, 0.45), [accentColor, textColor]);
  const panelBorder = useMemo(() => surfaceColor(accentColor, textColor, 0.5, 0.55), [accentColor, textColor]);
  const iconBackground = useMemo(() => surfaceColor(accentColor, textColor, 0.55, 0.5), [accentColor, textColor]);
  const mutedLabelColor = textColor === '#0f172a' ? '#475569' : '#e2e8f0';
  const subtleCaptionColor = textColor === '#0f172a' ? '#334155' : '#e2e8f0';
  const blankEmptyBackground = useMemo(() => surfaceColor(accentColor, textColor, 0.64, 0.35), [accentColor, textColor]);
  const blankEmptyBorder = useMemo(() => surfaceColor(accentColor, textColor, 0.48, 0.55), [accentColor, textColor]);
  const blankHoverBackground = useMemo(() => surfaceColor(accentColor, textColor, 0.72, 0.3), [accentColor, textColor]);
  const blankHoverBorder = useMemo(() => surfaceColor(accentColor, textColor, 0.58, 0.45), [accentColor, textColor]);
  const blankFilledBackground = useMemo(() => surfaceColor(accentColor, textColor, 0.52, 0.42), [accentColor, textColor]);
  const blankFilledBorder = useMemo(() => surfaceColor(accentColor, textColor, 0.45, 0.55), [accentColor, textColor]);
  const bankBackground = useMemo(() => surfaceColor(accentColor, textColor, 0.6, 0.42), [accentColor, textColor]);
  const bankBorder = useMemo(() => surfaceColor(accentColor, textColor, 0.48, 0.5), [accentColor, textColor]);
  const bankHighlightBackground = useMemo(() => surfaceColor(accentColor, textColor, 0.7, 0.34), [accentColor, textColor]);
  const bankHighlightBorder = useMemo(() => surfaceColor(accentColor, textColor, 0.58, 0.45), [accentColor, textColor]);
  const chipBackground = useMemo(() => surfaceColor(accentColor, textColor, 0.54, 0.48), [accentColor, textColor]);
  const chipBorder = useMemo(() => surfaceColor(accentColor, textColor, 0.45, 0.58), [accentColor, textColor]);

  // Start dragging either from the bank or from a filled blank.
  const handleDragStart = (event: React.DragEvent, optionId: string, source: 'pool' | 'blank', blankId?: string) => {
    if (!canInteract) return;

    const data: DragData = {
      type: 'match-option',
      optionId,
      source,
      blankId
    };
    event.dataTransfer.setData('application/json', JSON.stringify(data));
    event.dataTransfer.effectAllowed = 'move';
    setDraggingOptionId(optionId);
  };

  const handleDragEnd = () => {
    setDraggingOptionId(null);
    setDragOverBlankId(null);
    setIsBankHighlighted(false);
  };

  const parseDragData = (event: React.DragEvent): DragData | null => {
    try {
      const json = event.dataTransfer.getData('application/json');
      if (!json) return null;
      const data = JSON.parse(json) as DragData;
      return data.type === 'match-option' ? data : null;
    } catch (error) {
      return null;
    }
  };

  const handleBlankDragOver = (event: React.DragEvent, blankId: string) => {
    if (!canInteract) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverBlankId(blankId);
  };

  const handleBlankDragLeave = (blankId: string) => {
    if (dragOverBlankId === blankId) {
      setDragOverBlankId(null);
    }
  };

  // Accept drop events on a blank, moving the option and returning the previous
  // assignment (if any) back to the bank.
  const handleDropOnBlank = (event: React.DragEvent, blankId: string) => {
    if (!canInteract) return;
    event.preventDefault();
    setDragOverBlankId(null);

    const data = parseDragData(event);
    if (!data) return;
    if (data.source === 'blank' && data.blankId === blankId) return;

    const option = optionMap.get(data.optionId);
    if (!option) return;

    setAssignments(prevAssignments => {
      const previousOption = prevAssignments[blankId];
      const updated: Record<string, MatchPairsOption | null> = { ...prevAssignments };

      if (data.source === 'blank' && data.blankId) {
        updated[data.blankId] = null;
      }

      updated[blankId] = option;

      setAvailableOptions(prevOptions => {
        let updatedOptions = prevOptions;

        if (data.source === 'pool') {
          updatedOptions = prevOptions.filter(opt => opt.id !== option.id);
        }

        if (data.source === 'blank' && data.blankId && data.blankId !== blankId) {
          updatedOptions = prevOptions.filter(opt => opt.id !== option.id);
        }

        if (previousOption && previousOption.id !== option.id) {
          updatedOptions = [...updatedOptions, previousOption];
        }

        return dedupeAndSortOptions(updatedOptions, optionOrder, 'pl');
      });

      return updated;
    });

    setIsChecked(false);
    setIsCorrect(null);
    setWasIncompleteAttempt(false);
  };

  const handlePoolDragOver = (event: React.DragEvent) => {
    if (!canInteract) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setIsBankHighlighted(true);
  };

  const handlePoolDragLeave = () => {
    setIsBankHighlighted(false);
  };

  // Allow learners to drag options back to the bank when they want to retry.
  const handleDropToPool = (event: React.DragEvent) => {
    if (!canInteract) return;
    event.preventDefault();
    setIsBankHighlighted(false);

    const data = parseDragData(event);
    if (!data || data.source !== 'blank' || !data.blankId) return;

    setAssignments(prevAssignments => {
      const option = prevAssignments[data.blankId];
      if (!option) return prevAssignments;

      const updated: Record<string, MatchPairsOption | null> = {
        ...prevAssignments,
        [data.blankId]: null
      };

      setAvailableOptions(prevOptions =>
        dedupeAndSortOptions([...prevOptions, option], optionOrder, 'pl')
      );

      return updated;
    });

    setIsChecked(false);
    setIsCorrect(null);
    setWasIncompleteAttempt(false);
  };

  const handleClearBlank = (blankId: string) => {
    if (!canInteract) return;

    setAssignments(prevAssignments => {
      const option = prevAssignments[blankId];
      if (!option) return prevAssignments;

      const updated: Record<string, MatchPairsOption | null> = {
        ...prevAssignments,
        [blankId]: null
      };

      setAvailableOptions(prevOptions =>
        dedupeAndSortOptions([...prevOptions, option], optionOrder, 'pl')
      );

      return updated;
    });

    setIsChecked(false);
    setIsCorrect(null);
    setWasIncompleteAttempt(false);
  };

  const handleCheck = () => {
    if (!canInteract) return;

    const isComplete = tile.content.blanks.every(blank => assignments[blank.id]);
    const result =
      isComplete &&
      tile.content.blanks.every(
        blank => assignments[blank.id]?.id === (blank.correctOptionId ?? undefined)
      );

    setAttempts(prev => prev + 1);
    setIsChecked(true);
    setIsCorrect(result);
    setWasIncompleteAttempt(!isComplete);
  };

  const handleReset = () => {
    if (!canInteract) return;
    initializeState();
  };

  const segments = useMemo(() => parseTemplate(tile.content.textTemplate), [tile.content.textTemplate]);

  const feedbackMessage = useMemo(() => {
    if (!isChecked) return null;

    if (wasIncompleteAttempt) {
      return {
        tone: 'warning' as const,
        text: 'Uzupełnij wszystkie luki, aby sprawdzić odpowiedź.'
      };
    }

    if (isCorrect) {
      return {
        tone: 'success' as const,
        text: tile.content.correctFeedback
      };
    }

    return {
      tone: 'error' as const,
      text: tile.content.incorrectFeedback
    };
  }, [isChecked, isCorrect, tile.content.correctFeedback, tile.content.incorrectFeedback, wasIncompleteAttempt]);

  const feedbackStyles = useMemo(() => {
    if (!feedbackMessage) return null;

    switch (feedbackMessage.tone) {
      case 'success':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          background: textColor === '#0f172a' ? '#f0fdf4' : 'rgba(12, 54, 26, 0.4)',
          border: textColor === '#0f172a' ? '#86efac' : 'rgba(148, 226, 188, 0.65)',
          color: textColor === '#0f172a' ? '#166534' : '#f0fdf4'
        };
      case 'warning':
        return {
          icon: <ArrowLeftRight className="w-4 h-4" />,
          background: textColor === '#0f172a' ? '#fef3c7' : 'rgba(68, 56, 10, 0.5)',
          border: textColor === '#0f172a' ? '#facc15' : 'rgba(255, 221, 89, 0.75)',
          color: textColor === '#0f172a' ? '#92400e' : '#fef9c3'
        };
      default:
        return {
          icon: <XCircle className="w-4 h-4" />,
          background: textColor === '#0f172a' ? '#fee2e2' : 'rgba(76, 17, 17, 0.5)',
          border: textColor === '#0f172a' ? '#fca5a5' : 'rgba(254, 202, 202, 0.75)',
          color: textColor === '#0f172a' ? '#7f1d1d' : '#fee2e2'
        };
    }
  }, [feedbackMessage, textColor]);

  const showBorder = tile.content.showBorder ?? true;
  const isEmbedded = variant === 'embedded';

  return (
    <div
      className={`w-full h-full flex flex-col gap-5 ${showBorder ? 'border rounded-3xl' : 'rounded-3xl'} p-5`}
      style={{
        backgroundColor: isEmbedded ? 'transparent' : accentColor,
        backgroundImage: isEmbedded ? undefined : `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
        color: textColor,
        borderColor: !isEmbedded && showBorder ? frameBorderColor : undefined,
        boxShadow: isEmbedded ? undefined : '0 24px 40px rgba(15, 23, 42, 0.22)'
      }}
    >
      <TaskInstructionPanel
        icon={<Puzzle className="w-4 h-4" />}
        label="Instrukcja"
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
              fontSize: `${tile.content.fontSize}px`,
              whiteSpace: 'pre-wrap'
            }}
            dangerouslySetInnerHTML={{
              __html: tile.content.richInstruction || tile.content.instruction
            }}
            onDoubleClick={onRequestTextEditing}
          />
        )}
      </TaskInstructionPanel>

      {(isTestingMode || attempts > 0) && (
        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.28em]" style={{ color: subtleCaptionColor }}>
          {isTestingMode && <span>Tryb testowania</span>}
          {attempts > 0 && <span>Próba #{attempts}</span>}
        </div>
      )}

      <div className="flex-1 flex flex-col gap-5 overflow-hidden">
        <div
          className="rounded-2xl border flex-1 px-5 py-4 overflow-auto"
          style={{ backgroundColor: panelBackground, borderColor: panelBorder }}
        >
          {segments.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm" style={{ color: subtleCaptionColor }}>
              Dodaj treść ćwiczenia, aby pojawiły się luki.
            </div>
          ) : (
            <p
              className="text-base leading-relaxed"
              style={{
                fontFamily: tile.content.fontFamily,
                fontSize: `${tile.content.fontSize}px`,
                whiteSpace: 'pre-wrap'
              }}
            >
              {segments.map((segment, index) => {
                if (segment.type === 'text') {
                  return <React.Fragment key={`text-${index}`}>{segment.value}</React.Fragment>;
                }

                const blank = tile.content.blanks.find(b => b.id === segment.blankId);
                const assignedOption = assignments[segment.blankId];

                if (!blank) {
                  return (
                    <span key={`missing-${index}`} className="inline-block align-middle mx-1">
                      <span
                        className="px-3 py-2 rounded-lg border text-xs font-medium"
                        style={{
                          backgroundColor: blankEmptyBackground,
                          borderColor: blankEmptyBorder,
                          color: subtleCaptionColor
                        }}
                      >
                        [[{segment.blankId}]]
                      </span>
                    </span>
                  );
                }

                const isDragOver = dragOverBlankId === segment.blankId;
                const hasValue = Boolean(assignedOption);

                return (
                  <span key={`blank-${segment.blankId}`} className="inline-block align-middle mx-1">
                    <div
                      className={`group relative inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${
                        hasValue ? 'shadow-sm' : ''
                      } ${canInteract ? 'cursor-pointer' : 'cursor-default'}`}
                      style={{
                        backgroundColor: hasValue
                          ? blankFilledBackground
                          : isDragOver
                          ? blankHoverBackground
                          : blankEmptyBackground,
                        borderColor: hasValue
                          ? blankFilledBorder
                          : isDragOver
                          ? blankHoverBorder
                          : blankEmptyBorder,
                        color: hasValue ? textColor : subtleCaptionColor,
                        minWidth: 120,
                        minHeight: 40
                      }}
                      onDoubleClick={onRequestTextEditing}
                      draggable={Boolean(assignedOption) && canInteract}
                      onDragStart={event =>
                        assignedOption && handleDragStart(event, assignedOption.id, 'blank', segment.blankId)
                      }
                      onDragEnd={handleDragEnd}
                      onDragOver={event => handleBlankDragOver(event, segment.blankId)}
                      onDragLeave={() => handleBlankDragLeave(segment.blankId)}
                      onDrop={event => handleDropOnBlank(event, segment.blankId)}
                    >
                      <div className="flex flex-col text-left">
                        <span className="text-[11px] uppercase tracking-[0.2em]" style={{ color: mutedLabelColor }}>
                          {blank.label}
                        </span>
                        <span className="text-sm font-semibold" style={{ color: hasValue ? textColor : subtleCaptionColor }}>
                          {assignedOption ? assignedOption.text : 'Przeciągnij słowo'}
                        </span>
                      </div>

                      {assignedOption && canInteract && (
                        <button
                          type="button"
                          onClick={() => handleClearBlank(segment.blankId)}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white/80 text-slate-500 hover:text-slate-700 hover:bg-white flex items-center justify-center shadow-sm"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </span>
                );
              })}
            </p>
          )}
        </div>

        <div
          className="rounded-2xl border px-5 py-4 transition-colors"
          style={{
            backgroundColor: isBankHighlighted ? bankHighlightBackground : bankBackground,
            borderColor: isBankHighlighted ? bankHighlightBorder : bankBorder
          }}
          onDragOver={handlePoolDragOver}
          onDragLeave={handlePoolDragLeave}
          onDrop={handleDropToPool}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: subtleCaptionColor }}>
              <PackageOpen className="w-4 h-4" />
              <span>Bank słów</span>
            </div>
            <span className="text-xs" style={{ color: mutedLabelColor }}>
              Przeciągnij słowa do odpowiednich luk
            </span>
          </div>

          <div className="flex flex-wrap gap-3">
            {availableOptions.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center gap-2 text-center text-sm py-6 flex-1"
                style={{ color: subtleCaptionColor }}
              >
                <Sparkles className="w-5 h-5" />
                <span>Świetnie! Wszystkie słowa zostały już użyte.</span>
              </div>
            ) : (
              availableOptions.map(option => (
                <div
                  key={option.id}
                  draggable={canInteract}
                  onDragStart={event => handleDragStart(event, option.id, 'pool')}
                  onDragEnd={handleDragEnd}
                  className={`px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                    draggingOptionId === option.id ? 'opacity-70 scale-95' : 'hover:shadow-md'
                  } ${canInteract ? 'cursor-grab active:cursor-grabbing' : 'cursor-not-allowed opacity-70'}`}
                  style={{
                    backgroundColor: chipBackground,
                    borderColor: chipBorder,
                    color: textColor
                  }}
                >
                  {option.text}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {feedbackMessage && feedbackStyles && (
        <div
          className="rounded-2xl border px-4 py-3 flex items-center gap-3"
          style={{
            backgroundColor: feedbackStyles.background,
            borderColor: feedbackStyles.border,
            color: feedbackStyles.color
          }}
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-full border" style={{ borderColor: feedbackStyles.color }}>
            {feedbackStyles.icon}
          </span>
          <p className="text-sm leading-relaxed">{feedbackMessage.text}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={handleReset}
          disabled={!canInteract}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/30 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw className="w-4 h-4" />
          Resetuj
        </button>
        <button
          type="button"
          onClick={handleCheck}
          disabled={!canInteract}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold shadow-md transition-colors"
          style={{
            backgroundColor: darkenColor(accentColor, 0.15),
            color: '#f8fafc'
          }}
        >
          <CheckCircle className="w-4 h-4" />
          Sprawdź odpowiedź
        </button>
      </div>
    </div>
  );
};
