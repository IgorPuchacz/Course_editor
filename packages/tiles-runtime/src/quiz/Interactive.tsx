import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Circle, HelpCircle, XCircle } from 'lucide-react';
import { QuizTile } from 'tiles-core';
import { getReadableTextColor } from 'tiles-core/utils';
import { createSurfacePalette } from 'tiles-core/utils';
import {
  TaskInstructionPanel,
  TileInstructionContent,
  ValidateButton,
  type ValidateButtonState
} from 'ui-primitives';

interface QuizInteractiveProps {
  tile: QuizTile;
  isPreview?: boolean;
  isTestingMode?: boolean;
  onRequestTextEditing?: () => void;
  instructionContent?: React.ReactNode;
}

type EvaluationState = ValidateButtonState;

export const QuizInteractive: React.FC<QuizInteractiveProps> = ({
  tile,
  isPreview = false,
  isTestingMode = false,
  onRequestTextEditing,
  instructionContent
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [evaluationState, setEvaluationState] = useState<EvaluationState>('idle');

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

  const handleEvaluate = () => {
    if (!isInteractionEnabled) return;
    if (selectedAnswers.length === 0) return;

    const correctIndices = tile.content.answers
      .map((answer, index) => (answer.isCorrect ? index : null))
      .filter((index): index is number => index !== null);

    const isCorrectSelection =
      selectedAnswers.length === correctIndices.length &&
      selectedAnswers.every(index => correctIndices.includes(index));

    setEvaluationState(isCorrectSelection ? 'success' : 'error');
  };

  const handleRetry = () => {
    if (!isInteractionEnabled) return;
    setSelectedAnswers([]);
    setEvaluationState('idle');
  };

  const renderInstructionContent = () => {
    if (instructionContent) {
      return instructionContent;
    }

    return (
      <TileInstructionContent
        html={
          tile.content.richQuestion ||
          `<p style="margin: 0;">${tile.content.question}</p>`
        }
        textColor={textColor}
        fontFamily={tile.content.questionFontFamily}
        fontSize={tile.content.questionFontSize}
      />
    );
  };

  const renderAnswerButton = (answer: QuizTile['content']['answers'][number], index: number) => {
    const isSelected = selectedAnswers.includes(index);
    const showCorrectState = evaluationState !== 'idle' && answer.isCorrect;
    const showIncorrectState = evaluationState === 'error' && isSelected && !answer.isCorrect;

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

    const isCorrect = evaluationState === 'success';

    return (
      <div
        className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
          isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'
        }`}
      >
        {isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
        {isCorrect ? 'Świetnie! To poprawna odpowiedź.' : 'Spróbuj ponownie. Sprawdź wybrane odpowiedzi.'}
      </div>
    );
  };

  const validationState: ValidateButtonState = evaluationState;

  return (
    <div className="relative w-full h-full" onDoubleClick={handleTileDoubleClick}>
      <div className="w-full h-full flex flex-col gap-5 p-6">

        <TaskInstructionPanel
          icon={<HelpCircle className="w-4 h-4" />}
          label="Pytanie"
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
          labelStyle={{ color: mutedTextColor }}
        >
          {renderInstructionContent()}
        </TaskInstructionPanel>

        <div className="flex flex-col gap-3">
          {tile.content.answers.map((answer, index) => renderAnswerButton(answer, index))}
        </div>

        {isInteractionEnabled && (
          <div className="flex flex-col items-center gap-2 pt-2">
            <ValidateButton
              state={validationState}
              disabled={!isInteractionEnabled || selectedAnswers.length === 0}
              onClick={handleEvaluate}
              onRetry={handleRetry}
            />
          </div>
        )}

        {renderEvaluationMessage()}
      </div>
    </div>
  );
};

export default QuizInteractive;
