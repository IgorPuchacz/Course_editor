import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Circle, HelpCircle, RotateCcw, Sparkles, XCircle } from 'lucide-react';
import { QuizTile } from 'tiles-core';

import { InstructionPanel } from '../../components/InstructionPanel';
import { getReadableTextColor, createSurfacePalette } from '../../utils/color';

export type QuizEvaluationState = 'idle' | 'correct' | 'incorrect';

export interface QuizRuntimeTileProps {
  tile: QuizTile;
  isPreview?: boolean;
  isTestingMode?: boolean;
  onRequestTextEditing?: () => void;
  instructionSlot?: React.ReactNode;
  onEvaluationChange?: (state: QuizEvaluationState) => void;
}

export const evaluateQuizAnswers = (
  tile: QuizTile,
  selectedAnswers: number[]
): QuizEvaluationState => {
  if (selectedAnswers.length === 0) {
    return 'idle';
  }

  const correctIndices = tile.content.answers
    .map((answer, index) => (answer.isCorrect ? index : null))
    .filter((index): index is number => index !== null);

  const isCorrectSelection =
    selectedAnswers.length === correctIndices.length &&
    selectedAnswers.every(index => correctIndices.includes(index));

  return isCorrectSelection ? 'correct' : 'incorrect';
};

export const QuizRuntimeTile: React.FC<QuizRuntimeTileProps> = ({
  tile,
  isPreview = false,
  isTestingMode = false,
  onRequestTextEditing,
  instructionSlot,
  onEvaluationChange
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [evaluationState, setEvaluationState] = useState<QuizEvaluationState>('idle');

  useEffect(() => {
    setSelectedAnswers([]);
    setEvaluationState('idle');
  }, [tile.content.answers, tile.content.multipleCorrect]);

  const accentColor = tile.content.backgroundColor || '#1d4ed8';
  const textColor = useMemo(() => getReadableTextColor(accentColor), [accentColor]);
  const mutedTextColor = textColor === '#0f172a' ? '#475569' : '#e2e8f0';
  const isInteractionEnabled = !isPreview && isTestingMode;

  useEffect(() => {
    if (!isInteractionEnabled) {
      setSelectedAnswers([]);
      setEvaluationState('idle');
    }
  }, [isInteractionEnabled]);

  useEffect(() => {
    onEvaluationChange?.(evaluationState);
  }, [evaluationState, onEvaluationChange]);

  const {
    panelBackground,
    panelBorder,
    iconBackground,
    answerBackground,
    answerBorder,
    answerSelectedBackground,
    answerSelectedBorder
  } = useMemo(
    () =>
      createSurfacePalette(accentColor, textColor, {
        panelBackground: { lighten: 0.66, darken: 0.42 },
        panelBorder: { lighten: 0.54, darken: 0.52 },
        iconBackground: { lighten: 0.58, darken: 0.48 },
        answerBackground: { lighten: 0.7, darken: 0.38 },
        answerBorder: { lighten: 0.58, darken: 0.48 },
        answerSelectedBackground: { lighten: 0.46, darken: 0.56 },
        answerSelectedBorder: { lighten: 0.38, darken: 0.62 }
      }),
    [accentColor, textColor]
  );

  const handleTileDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      if (isPreview || isTestingMode) return;

      event.preventDefault();
      event.stopPropagation();
      onRequestTextEditing?.();
    },
    [isPreview, isTestingMode, onRequestTextEditing]
  );

  const handleSelectAnswer = (index: number) => {
    if (!isInteractionEnabled) return;

    setEvaluationState('idle');

    setSelectedAnswers(prev => {
      if (tile.content.multipleCorrect) {
        return prev.includes(index)
          ? prev.filter(i => i !== index)
          : [...prev, index];
      }

      return prev.includes(index) ? prev : [index];
    });
  };

  const handleReset = () => {
    if (!isInteractionEnabled) return;
    setSelectedAnswers([]);
    setEvaluationState('idle');
  };

  const handleEvaluate = () => {
    if (!isInteractionEnabled) return;
    if (selectedAnswers.length === 0) return;

    setEvaluationState(evaluateQuizAnswers(tile, selectedAnswers));
  };

  const renderInstructionContent = () => {
    if (instructionSlot) {
      return instructionSlot;
    }

    return (
      <div
        className="text-sm leading-relaxed"
        style={{
          fontFamily: tile.content.questionFontFamily || 'Inter',
          fontSize: `${tile.content.questionFontSize ?? 16}px`
        }}
        dangerouslySetInnerHTML={{
          __html: tile.content.richQuestion || `<p>${tile.content.question}</p>`
        }}
      />
    );
  };

  const renderAnswerButton = (answer: QuizTile['content']['answers'][number], index: number) => {
    const isSelected = selectedAnswers.includes(index);
    const showCorrectState = evaluationState !== 'idle' && answer.isCorrect;
    const showIncorrectState = evaluationState === 'incorrect' && isSelected && !answer.isCorrect;

    const backgroundColor = showCorrectState
      ? 'rgba(34, 197, 94, 0.18)'
      : showIncorrectState
        ? 'rgba(248, 113, 113, 0.2)'
        : isSelected
          ? answerSelectedBackground
          : answerBackground;

    const borderColor = showCorrectState
      ? 'rgba(34, 197, 94, 0.5)'
      : showIncorrectState
        ? 'rgba(248, 113, 113, 0.7)'
        : isSelected
          ? answerSelectedBorder
          : answerBorder;

    const iconColor = showCorrectState
      ? '#16a34a'
      : showIncorrectState
        ? '#dc2626'
        : textColor;

    const icon = showCorrectState ? (
      <CheckCircle2 className="w-5 h-5" style={{ color: iconColor }} />
    ) : showIncorrectState ? (
      <XCircle className="w-5 h-5" style={{ color: iconColor }} />
    ) : isSelected ? (
      <CheckCircle2 className="w-5 h-5" style={{ color: iconColor }} />
    ) : (
      <Circle className="w-5 h-5" style={{ color: iconColor }} />
    );

    return (
      <button
        key={index}
        type="button"
        onClick={() => handleSelectAnswer(index)}
        className={`flex items-center justify-between w-full rounded-xl px-4 py-3 text-left transition-colors duration-200 ${
          isInteractionEnabled ? 'cursor-pointer hover:scale-[1.01]' : 'cursor-default'
        }`}
        style={{
          backgroundColor,
          borderColor,
          color: textColor,
          borderWidth: 1,
          borderStyle: 'solid'
        }}
        disabled={isPreview}
      >
        <div className="flex items-center gap-3">
          <span className="flex-shrink-0">{icon}</span>
          <span className="text-sm font-medium" style={{ color: textColor }}>
            {answer.text}
          </span>
        </div>
      </button>
    );
  };

  const renderEvaluationMessage = () => {
    if (!isInteractionEnabled || evaluationState === 'idle') return null;

    if (evaluationState === 'correct') {
      return (
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
          <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
          <span>Great job! All selected answers are correct.</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-sm font-medium text-rose-500">
        <XCircle className="w-5 h-5" aria-hidden="true" />
        <span>Not quite right yet. Adjust your answers and try again.</span>
      </div>
    );
  };

  return (
    <div
      className="flex flex-col gap-4"
      style={{ color: textColor }}
      onDoubleClick={handleTileDoubleClick}
    >
      <InstructionPanel
        icon={<HelpCircle className="w-5 h-5" style={{ color: textColor }} aria-hidden="true" />}
        label="Task"
        className="shadow-sm"
        style={{
          backgroundColor: panelBackground,
          border: `1px solid ${panelBorder}`
        }}
        iconWrapperStyle={{ backgroundColor: iconBackground }}
      >
        {renderInstructionContent()}
      </InstructionPanel>

      <div className="flex flex-col gap-3">
        {tile.content.answers.map((answer, index) => renderAnswerButton(answer, index))}
      </div>

      <div className="flex flex-col gap-3 mt-2">
        {renderEvaluationMessage()}

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <button
            type="button"
            onClick={handleEvaluate}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold shadow-md transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-900/20 disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              backgroundColor: iconBackground,
              color: textColor,
              border: `1px solid ${panelBorder}`
            }}
            disabled={!isInteractionEnabled}
          >
            {(evaluationState === 'correct' && (
              <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
            )) ||
              (evaluationState === 'incorrect' && (
                <XCircle className="w-5 h-5" aria-hidden="true" />
              )) || <Sparkles className="w-5 h-5" aria-hidden="true" />}
            <span>{evaluationState === 'correct' ? 'Well done!' : 'Check answers'}</span>
          </button>

          {isInteractionEnabled && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-900/20"
              style={{ color: mutedTextColor }}
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizRuntimeTile;
