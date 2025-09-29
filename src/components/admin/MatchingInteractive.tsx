import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Sparkles, PenLine, RefreshCw, CheckCircle, XCircle, BookOpen, Hand } from 'lucide-react';
import { MatchingTile, MatchingWord } from '../../types/lessonEditor';
import { TaskInstructionPanel } from './common/TaskInstructionPanel';

interface MatchingInteractiveProps {
  tile: MatchingTile;
  isPreview?: boolean;
  isTestingMode?: boolean;
  onRequestTextEditing?: () => void;
  instructionContent?: React.ReactNode;
}

type DragSource = 'bank' | 'blank';

interface DragState {
  wordId: string;
  source: DragSource;
  blankId?: string;
}

interface Segment {
  type: 'text' | 'blank';
  value: string;
}

const PLACEHOLDER_REGEX = /\[\[([^\[\]]+)\]\]/g;

const parseSegments = (text: string, blankIds: Set<string>): Segment[] => {
  const segments: Segment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const source = text ?? '';

  while ((match = PLACEHOLDER_REGEX.exec(source)) !== null) {
    const [placeholder, id] = match;
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: source.slice(lastIndex, match.index) });
    }

    if (id && blankIds.has(id)) {
      segments.push({ type: 'blank', value: id });
    } else {
      segments.push({ type: 'text', value: placeholder });
    }

    lastIndex = match.index + placeholder.length;
  }

  if (lastIndex < source.length) {
    segments.push({ type: 'text', value: source.slice(lastIndex) });
  }

  if (segments.length === 0) {
    segments.push({ type: 'text', value: source });
  }

  return segments;
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  if (!hex) return null;

  let normalized = hex.replace('#', '').trim();
  if (normalized.length === 3) {
    normalized = normalized.split('').map(char => `${char}${char}`).join('');
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

export const MatchingInteractive: React.FC<MatchingInteractiveProps> = ({
  tile,
  isPreview = false,
  isTestingMode = false,
  onRequestTextEditing,
  instructionContent
}) => {
  const [availableWords, setAvailableWords] = useState<MatchingWord[]>(() => [...tile.content.wordBank]);
  const [placements, setPlacements] = useState<Record<string, MatchingWord | null>>(() => {
    const initial: Record<string, MatchingWord | null> = {};
    tile.content.blanks.forEach(blank => {
      initial[blank.id] = null;
    });
    return initial;
  });
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [hoveredBlankId, setHoveredBlankId] = useState<string | null>(null);
  const [isBankHighlighted, setIsBankHighlighted] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const blankIds = useMemo(() => new Set(tile.content.blanks.map(blank => blank.id)), [tile.content.blanks]);
  const segments = useMemo(() => parseSegments(tile.content.storyText || '', blankIds), [tile.content.storyText, blankIds]);
  const wordOrder = useMemo(() => tile.content.wordBank.map(word => word.id), [tile.content.wordBank]);
  const canInteract = !isPreview;

  const accentColor = tile.content.backgroundColor || '#0f172a';
  const textColor = useMemo(() => getReadableTextColor(accentColor), [accentColor]);
  const gradientStart = useMemo(() => lightenColor(accentColor, 0.08), [accentColor]);
  const gradientEnd = useMemo(() => darkenColor(accentColor, 0.08), [accentColor]);
  const frameBorderColor = useMemo(() => surfaceColor(accentColor, textColor, 0.52, 0.6), [accentColor, textColor]);
  const panelBackground = useMemo(() => surfaceColor(accentColor, textColor, 0.64, 0.45), [accentColor, textColor]);
  const panelBorder = useMemo(() => surfaceColor(accentColor, textColor, 0.5, 0.58), [accentColor, textColor]);
  const iconBackground = useMemo(() => surfaceColor(accentColor, textColor, 0.56, 0.5), [accentColor, textColor]);
  const mutedLabelColor = textColor === '#0f172a' ? '#475569' : '#dbeafe';
  const subtleCaptionColor = textColor === '#0f172a' ? '#64748b' : '#e2e8f0';
  const bankBackground = useMemo(() => surfaceColor(accentColor, textColor, 0.6, 0.42), [accentColor, textColor]);
  const bankBorder = useMemo(() => surfaceColor(accentColor, textColor, 0.5, 0.56), [accentColor, textColor]);
  const bankHighlightBackground = useMemo(() => surfaceColor(accentColor, textColor, 0.7, 0.34), [accentColor, textColor]);
  const bankHighlightBorder = useMemo(() => surfaceColor(accentColor, textColor, 0.62, 0.46), [accentColor, textColor]);
  const wordBackground = useMemo(() => surfaceColor(accentColor, textColor, 0.56, 0.48), [accentColor, textColor]);
  const wordBorder = useMemo(() => surfaceColor(accentColor, textColor, 0.48, 0.58), [accentColor, textColor]);
  const wordHoverBackground = useMemo(() => surfaceColor(accentColor, textColor, 0.62, 0.42), [accentColor, textColor]);
  const wordHoverBorder = useMemo(() => surfaceColor(accentColor, textColor, 0.54, 0.54), [accentColor, textColor]);
  const blankEmptyBackground = useMemo(() => surfaceColor(accentColor, textColor, 0.6, 0.4), [accentColor, textColor]);
  const blankEmptyBorder = useMemo(() => surfaceColor(accentColor, textColor, 0.5, 0.56), [accentColor, textColor]);
  const blankFilledBackground = useMemo(() => surfaceColor(accentColor, textColor, 0.54, 0.46), [accentColor, textColor]);
  const blankFilledBorder = useMemo(() => surfaceColor(accentColor, textColor, 0.44, 0.6), [accentColor, textColor]);
  const blankHoverBackground = useMemo(() => surfaceColor(accentColor, textColor, 0.68, 0.32), [accentColor, textColor]);
  const blankHoverBorder = useMemo(() => surfaceColor(accentColor, textColor, 0.58, 0.5), [accentColor, textColor]);
  const blankCorrectBackground = useMemo(() => surfaceColor(accentColor, textColor, 0.7, 0.22), [accentColor, textColor]);
  const blankCorrectBorder = useMemo(() => surfaceColor(accentColor, textColor, 0.62, 0.34), [accentColor, textColor]);
  const attemptCaptionColor = useMemo(() => surfaceColor(accentColor, textColor, 0.42, 0.4), [accentColor, textColor]);

  const resetState = useCallback(() => {
    const initial: Record<string, MatchingWord | null> = {};
    tile.content.blanks.forEach(blank => {
      initial[blank.id] = null;
    });

    setPlacements(initial);
    setAvailableWords([...tile.content.wordBank]);
    setDragState(null);
    setHoveredBlankId(null);
    setIsBankHighlighted(false);
    setIsChecked(false);
    setIsCorrect(null);
    setFeedbackMessage('');
    setAttempts(0);
  }, [tile.content.blanks, tile.content.wordBank]);

  useEffect(() => {
    resetState();
  }, [resetState, tile.content.storyText]);

  const sortWords = useCallback((words: MatchingWord[]) => {
    const order = new Map(wordOrder.map((id, index) => [id, index]));
    return [...words].sort((a, b) => {
      const indexA = order.has(a.id) ? order.get(a.id)! : Number.POSITIVE_INFINITY;
      const indexB = order.has(b.id) ? order.get(b.id)! : Number.POSITIVE_INFINITY;
      return indexA - indexB;
    });
  }, [wordOrder]);

  const handleDragStart = (word: MatchingWord, source: DragSource, blankId?: string) => (event: React.DragEvent) => {
    if (!canInteract) return;

    setDragState({ wordId: word.id, source, blankId });
    event.dataTransfer.setData('application/json', JSON.stringify({ type: 'matching-word', wordId: word.id, source, blankId }));
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDragState(null);
    setHoveredBlankId(null);
    setIsBankHighlighted(false);
  };

  const handleBlankDragOver = (blankId: string) => (event: React.DragEvent) => {
    if (!canInteract) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setHoveredBlankId(blankId);
  };

  const handleBlankDragLeave = (blankId: string) => (event: React.DragEvent) => {
    if (!canInteract) return;
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      if (hoveredBlankId === blankId) {
        setHoveredBlankId(null);
      }
    }
  };

  const handleDropOnBlank = (blankId: string) => (event: React.DragEvent) => {
    if (!canInteract) return;
    event.preventDefault();

    const dataString = event.dataTransfer.getData('application/json');
    if (!dataString) return;

    try {
      const data = JSON.parse(dataString) as DragState & { type: string };
      if (data.type !== 'matching-word') return;

      setHoveredBlankId(null);

      if (data.source === 'bank') {
        const word = availableWords.find(item => item.id === data.wordId);
        if (!word) return;

        setPlacements(prev => {
          const next = { ...prev };
          const displaced = next[blankId];
          next[blankId] = word;

          setAvailableWords(prevWords => {
            const filtered = prevWords.filter(item => item.id !== word.id);
            return displaced ? sortWords([...filtered, displaced]) : filtered;
          });

          setIsChecked(false);
          setIsCorrect(null);
          setFeedbackMessage('');
          return next;
        });
      } else if (data.source === 'blank') {
        const fromBlankId = data.blankId;
        if (!fromBlankId || fromBlankId === blankId) return;

        setPlacements(prev => {
          const next = { ...prev };
          const movingWord = next[fromBlankId];
          if (!movingWord) return prev;

          const displaced = next[blankId];
          next[fromBlankId] = null;
          next[blankId] = movingWord;

          if (displaced) {
            setAvailableWords(prevWords => sortWords([...prevWords, displaced]));
          }

          setIsChecked(false);
          setIsCorrect(null);
          setFeedbackMessage('');
          return next;
        });
      }
    } catch (error) {
      console.error('Failed to process drop:', error);
    }
  };

  const handleBankDragOver = (event: React.DragEvent) => {
    if (!canInteract) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setIsBankHighlighted(true);
  };

  const handleBankDragLeave = (event: React.DragEvent) => {
    if (!canInteract) return;
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setIsBankHighlighted(false);
    }
  };

  const handleDropToBank = (event: React.DragEvent) => {
    if (!canInteract) return;
    event.preventDefault();

    const dataString = event.dataTransfer.getData('application/json');
    if (!dataString) return;

    try {
      const data = JSON.parse(dataString) as DragState & { type: string };
      if (data.type !== 'matching-word' || data.source !== 'blank' || !data.blankId) return;

      setPlacements(prev => {
        const next = { ...prev };
        const placedWord = next[data.blankId!];
        if (!placedWord) return prev;

        next[data.blankId!] = null;
        setAvailableWords(prevWords => sortWords([...prevWords, placedWord]));
        setIsChecked(false);
        setIsCorrect(null);
        setFeedbackMessage('');
        return next;
      });
    } catch (error) {
      console.error('Failed to process drop:', error);
    } finally {
      setIsBankHighlighted(false);
    }
  };

  const allBlanksFilled = useMemo(() => tile.content.blanks.every(blank => placements[blank.id]), [tile.content.blanks, placements]);

  const handleCheckAnswers = () => {
    if (!canInteract) return;

    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    if (!allBlanksFilled) {
      setIsChecked(true);
      setIsCorrect(false);
      setFeedbackMessage('Uzupełnij wszystkie luki, aby sprawdzić odpowiedzi.');
      return;
    }

    const isAllCorrect = tile.content.blanks.every(blank => {
      const placed = placements[blank.id];
      if (!placed || !blank.correctWordId) return false;
      return placed.id === blank.correctWordId;
    });

    setIsChecked(true);
    setIsCorrect(isAllCorrect);
    setFeedbackMessage(isAllCorrect ? tile.content.successFeedback : tile.content.failureFeedback);
  };

  const handleReset = () => {
    resetState();
  };

  const getBlankStyle = (blankId: string): React.CSSProperties => {
    const placedWord = placements[blankId];

    if (isChecked && isCorrect !== null) {
      const blankDefinition = tile.content.blanks.find(blank => blank.id === blankId);
      const isBlankCorrect = blankDefinition && placedWord && blankDefinition.correctWordId === placedWord.id;

      if (isBlankCorrect) {
        return {
          backgroundColor: blankCorrectBackground,
          borderColor: blankCorrectBorder,
          color: textColor
        };
      }

      if (placedWord) {
        return {
          backgroundColor: '#fee2e2',
          borderColor: '#f87171',
          color: '#b91c1c'
        };
      }
    }

    if (hoveredBlankId === blankId) {
      return {
        backgroundColor: blankHoverBackground,
        borderColor: blankHoverBorder,
        color: textColor
      };
    }

    if (placedWord) {
      return {
        backgroundColor: blankFilledBackground,
        borderColor: blankFilledBorder,
        color: textColor
      };
    }

    return {
      backgroundColor: blankEmptyBackground,
      borderColor: blankEmptyBorder,
      color: mutedLabelColor
    };
  };

  const getWordClassNames = (wordId: string): string => {
    const isDragging = dragState?.wordId === wordId;
    return `inline-flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-200 select-none ${
      isDragging ? 'opacity-70 scale-95 shadow-sm' : 'hover:shadow-md'
    }`;
  };

  const handleTileDoubleClick = (event: React.MouseEvent) => {
    if (isPreview || isTestingMode) return;

    event.preventDefault();
    event.stopPropagation();
    onRequestTextEditing?.();
  };

  return (
    <div className="relative w-full h-full" onDoubleClick={handleTileDoubleClick}>
      <div
        className={`w-full h-full flex flex-col gap-6 transition-all duration-300 ${
          isPreview
            ? 'p-6'
            : `rounded-3xl ${tile.content.showBorder ? 'border' : ''} shadow-2xl shadow-slate-950/40 p-6 overflow-hidden`
        }`}
        style={{
          backgroundColor: isPreview ? 'transparent' : accentColor,
          backgroundImage: isPreview ? undefined : `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
          color: textColor,
          borderColor: !isPreview && tile.content.showBorder ? frameBorderColor : undefined
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
                __html: tile.content.richInstructions || tile.content.instructions
              }}
            />
          )}
        </TaskInstructionPanel>

        {isTestingMode && (
          <div className="text-[11px] uppercase tracking-[0.32em]" style={{ color: attemptCaptionColor }}>
            Tryb testowania
          </div>
        )}

        {attempts > 0 && (
          <div className="text-xs uppercase tracking-[0.32em]" style={{ color: attemptCaptionColor }}>
            Próba #{attempts}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-6 flex-1 min-h-0">
          <div className="flex flex-col rounded-2xl border bg-white/10 backdrop-blur-sm" style={{ borderColor: panelBorder }}>
            <div className="px-6 py-4 border-b flex items-center gap-2" style={{ borderColor: panelBorder, color: subtleCaptionColor }}>
              <BookOpen className="w-4 h-4" />
              <span className="text-sm font-semibold tracking-wide uppercase">Treść ćwiczenia</span>
            </div>
            <div className="flex-1 px-6 py-5 overflow-auto">
              <div
                className="flex flex-wrap items-center gap-x-3 gap-y-4 text-base leading-relaxed"
                style={{ fontFamily: tile.content.fontFamily, fontSize: `${tile.content.fontSize}px` }}
              >
                {segments.map((segment, index) => {
                  if (segment.type === 'text') {
                    return (
                      <span key={`text-${index}`} className="whitespace-pre-wrap text-left" style={{ color: textColor }}>
                        {segment.value}
                      </span>
                    );
                  }

                  const blankId = segment.value;
                  const blankDefinition = tile.content.blanks.find(blank => blank.id === blankId);
                  const placedWord = placements[blankId];
                  const blankStyle = getBlankStyle(blankId);

                  return (
                    <div
                      key={`blank-${blankId}-${index}`}
                      className={`inline-flex min-w-[140px] items-center justify-between gap-3 rounded-xl border px-4 py-2 transition-all duration-200 ${
                        canInteract ? 'cursor-pointer' : 'cursor-default'
                      }`}
                      style={blankStyle}
                      onDragOver={handleBlankDragOver(blankId)}
                      onDragLeave={handleBlankDragLeave(blankId)}
                      onDrop={handleDropOnBlank(blankId)}
                    >
                      <div className="flex flex-col">
                        <span className="text-[11px] uppercase tracking-[0.24em]" style={{ color: mutedLabelColor }}>
                          {blankDefinition?.label || 'Luka'}
                        </span>
                        <span className="text-sm font-semibold" style={{ color: blankStyle.color }}>
                          {placedWord ? placedWord.text : 'Przeciągnij słowo'}
                        </span>
                      </div>
                      {placedWord && canInteract && (
                        <span
                          draggable
                          onDragStart={handleDragStart(placedWord, 'blank', blankId)}
                          onDragEnd={handleDragEnd}
                          className="text-xs uppercase tracking-[0.28em] text-white/70 px-2 py-1 rounded-md bg-white/10"
                          style={{ color: blankStyle.color }}
                        >
                          Przenieś
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div
            className="flex flex-col rounded-2xl border transition-all duration-200"
            style={{
              backgroundColor: isBankHighlighted ? bankHighlightBackground : bankBackground,
              borderColor: isBankHighlighted ? bankHighlightBorder : bankBorder,
              boxShadow: isBankHighlighted ? '0 22px 44px rgba(15, 23, 42, 0.22)' : undefined
            }}
            onDragOver={handleBankDragOver}
            onDragLeave={handleBankDragLeave}
            onDrop={handleDropToBank}
          >
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: bankBorder, color: subtleCaptionColor }}>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Hand className="w-4 h-4" />
                <span>Pula słów</span>
              </div>
              <span className="text-xs" style={{ color: mutedLabelColor }}>
                {availableWords.length} słów
              </span>
            </div>

            <div className="flex-1 px-5 py-4 overflow-auto">
              {availableWords.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 text-center text-sm py-10" style={{ color: subtleCaptionColor }}>
                  <PenLine className="w-5 h-5" />
                  <span>Wszystkie słowa są już wykorzystane</span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableWords.map(word => (
                    <div
                      key={word.id}
                      draggable={canInteract}
                      onDragStart={handleDragStart(word, 'bank')}
                      onDragEnd={handleDragEnd}
                      className={getWordClassNames(word.id)}
                      style={{
                        backgroundColor: wordBackground,
                        borderColor: wordBorder,
                        color: textColor
                      }}
                      onMouseEnter={(e) => {
                        if (!canInteract) return;
                        (e.currentTarget as HTMLElement).style.backgroundColor = wordHoverBackground;
                        (e.currentTarget as HTMLElement).style.borderColor = wordHoverBorder;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = wordBackground;
                        (e.currentTarget as HTMLElement).style.borderColor = wordBorder;
                      }}
                    >
                      <span className="text-sm font-semibold" style={{ color: textColor }}>
                        {word.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCheckAnswers}
              disabled={!canInteract}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition-colors ${
                canInteract
                  ? 'bg-white/90 text-slate-900 hover:bg-white'
                  : 'bg-white/60 text-slate-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              Sprawdź odpowiedzi
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={!canInteract}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                canInteract
                  ? 'bg-transparent border border-white/40 text-white hover:bg-white/10'
                  : 'bg-transparent border border-white/20 text-white/50 cursor-not-allowed'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              Resetuj
            </button>
          </div>

          {isChecked && (
            <div
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                isCorrect ? 'bg-emerald-500/90 text-white' : 'bg-rose-500/90 text-white'
              }`}
            >
              {isCorrect ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              <span>{isCorrect ? 'Świetnie!' : 'Spróbuj ponownie'}</span>
            </div>
          )}
        </div>

        {feedbackMessage && (
          <div className={`rounded-2xl border px-5 py-4 text-sm leading-relaxed ${isCorrect ? 'bg-emerald-500/10 border-emerald-400/60 text-emerald-900' : 'bg-rose-500/10 border-rose-400/60 text-rose-900'}`}>
            {feedbackMessage}
          </div>
        )}
      </div>
    </div>
  );
};

