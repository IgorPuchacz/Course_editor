import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpenCheck, CheckCircle, RotateCcw, Sparkles, XCircle } from 'lucide-react';
import { FillBlanksTile } from '../../types/lessonEditor';
import { TaskInstructionPanel } from './common/TaskInstructionPanel';

interface FillBlanksInteractiveProps {
  tile: FillBlanksTile;
  isPreview?: boolean;
  isTestingMode?: boolean;
  onRequestTextEditing?: () => void;
  instructionContent?: React.ReactNode;
}

type EvaluationState = 'idle' | 'correct' | 'incorrect';

interface WordEntry {
  id: string;
  text: string;
}

interface Segment {
  type: 'text' | 'blank';
  value: string;
  index?: number;
}

const BLANK_REGEX = /_{3,}/g;

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

const createWordEntries = (tileId: string, wordBank: string[]): WordEntry[] =>
  wordBank.map((word, index) => ({ id: `${tileId}-word-${index}`, text: word }));

export const FillBlanksInteractive: React.FC<FillBlanksInteractiveProps> = ({
  tile,
  isPreview = false,
  isTestingMode = false,
  onRequestTextEditing,
  instructionContent
}) => {
  const accentColor = tile.content.backgroundColor || '#2563eb';
  const textColor = useMemo(() => getReadableTextColor(accentColor), [accentColor]);
  const mutedTextColor = textColor === '#0f172a' ? '#475569' : '#e2e8f0';

  const [placements, setPlacements] = useState<(string | null)[]>([]);
  const [wordEntries, setWordEntries] = useState<WordEntry[]>(() =>
    createWordEntries(tile.id, tile.content.wordBank)
  );
  const [, setDraggedWordId] = useState<string | null>(null);
  const [dragOverBlank, setDragOverBlank] = useState<number | null>(null);
  const [evaluationState, setEvaluationState] = useState<EvaluationState>('idle');

  const isInteractionEnabled = !isPreview && isTestingMode;

  useEffect(() => {
    setWordEntries(createWordEntries(tile.id, tile.content.wordBank));
  }, [tile.id, tile.content.wordBank]);

  useEffect(() => {
    setPlacements(Array.from({ length: tile.content.blanks.length }, () => null));
    setEvaluationState('idle');
  }, [tile.content.blanks.length, tile.content.text, tile.content.wordBank]);

  const wordMap = useMemo(() => {
    return wordEntries.reduce<Record<string, string>>((acc, entry) => {
      acc[entry.id] = entry.text;
      return acc;
    }, {});
  }, [wordEntries]);

  const segments = useMemo(() => {
    const text = tile.content.text || '';
    const result: Segment[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let blankIndex = 0;

    while ((match = BLANK_REGEX.exec(text)) !== null) {
      if (match.index > lastIndex) {
        result.push({ type: 'text', value: text.slice(lastIndex, match.index) });
      }

      result.push({ type: 'blank', value: match[0], index: blankIndex });
      blankIndex += 1;
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      result.push({ type: 'text', value: text.slice(lastIndex) });
    }

    return result;
  }, [tile.content.text]);

  const panelBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.64, 0.42),
    [accentColor, textColor]
  );
  const panelBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.54, 0.5),
    [accentColor, textColor]
  );
  const iconBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.58, 0.46),
    [accentColor, textColor]
  );
  const wordSurface = useMemo(
    () => surfaceColor(accentColor, textColor, 0.7, 0.38),
    [accentColor, textColor]
  );
  const wordBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.6, 0.46),
    [accentColor, textColor]
  );
  const blankSurface = useMemo(
    () => surfaceColor(accentColor, textColor, 0.74, 0.36),
    [accentColor, textColor]
  );
  const blankBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.62, 0.48),
    [accentColor, textColor]
  );
  const blankHover = useMemo(
    () => surfaceColor(accentColor, textColor, 0.54, 0.52),
    [accentColor, textColor]
  );
  const feedbackBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.48, 0.54),
    [accentColor, textColor]
  );

  const assignWordToBlank = useCallback((blankIndex: number, wordId: string | null) => {
    setPlacements(prev => {
      const next = [...prev];

      if (wordId) {
        const existingIndex = next.findIndex(value => value === wordId);
        if (existingIndex !== -1) {
          next[existingIndex] = null;
        }
        next[blankIndex] = wordId;
      } else {
        next[blankIndex] = null;
      }

      return next;
    });
    setEvaluationState('idle');
  }, []);

  const handleDragStart = (event: React.DragEvent<HTMLButtonElement>, wordId: string) => {
    if (!isInteractionEnabled) return;
    setDraggedWordId(wordId);
    event.dataTransfer.setData('text/plain', wordId);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedWordId(null);
    setDragOverBlank(null);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>, index: number) => {
    if (!isInteractionEnabled) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverBlank(index);
  };

  const handleDragLeave = (index: number) => {
    if (dragOverBlank === index) {
      setDragOverBlank(null);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>, index: number) => {
    if (!isInteractionEnabled) return;
    event.preventDefault();
    const wordId = event.dataTransfer.getData('text/plain');
    if (!wordId) return;

    assignWordToBlank(index, wordId);
    setDraggedWordId(null);
    setDragOverBlank(null);
  };

  const handleClearBlank = (index: number) => {
    assignWordToBlank(index, null);
  };

  const handleReset = () => {
    if (!isInteractionEnabled) return;
    setPlacements(Array.from({ length: tile.content.blanks.length }, () => null));
    setEvaluationState('idle');
  };

  const handleEvaluate = () => {
    if (!isInteractionEnabled) return;

    const allFilled = placements.every(value => value !== null);
    if (!allFilled) {
      setEvaluationState('incorrect');
      return;
    }

    const isCorrect = placements.every((wordId, index) => {
      if (!wordId) return false;
      const filled = (wordMap[wordId] || '').trim();
      const expected = (tile.content.blanks[index]?.correctAnswer || '').trim();
      return filled.localeCompare(expected, undefined, { sensitivity: 'base' }) === 0;
    });

    setEvaluationState(isCorrect ? 'correct' : 'incorrect');
  };

  const handleInstructionDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      if (isPreview || isTestingMode) return;
      if (!onRequestTextEditing) return;

      event.preventDefault();
      event.stopPropagation();
      onRequestTextEditing();
    },
    [isPreview, isTestingMode, onRequestTextEditing]
  );

  const renderInstructionContent = () => {
    if (instructionContent) {
      return instructionContent;
    }

    return (
      <div
        className="text-sm leading-relaxed cursor-text"
        style={{ fontFamily: tile.content.fontFamily, fontSize: `${tile.content.fontSize}px` }}
        onDoubleClick={handleInstructionDoubleClick}
        dangerouslySetInnerHTML={{
          __html:
            tile.content.richInstruction ||
            `<p style="margin: 0;">${tile.content.instruction || 'Dodaj instrukcję zadania'}</p>`
        }}
      />
    );
  };

  const wordInUse = (wordId: string) => placements.includes(wordId);

  return (
    <div className="relative w-full h-full flex flex-col"
      style={{
        backgroundColor: tile.content.showBorder ? 'transparent' : accentColor,
        borderRadius: tile.content.showBorder ? undefined : '1rem'
      }}
    >
      <TaskInstructionPanel
        icon={<BookOpenCheck className="w-5 h-5" style={{ color: textColor }} />}
        label="Instrukcja zadania"
        className={`border ${tile.content.showBorder ? 'border-transparent' : ''}`}
        style={{
          background: tile.content.showBorder ? 'transparent' : panelBackground,
          borderColor: tile.content.showBorder ? 'transparent' : panelBorder,
          color: textColor
        }}
        headerClassName="px-5 pt-5 pb-3 flex items-center gap-3"
        iconWrapperClassName="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
        iconWrapperStyle={{ background: iconBackground }}
        labelClassName="text-sm uppercase tracking-[0.24em] font-semibold"
        labelStyle={{ color: textColor }}
        bodyClassName="px-5 pb-5"
      >
        {renderInstructionContent()}
      </TaskInstructionPanel>

      <div className="flex-1 overflow-hidden px-5 pb-5">
        <div
          className={`w-full h-full rounded-2xl ${
            tile.content.showBorder ? 'border' : ''
          } flex flex-col gap-6 p-5`}
          style={{
            background: tile.content.showBorder ? blankSurface : surfaceColor(accentColor, textColor, 0.8, 0.34),
            borderColor: tile.content.showBorder ? blankBorder : 'transparent',
            color: textColor
          }}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold tracking-wide" style={{ color: textColor }}>
                Tekst z lukami
              </h4>
              {!isInteractionEnabled && (
                <div className="flex items-center gap-2 text-xs" style={{ color: mutedTextColor }}>
                  <Sparkles className="w-4 h-4" />
                  <span>Włącz testowanie, aby przetestować zadanie</span>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-dashed" style={{ borderColor: blankBorder, background: blankSurface }}>
              <p className="p-4 text-base leading-relaxed text-left">
                {segments.map((segment, index) => {
                  if (segment.type === 'text') {
                    return (
                      <span key={`text-${index}`} className="whitespace-pre-wrap">
                        {segment.value}
                      </span>
                    );
                  }

                  const blankIndex = segment.index ?? 0;
                  const assignedWordId = placements[blankIndex];
                  const assignedWord = assignedWordId ? wordMap[assignedWordId] : null;
                  const isHovered = dragOverBlank === blankIndex;

                  return (
                    <span key={`blank-${blankIndex}`} className="inline-flex mx-1 my-0.5">
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                          isInteractionEnabled
                            ? 'cursor-pointer'
                            : 'cursor-default'
                        } ${
                          isHovered ? 'shadow-md scale-105' : 'shadow-sm'
                        }`}
                        style={{
                          background: assignedWord ? blankHover : blankSurface,
                          borderColor: isHovered ? blankHover : blankBorder,
                          color: textColor
                        }}
                        onDragOver={(event) => handleDragOver(event, blankIndex)}
                        onDragLeave={() => handleDragLeave(blankIndex)}
                        onDrop={(event) => handleDrop(event, blankIndex)}
                        onDoubleClick={() => (isInteractionEnabled ? handleClearBlank(blankIndex) : undefined)}
                      >
                        {assignedWord ? (
                          <>
                            <span className="font-medium">{assignedWord}</span>
                            {isInteractionEnabled && (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleClearBlank(blankIndex);
                                }}
                                className="text-xs rounded-full px-2 py-0.5"
                                style={{
                                  background: surfaceColor(accentColor, textColor, 0.48, 0.54),
                                  color: textColor
                                }}
                              >
                                ×
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="text-sm" style={{ color: mutedTextColor }}>
                            {isInteractionEnabled ? 'Przeciągnij słowo' : 'Luka'}
                          </span>
                        )}
                      </div>
                    </span>
                  );
                })}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold tracking-wide" style={{ color: textColor }}>
                Bank słów ({wordEntries.length})
              </h4>
              {isInteractionEnabled && (
                <div className="flex items-center gap-2 text-xs" style={{ color: mutedTextColor }}>
                  <span>Przeciągnij słowo do odpowiedniej luki</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {wordEntries.map(entry => {
                const inUse = wordInUse(entry.id);
                return (
                  <button
                    key={entry.id}
                    type="button"
                    draggable={isInteractionEnabled && !inUse}
                    onDragStart={(event) => handleDragStart(event, entry.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => {
                      if (!isInteractionEnabled || inUse) return;
                      const firstEmpty = placements.findIndex(value => value === null);
                      if (firstEmpty !== -1) {
                        assignWordToBlank(firstEmpty, entry.id);
                      }
                    }}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                      inUse ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
                    }`}
                    style={{
                      background: wordSurface,
                      borderColor: wordBorder,
                      color: textColor
                    }}
                  >
                    {entry.text}
                  </button>
                );
              })}
            </div>
          </div>

          {isInteractionEnabled && (
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-sm" style={{ color: mutedTextColor }}>
                <span>Dwuklik na słowie w luce, aby je usunąć</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    background: surfaceColor(accentColor, textColor, 0.64, 0.38),
                    color: textColor
                  }}
                >
                  <RotateCcw className="w-4 h-4" />
                  Resetuj
                </button>
                <button
                  type="button"
                  onClick={handleEvaluate}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors"
                  style={{
                    background: surfaceColor(accentColor, textColor, 0.42, 0.54),
                    color: textColor
                  }}
                >
                  Sprawdź
                </button>
              </div>
            </div>
          )}

          {evaluationState !== 'idle' && (
            <div
              className={`rounded-xl border px-4 py-3 flex items-center gap-3 shadow-sm ${
                evaluationState === 'correct' ? 'backdrop-blur-sm' : ''
              }`}
              style={{
                background: feedbackBackground,
                borderColor: surfaceColor(accentColor, textColor, 0.46, 0.52),
                color: textColor
              }}
            >
              {evaluationState === 'correct' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              <div className="text-sm font-medium">
                {evaluationState === 'correct'
                  ? 'Świetnie! Wszystkie luki zostały uzupełnione poprawnie.'
                  : 'Sprawdź odpowiedzi i spróbuj ponownie.'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
