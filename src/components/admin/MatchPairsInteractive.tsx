import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { CheckCircle, XCircle, RefreshCw, Sparkles, Puzzle, RotateCcw } from 'lucide-react';
import { MatchPairsTile } from '../../types/lessonEditor';
import { TaskInstructionPanel } from './common/TaskInstructionPanel';

interface MatchPairsInteractiveProps {
  tile: MatchPairsTile;
  isPreview?: boolean;
  isTestingMode?: boolean;
  instructionContent?: React.ReactNode;
  onRequestTextEditing?: () => void;
}

type Segment =
  | { type: 'text'; value: string }
  | { type: 'blank'; id: string };

type EvaluationState = 'idle' | 'success' | 'error';

interface DragPayload {
  optionId: string;
  sourceBlankId?: string;
}

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

const parseTemplate = (template: string): Segment[] => {
  const regex = /\{\{(.*?)\}\}/g;
  const segments: Segment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(template)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: template.slice(lastIndex, match.index) });
    }

    const placeholderId = match[1]?.trim();
    if (placeholderId) {
      segments.push({ type: 'blank', id: placeholderId });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < template.length) {
    segments.push({ type: 'text', value: template.slice(lastIndex) });
  }

  if (segments.length === 0) {
    return [{ type: 'text', value: template }];
  }

  return segments;
};

const mapTextToNodes = (text: string): React.ReactNode =>
  text.split(/(\n)/g).map((part, index) =>
    part === '\n' ? <br key={`br-${index}`} /> : <span key={`segment-${index}`}>{part}</span>
  );

export const MatchPairsInteractive: React.FC<MatchPairsInteractiveProps> = ({
  tile,
  isPreview = false,
  isTestingMode = false,
  instructionContent,
  onRequestTextEditing
}) => {
  const [placements, setPlacements] = useState<Record<string, string | null>>({});
  const [evaluation, setEvaluation] = useState<EvaluationState>('idle');
  const [attempts, setAttempts] = useState(0);
  const [draggedOptionId, setDraggedOptionId] = useState<string | null>(null);
  const [activeBlankId, setActiveBlankId] = useState<string | null>(null);

  const accentColor = tile.content.backgroundColor || '#0f172a';
  const textColor = useMemo(() => getReadableTextColor(accentColor), [accentColor]);
  const gradientStart = useMemo(() => lightenColor(accentColor, 0.08), [accentColor]);
  const gradientEnd = useMemo(() => darkenColor(accentColor, 0.08), [accentColor]);
  const panelBackground = useMemo(() => surfaceColor(accentColor, textColor, 0.62, 0.45), [accentColor, textColor]);
  const panelBorder = useMemo(() => surfaceColor(accentColor, textColor, 0.5, 0.55), [accentColor, textColor]);
  const iconBackground = useMemo(() => surfaceColor(accentColor, textColor, 0.54, 0.48), [accentColor, textColor]);
  const mutedLabelColor = textColor === '#0f172a' ? '#475569' : '#d1d5db';
  const frameBorderColor = useMemo(() => surfaceColor(accentColor, textColor, 0.52, 0.58), [accentColor, textColor]);
  const blankBackground = useMemo(() => surfaceColor(accentColor, textColor, 0.65, 0.38), [accentColor, textColor]);
  const blankBorder = useMemo(() => surfaceColor(accentColor, textColor, 0.54, 0.52), [accentColor, textColor]);
  const blankHoverBackground = useMemo(() => surfaceColor(accentColor, textColor, 0.75, 0.32), [accentColor, textColor]);
  const blankFilledBackground = useMemo(() => surfaceColor(accentColor, textColor, 0.52, 0.46), [accentColor, textColor]);
  const optionBackground = useMemo(() => surfaceColor(accentColor, textColor, 0.52, 0.46), [accentColor, textColor]);
  const optionBorder = useMemo(() => surfaceColor(accentColor, textColor, 0.44, 0.56), [accentColor, textColor]);
  const testingCaptionColor = useMemo(() => surfaceColor(accentColor, textColor, 0.42, 0.4), [accentColor, textColor]);
  const evaluationSuccessBackground = '#dcfce7';
  const evaluationErrorBackground = '#fee2e2';

  const segments = useMemo(() => parseTemplate(tile.content.textTemplate), [tile.content.textTemplate]);

  const resetPlacements = useCallback(() => {
    const initialPlacements = tile.content.blanks.reduce<Record<string, string | null>>((acc, blank) => {
      acc[blank.id] = null;
      return acc;
    }, {});

    setPlacements(initialPlacements);
    setEvaluation('idle');
    setAttempts(0);
  }, [tile.content.blanks]);

  useEffect(() => {
    resetPlacements();
  }, [resetPlacements]);

  const availableOptions = useMemo(() => {
    const usedIds = new Set(
      Object.values(placements).filter((value): value is string => value !== null)
    );
    return tile.content.options.filter(option => !usedIds.has(option.id));
  }, [placements, tile.content.options]);

  const isInteractionEnabled = !isPreview;

  const handleDragStartFromBank = (event: React.DragEvent<HTMLButtonElement>, optionId: string) => {
    if (!isInteractionEnabled) return;

    const payload: DragPayload = { optionId };
    event.dataTransfer.setData('application/json', JSON.stringify(payload));
    event.dataTransfer.effectAllowed = 'move';
    setDraggedOptionId(optionId);
  };

  const handleDragStartFromBlank = (event: React.DragEvent<HTMLDivElement>, blankId: string, optionId: string) => {
    if (!isInteractionEnabled) return;

    const payload: DragPayload = { optionId, sourceBlankId: blankId };
    event.dataTransfer.setData('application/json', JSON.stringify(payload));
    event.dataTransfer.effectAllowed = 'move';
    setDraggedOptionId(optionId);
  };

  const extractPayload = (event: React.DragEvent): DragPayload | null => {
    try {
      const data = event.dataTransfer.getData('application/json');
      if (!data) return null;
      const parsed = JSON.parse(data) as DragPayload;
      if (!parsed.optionId) return null;
      return parsed;
    } catch (error) {
      console.warn('Invalid drag payload', error);
      return null;
    }
  };

  const handleDropToBlank = (event: React.DragEvent<HTMLDivElement>, blankId: string) => {
    event.preventDefault();
    if (!isInteractionEnabled) return;

    const payload = extractPayload(event);
    if (!payload) return;

    setPlacements(prev => {
      const updated = { ...prev };
      Object.entries(updated).forEach(([id, placedOption]) => {
        if (placedOption === payload.optionId) {
          updated[id] = null;
        }
      });
      updated[blankId] = payload.optionId;
      return updated;
    });

    setEvaluation('idle');
    setActiveBlankId(null);
  };

  const handleDropToBank = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!isInteractionEnabled) return;

    const payload = extractPayload(event);
    if (!payload) return;

    if (!payload.sourceBlankId) return;

    setPlacements(prev => ({
      ...prev,
      [payload.sourceBlankId!]: null
    }));

    setEvaluation('idle');
  };

  const handleDragOverBlank = (event: React.DragEvent<HTMLDivElement>, blankId: string) => {
    if (!isInteractionEnabled) return;
    event.preventDefault();
    setActiveBlankId(blankId);
  };

  const handleDragLeaveBlank = () => {
    setActiveBlankId(null);
  };

  const handleDragOverBank = (event: React.DragEvent<HTMLDivElement>) => {
    if (!isInteractionEnabled) return;
    event.preventDefault();
  };

  const handleDragEnd = () => {
    setDraggedOptionId(null);
    setActiveBlankId(null);
  };

  const handleCheck = () => {
    setAttempts(prev => prev + 1);
    const isComplete = tile.content.blanks.every(blank => placements[blank.id]);
    if (!isComplete) {
      setEvaluation('error');
      return;
    }

    const isCorrect = tile.content.blanks.every(blank => placements[blank.id] === blank.correctOptionId);
    setEvaluation(isCorrect ? 'success' : 'error');
  };

  const handleReset = () => {
    resetPlacements();
  };

  const renderEvaluationMessage = () => {
    if (evaluation === 'idle') return null;

    const isSuccess = evaluation === 'success';
    const backgroundColor = isSuccess ? evaluationSuccessBackground : evaluationErrorBackground;
    const textColorClass = isSuccess ? 'text-emerald-700' : 'text-rose-700';
    const Icon = isSuccess ? CheckCircle : XCircle;
    const message = isSuccess ? tile.content.successFeedback : tile.content.failureFeedback;

    return (
      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${textColorClass}`} style={{ backgroundColor }}>
        <Icon className="w-5 h-5" />
        <span>{message}</span>
      </div>
    );
  };

  const handleTileDoubleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isPreview || isTestingMode) return;
    event.preventDefault();
    event.stopPropagation();
    onRequestTextEditing?.();
  };

  const renderBlank = (blankId: string) => {
    const placedOptionId = placements[blankId];
    const option = tile.content.options.find(opt => opt.id === placedOptionId);
    const isDropActive = activeBlankId === blankId;
    const isCorrect = evaluation !== 'idle' && placedOptionId && tile.content.blanks.find(blank => blank.id === blankId)?.correctOptionId === placedOptionId;

    const baseStyle: React.CSSProperties = {
      backgroundColor: option ? blankFilledBackground : isDropActive ? blankHoverBackground : blankBackground,
      borderColor: option ? optionBorder : isDropActive ? surfaceColor(accentColor, textColor, 0.68, 0.42) : blankBorder,
      color: textColor
    };

    const evaluationBorder = evaluation === 'idle' || !option
      ? undefined
      : isCorrect
        ? '#15803d'
        : '#b91c1c';

    return (
      <span
        key={blankId}
        onDragOver={(event) => handleDragOverBlank(event, blankId)}
        onDragLeave={handleDragLeaveBlank}
        onDrop={(event) => handleDropToBlank(event, blankId)}
        className={`inline-flex min-w-[120px] min-h-[44px] items-center justify-center rounded-xl border-2 px-4 py-2 text-sm font-medium transition-all duration-200 ${
          option ? 'shadow-sm' : 'opacity-95'
        } ${evaluationBorder ? 'border-2' : ''}`}
        style={{
          ...baseStyle,
          borderColor: evaluationBorder ?? baseStyle.borderColor,
          cursor: isInteractionEnabled ? 'pointer' : 'default'
        }}
      >
        {option ? (
          <div
            className="flex items-center gap-2"
            draggable={isInteractionEnabled}
            onDragStart={(event) => option && handleDragStartFromBlank(event as React.DragEvent<HTMLDivElement>, blankId, option.id)}
            onDragEnd={handleDragEnd}
          >
            <span>{option.text}</span>
          </div>
        ) : (
          <span className="text-xs" style={{ color: textColor === '#0f172a' ? '#475569' : '#e2e8f0' }}>
            Przeciągnij odpowiedź
          </span>
        )}
      </span>
    );
  };

  return (
    <div className="relative w-full h-full" onDoubleClick={handleTileDoubleClick}>
      <div
        className={`w-full h-full flex flex-col gap-6 transition-all duration-300 p-6 ${
          tile.content.showBorder ? 'rounded-3xl border shadow-lg shadow-slate-950/20' : ''
        }`}
        style={{
          backgroundColor: accentColor,
          backgroundImage: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
          color: textColor,
          borderColor: tile.content.showBorder ? frameBorderColor : undefined
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
        >
          {instructionContent ?? (
            <div
              className="text-base leading-relaxed"
              style={{
                fontFamily: tile.content.fontFamily,
                fontSize: `${tile.content.fontSize}px`
              }}
              dangerouslySetInnerHTML={{
                __html: tile.content.richInstruction || `<p>${tile.content.instruction}</p>`
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

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div
            className="lg:col-span-3 rounded-2xl border px-6 py-5 space-y-4 shadow-sm"
            style={{
              backgroundColor: surfaceColor(accentColor, textColor, 0.68, 0.42),
              borderColor: surfaceColor(accentColor, textColor, 0.52, 0.54),
              color: textColor
            }}
          >
            <div className="flex items-center gap-3 text-sm font-semibold" style={{ color: mutedLabelColor }}>
              <Puzzle className="w-4 h-4" />
              <span>Tekst zadania</span>
            </div>
            <div
              className="text-base leading-relaxed space-y-3"
              style={{ fontFamily: tile.content.fontFamily, fontSize: `${tile.content.fontSize}px` }}
            >
              {segments.map((segment, index) => (
                segment.type === 'text'
                  ? <React.Fragment key={`text-${index}`}>{mapTextToNodes(segment.value)}</React.Fragment>
                  : <React.Fragment key={`blank-${segment.id}-${index}`}>{renderBlank(segment.id)}</React.Fragment>
              ))}
            </div>
          </div>

          <div
            className="lg:col-span-2 rounded-2xl border px-6 py-5 flex flex-col gap-4"
            style={{
              backgroundColor: surfaceColor(accentColor, textColor, 0.6, 0.4),
              borderColor: surfaceColor(accentColor, textColor, 0.5, 0.52),
              color: textColor
            }}
            onDragOver={handleDragOverBank}
            onDrop={handleDropToBank}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm font-semibold" style={{ color: mutedLabelColor }}>
                <RefreshCw className="w-4 h-4" />
                <span>Pula odpowiedzi</span>
              </div>
              <span className="text-xs" style={{ color: mutedLabelColor }}>
                {availableOptions.length} / {tile.content.options.length}
              </span>
            </div>

            <div className="flex flex-wrap gap-3">
              {availableOptions.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-sm text-center gap-2 py-8 w-full" style={{ color: mutedLabelColor }}>
                  <RotateCcw className="w-5 h-5" />
                  <span>Wszystkie odpowiedzi zostały wykorzystane.</span>
                </div>
              ) : (
                availableOptions.map(option => (
                  <button
                    key={option.id}
                    type="button"
                    draggable={isInteractionEnabled}
                    onDragStart={(event) => handleDragStartFromBank(event, option.id)}
                    onDragEnd={handleDragEnd}
                    className={`px-4 py-2 rounded-xl border text-sm font-medium shadow-sm transition-all duration-200 ${
                      draggedOptionId === option.id ? 'opacity-70' : 'hover:scale-105'
                    }`}
                    style={{
                      backgroundColor: optionBackground,
                      borderColor: optionBorder,
                      color: textColor,
                      cursor: isInteractionEnabled ? 'grab' : 'default'
                    }}
                    disabled={!isInteractionEnabled}
                  >
                    {option.text}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {isInteractionEnabled && (
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleCheck}
              className="px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors duration-200 bg-white/90 hover:bg-white"
              style={{ color: accentColor }}
            >
              Sprawdź odpowiedzi
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 text-slate-100/90 hover:text-white"
              style={{ backgroundColor: 'transparent' }}
            >
              <RotateCcw className="w-4 h-4" />
              Wyczyść wybór
            </button>
            {renderEvaluationMessage()}
          </div>
        )}

        {!isInteractionEnabled && renderEvaluationMessage()}
      </div>
    </div>
  );
};

export default MatchPairsInteractive;
