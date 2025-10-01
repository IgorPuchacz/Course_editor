import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Circle, HelpCircle, RotateCcw, XCircle } from 'lucide-react';
import { QuizTile } from '../../../../types/lessonEditor';
import { getReadableTextColor, surfaceColor } from '../../../../utils/colorUtils';
import { TaskInstructionPanel } from '../TaskInstructionPanel.tsx';
import { RichTextEditor, RichTextEditorProps } from '../RichTextEditor.tsx';

interface QuizInteractiveProps {
  tile: QuizTile;
  isPreview?: boolean;
  isTestingMode?: boolean;
  onRequestTextEditing?: () => void;
  instructionEditorProps?: RichTextEditorProps;
}

type EvaluationState = 'idle' | 'correct' | 'incorrect';

export const QuizInteractive: React.FC<QuizInteractiveProps> = ({
  tile,
  isPreview = false,
  isTestingMode = false,
  onRequestTextEditing,
  instructionEditorProps
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

  const panelBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.66, 0.42),
    [accentColor, textColor]
  );
  const panelBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.54, 0.52),
    [accentColor, textColor]
  );
  const iconBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.58, 0.48),
    [accentColor, textColor]
  );
  const answerBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.7, 0.38),
    [accentColor, textColor]
  );
  const answerBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.58, 0.48),
    [accentColor, textColor]
  );
  const answerSelectedBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.46, 0.56),
    [accentColor, textColor]
  );
  const answerSelectedBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.38, 0.62),
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

    const correctIndices = tile.content.answers
      .map((answer, index) => (answer.isCorrect ? index : null))
      .filter((index): index is number => index !== null);

    const isCorrectSelection =
      selectedAnswers.length === correctIndices.length &&
      selectedAnswers.every(index => correctIndices.includes(index));

    setEvaluationState(isCorrectSelection ? 'correct' : 'incorrect');
  };

  const renderInstructionContent = () => {
    if (instructionEditorProps) {
      return <RichTextEditor {...instructionEditorProps} />;
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

    const isCorrect = evaluationState === 'correct';

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
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleEvaluate}
              className="px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors duration-200 bg-white/90 hover:bg-white"
              style={{ color: accentColor }}
              disabled={selectedAnswers.length === 0}
            >
              Sprawdź odpowiedź
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 text-slate-600 hover:text-slate-800"
            >
              <RotateCcw className="w-4 h-4" />
              Wyczyść wybór
            </button>
          </div>
        )}

        {renderEvaluationMessage()}
      </div>
    </div>
  );
};

export default QuizInteractive;
