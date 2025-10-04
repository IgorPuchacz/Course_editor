import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Sparkles, Puzzle, RotateCcw } from 'lucide-react';
import { BlanksTile } from 'tiles-core';

import { InstructionPanel } from '../../components/InstructionPanel';
import { TileSection } from '../../components/TileSection';
import {
  ValidationButton,
  type ValidationButtonColors,
  type ValidationButtonLabels,
  type ValidationState
} from '../../components/ValidationButton';
import {
  createBlankId,
  createPlaceholderRegex
} from '../../utils/blanks';
import {
  createSurfacePalette,
  getReadableTextColor,
  surfaceColor
} from '../../utils/color';

export interface BlanksRuntimeTileProps {
  tile: BlanksTile;
  isPreview?: boolean;
  instructionSlot?: React.ReactNode;
  onRequestTextEditing?: () => void;
  onEvaluationChange?: (state: ValidationState) => void;
}

interface Segment {
  type: 'text' | 'blank';
  value?: string;
  id?: string;
}

interface DragPayload {
  optionId: string;
  sourceBlankId?: string;
}

export const evaluateBlanksPlacements = (
  tile: BlanksTile,
  placements: Record<string, string | null>
): ValidationState => {
  const blanks = tile.content.blanks;

  const allFilled = blanks.every(blank => Boolean(placements[blank.id]));
  if (!allFilled) {
    return 'idle';
  }

  const isCorrect = blanks.every(blank => placements[blank.id] === blank.correctOptionId);
  return isCorrect ? 'success' : 'error';
};

const parseTemplate = (template: string): Segment[] => {
  const regex = createPlaceholderRegex();
  const segments: Segment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let occurrenceIndex = 0;

  while ((match = regex.exec(template)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: template.slice(lastIndex, match.index) });
    }

    const answerText = (match[1] ?? '').trim();

    if (answerText) {
      const blankId = createBlankId(answerText, occurrenceIndex);
      segments.push({ type: 'blank', id: blankId });
      occurrenceIndex += 1;
    } else {
      segments.push({ type: 'text', value: template.slice(match.index, regex.lastIndex) });
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

const createValidationPalette = (
  accentColor: string,
  textColor: string
): ValidationButtonColors => {
  const baseIdleBackground = textColor === '#0f172a'
    ? surfaceColor(accentColor, textColor, 0.1, 0.24)
    : surfaceColor(accentColor, textColor, 0.24, 0.1);

  return {
    idle: {
      background: baseIdleBackground,
      color: textColor === '#0f172a' ? '#0f172a' : '#f8fafc',
      border: 'transparent'
    },
    success: {
      background: 'rgba(34, 197, 94, 0.2)',
      color: '#15803d',
      border: 'rgba(34, 197, 94, 0.4)'
    },
    error: {
      background: 'rgba(248, 113, 113, 0.18)',
      color: '#b91c1c',
      border: 'rgba(248, 113, 113, 0.5)'
    }
  };
};

export const BlanksRuntimeTile: React.FC<BlanksRuntimeTileProps> = ({
  tile,
  isPreview = false,
  instructionSlot,
  onRequestTextEditing,
  onEvaluationChange
}) => {
  const [placements, setPlacements] = useState<Record<string, string | null>>({});
  const [evaluation, setEvaluation] = useState<ValidationState>('idle');
  const [attempts, setAttempts] = useState(0);
  const [activeBlankId, setActiveBlankId] = useState<string | null>(null);

  const accentColor = tile.content.backgroundColor || '#0f172a';
  const textColor = useMemo(() => getReadableTextColor(accentColor), [accentColor]);
  const {
    panelBackground,
    panelBorder,
    iconBackground,
    blankBackground,
    blankBorder,
    blankHoverBackground,
    blankFilledBackground,
    optionBackground,
    optionBorder,
    testingCaptionColor
  } = useMemo(
    () =>
      createSurfacePalette(accentColor, textColor, {
        panelBackground: { lighten: 0.62, darken: 0.45 },
        panelBorder: { lighten: 0.5, darken: 0.55 },
        iconBackground: { lighten: 0.54, darken: 0.48 },
        blankBackground: { lighten: 0.65, darken: 0.38 },
        blankBorder: { lighten: 0.54, darken: 0.52 },
        blankHoverBackground: { lighten: 0.75, darken: 0.32 },
        blankFilledBackground: { lighten: 0.52, darken: 0.46 },
        optionBackground: { lighten: 0.52, darken: 0.46 },
        optionBorder: { lighten: 0.44, darken: 0.56 },
        testingCaptionColor: { lighten: 0.42, darken: 0.4 }
      }),
    [accentColor, textColor]
  );
  const mutedLabelColor = textColor === '#0f172a' ? '#475569' : '#d1d5db';
  const validateButtonColors = useMemo<ValidationButtonColors>(
    () => createValidationPalette(accentColor, textColor),
    [accentColor, textColor]
  );
  const validateButtonLabels = useMemo<ValidationButtonLabels>(
    () => ({
      idle: (
        <>
          <span>Check answers</span>
        </>
      ),
      success: (
        <>
          <span aria-hidden="true">✅</span>
          <span>Great work!</span>
        </>
      ),
      error: (
        <>
          <RotateCcw className="h-5 w-5" aria-hidden="true" />
          <span>Try again</span>
        </>
      )
    }),
    []
  );

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
  const isComplete = useMemo(
    () => tile.content.blanks.every(blank => placements[blank.id]),
    [placements, tile.content.blanks]
  );

  useEffect(() => {
    onEvaluationChange?.(evaluation);
  }, [evaluation, onEvaluationChange]);

  const handleDragStartFromBank = (event: React.DragEvent<HTMLButtonElement>, optionId: string) => {
    if (!isInteractionEnabled) return;

    const payload: DragPayload = { optionId };
    event.dataTransfer.setData('application/json', JSON.stringify(payload));
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDragStartFromBlank = (
    event: React.DragEvent<HTMLDivElement>,
    blankId: string,
    optionId: string
  ) => {
    if (!isInteractionEnabled) return;

    const payload: DragPayload = { optionId, sourceBlankId: blankId };
    event.dataTransfer.setData('application/json', JSON.stringify(payload));
    event.dataTransfer.effectAllowed = 'move';
  };

  const extractPayload = (event: React.DragEvent): DragPayload | null => {
    try {
      const data = event.dataTransfer.getData('application/json');
      if (!data) return null;
      return JSON.parse(data) as DragPayload;
    } catch (error) {
      console.error('Failed to parse drag payload', error);
      return null;
    }
  };

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>,
    targetBlankId: string
  ) => {
    if (!isInteractionEnabled) return;

    event.preventDefault();
    event.stopPropagation();

    const payload = extractPayload(event);
    if (!payload) return;

    setPlacements(prev => {
      const nextPlacements = { ...prev };

      if (payload.sourceBlankId) {
        nextPlacements[payload.sourceBlankId] = null;
      }

      nextPlacements[targetBlankId] = payload.optionId;
      return nextPlacements;
    });

    setActiveBlankId(null);
    setEvaluation('idle');
  };

  const handleDragOver = (
    event: React.DragEvent<HTMLDivElement>,
    blankId: string
  ) => {
    if (!isInteractionEnabled) return;

    event.preventDefault();

    setActiveBlankId(blankId);
  };

  const handleDropToBank = (event: React.DragEvent<HTMLDivElement>) => {
    if (!isInteractionEnabled) return;

    event.preventDefault();
    event.stopPropagation();

    const payload = extractPayload(event);
    if (!payload) return;

    setPlacements(prev => {
      const nextPlacements = { ...prev };
      if (payload.sourceBlankId) {
        nextPlacements[payload.sourceBlankId] = null;
      }
      return nextPlacements;
    });

    setActiveBlankId(null);
    setEvaluation('idle');
  };

  const handleReset = () => {
    if (!isInteractionEnabled) return;
    resetPlacements();
  };

  const handleValidate = () => {
    if (!isInteractionEnabled) return;

    const nextEvaluation = evaluateBlanksPlacements(tile, placements);
    setEvaluation(nextEvaluation);
    setAttempts(prev => prev + 1);
  };

  const renderInstructionContent = () => {
    if (instructionSlot) {
      return instructionSlot;
    }

    return (
      <div
        className="text-sm leading-relaxed"
        style={{
          fontFamily: tile.content.instructionFontFamily || 'Inter',
          fontSize: `${tile.content.instructionFontSize ?? 16}px`
        }}
        dangerouslySetInnerHTML={{
          __html: tile.content.richInstruction || `<p>${tile.content.instruction}</p>`
        }}
      />
    );
  };

  const renderSegment = (segment: Segment, index: number) => {
    if (segment.type === 'text') {
      return (
        <span key={`segment-${index}`} className="whitespace-pre-wrap">
          {segment.value ? mapTextToNodes(segment.value) : null}
        </span>
      );
    }

    const blankId = segment.id!;
    const placedOptionId = placements[blankId];
    const placedOption = tile.content.options.find(option => option.id === placedOptionId);
    const blankDefinition = tile.content.blanks.find(blank => blank.id === blankId);

    const isBlankFilled = Boolean(placedOption);
    const isActive = activeBlankId === blankId;
    const isCorrectPlacement =
      evaluation !== 'idle' &&
      Boolean(placedOptionId) &&
      placedOptionId === blankDefinition?.correctOptionId;

    const evaluationBackground = !isBlankFilled || evaluation === 'idle'
      ? undefined
      : isCorrectPlacement
        ? 'rgba(34, 197, 94, 0.18)'
        : 'rgba(248, 113, 113, 0.18)';

    const evaluationBorder = !isBlankFilled || evaluation === 'idle'
      ? undefined
      : isCorrectPlacement
        ? 'rgba(34, 197, 94, 0.6)'
        : 'rgba(248, 113, 113, 0.6)';

    return (
      <div
        key={`blank-${blankId}`}
        className={`inline-flex min-w-[120px] items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-200 ${
          isBlankFilled ? 'shadow-sm' : ''
        }`}
        style={{
          backgroundColor: evaluationBackground ?? (isBlankFilled ? blankFilledBackground : blankBackground),
          borderColor: evaluationBorder ?? (isActive ? iconBackground : blankBorder),
          color: textColor
        }}
        onDragOver={event => handleDragOver(event, blankId)}
        onDrop={event => handleDrop(event, blankId)}
        onDragLeave={() => setActiveBlankId(null)}
        data-filled={isBlankFilled}
      >
        {isBlankFilled ? (
          <button
            type="button"
            className="flex items-center gap-2"
            draggable={isInteractionEnabled}
            onDragStart={event =>
              handleDragStartFromBlank(event, blankId, placedOption!.id)
            }
            style={{ color: textColor }}
          >
            <span>{placedOption!.text}</span>
            <RotateCcw className="w-4 h-4 opacity-70" aria-hidden="true" />
          </button>
        ) : (
          <span style={{ color: mutedLabelColor }}>Drop answer here</span>
        )}
      </div>
    );
  };

  return (
    <div
      className="flex flex-col gap-6"
      onDoubleClick={event => {
        if (isPreview) return;
        event.preventDefault();
        event.stopPropagation();
        onRequestTextEditing?.();
      }}
    >
      <InstructionPanel
        icon={<Puzzle className="w-5 h-5" aria-hidden="true" />}
        label="Task"
        className="shadow-sm"
        style={{
          backgroundColor: panelBackground,
          border: `1px solid ${panelBorder}`,
          color: textColor
        }}
        iconWrapperStyle={{ backgroundColor: iconBackground }}
      >
        {renderInstructionContent()}
      </InstructionPanel>

      <TileSection
        title={
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            <span>Fill in the blanks</span>
          </div>
        }
        icon={<RefreshCw className="w-4 h-4" aria-hidden="true" />}
        className="border-transparent shadow-sm"
        contentClassName="flex flex-col gap-4"
        style={{ backgroundColor: panelBackground, borderColor: panelBorder, color: textColor }}
      >
        <p className="text-sm" style={{ color: mutedLabelColor }}>
          Drag the answers from the bank to complete the sentence.
        </p>
        <div className="flex flex-wrap gap-2 text-base font-medium">
          {segments.map((segment, index) => renderSegment(segment, index))}
        </div>
      </TileSection>

      <TileSection
        title="Answer bank"
        icon={<RefreshCw className="w-4 h-4" aria-hidden="true" />}
        className="border-transparent shadow-sm"
        contentClassName="flex flex-col gap-3"
        style={{ backgroundColor: panelBackground, borderColor: panelBorder, color: textColor }}
        onDrop={handleDropToBank}
        onDragOver={event => {
          if (!isInteractionEnabled) return;
          event.preventDefault();
          setActiveBlankId(null);
        }}
      >
        <div className="flex flex-wrap gap-3">
          {availableOptions.map(option => (
            <button
              key={option.id}
              type="button"
              draggable={isInteractionEnabled}
              onDragStart={event => handleDragStartFromBank(event, option.id)}
              className="rounded-xl border px-4 py-2 text-sm font-medium shadow-sm transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-900/20"
              style={{
                backgroundColor: optionBackground,
                borderColor: optionBorder,
                color: textColor
              }}
            >
              {option.text}
            </button>
          ))}
        </div>

        {isPreview && (
          <p className="text-xs" style={{ color: testingCaptionColor }}>
            Drag and drop is disabled in preview mode.
          </p>
        )}
      </TileSection>

      <div className="flex flex-col gap-3">
        <ValidationButton
          state={evaluation}
          onClick={handleValidate}
          onRetry={handleReset}
          disabled={!isInteractionEnabled || !isComplete}
          colors={validateButtonColors}
          labels={validateButtonLabels}
        />

        <div className="flex justify-between text-xs" style={{ color: mutedLabelColor }}>
          <span>Attempts: {attempts}</span>
          {evaluation === 'success' && <span>All blanks are correctly filled!</span>}
          {evaluation === 'error' && <span>Some blanks are incorrect, try again.</span>}
        </div>
      </div>
    </div>
  );
};

export default BlanksRuntimeTile;
