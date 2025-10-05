import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, FileText, Paperclip, Download, PencilLine, XCircle } from 'lucide-react';
import { OpenTile } from 'tiles-core';
import { getReadableTextColor, surfaceColor } from 'tiles-core/utils';
import {
  TaskInstructionPanel,
  TaskTileSection,
  TileInstructionContent,
  ValidateButton,
  createValidateButtonPalette,
  type ValidateButtonColors,
  type ValidateButtonState
} from 'ui-primitives';

interface OpenInteractiveProps {
  tile: OpenTile;
  isPreview?: boolean;
  isTestingMode?: boolean;
  onRequestTextEditing?: () => void;
  instructionContent?: React.ReactNode;
}

export const OpenInteractive: React.FC<OpenInteractiveProps> = ({
  tile,
  isPreview = false,
  isTestingMode = false,
  onRequestTextEditing,
  instructionContent,
}) => {
  const accentColor = tile.content.backgroundColor || '#0f172a';
  const textColor = useMemo(() => getReadableTextColor(accentColor), [accentColor]);
  const mutedLabelColor = textColor === '#0f172a' ? '#475569' : '#dbeafe';
  const captionColor = textColor === '#0f172a' ? '#64748b' : '#cbd5f5';
  const sectionBackground = surfaceColor(accentColor, textColor, 0.66, 0.4);
  const sectionBorder = surfaceColor(accentColor, textColor, 0.52, 0.52);
  const itemBackground = surfaceColor(accentColor, textColor, 0.72, 0.36);
  const itemBorder = surfaceColor(accentColor, textColor, 0.6, 0.46);
  const inputBackground = surfaceColor(accentColor, textColor, 0.78, 0.32);
  const inputBorder = surfaceColor(accentColor, textColor, 0.6, 0.46);
  const iconBackground = surfaceColor(accentColor, textColor, 0.54, 0.48);
  const panelBackground = surfaceColor(accentColor, textColor, 0.62, 0.45);
  const panelBorder = surfaceColor(accentColor, textColor, 0.5, 0.55);

  const attachments = useMemo(() => tile.content.attachments ?? [], [tile.content.attachments]);
  const [answer, setAnswer] = useState('');
  const [evaluation, setEvaluation] = useState<ValidateButtonState>('idle');
  const [attempts, setAttempts] = useState(0);
  const isInteractionEnabled = !isPreview;

  const validateButtonColors = useMemo<ValidateButtonColors>(
    () => createValidateButtonPalette(accentColor, textColor),
    [accentColor, textColor]
  );

  const handleTileDoubleClick = useCallback(() => {
    if (isPreview || isTestingMode) {
      return;
    }

    onRequestTextEditing?.();
  }, [isPreview, isTestingMode, onRequestTextEditing]);

  useEffect(() => {
    setAnswer('');
    setEvaluation('idle');
    setAttempts(0);
  }, [tile.content.correctAnswer, tile.content.ignoreCase, tile.content.ignoreWhitespace]);

  const normalizeAnswer = useCallback(
    (value: string) => {
      let normalized = value;

      if (tile.content.ignoreWhitespace) {
        normalized = normalized.replace(/\s+/g, '');
      } else {
        normalized = normalized.trim();
      }

      if (tile.content.ignoreCase) {
        normalized = normalized.toLowerCase();
      }

      return normalized;
    },
    [tile.content.ignoreCase, tile.content.ignoreWhitespace]
  );

  const handleAnswerChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!isInteractionEnabled) return;
    const { value } = event.target;
    setAnswer(value);
    if (evaluation !== 'idle') {
      setEvaluation('idle');
    }
  };

  const handleValidate = () => {
    if (!isInteractionEnabled) return;

    setAttempts(prev => prev + 1);

    const userInput = answer.trim();
    if (!userInput) {
      setEvaluation('error');
      return;
    }

    const normalizedUserInput = normalizeAnswer(answer);
    const normalizedCorrect = normalizeAnswer(tile.content.correctAnswer ?? '');

    setEvaluation(normalizedUserInput === normalizedCorrect ? 'success' : 'error');
  };

  const handleRetry = () => {
    if (!isInteractionEnabled) return;
    setEvaluation('idle');
  };

  const validationState: ValidateButtonState = evaluation;
  const showFeedback = evaluation !== 'idle';
  const isCorrect = evaluation === 'success';

  const answerPlaceholder = tile.content.expectedFormat
    ? `Oczekiwany format:\n${tile.content.expectedFormat}`
    : 'Wpisz swoją odpowiedź w tym miejscu.';

  return (
    <div className="relative w-full h-full" onDoubleClick={handleTileDoubleClick}>
      <div
        className="w-full h-full flex flex-col gap-6 transition-all duration-300 p-6 rounded-[inherit]"
        style={{ color: textColor }}
      >
        <TaskInstructionPanel
          icon={<FileText className="w-4 h-4" />}
          label="Zadanie otwarte"
          className="border"
          style={{
            backgroundColor: panelBackground,
            borderColor: panelBorder,
            color: textColor,
          }}
          iconWrapperClassName="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
          iconWrapperStyle={{
            backgroundColor: iconBackground,
            color: textColor,
          }}
          labelStyle={{ color: mutedLabelColor }}
        >
          {instructionContent ?? (
            <TileInstructionContent
              html={
                tile.content.richInstruction ||
                `<p style="margin: 0;">${tile.content.instruction}</p>`
              }
              textColor={textColor}
              fontFamily={tile.content.fontFamily}
              fontSize={tile.content.fontSize}
              verticalAlign={tile.content.verticalAlign}
            />
          )}
        </TaskInstructionPanel>
        <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden">
          <TaskTileSection
            icon={<Paperclip className="w-4 h-4" />}
            title="Materiały do zadania"
            className="shadow-sm min-h-0"
            style={{
              backgroundColor: sectionBackground,
              borderColor: sectionBorder,
              color: textColor,
            }}
            headerClassName="px-5 py-4 border-b"
            headerStyle={{ borderColor: sectionBorder, color: mutedLabelColor }}
            titleStyle={{ color: mutedLabelColor }}
            contentClassName="flex-1 overflow-auto px-5 py-4"
          >
            {attachments.length === 0 ? (
              <p className="text-sm" style={{ color: captionColor }}>
                Nie dodano żadnych plików. Dodaj je w panelu edycji, jeśli zadanie tego wymaga.
              </p>
              ) : (
              <div
                className="rounded-xl border p-3"
                style={{ backgroundColor: itemBackground, borderColor: itemBorder, color: textColor }}
              >

              <ul className="divide-y" style={{ borderColor: itemBorder }}>
                {attachments.map((attachment, index) => (
                  <li key={attachment.id} className="flex items-center gap-2 py-2">
                    <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border"
                    style={{ borderColor: itemBorder, backgroundColor: sectionBackground, color: textColor }}
                    >
                    <Download className="w-4 h-4" />
                    </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate" style={{ color: textColor }}>
                        {attachment.name || `Plik ${index + 1}`}
                        </p>
                      </div>
                  </li>
                  ))}
                </ul>
              </div>
            )}
          </TaskTileSection>

          <TaskTileSection
            icon={<PencilLine className="w-4 h-4" />}
            title="Twoja odpowiedź"
            className="shadow-sm min-h-0 flex flex-col flex-1"
            style={{
              backgroundColor: sectionBackground,
              borderColor: sectionBorder,
              color: textColor,
            }}
            headerClassName="px-5 py-4 border-b"
            headerStyle={{ borderColor: sectionBorder, color: mutedLabelColor }}
            titleStyle={{ color: mutedLabelColor }}
            contentClassName="flex flex-col flex-1 overflow-hidden px-5 py-4"
          >
            <textarea
              className="w-full flex-1 min-h-0 resize-none rounded-xl px-4 py-3 text-sm"
              style={{
                backgroundColor: inputBackground,
                borderColor: inputBorder,
                color: textColor,
              }}
              placeholder={answerPlaceholder}
              value={answer}
              onChange={handleAnswerChange}
              disabled={!isInteractionEnabled}
            />
            {showFeedback && (
              <div
                className={`mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
                  isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'
                }`}
              >
                {isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                {isCorrect
                  ? 'Świetnie! Twoja odpowiedź jest poprawna.'
                  : 'To jeszcze nie to. Sprawdź swoją odpowiedź i spróbuj ponownie.'}
              </div>
            )}
          </TaskTileSection>
        </div>

        <div className="flex flex-col items-center gap-2 pt-2">
          <ValidateButton
            state={validationState}
            disabled={!isInteractionEnabled || answer.trim().length === 0}
            onClick={handleValidate}
            onRetry={handleRetry}
            colors={validateButtonColors}
            labels={{ idle: 'Sprawdź odpowiedź', success: 'Dobrze!', error: 'Spróbuj ponownie' }}
          />
        </div>
      </div>
    </div>
  );
};
