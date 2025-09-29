import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpenCheck, CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { FillBlanksSlot, FillBlanksTile, FillBlanksWord } from '../../types/lessonEditor';
import { TaskInstructionPanel } from './common/TaskInstructionPanel';

interface FillBlanksInteractiveProps {
  tile: FillBlanksTile;
  isPreview?: boolean;
  isTestingMode?: boolean;
  onRequestTextEditing?: () => void;
  instructionContent?: React.ReactNode;
}

type DragSource =
  | { type: 'bank'; wordId: string }
  | { type: 'slot'; wordId: string; slotId: string };

type EvaluationState = 'idle' | 'correct' | 'incorrect';

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

interface PlacementState {
  [slotId: string]: string | null;
}

export const FillBlanksInteractive: React.FC<FillBlanksInteractiveProps> = ({
  tile,
  isPreview = false,
  isTestingMode = false,
  onRequestTextEditing,
  instructionContent
}) => {
  const [placements, setPlacements] = useState<PlacementState>({});
  const [evaluationState, setEvaluationState] = useState<EvaluationState>('idle');
  const [dragOverSlotId, setDragOverSlotId] = useState<string | null>(null);

  const accentColor = tile.content.backgroundColor || '#2563eb';
  const textColor = useMemo(() => getReadableTextColor(accentColor), [accentColor]);
  const mutedLabelColor = textColor === '#0f172a' ? '#475569' : '#dbeafe';
  const subtleCaptionColor = textColor === '#0f172a' ? '#64748b' : '#e2e8f0';

  const panelBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.66, 0.4),
    [accentColor, textColor]
  );
  const panelBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.52, 0.58),
    [accentColor, textColor]
  );
  const iconBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.56, 0.52),
    [accentColor, textColor]
  );
  const wordBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.7, 0.38),
    [accentColor, textColor]
  );
  const wordBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.56, 0.48),
    [accentColor, textColor]
  );
  const slotBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.64, 0.42),
    [accentColor, textColor]
  );
  const slotBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.52, 0.54),
    [accentColor, textColor]
  );
  const slotHoverBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.74, 0.34),
    [accentColor, textColor]
  );

  const availableWords = useMemo(() => {
    const usedWordIds = new Set(Object.values(placements).filter((value): value is string => Boolean(value)));
    return tile.content.wordBank.filter(word => !usedWordIds.has(word.id));
  }, [placements, tile.content.wordBank]);

  useEffect(() => {
    const initialPlacements = tile.content.slots.reduce<PlacementState>((acc, slot) => {
      acc[slot.id] = null;
      return acc;
    }, {} as PlacementState);
    setPlacements(initialPlacements);
    setEvaluationState('idle');
    setDragOverSlotId(null);
  }, [tile.content.slots, tile.id]);

  const getWordById = useCallback(
    (wordId: string | null) => tile.content.wordBank.find(word => word.id === wordId) ?? null,
    [tile.content.wordBank]
  );

  const parseTemplate = useMemo(() => {
    const parts = tile.content.textTemplate.split('___');
    const segments: Array<{ type: 'text'; value: string } | { type: 'blank'; slot: FillBlanksSlot | null }> = [];

    parts.forEach((part, index) => {
      if (part) {
        segments.push({ type: 'text', value: part });
      }
      if (index < tile.content.slots.length) {
        segments.push({ type: 'blank', slot: tile.content.slots[index] ?? null });
      }
    });

    return segments;
  }, [tile.content.slots, tile.content.textTemplate]);

  const isInteractionEnabled = isTestingMode && !isPreview;
  const allSlotsFilled = useMemo(
    () => tile.content.slots.every(slot => placements[slot.id]),
    [placements, tile.content.slots]
  );

  const handleReset = () => {
    setPlacements(prev => {
      const resetState: PlacementState = {};
      Object.keys(prev).forEach(slotId => {
        resetState[slotId] = null;
      });
      return resetState;
    });
    setEvaluationState('idle');
    setDragOverSlotId(null);
  };

  const handleEvaluate = () => {
    if (!allSlotsFilled) return;

    const isCorrect = tile.content.slots.every(slot => {
      const placedWordId = placements[slot.id];
      return placedWordId !== null && placedWordId === slot.correctWordId;
    });

    setEvaluationState(isCorrect ? 'correct' : 'incorrect');
  };

  const handleDragStart = (event: React.DragEvent, payload: DragSource) => {
    event.dataTransfer.setData('application/json', JSON.stringify(payload));
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDropOnBank = (event: React.DragEvent) => {
    event.preventDefault();
    try {
      const payload = JSON.parse(event.dataTransfer.getData('application/json')) as DragSource;
      if (payload.type === 'slot') {
        setPlacements(prev => ({
          ...prev,
          [payload.slotId]: null
        }));
        setEvaluationState('idle');
        setDragOverSlotId(null);
      }
    } catch (error) {
      console.error('Failed to parse drag payload', error);
    }
  };

  const handleDropOnSlot = (event: React.DragEvent, slot: FillBlanksSlot | null) => {
    event.preventDefault();
    if (!slot || !isInteractionEnabled) return;

    try {
      const payload = JSON.parse(event.dataTransfer.getData('application/json')) as DragSource;
      if (payload.type === 'bank') {
        setPlacements(prev => ({
          ...prev,
          [slot.id]: payload.wordId
        }));
        setEvaluationState('idle');
      }
      if (payload.type === 'slot') {
        setPlacements(prev => {
          const updated: PlacementState = { ...prev };
          updated[payload.slotId] = prev[slot.id];
          updated[slot.id] = payload.wordId;
          return updated;
        });
        setEvaluationState('idle');
      }
      setDragOverSlotId(null);
    } catch (error) {
      console.error('Failed to parse drag payload', error);
    }
  };

  const handleDragOverSlot = (event: React.DragEvent, slotId: string) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverSlotId(slotId);
  };

  const handleDragLeaveSlot = (slotId: string) => {
    setDragOverSlotId(prev => (prev === slotId ? null : prev));
  };

  const handleDragOverBank = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleTileDoubleClick = () => {
    if (onRequestTextEditing) {
      onRequestTextEditing();
    }
  };

  const renderSlot = (slot: FillBlanksSlot | null, index: number) => {
    if (!slot) {
      return (
        <span key={`placeholder-${index}`} className="inline-flex min-w-[56px] h-9 rounded-xl bg-slate-200/60"></span>
      );
    }

    const assignedWordId = placements[slot.id];
    const assignedWord = assignedWordId ? getWordById(assignedWordId) : null;
    const isEvaluated = evaluationState !== 'idle';
    const isCorrectPlacement = assignedWordId && assignedWordId === slot.correctWordId;
    const slotStateStyles = isEvaluated
      ? isCorrectPlacement
        ? 'ring-2 ring-emerald-400'
        : 'ring-2 ring-rose-400'
      : '';

    return (
      <div
        key={slot.id}
        className={`inline-flex items-center justify-center px-3 h-10 rounded-xl border text-sm font-semibold transition-all duration-150 ${slotStateStyles}`}
        style={{
          backgroundColor:
            assignedWord
              ? wordBackground
              : dragOverSlotId === slot.id && isInteractionEnabled
                ? slotHoverBackground
                : slotBackground,
          borderColor: slotBorder,
          color: textColor,
          minWidth: '120px'
        }}
        onDragOver={(event) => handleDragOverSlot(event, slot.id)}
        onDragLeave={() => handleDragLeaveSlot(slot.id)}
        onDrop={(event) => handleDropOnSlot(event, slot)}
      >
        {assignedWord ? (
          <div
            className="flex items-center gap-2 cursor-move"
            draggable={isInteractionEnabled}
            onDragStart={(event) => handleDragStart(event, { type: 'slot', wordId: assignedWord.id, slotId: slot.id })}
          >
            <span>{assignedWord.text}</span>
          </div>
        ) : (
          <span className="opacity-70" style={{ color: subtleCaptionColor }}>
            Przeciągnij słowo
          </span>
        )}
      </div>
    );
  };

  const renderWordBankItem = (word: FillBlanksWord) => (
    <div
      key={word.id}
      className="px-3 py-2 rounded-xl border text-sm font-semibold shadow-sm cursor-move"
      style={{
        backgroundColor: wordBackground,
        borderColor: wordBorder,
        color: textColor
      }}
      draggable={isInteractionEnabled}
      onDragStart={(event) => handleDragStart(event, { type: 'bank', wordId: word.id })}
    >
      {word.text}
    </div>
  );

  const renderEvaluationMessage = () => {
    if (evaluationState === 'idle') return null;

    const isCorrect = evaluationState === 'correct';
    return (
      <div
        className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
          isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'
        }`}
      >
        {isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
        {isCorrect
          ? 'Świetnie! Wszystkie odpowiedzi są poprawne.'
          : 'Spróbuj ponownie. Niektóre odpowiedzi są niepoprawne.'}
      </div>
    );
  };

  return (
    <div className="relative w-full h-full" onDoubleClick={handleTileDoubleClick}>
      <div className="w-full h-full flex flex-col gap-5 p-6">
        <TaskInstructionPanel
          icon={<BookOpenCheck className="w-4 h-4" />}
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
        >
          {instructionContent ?? (
            <div
              className="text-sm leading-relaxed"
              style={{
                fontFamily: tile.content.fontFamily,
                fontSize: `${tile.content.fontSize}px`,
                color: textColor
              }}
              dangerouslySetInnerHTML={{ __html: tile.content.richInstruction || tile.content.instruction }}
            />
          )}
        </TaskInstructionPanel>

        <div
          className="flex-1 rounded-2xl border p-5 space-y-6"
          style={{
            backgroundColor: surfaceColor(accentColor, textColor, 0.76, 0.32),
            borderColor: surfaceColor(accentColor, textColor, 0.58, 0.5),
            color: textColor
          }}
        >
          <div className="flex flex-wrap items-center gap-3 text-base leading-relaxed" style={{ color: textColor }}>
            {parseTemplate.map((segment, index) =>
              segment.type === 'text' ? (
                <span key={`text-${index}`} className="whitespace-pre-wrap">
                  {segment.value}
                </span>
              ) : (
                renderSlot(segment.slot, index)
              )
            )}
          </div>

          <div
            className="rounded-2xl border p-4 space-y-4 transition-colors"
            style={{
              backgroundColor: surfaceColor(accentColor, textColor, 0.82, 0.26),
              borderColor: surfaceColor(accentColor, textColor, 0.64, 0.42),
              color: textColor
            }}
            onDragOver={handleDragOverBank}
            onDrop={handleDropOnBank}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold tracking-wide uppercase" style={{ color: mutedLabelColor }}>
                Bank słów
              </span>
              {!isInteractionEnabled && (
                <span className="text-xs" style={{ color: subtleCaptionColor }}>
                  Podgląd bez możliwości interakcji
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              {availableWords.length > 0 ? (
                availableWords.map(renderWordBankItem)
              ) : (
                <span className="text-sm" style={{ color: subtleCaptionColor }}>
                  Wszystkie słowa zostały wykorzystane.
                </span>
              )}
            </div>
          </div>

          {isInteractionEnabled && (
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleEvaluate}
                className="px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors duration-200 bg-white/90 hover:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ color: accentColor }}
                disabled={!allSlotsFilled}
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
    </div>
  );
};

export default FillBlanksInteractive;
