import React, { useMemo } from 'react';
import { NotebookPen, Download, Paperclip, Shuffle, Info } from 'lucide-react';
import { OpenTile } from '../../../../types/lessonEditor.ts';
import { TaskInstructionPanel } from '../TaskInstructionPanel.tsx';
import { TaskTileSection } from '../TaskTileSection.tsx';
import { RichTextEditor, type RichTextEditorProps } from '../RichTextEditor.tsx';
import { ValidateButton } from '../../../common/ValidateButton.tsx';
import { getReadableTextColor, surfaceColor } from '../shared.ts';
import { createSurfacePalette, createValidateButtonPalette } from '../../../../utils/surfacePalette.ts';

interface OpenInteractiveProps {
  tile: OpenTile;
  isPreview?: boolean;
  onRequestTextEditing?: () => void;
  instructionEditorProps?: RichTextEditorProps;
}

export const OpenInteractive: React.FC<OpenInteractiveProps> = ({
  tile,
  onRequestTextEditing,
  instructionEditorProps
}) => {
  const accentColor = tile.content.backgroundColor || '#0f172a';
  const textColor = useMemo(() => getReadableTextColor(accentColor), [accentColor]);
  const mutedLabelColor = textColor === '#0f172a' ? '#475569' : '#dbeafe';
  const subtleCaptionColor = textColor === '#0f172a' ? '#64748b' : '#e2e8f0';

  const surfaces = useMemo(
    () =>
      createSurfacePalette(accentColor, textColor, {
        frameBorder: { lighten: 0.5, darken: 0.6 },
        panelBackground: { lighten: 0.64, darken: 0.42 },
        panelBorder: { lighten: 0.5, darken: 0.58 },
        iconBackground: { lighten: 0.58, darken: 0.46 },
        sectionBackground: { lighten: 0.7, darken: 0.36 },
        sectionBorder: { lighten: 0.54, darken: 0.56 },
        cardBackground: { lighten: 0.78, darken: 0.28 },
        cardBorder: { lighten: 0.62, darken: 0.5 },
        inputBackground: { lighten: 0.82, darken: 0.24 },
        inputBorder: { lighten: 0.62, darken: 0.5 },
        badgeBackground: { lighten: 0.74, darken: 0.32 },
        badgeBorder: { lighten: 0.6, darken: 0.44 }
      }),
    [accentColor, textColor]
  );

  const validateButtonColors = useMemo(
    () => createValidateButtonPalette(accentColor, textColor),
    [accentColor, textColor]
  );

  const attachments = useMemo(() => tile.content.attachments ?? [], [tile.content.attachments]);
  const pairs = useMemo(() => tile.content.pairs ?? [], [tile.content.pairs]);
  const expectedFormat = tile.content.expectedFormat?.trim().length
    ? tile.content.expectedFormat
    : "['napis1', 'napis2', 'napis3']";
  const answerPlaceholder = tile.content.answerPlaceholder || 'Odpowiedź ucznia pojawi się tutaj...';

  const shuffledRightColumn = useMemo(() => {
    if (pairs.length <= 1) {
      return [...pairs];
    }

    const [, ...rest] = pairs;
    return [...rest, pairs[0]];
  }, [pairs]);

  const containerStyle: React.CSSProperties = {
    borderRadius: 'inherit',
    backgroundColor: tile.content.backgroundColor || '#ffffff',
    border:
      tile.content.showBorder === false
        ? 'none'
        : `1px solid ${surfaces.frameBorder}`,
    color: textColor
  };

  const renderInstructionContent = () => {
    if (instructionEditorProps) {
      return (
        <RichTextEditor
          content={instructionEditorProps.content}
          onChange={instructionEditorProps.onChange}
          onFinish={instructionEditorProps.onFinish}
          onEditorReady={instructionEditorProps.onEditorReady}
          textColor={instructionEditorProps.textColor ?? textColor}
        />
      );
    }

    return (
      <div
        className="text-sm leading-relaxed space-y-2"
        style={{
          fontFamily: tile.content.fontFamily,
          fontSize: `${tile.content.fontSize}px`
        }}
        onDoubleClick={onRequestTextEditing}
        role="textbox"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && event.metaKey) {
            onRequestTextEditing?.();
          }
        }}
        dangerouslySetInnerHTML={{
          __html: tile.content.richInstruction || tile.content.instruction
        }}
      />
    );
  };

  return (
    <div className="w-full h-full overflow-hidden" style={containerStyle}>
      <div className="w-full h-full flex flex-col gap-5 p-5">
        <TaskInstructionPanel
          icon={<NotebookPen className="w-4 h-4" />}
          label="Instrukcja"
          className="border transition-colors duration-300"
          style={{
            backgroundColor: surfaces.panelBackground,
            color: textColor,
            borderColor: surfaces.panelBorder
          }}
          iconWrapperStyle={{
            backgroundColor: surfaces.iconBackground,
            color: textColor
          }}
          labelStyle={{ color: mutedLabelColor }}
          bodyClassName="px-5 pb-5 text-sm leading-relaxed space-y-3"
        >
          {renderInstructionContent()}
        </TaskInstructionPanel>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
          <TaskTileSection
            className="h-full"
            style={{
              backgroundColor: surfaces.sectionBackground,
              borderColor: surfaces.sectionBorder,
              color: textColor
            }}
            icon={<Paperclip className="w-4 h-4" />}
            title="Materiały do pobrania"
            headerClassName="px-5 py-4 border-b"
            headerStyle={{ borderColor: surfaces.sectionBorder, color: mutedLabelColor }}
            titleStyle={{ color: mutedLabelColor }}
            contentClassName="px-5 py-4 space-y-3 overflow-auto"
          >
            {attachments.length === 0 ? (
              <div className="text-sm" style={{ color: subtleCaptionColor }}>
                Brak dodatkowych materiałów. Dodaj pliki w panelu edycji, jeśli zadanie tego wymaga.
              </div>
            ) : (
              attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="rounded-xl border px-4 py-3 flex items-center justify-between gap-3"
                  style={{
                    backgroundColor: surfaces.cardBackground,
                    borderColor: surfaces.cardBorder
                  }}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold" style={{ color: textColor }}>
                      {attachment.name}
                    </span>
                    {attachment.description ? (
                      <span className="text-xs" style={{ color: subtleCaptionColor }}>
                        {attachment.description}
                      </span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium opacity-70"
                    style={{
                      borderColor: surfaces.cardBorder,
                      color: subtleCaptionColor,
                      cursor: 'not-allowed'
                    }}
                  >
                    <Download className="w-4 h-4" />
                    Pobierz
                  </button>
                </div>
              ))
            )}
          </TaskTileSection>

          <TaskTileSection
            className="h-full"
            style={{
              backgroundColor: surfaces.sectionBackground,
              borderColor: surfaces.sectionBorder,
              color: textColor
            }}
            icon={<Shuffle className="w-4 h-4" />}
            title="Pary kontekstowe"
            headerClassName="px-5 py-4 border-b"
            headerStyle={{ borderColor: surfaces.sectionBorder, color: mutedLabelColor }}
            titleStyle={{ color: mutedLabelColor }}
            contentClassName="px-5 py-4 flex flex-col gap-4 overflow-auto"
          >
            {pairs.length === 0 ? (
              <div className="text-sm" style={{ color: subtleCaptionColor }}>
                Dodaj pary w panelu edycji, aby zaprezentować uczniowi dodatkowe informacje lub podpowiedzi.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-3">
                  {pairs.map((pair, index) => (
                    <div
                      key={`left-${pair.id}`}
                      className="rounded-xl border px-4 py-3"
                      style={{
                        backgroundColor: surfaces.cardBackground,
                        borderColor: surfaces.cardBorder
                      }}
                    >
                      <span className="text-xs font-semibold" style={{ color: mutedLabelColor }}>
                        Lewa kolumna {index + 1}
                      </span>
                      <div className="text-sm font-medium" style={{ color: textColor }}>
                        {pair.prompt}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  {shuffledRightColumn.map((pair, index) => (
                    <div
                      key={`right-${pair.id}`}
                      className="rounded-xl border px-4 py-3"
                      style={{
                        backgroundColor: surfaces.cardBackground,
                        borderColor: surfaces.cardBorder
                      }}
                    >
                      <span className="text-xs font-semibold" style={{ color: mutedLabelColor }}>
                        Prawa kolumna {index + 1}
                      </span>
                      <div className="text-sm font-medium" style={{ color: textColor }}>
                        {pair.response}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TaskTileSection>
        </div>

        <TaskTileSection
          className="rounded-2xl"
          style={{
            backgroundColor: surfaceColor(accentColor, textColor, 0.76, 0.3),
            borderColor: surfaces.sectionBorder,
            color: textColor
          }}
          icon={<Info className="w-4 h-4" />}
          title="Odpowiedź ucznia"
          headerClassName="px-5 py-4 border-b"
          headerStyle={{ borderColor: surfaces.sectionBorder, color: mutedLabelColor }}
          titleStyle={{ color: mutedLabelColor }}
          contentClassName="px-5 py-4 space-y-3"
        >
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: subtleCaptionColor }}>
              Oczekiwany format
            </span>
          <pre
            className="mt-2 px-3 py-2 rounded-lg border text-xs overflow-x-auto"
            style={{
              backgroundColor: surfaces.inputBackground,
              borderColor: surfaces.inputBorder,
              color: textColor
            }}
          >
            {expectedFormat}
          </pre>
          </div>

          <textarea
            disabled
            className="w-full min-h-[120px] px-4 py-3 rounded-xl border text-sm resize-none"
            style={{
              backgroundColor: surfaces.inputBackground,
              borderColor: surfaces.inputBorder,
              color: textColor,
              cursor: 'not-allowed'
            }}
            placeholder={answerPlaceholder}
          />

          <p className="text-xs" style={{ color: subtleCaptionColor }}>
            Pole odpowiedzi jest wyłączone w podglądzie edytora. Uczeń wypełni je w wersji uczniowskiej platformy.
          </p>
        </TaskTileSection>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
          <ValidateButton
            state="idle"
            onClick={() => undefined}
            disabled
            colors={validateButtonColors}
            labels={{
              idle: 'Sprawdź odpowiedź',
              success: 'Dobrze!',
              error: 'Spróbuj ponownie'
            }}
          />
          <span className="text-xs" style={{ color: subtleCaptionColor }}>
            Przyciski interakcji są dostępne po stronie ucznia. W edytorze służą jedynie do podglądu układu.
          </span>
        </div>
      </div>
    </div>
  );
};

export default OpenInteractive;
