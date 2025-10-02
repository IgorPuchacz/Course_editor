import React, { useMemo, useCallback } from 'react';
import { NotebookPen, Paperclip, Download, FileText, Shuffle, Sparkles, Lock } from 'lucide-react';
import { OpenTile } from '../../../../types/lessonEditor';
import { getReadableTextColor, surfaceColor } from '../../../../utils/colorUtils';
import {
  createSurfacePalette,
  createValidateButtonPalette
} from '../../../../utils/surfacePalette.ts';
import { TaskInstructionPanel } from '../TaskInstructionPanel.tsx';
import { TaskTileSection } from '../TaskTileSection.tsx';
import { RichTextEditor, type RichTextEditorProps } from '../RichTextEditor.tsx';
import {
  ValidateButton,
  type ValidateButtonState,
  type ValidateButtonColors
} from '../../../common/ValidateButton.tsx';

interface OpenInteractiveProps {
  tile: OpenTile;
  isPreview?: boolean;
  isTestingMode?: boolean;
  onRequestTextEditing?: () => void;
  instructionEditorProps?: RichTextEditorProps;
}

const createDeterministicShuffle = (tileId: string, pairs: OpenTile['content']['pairs']) => {
  const hash = (value: string) => {
    let h = 0;
    for (let i = 0; i < value.length; i += 1) {
      h = (h * 31 + value.charCodeAt(i)) >>> 0;
    }
    return h;
  };

  return [...pairs]
    .map((pair, index) => ({
      pair,
      sortKey: (hash(`${tileId}-${pair.id}`) + index * 17) % 100000,
    }))
    .sort((a, b) => a.sortKey - b.sortKey)
    .map(entry => entry.pair);
};

export const OpenInteractive: React.FC<OpenInteractiveProps> = ({
  tile,
  isPreview = false,
  isTestingMode = false,
  onRequestTextEditing,
  instructionEditorProps,
}) => {
  const accentColor = tile.content.backgroundColor || '#0f172a';
  const textColor = useMemo(() => getReadableTextColor(accentColor), [accentColor]);
  const {
    panelBackground,
    panelBorder,
    iconBackground,
    attachmentBackground,
    attachmentBorder,
    attachmentHover,
    inputBackground,
    inputBorder,
    pairsBackground,
    pairsBorder,
    chipBackground,
    chipBorder,
    captionColor,
  } = useMemo(
    () =>
      createSurfacePalette(accentColor, textColor, {
        panelBackground: { lighten: 0.64, darken: 0.44 },
        panelBorder: { lighten: 0.5, darken: 0.56 },
        iconBackground: { lighten: 0.56, darken: 0.48 },
        attachmentBackground: { lighten: 0.68, darken: 0.42 },
        attachmentBorder: { lighten: 0.54, darken: 0.52 },
        attachmentHover: { lighten: 0.74, darken: 0.34 },
        inputBackground: { lighten: 0.76, darken: 0.36 },
        inputBorder: { lighten: 0.6, darken: 0.5 },
        pairsBackground: { lighten: 0.66, darken: 0.38 },
        pairsBorder: { lighten: 0.52, darken: 0.54 },
        chipBackground: { lighten: 0.58, darken: 0.46 },
        chipBorder: { lighten: 0.46, darken: 0.58 },
        captionColor: { lighten: 0.48, darken: 0.52 },
      }),
    [accentColor, textColor],
  );

  const mutedLabelColor = textColor === '#0f172a' ? '#475569' : '#dbeafe';
  const subduedTextColor = textColor === '#0f172a' ? '#0f172a' : '#f8fafc';
  const validateButtonColors = useMemo<ValidateButtonColors>(
    () => createValidateButtonPalette(accentColor, textColor),
    [accentColor, textColor],
  );
  const validateButtonLabels = useMemo(
    () => ({
      idle: (
        <>
          <Sparkles className="h-5 w-5" aria-hidden="true" />
          <span>Sprawdź odpowiedź</span>
        </>
      ),
      success: 'Dobrze!',
      error: 'Spróbuj ponownie',
    }),
    [],
  );

  const handleTileDoubleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (isPreview || isTestingMode) return;
      event.preventDefault();
      event.stopPropagation();
      onRequestTextEditing?.();
    },
    [isPreview, isTestingMode, onRequestTextEditing],
  );

  const attachments = tile.content.attachments ?? [];
  const pairs = tile.content.pairs ?? [];
  const shuffledPairs = useMemo(
    () => createDeterministicShuffle(tile.id, pairs),
    [pairs, tile.id],
  );

  const validationState: ValidateButtonState = 'idle';
  const noop = useCallback(() => {}, []);
  const answerPlaceholder = tile.content.answerPlaceholder || 'Pole odpowiedzi (wyłączone w wersji edytora)';

  return (
    <div className="relative w-full h-full" onDoubleClick={handleTileDoubleClick}>
      <div
        className="w-full h-full flex flex-col gap-6 transition-all duration-300 p-6 rounded-[inherit]"
        style={{
          background: 'transparent',
          color: textColor,
        }}
      >
        <TaskInstructionPanel
          icon={<NotebookPen className="w-4 h-4" />}
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
              className="text-base leading-relaxed space-y-2"
              dangerouslySetInnerHTML={{
                __html: tile.content.richInstruction || `<p>${tile.content.instruction}</p>`
              }}
            />
          )}
        </TaskInstructionPanel>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          <TaskTileSection
            className="shadow-sm"
            style={{
              backgroundColor: attachmentBackground,
              borderColor: attachmentBorder,
              color: textColor,
            }}
            icon={<Paperclip className="w-4 h-4" />}
            title="Materiały do pobrania"
            headerClassName="px-5 py-4 border-b"
            headerStyle={{ borderColor: attachmentBorder, color: mutedLabelColor }}
            titleStyle={{ color: mutedLabelColor }}
            contentClassName="px-5 py-4 space-y-3 overflow-y-auto"
          >
            {attachments.length === 0 ? (
              <p className="text-sm" style={{ color: captionColor }}>
                Brak dodatkowych plików. Dodaj załączniki w panelu edycji, jeżeli są wymagane.
              </p>
            ) : (
              <div className="space-y-3">
                {attachments.map(attachment => (
                  <div
                    key={attachment.id}
                    className="flex items-start justify-between gap-4 rounded-xl border px-4 py-3"
                    style={{
                      backgroundColor: surfaceColor(accentColor, textColor, 0.74, 0.36),
                      borderColor: attachmentBorder,
                    }}
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium" style={{ color: subduedTextColor }}>
                        {attachment.name}
                      </p>
                      {attachment.description ? (
                        <p className="text-xs" style={{ color: captionColor }}>
                          {attachment.description}
                        </p>
                      ) : null}
                      {attachment.url ? (
                        <p className="text-xs font-mono break-all" style={{ color: captionColor }}>
                          {attachment.url}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg border"
                      style={{
                        backgroundColor: attachmentHover,
                        borderColor: attachmentBorder,
                        color: textColor,
                        opacity: 0.7,
                        cursor: 'not-allowed',
                      }}
                      disabled
                      aria-disabled="true"
                    >
                      <Download className="w-4 h-4" aria-hidden="true" />
                      Pobierz
                    </button>
                  </div>
                ))}
              </div>
            )}
          </TaskTileSection>

          <div className="lg:col-span-2 flex flex-col gap-6 min-h-0">
            <TaskTileSection
              className="shadow-sm"
              style={{
                backgroundColor: surfaceColor(accentColor, textColor, 0.7, 0.4),
                borderColor: surfaceColor(accentColor, textColor, 0.54, 0.52),
                color: textColor,
              }}
              icon={<FileText className="w-4 h-4" />}
              title="Odpowiedź"
              headerClassName="px-5 py-4 border-b"
              headerStyle={{
                borderColor: surfaceColor(accentColor, textColor, 0.54, 0.52),
                color: mutedLabelColor,
              }}
              titleStyle={{ color: mutedLabelColor }}
              contentClassName="px-5 py-4 space-y-4"
            >
              <div className="space-y-2">
                <span className="text-xs uppercase tracking-[0.32em] block" style={{ color: captionColor }}>
                  Oczekiwany format odpowiedzi
                </span>
                <code
                  className="block text-sm rounded-lg px-3 py-2"
                  style={{
                    backgroundColor: surfaceColor(accentColor, textColor, 0.78, 0.34),
                    border: `1px solid ${surfaceColor(accentColor, textColor, 0.64, 0.48)}`,
                    color: subduedTextColor,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {tile.content.expectedFormat}
                </code>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.24em] block" style={{ color: captionColor }}>
                  Twoja odpowiedź
                </label>
                <textarea
                  className="w-full rounded-xl border px-4 py-3 text-sm leading-relaxed resize-none"
                  style={{
                    backgroundColor: inputBackground,
                    borderColor: inputBorder,
                    color: subduedTextColor,
                  }}
                  placeholder={answerPlaceholder}
                  disabled
                  rows={4}
                />
                <div className="flex items-center gap-2 text-xs" style={{ color: captionColor }}>
                  <Lock className="w-4 h-4" aria-hidden="true" />
                  <span>Pole odpowiedzi jest wyłączone w wersji edytora.</span>
                </div>
              </div>
            </TaskTileSection>

            <TaskTileSection
              className="shadow-sm flex-1"
              style={{
                backgroundColor: pairsBackground,
                borderColor: pairsBorder,
                color: textColor,
              }}
              icon={<Shuffle className="w-4 h-4" />}
              title="Pary referencyjne"
              headerClassName="px-5 py-4 border-b"
              headerStyle={{ borderColor: pairsBorder, color: mutedLabelColor }}
              titleStyle={{ color: mutedLabelColor }}
              contentClassName="px-5 py-4 h-full"
            >
              {pairs.length === 0 ? (
                <p className="text-sm" style={{ color: captionColor }}>
                  Dodaj pary w panelu edycji, aby zaprezentować dodatkowy kontekst zadania.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                  <div className="space-y-3">
                    <span className="text-xs uppercase tracking-[0.24em] block" style={{ color: captionColor }}>
                      Elementy
                    </span>
                    <div className="space-y-2">
                      {pairs.map(pair => (
                        <div
                          key={`prompt-${pair.id}`}
                          className="rounded-xl border px-3 py-2 text-sm font-medium shadow-sm"
                          style={{
                            backgroundColor: chipBackground,
                            borderColor: chipBorder,
                            color: subduedTextColor,
                          }}
                        >
                          {pair.prompt}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <span className="text-xs uppercase tracking-[0.24em] block" style={{ color: captionColor }}>
                      Powiązania (losowa kolejność)
                    </span>
                    <div className="space-y-2">
                      {shuffledPairs.map(pair => (
                        <div
                          key={`response-${pair.id}`}
                          className="rounded-xl border px-3 py-2 text-sm shadow-sm"
                          style={{
                            backgroundColor: surfaceColor(accentColor, textColor, 0.74, 0.36),
                            borderColor: chipBorder,
                            color: subduedTextColor,
                          }}
                        >
                          {pair.response}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </TaskTileSection>
          </div>
        </div>

        <div className="flex justify-center pt-2">
          <ValidateButton
            state={validationState}
            onClick={noop}
            disabled
            className="max-w-md"
            colors={validateButtonColors}
            labels={validateButtonLabels}
          />
        </div>
      </div>
    </div>
  );
};
