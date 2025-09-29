import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Puzzle, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { MatchPairsTile } from '../../types/lessonEditor';
import { TaskInstructionPanel } from './common/TaskInstructionPanel';
import { MATCH_PAIRS_PLACEHOLDER_REGEX } from '../../utils/matchPairs';

interface MatchPairsInteractiveProps {
  tile: MatchPairsTile;
  isPreview?: boolean;
  isTestingMode?: boolean;
  onRequestTextEditing?: () => void;
  instructionContent?: React.ReactNode;
}

type EvaluationState = 'idle' | 'correct' | 'incorrect';
type BlankStatus = 'idle' | 'correct' | 'incorrect';

type Segment =
  | { type: 'text'; text: string }
  | { type: 'blank'; blank: MatchPairsTile['content']['blanks'][number]; index: number };

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

const buildSegments = (tile: MatchPairsTile): Segment[] => {
  const segments: Segment[] = [];
  const text = tile.content.prompt || '';
  const blanks = tile.content.blanks;

  MATCH_PAIRS_PLACEHOLDER_REGEX.lastIndex = 0;
  let lastIndex = 0;
  let blankIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = MATCH_PAIRS_PLACEHOLDER_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', text: text.slice(lastIndex, match.index) });
    }

    const blank = blanks[blankIndex];
    if (blank) {
      segments.push({ type: 'blank', blank, index: blankIndex });
    }

    lastIndex = match.index + match[0].length;
    blankIndex += 1;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', text: text.slice(lastIndex) });
  }

  for (; blankIndex < blanks.length; blankIndex += 1) {
    segments.push({ type: 'blank', blank: blanks[blankIndex], index: blankIndex });
  }

  return segments;
};

export const MatchPairsInteractive: React.FC<MatchPairsInteractiveProps> = ({
  tile,
  isPreview = false,
  isTestingMode = false,
  onRequestTextEditing,
  instructionContent
}) => {
  const [assignments, setAssignments] = useState<Record<string, string | null>>(() => {
    const initial: Record<string, string | null> = {};
    tile.content.blanks.forEach((blank) => {
      initial[blank.id] = null;
    });
    return initial;
  });
  const [blankStatuses, setBlankStatuses] = useState<Record<string, BlankStatus>>(() => {
    const initial: Record<string, BlankStatus> = {};
    tile.content.blanks.forEach((blank) => {
      initial[blank.id] = 'idle';
    });
    return initial;
  });
  const [draggedOptionId, setDraggedOptionId] = useState<string | null>(null);
  const [hoveredBlankId, setHoveredBlankId] = useState<string | null>(null);
  const [evaluationState, setEvaluationState] = useState<EvaluationState>('idle');

  const isInteractionEnabled = !isPreview && isTestingMode;

  useEffect(() => {
    const initialAssignments: Record<string, string | null> = {};
    const initialStatuses: Record<string, BlankStatus> = {};

    tile.content.blanks.forEach((blank) => {
      initialAssignments[blank.id] = null;
      initialStatuses[blank.id] = 'idle';
    });

    setAssignments(initialAssignments);
    setBlankStatuses(initialStatuses);
    setEvaluationState('idle');
  }, [tile.content.blanks, tile.content.options, tile.id]);

  const accentColor = tile.content.backgroundColor || '#4c1d95';
  const textColor = useMemo(() => getReadableTextColor(accentColor), [accentColor]);
  const panelBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.66, 0.42),
    [accentColor, textColor]
  );
  const panelBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.5, 0.56),
    [accentColor, textColor]
  );
  const iconBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.58, 0.48),
    [accentColor, textColor]
  );
  const mutedLabelColor = textColor === '#0f172a' ? '#475569' : '#dbeafe';
  const blankBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.74, 0.38),
    [accentColor, textColor]
  );
  const blankBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.52, 0.54),
    [accentColor, textColor]
  );
  const blankHoverBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.82, 0.32),
    [accentColor, textColor]
  );
  const blankHoverBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.6, 0.46),
    [accentColor, textColor]
  );
  const bankBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.68, 0.4),
    [accentColor, textColor]
  );
  const bankBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.54, 0.52),
    [accentColor, textColor]
  );
  const chipBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.56, 0.48),
    [accentColor, textColor]
  );
  const chipBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.48, 0.56),
    [accentColor, textColor]
  );

  const segments = useMemo(() => buildSegments(tile), [tile]);

  const assignedOptionIds = useMemo(() => {
    const used = new Set<string>();
    Object.values(assignments).forEach((value) => {
      if (value) {
        used.add(value);
      }
    });
    return used;
  }, [assignments]);

  const availableOptions = useMemo(
    () => tile.content.options.filter((option) => !assignedOptionIds.has(option.id)),
    [tile.content.options, assignedOptionIds]
  );

  const allBlanksFilled = tile.content.blanks.length > 0 && tile.content.blanks.every((blank) => assignments[blank.id]);

  const handleTileDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      if (isPreview || isTestingMode) return;

      event.preventDefault();
      event.stopPropagation();
      onRequestTextEditing?.();
    },
    [isPreview, isTestingMode, onRequestTextEditing]
  );

  const assignOptionToBlank = (blankId: string, optionId: string | null) => {
    setAssignments((prev) => {
      const updated: Record<string, string | null> = { ...prev };

      if (optionId) {
        Object.keys(updated).forEach((key) => {
          if (updated[key] === optionId) {
            updated[key] = null;
          }
        });
      }

      updated[blankId] = optionId;
      return updated;
    });

    setBlankStatuses((prev) => ({
      ...prev,
      [blankId]: 'idle'
    }));
    setEvaluationState('idle');
  };

  const handleOptionDragStart = (event: React.DragEvent, optionId: string) => {
    if (!isInteractionEnabled) return;
    setDraggedOptionId(optionId);
    event.dataTransfer.setData('text/plain', optionId);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleOptionDragEnd = () => {
    setDraggedOptionId(null);
  };

  const handleBlankDragOver = (event: React.DragEvent) => {
    if (!isInteractionEnabled) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleBlankDrop = (event: React.DragEvent, blankId: string) => {
    if (!isInteractionEnabled) return;
    event.preventDefault();
    const optionId = draggedOptionId || event.dataTransfer.getData('text/plain');
    if (!optionId) return;

    assignOptionToBlank(blankId, optionId);
    setHoveredBlankId(null);
    setDraggedOptionId(null);
  };

  const handleBlankDragEnter = (blankId: string) => {
    if (!isInteractionEnabled) return;
    setHoveredBlankId(blankId);
  };

  const handleBlankDragLeave = (blankId: string) => {
    if (!isInteractionEnabled) return;
    if (hoveredBlankId === blankId) {
      setHoveredBlankId(null);
    }
  };

  const handleClearBlank = (blankId: string) => {
    if (!isInteractionEnabled) return;
    assignOptionToBlank(blankId, null);
  };

  const handleReset = () => {
    if (!isInteractionEnabled) return;
    const resetAssignments: Record<string, string | null> = {};
    const resetStatuses: Record<string, BlankStatus> = {};

    tile.content.blanks.forEach((blank) => {
      resetAssignments[blank.id] = null;
      resetStatuses[blank.id] = 'idle';
    });

    setAssignments(resetAssignments);
    setBlankStatuses(resetStatuses);
    setEvaluationState('idle');
  };

  const handleEvaluate = () => {
    if (!isInteractionEnabled) return;

    const statusUpdates: Record<string, BlankStatus> = {};
    let isCorrect = true;

    tile.content.blanks.forEach((blank) => {
      const assigned = assignments[blank.id];
      const blankIsCorrect = Boolean(assigned) && assigned === blank.correctOptionId;
      statusUpdates[blank.id] = blankIsCorrect ? 'correct' : 'incorrect';
      if (!blankIsCorrect) {
        isCorrect = false;
      }
    });

    setBlankStatuses(statusUpdates);
    setEvaluationState(isCorrect ? 'correct' : 'incorrect');
  };

  const renderEvaluationMessage = () => {
    if (!isInteractionEnabled || evaluationState === 'idle') return null;

    const isCorrect = evaluationState === 'correct';

    return (
      <div
        className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
          isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'
        }`}
      >
        {isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
        {isCorrect ? 'Świetnie! Wszystkie odpowiedzi są poprawne.' : 'Spróbuj ponownie. Przeciągnij słowa w inne miejsca.'}
      </div>
    );
  };

  const renderBlankSegment = (segment: Extract<Segment, { type: 'blank' }>) => {
    const assignedOptionId = assignments[segment.blank.id];
    const assignedOption = assignedOptionId
      ? tile.content.options.find((option) => option.id === assignedOptionId)
      : null;
    const status = blankStatuses[segment.blank.id] ?? 'idle';
    const isHovered = hoveredBlankId === segment.blank.id;

    let background = blankBackground;
    let border = blankBorder;
    let text = textColor;

    if (status === 'correct') {
      background = '#dcfce7';
      border = '#22c55e';
      text = '#166534';
    } else if (status === 'incorrect') {
      background = '#fee2e2';
      border = '#f87171';
      text = '#b91c1c';
    } else if (isHovered) {
      background = blankHoverBackground;
      border = blankHoverBorder;
    }

    return (
      <span
        key={segment.blank.id}
        className={`inline-flex items-center gap-2 px-3 py-1.5 mx-1 rounded-lg border text-sm font-medium transition-all duration-200 ${
          isInteractionEnabled ? 'cursor-pointer' : 'cursor-default'
        }`}
        style={{
          backgroundColor: background,
          borderColor: border,
          color: text
        }}
        draggable={false}
        onDragOver={handleBlankDragOver}
        onDrop={(event) => handleBlankDrop(event, segment.blank.id)}
        onDragEnter={() => handleBlankDragEnter(segment.blank.id)}
        onDragLeave={() => handleBlankDragLeave(segment.blank.id)}
      >
        {assignedOption ? (
          <>
            <span>{assignedOption.text}</span>
            {isInteractionEnabled && (
              <button
                type="button"
                onClick={() => handleClearBlank(segment.blank.id)}
                className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/60 text-xs text-slate-600 hover:bg-white/80"
              >
                ×
              </button>
            )}
          </>
        ) : (
          <span className="opacity-70">Przeciągnij słowo</span>
        )}
      </span>
    );
  };

  return (
    <div className="relative w-full h-full" onDoubleClick={handleTileDoubleClick}>
      <div className="w-full h-full flex flex-col gap-5 p-6">
        <TaskInstructionPanel
          icon={<Puzzle className="w-4 h-4" />}
          label="Uzupełnij tekst"
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
              className="flex flex-wrap items-center gap-y-2 text-base leading-relaxed"
              style={{
                fontFamily: tile.content.fontFamily,
                fontSize: `${tile.content.fontSize}px`,
                color: textColor,
                whiteSpace: 'pre-wrap'
              }}
            >
              {segments.map((segment, index) =>
                segment.type === 'text' ? (
                  <span key={`text-${index}`} className="whitespace-pre-wrap">
                    {segment.text}
                  </span>
                ) : (
                  renderBlankSegment(segment)
                )
              )}
            </div>
          )}
        </TaskInstructionPanel>

        <div
          className="rounded-2xl border p-4 flex flex-col gap-3"
          style={{
            backgroundColor: bankBackground,
            borderColor: bankBorder,
            color: textColor
          }}
        >
          <div className="text-xs uppercase tracking-[0.32em] font-semibold opacity-80">
            Bank słów
          </div>
          <div className="flex flex-wrap gap-2">
            {availableOptions.length === 0 && (
              <span className="text-sm opacity-70">Wszystkie słowa zostały użyte</span>
            )}
            {availableOptions.map((option) => (
              <span
                key={option.id}
                className={`inline-flex items-center px-3 py-1.5 rounded-full border text-sm font-medium shadow-sm transition-transform ${
                  isInteractionEnabled ? 'cursor-grab active:cursor-grabbing' : 'opacity-70 cursor-not-allowed'
                }`}
                style={{
                  backgroundColor: chipBackground,
                  borderColor: chipBorder,
                  color: textColor
                }}
                draggable={isInteractionEnabled}
                onDragStart={(event) => handleOptionDragStart(event, option.id)}
                onDragEnd={handleOptionDragEnd}
              >
                {option.text}
              </span>
            ))}
          </div>
        </div>

        {isInteractionEnabled && (
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleEvaluate}
              className="px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors duration-200 bg-white/90 hover:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ color: accentColor }}
              disabled={!allBlanksFilled}
            >
              Sprawdź odpowiedzi
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 text-slate-600 hover:text-slate-800"
            >
              <RotateCcw className="w-4 h-4" />
              Wyczyść
            </button>
          </div>
        )}

        {renderEvaluationMessage()}
      </div>
    </div>
  );
};

export default MatchPairsInteractive;
