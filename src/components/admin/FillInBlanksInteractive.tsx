import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ListChecks, RotateCcw, XCircle } from 'lucide-react';
import { FillBlanksTile } from '../../types/lessonEditor';
import { TaskInstructionPanel } from './common/TaskInstructionPanel';

interface FillInBlanksInteractiveProps {
  tile: FillBlanksTile;
  isPreview?: boolean;
  isTestingMode?: boolean;
  onRequestTextEditing?: () => void;
  instructionContent?: React.ReactNode;
}

type DragSource = 'pool' | 'blank';

type EvaluationState = 'idle' | 'correct' | 'incorrect';

interface DragData {
  optionId: string;
  source: DragSource;
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

const surfaceColor = (accent: string, textColor: string, lightenAmount: number, darkenAmount: number): string =>
  textColor === '#0f172a' ? lightenColor(accent, lightenAmount) : darkenColor(accent, darkenAmount);

export const FillInBlanksInteractive: React.FC<FillInBlanksInteractiveProps> = ({
  tile,
  isPreview = false,
  isTestingMode = false,
  onRequestTextEditing,
  instructionContent
}) => {
  const [assignments, setAssignments] = useState<Record<string, string | null>>({});
  const [draggedOption, setDraggedOption] = useState<DragData | null>(null);
  const [dragOverBlankId, setDragOverBlankId] = useState<string | null>(null);
  const [evaluationState, setEvaluationState] = useState<EvaluationState>('idle');
  const [incorrectBlanks, setIncorrectBlanks] = useState<string[]>([]);

  const accentColor = tile.content.backgroundColor || '#1d4ed8';
  const textColor = useMemo(() => getReadableTextColor(accentColor), [accentColor]);
  const mutedTextColor = textColor === '#0f172a' ? '#475569' : '#e2e8f0';

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
  const textCardBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.72, 0.34),
    [accentColor, textColor]
  );
  const textCardBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.58, 0.52),
    [accentColor, textColor]
  );
  const blankEmptyBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.76, 0.3),
    [accentColor, textColor]
  );
  const blankEmptyBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.6, 0.5),
    [accentColor, textColor]
  );
  const blankFilledBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.58, 0.46),
    [accentColor, textColor]
  );
  const blankFilledBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.46, 0.6),
    [accentColor, textColor]
  );
  const blankActiveBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.48, 0.56),
    [accentColor, textColor]
  );
  const blankActiveBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.4, 0.62),
    [accentColor, textColor]
  );
  const poolBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.68, 0.36),
    [accentColor, textColor]
  );
  const poolBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.54, 0.52),
    [accentColor, textColor]
  );
  const optionBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.62, 0.44),
    [accentColor, textColor]
  );
  const optionBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.48, 0.58),
    [accentColor, textColor]
  );
  const optionUsedBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.54, 0.5),
    [accentColor, textColor]
  );

  const optionTextColor = textColor === '#0f172a' ? '#1f2937' : '#f8fafc';

  const isInteractionEnabled = !isPreview && isTestingMode;

  useEffect(() => {
    setAssignments(prevAssignments => {
      const nextAssignments: Record<string, string | null> = {};
      tile.content.segments
        .filter(segment => segment.type === 'blank')
        .forEach(segment => {
          const previousValue = prevAssignments[segment.id];
          const stillExists = tile.content.options.some(option => option.id === previousValue);
          nextAssignments[segment.id] = stillExists ? previousValue : null;
        });
      return nextAssignments;
    });
    setEvaluationState('idle');
    setIncorrectBlanks([]);
  }, [tile.content.segments, tile.content.options]);

  useEffect(() => {
    if (!isInteractionEnabled) {
      setDraggedOption(null);
      setDragOverBlankId(null);
    }
  }, [isInteractionEnabled]);

  const handleTileDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      if (isPreview || isTestingMode) return;
      event.preventDefault();
      event.stopPropagation();
      onRequestTextEditing?.();
    },
    [isPreview, isTestingMode, onRequestTextEditing]
  );

  const assignOptionToBlank = useCallback((blankId: string, optionId: string | null) => {
    setAssignments(prev => {
      const next = { ...prev };

      if (optionId === null) {
        next[blankId] = null;
        return next;
      }

      Object.entries(next).forEach(([otherBlankId, assignedOptionId]) => {
        if (otherBlankId !== blankId && assignedOptionId === optionId) {
          next[otherBlankId] = null;
        }
      });

      next[blankId] = optionId;
      return next;
    });
    setEvaluationState('idle');
    setIncorrectBlanks([]);
  }, []);

  const handleDragStart = useCallback(
    (optionId: string, source: DragSource, blankId?: string) => (e: React.DragEvent) => {
      if (!isInteractionEnabled) return;

      const payload: DragData = { optionId, source, blankId };
      e.dataTransfer.setData('application/json', JSON.stringify(payload));
      e.dataTransfer.effectAllowed = 'move';
      setDraggedOption(payload);
    },
    [isInteractionEnabled]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedOption(null);
    setDragOverBlankId(null);
  }, []);

  const handleBlankDragOver = useCallback(
    (blankId: string) => (e: React.DragEvent) => {
      if (!isInteractionEnabled) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOverBlankId(blankId);
    },
    [isInteractionEnabled]
  );

  const handleBlankDragLeave = useCallback((blankId: string) => {
    setDragOverBlankId(prev => (prev === blankId ? null : prev));
  }, []);

  const resolveDragData = useCallback((event: React.DragEvent): DragData | null => {
    if (draggedOption) return draggedOption;
    try {
      const data = event.dataTransfer.getData('application/json');
      if (!data) return null;
      return JSON.parse(data) as DragData;
    } catch {
      return null;
    }
  }, [draggedOption]);

  const handleBlankDrop = useCallback(
    (blankId: string) => (e: React.DragEvent) => {
      if (!isInteractionEnabled) return;
      e.preventDefault();

      const payload = resolveDragData(e);
      if (!payload) return;

      assignOptionToBlank(blankId, payload.optionId);
      setDraggedOption(null);
      setDragOverBlankId(null);
    },
    [assignOptionToBlank, isInteractionEnabled, resolveDragData]
  );

  const handlePoolDragOver = useCallback((e: React.DragEvent) => {
    if (!isInteractionEnabled || !draggedOption || draggedOption.source !== 'blank') return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, [draggedOption, isInteractionEnabled]);

  const handlePoolDrop = useCallback(
    (e: React.DragEvent) => {
      if (!isInteractionEnabled) return;
      e.preventDefault();

      const payload = resolveDragData(e);
      if (!payload || payload.source !== 'blank' || !payload.blankId) return;

      assignOptionToBlank(payload.blankId, null);
      setDraggedOption(null);
      setDragOverBlankId(null);
    },
    [assignOptionToBlank, isInteractionEnabled, resolveDragData]
  );

  const usedOptionIds = useMemo(() => new Set(Object.values(assignments).filter(Boolean)), [assignments]);

  const blanks = useMemo(
    () => tile.content.segments.filter(segment => segment.type === 'blank'),
    [tile.content.segments]
  );

  const allBlanksFilled = blanks.every(blank => {
    const assigned = assignments[blank.id];
    return assigned && tile.content.options.some(option => option.id === assigned);
  });

  const handleReset = useCallback(() => {
    if (!isInteractionEnabled) return;
    setAssignments(prev => {
      const reset: Record<string, string | null> = {};
      Object.keys(prev).forEach(key => {
        reset[key] = null;
      });
      return reset;
    });
    setEvaluationState('idle');
    setIncorrectBlanks([]);
  }, [isInteractionEnabled]);

  const handleEvaluate = useCallback(() => {
    if (!isInteractionEnabled || !allBlanksFilled) return;

    const incorrect = blanks
      .filter(blank => assignments[blank.id] !== blank.correctOptionId)
      .map(blank => blank.id);

    setIncorrectBlanks(incorrect);
    setEvaluationState(incorrect.length === 0 ? 'correct' : 'incorrect');
  }, [allBlanksFilled, assignments, blanks, isInteractionEnabled]);

  const renderInstructionContent = () => {
    if (instructionContent) {
      return instructionContent;
    }

    return (
      <div
        className="text-sm leading-relaxed"
        style={{
          fontFamily: tile.content.fontFamily,
          fontSize: `${tile.content.fontSize}px`
        }}
        dangerouslySetInnerHTML={{
          __html: tile.content.richPrompt || `<p>${tile.content.prompt}</p>`
        }}
      />
    );
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
        {isCorrect
          ? 'Świetnie! Wszystkie luki zostały uzupełnione poprawnie.'
          : 'Spróbuj ponownie. Niektóre luki zawierają niewłaściwe wyrazy.'}
      </div>
    );
  };

  const renderBlank = (segment: Extract<FillBlanksTile['content']['segments'][number], { type: 'blank' }>) => {
    const assignedOptionId = assignments[segment.id];
    const assignedOption = tile.content.options.find(option => option.id === assignedOptionId);

    const isIncorrect = incorrectBlanks.includes(segment.id) && evaluationState === 'incorrect';
    const isActive = dragOverBlankId === segment.id && isInteractionEnabled;

    const backgroundColor = isActive
      ? blankActiveBackground
      : assignedOption
        ? blankFilledBackground
        : blankEmptyBackground;

    const borderColor = isActive
      ? blankActiveBorder
      : assignedOption
        ? blankFilledBorder
        : blankEmptyBorder;

    const displayText = assignedOption?.text ?? 'Przeciągnij słowo';

    const draggableProps =
      isInteractionEnabled && assignedOption
        ? {
            draggable: true,
            onDragStart: handleDragStart(assignedOption.id, 'blank', segment.id),
            onDragEnd: () => handleDragEnd()
          }
        : {};

    return (
      <div
        key={segment.id}
        className="relative inline-flex items-center"
      >
        <div
          className={`inline-flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-medium transition-colors ${
            isInteractionEnabled && assignedOption ? 'cursor-grab active:cursor-grabbing' : ''
          } ${
            isInteractionEnabled && !assignedOption ? 'cursor-pointer' : 'cursor-default'
          } ${isIncorrect ? 'ring-2 ring-rose-400 ring-offset-2' : ''}`}
          style={{
            backgroundColor,
            borderColor,
            color: textColor,
            minWidth: '112px'
          }}
          onDragOver={handleBlankDragOver(segment.id)}
          onDragLeave={() => handleBlankDragLeave(segment.id)}
          onDrop={handleBlankDrop(segment.id)}
          {...draggableProps}
        >
          <span className={assignedOption ? '' : 'italic opacity-80'}>{displayText}</span>
          {assignedOption && isInteractionEnabled && (
            <button
              type="button"
              className="ml-auto text-xs text-current/80 hover:text-current"
              onClick={() => assignOptionToBlank(segment.id, null)}
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderSegment = (segment: FillBlanksTile['content']['segments'][number]) => {
    if (segment.type === 'text') {
      return (
        <span key={segment.id} className="whitespace-pre-wrap text-base" style={{ color: textColor }}>
          {segment.text}
        </span>
      );
    }

    return renderBlank(segment);
  };

  const renderOption = (option: FillBlanksTile['content']['options'][number]) => {
    const isUsed = usedOptionIds.has(option.id);

    return (
      <div
        key={option.id}
        className={`px-3 py-2 rounded-lg border text-sm font-medium shadow-sm transition-transform duration-150 ${
          isInteractionEnabled ? 'cursor-grab active:cursor-grabbing' : 'cursor-not-allowed opacity-70'
        } ${isUsed ? 'opacity-70' : 'opacity-100'}`}
        style={{
          backgroundColor: isUsed ? optionUsedBackground : optionBackground,
          borderColor: optionBorder,
          color: optionTextColor
        }}
        draggable={isInteractionEnabled}
        onDragStart={handleDragStart(option.id, 'pool')}
        onDragEnd={handleDragEnd}
      >
        {option.text}
      </div>
    );
  };

  return (
    <div className="relative w-full h-full" onDoubleClick={handleTileDoubleClick}>
      <div className="w-full h-full flex flex-col gap-5 p-6">
        <TaskInstructionPanel
          icon={<ListChecks className="w-4 h-4" />}
          label="Zadanie"
          className="border"
          style={{
            backgroundColor: panelBackground,
            borderColor: panelBorder,
            color: textColor
          }}
          iconWrapperStyle={{
            backgroundColor: iconBackground,
            color: textColor
          }}
          labelStyle={{ color: mutedTextColor }}
        >
          {renderInstructionContent()}
        </TaskInstructionPanel>

        <div
          className="rounded-2xl border shadow-sm p-5 space-y-4"
          style={{
            backgroundColor: textCardBackground,
            borderColor: textCardBorder,
            color: textColor,
            fontFamily: tile.content.fontFamily,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div className="flex flex-wrap gap-2 text-base leading-relaxed">
            {tile.content.segments.map(segment => renderSegment(segment))}
          </div>

          <div
            className={`mt-4 rounded-xl border px-4 py-4 shadow-inner transition-colors ${
              isInteractionEnabled ? 'border-dashed' : ''
            }`}
            style={{
              backgroundColor: poolBackground,
              borderColor: poolBorder,
              color: textColor
            }}
            onDragOver={handlePoolDragOver}
            onDrop={handlePoolDrop}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: mutedTextColor }}>
                Baza wyrazów
              </span>
              {!isInteractionEnabled && (
                <span className="text-xs" style={{ color: mutedTextColor }}>
                  Włącz tryb testowania, aby przeciągać wyrazy
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              {tile.content.options.length > 0 ? (
                tile.content.options.map(option => renderOption(option))
              ) : (
                <span className="text-sm italic opacity-80">
                  Dodaj wyrazy w panelu bocznym, aby zbudować zadanie.
                </span>
              )}
            </div>
          </div>

          {isInteractionEnabled && (
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleEvaluate}
                disabled={!allBlanksFilled}
                className={`px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors duration-200 ${
                  allBlanksFilled
                    ? 'bg-white/90 hover:bg-white text-slate-900'
                    : 'bg-white/50 text-slate-500 cursor-not-allowed'
                }`}
              >
                Sprawdź odpowiedź
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 text-slate-100/80 hover:text-white/90"
              >
                <RotateCcw className="w-4 h-4" />
                Wyczyść
              </button>
            </div>
          )}

          {renderEvaluationMessage()}
        </div>
      </div>
    </div>
  );
};

export default FillInBlanksInteractive;
