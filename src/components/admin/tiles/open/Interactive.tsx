import React, { useCallback, useMemo } from 'react';
import { FileText, Paperclip, Download, PenSquare, CheckCircle2, Info } from 'lucide-react';
import { OpenTile } from '../../../../types/lessonEditor';
import { getReadableTextColor, surfaceColor } from '../../../../utils/colorUtils';
import { createValidateButtonPalette } from '../../../../utils/surfacePalette.ts';
import { TaskInstructionPanel } from '../TaskInstructionPanel.tsx';
import { TaskTileSection } from '../TaskTileSection.tsx';
import { RichTextEditor, RichTextEditorProps } from '../RichTextEditor.tsx';
import { ValidateButton, ValidateButtonColors } from '../../../common/ValidateButton.tsx';

interface OpenInteractiveProps {
  tile: OpenTile;
  isPreview?: boolean;
  isTestingMode?: boolean;
  onRequestTextEditing?: () => void;
  instructionEditorProps?: RichTextEditorProps;
}

export const OpenInteractive: React.FC<OpenInteractiveProps> = ({
  tile,
  isPreview = false,
  isTestingMode = false,
  onRequestTextEditing,
  instructionEditorProps,
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
  const expectedFormat = tile.content.expectedFormat?.trim();
  const correctAnswer = tile.content.correctAnswer?.trim();

  const validateButtonColors = useMemo<ValidateButtonColors>(
    () => createValidateButtonPalette(accentColor, textColor),
    [accentColor, textColor]
  );

  const handleTileDoubleClick = useCallback(() => {
    if (isPreview) {
      return;
    }

    onRequestTextEditing?.();
  }, [isPreview, onRequestTextEditing]);

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
          {instructionEditorProps ? (
            <RichTextEditor {...instructionEditorProps} />
          ) : (
            <div
              className="text-base leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: tile.content.richInstruction || `<p>${tile.content.instruction}</p>`
              }}
            />
          )}
        </TaskInstructionPanel>

        {isTestingMode && (
          <div
            className="text-[11px] uppercase tracking-[0.32em]"
            style={{ color: captionColor }}
          >
            Tryb testowania
          </div>
        )}

        <TaskTileSection
          icon={<Paperclip className="w-4 h-4" />}
          title="Materiały do zadania"
          className="shadow-sm"
          style={{
            backgroundColor: sectionBackground,
            borderColor: sectionBorder,
            color: textColor,
          }}
          headerClassName="px-5 py-4 border-b"
          headerStyle={{ borderColor: sectionBorder, color: mutedLabelColor }}
          titleStyle={{ color: mutedLabelColor }}
          contentClassName="flex flex-col gap-3 px-5 py-4"
        >
          {attachments.length === 0 ? (
            <p className="text-sm" style={{ color: captionColor }}>
              Nie dodano żadnych plików. Dodaj je w panelu edycji, jeśli zadanie tego wymaga.
            </p>
          ) : (
            <div className="space-y-3">
              {attachments.map(attachment => (
                <div
                  key={attachment.id}
                  className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                  style={{
                    backgroundColor: itemBackground,
                    borderColor: itemBorder,
                  }}
                >
                  <div>
                    <p className="text-sm font-semibold" style={{ color: textColor }}>
                      {attachment.name}
                    </p>
                    {attachment.description ? (
                      <p className="text-xs" style={{ color: captionColor }}>
                        {attachment.description}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium opacity-70 cursor-not-allowed"
                    style={{
                      borderColor: itemBorder,
                      color: textColor,
                      backgroundColor: 'transparent',
                    }}
                  >
                    <Download className="w-4 h-4" />
                    Pobierz (podgląd)
                  </button>
                </div>
              ))}
            </div>
          )}
        </TaskTileSection>

        <TaskTileSection
          icon={<PenSquare className="w-4 h-4" />}
          title="Twoja odpowiedź"
          className="shadow-sm"
          style={{
            backgroundColor: sectionBackground,
            borderColor: sectionBorder,
            color: textColor,
          }}
          headerClassName="px-5 py-4 border-b"
          headerStyle={{ borderColor: sectionBorder, color: mutedLabelColor }}
          titleStyle={{ color: mutedLabelColor }}
          contentClassName="flex flex-col gap-4 px-5 py-4"
        >

          <textarea
            className="w-full min-h-[120px] resize-none rounded-xl px-4 py-3 text-sm"
            style={{
              backgroundColor: inputBackground,
              borderColor: inputBorder,
              color: textColor,
            }}
            placeholder={answerPlaceholder}
            disabled
          />
        </TaskTileSection>

        <div className="flex flex-col items-center gap-2 pt-2">
          <ValidateButton
            state="idle"
            disabled
            onClick={() => {}}
            colors={validateButtonColors}
            labels={{ idle: 'Sprawdź odpowiedź', success: 'Dobrze!', error: 'Spróbuj ponownie' }}
          />
        </div>
      </div>
    </div>
  );
};
