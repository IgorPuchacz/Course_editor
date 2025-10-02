import React, { useCallback, useMemo } from 'react';
import { FileText, Paperclip, Sparkles, Shuffle, ListChecks } from 'lucide-react';
import { OpenTile } from '../../../../types/lessonEditor';
import { getReadableTextColor, lightenColor, darkenColor } from '../../../../utils/colorUtils';
import {
  createSurfacePalette,
  createValidateButtonPalette
} from '../../../../utils/surfacePalette.ts';
import { TaskInstructionPanel } from '../TaskInstructionPanel.tsx';
import { TaskTileSection } from '../TaskTileSection.tsx';
import { RichTextEditor, RichTextEditorProps } from '../RichTextEditor.tsx';
import {
  ValidateButton,
  ValidateButtonColors,
  ValidateButtonState
} from '../../../common/ValidateButton.tsx';

interface OpenInteractiveProps {
  tile: OpenTile;
  isPreview?: boolean;
  isTestingMode?: boolean;
  onRequestTextEditing?: () => void;
  instructionEditorProps?: RichTextEditorProps;
}

interface PairItem {
  id: string;
  text: string;
}

const stableShuffle = <T,>(items: T[], seed: string): T[] => {
  const hash = (value: string) => {
    let h = 0;
    for (let i = 0; i < value.length; i += 1) {
      h = Math.imul(31, h) + value.charCodeAt(i);
    }
    return Math.abs(h);
  };

  return items
    .map((item, index) => ({
      item,
      weight: hash(`${seed}-${index}-${JSON.stringify(item)}`),
      index
    }))
    .sort((a, b) => (a.weight - b.weight) || (a.index - b.index))
    .map(entry => entry.item);
};

export const OpenInteractive: React.FC<OpenInteractiveProps> = ({
  tile,
  onRequestTextEditing,
  instructionEditorProps
}) => {
  const accentColor = tile.content.backgroundColor || '#0f172a';
  const textColor = useMemo(() => getReadableTextColor(accentColor), [accentColor]);
  const gradientStart = useMemo(() => lightenColor(accentColor, 0.06), [accentColor]);
  const gradientEnd = useMemo(() => darkenColor(accentColor, 0.06), [accentColor]);
  const {
    frameBorderColor,
    panelBackground,
    panelBorder,
    iconBackground,
    sectionBackground,
    sectionBorder,
    attachmentBackground,
    attachmentBorder,
    pairCardBackground,
    pairCardBorder,
    formatBackground,
    formatBorder
  } = useMemo(
    () =>
      createSurfacePalette(accentColor, textColor, {
        frameBorderColor: { lighten: 0.5, darken: 0.6 },
        panelBackground: { lighten: 0.64, darken: 0.45 },
        panelBorder: { lighten: 0.52, darken: 0.52 },
        iconBackground: { lighten: 0.56, darken: 0.48 },
        sectionBackground: { lighten: 0.66, darken: 0.38 },
        sectionBorder: { lighten: 0.5, darken: 0.5 },
        attachmentBackground: { lighten: 0.72, darken: 0.34 },
        attachmentBorder: { lighten: 0.56, darken: 0.46 },
        pairCardBackground: { lighten: 0.7, darken: 0.3 },
        pairCardBorder: { lighten: 0.54, darken: 0.46 },
        formatBackground: { lighten: 0.78, darken: 0.28 },
        formatBorder: { lighten: 0.58, darken: 0.42 }
      }),
    [accentColor, textColor]
  );
  const mutedLabelColor = textColor === '#0f172a' ? '#475569' : '#dbeafe';
  const secondaryTextColor = textColor === '#0f172a' ? '#1f2937' : '#e2e8f0';
  const captionColor = textColor === '#0f172a' ? '#64748b' : '#dbeafe';

  const attachments = tile.content.attachments ?? [];
  const pairs = tile.content.pairs ?? [];

  const leftItems = useMemo<PairItem[]>(
    () => stableShuffle(
      pairs.map(pair => ({ id: pair.id, text: pair.prompt })),
      `${tile.id}-left`
    ),
    [pairs, tile.id]
  );
  const rightItems = useMemo<PairItem[]>(
    () => stableShuffle(
      pairs.map(pair => ({ id: pair.id, text: pair.answer })),
      `${tile.id}-right`
    ),
    [pairs, tile.id]
  );

  const validateButtonColors = useMemo<ValidateButtonColors>(
    () =>
      createValidateButtonPalette(accentColor, textColor, {
        idle: {
          background: textColor === '#0f172a' ? darkenColor(accentColor, 0.18) : lightenColor(accentColor, 0.24),
          color: textColor === '#0f172a' ? '#f8fafc' : '#0f172a',
          border: 'transparent'
        }
      }),
    [accentColor, textColor]
  );

  const validateButtonLabels = useMemo(
    () => ({
      idle: (
        <>
          <Sparkles className="h-5 w-5" aria-hidden="true" />
          <span>Podgląd walidacji</span>
        </>
      ),
      success: (
        <>
          <span aria-hidden="true">✅</span>
          <span>Dobrze!</span>
        </>
      ),
      error: (
        <>
          <span aria-hidden="true">⚠️</span>
          <span>Niepoprawne</span>
        </>
      )
    }),
    []
  );

  const validationState: ValidateButtonState = 'idle';

  const expectedFormat = (tile.content.expectedFormat || '').trim();

  const handleTileDoubleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (instructionEditorProps) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      onRequestTextEditing?.();
    },
    [instructionEditorProps, onRequestTextEditing]
  );

  return (
    <div className="relative w-full h-full" onDoubleClick={handleTileDoubleClick}>
      <div
        className="w-full h-full flex flex-col gap-6 p-6"
        style={{
          borderRadius: 'inherit',
          color: textColor,
          backgroundColor: 'transparent',
          backgroundImage: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
          border: tile.content.showBorder !== false ? `1px solid ${frameBorderColor}` : 'none',
          boxShadow: tile.content.showBorder !== false ? '0 24px 48px rgba(15, 23, 42, 0.22)' : 'none'
        }}
      >
        <TaskInstructionPanel
          icon={<FileText className="w-4 h-4" />}
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
          {instructionEditorProps ? (
            <RichTextEditor {...instructionEditorProps} />
          ) : (
            <div
              className="text-base leading-relaxed"
              style={{
                fontFamily: tile.content.fontFamily,
                fontSize: `${tile.content.fontSize}px`
              }}
              dangerouslySetInnerHTML={{
                __html: tile.content.richInstruction || tile.content.instruction
              }}
            />
          )}
        </TaskInstructionPanel>

        <TaskTileSection
          className="border"
          style={{
            backgroundColor: sectionBackground,
            borderColor: sectionBorder,
            color: textColor
          }}
          icon={<Paperclip className="w-4 h-4" />}
          title="Materiały do pobrania"
          titleStyle={{ color: mutedLabelColor }}
          contentClassName="px-5 py-4 space-y-3"
        >
          {attachments.length === 0 ? (
            <p className="text-sm" style={{ color: captionColor }}>
              Brak dodatkowych plików do pobrania.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {attachments.map(attachment => (
                <div
                  key={attachment.id}
                  className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm"
                  style={{
                    backgroundColor: attachmentBackground,
                    borderColor: attachmentBorder,
                    color: secondaryTextColor
                  }}
                >
                  <Paperclip className="h-4 w-4" aria-hidden="true" />
                  <div className="flex flex-col">
                    <span className="font-medium" style={{ color: textColor }}>
                      {attachment.name || 'Bez nazwy'}
                    </span>
                    <span className="text-xs" style={{ color: captionColor }}>
                      {attachment.url || 'Podgląd adresu pliku'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TaskTileSection>

        <TaskTileSection
          className="border"
          style={{
            backgroundColor: sectionBackground,
            borderColor: sectionBorder,
            color: textColor
          }}
          icon={<ListChecks className="w-4 h-4" />}
          title="Odpowiedź ucznia"
          titleStyle={{ color: mutedLabelColor }}
          contentClassName="px-5 py-4 space-y-4"
        >
          <div
            className="rounded-xl border px-4 py-3 text-sm"
            style={{
              backgroundColor: formatBackground,
              borderColor: formatBorder,
              color: secondaryTextColor
            }}
          >
            {expectedFormat ? expectedFormat : 'Oczekiwany format odpowiedzi zostanie ustawiony w edytorze bocznym.'}
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: mutedLabelColor }}>
              Pole odpowiedzi (podgląd)
            </label>
            <textarea
              disabled
              placeholder="Miejsce na odpowiedź ucznia (podgląd)"
              className="w-full rounded-xl border border-dashed border-slate-400/40 bg-white/60 px-3 py-2 text-sm text-slate-500"
              style={{
                cursor: 'not-allowed',
                resize: 'vertical',
                minHeight: '96px'
              }}
            />
            <p className="text-xs" style={{ color: captionColor }}>
              Pole odpowiedzi zostanie aktywowane w widoku ucznia.
            </p>
          </div>
        </TaskTileSection>

        <TaskTileSection
          className="border"
          style={{
            backgroundColor: sectionBackground,
            borderColor: sectionBorder,
            color: textColor
          }}
          icon={<Shuffle className="w-4 h-4" />}
          title="Przykładowe pary walidacyjne"
          titleStyle={{ color: mutedLabelColor }}
          contentClassName="px-5 py-4"
        >
          {pairs.length === 0 ? (
            <p className="text-sm" style={{ color: captionColor }}>
              Dodaj pary w panelu bocznym, aby zobaczyć przykładowe dane testowe.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wide" style={{ color: mutedLabelColor }}>
                  Wejścia
                </h4>
                {leftItems.map(item => (
                  <div
                    key={item.id}
                    className="rounded-xl border px-4 py-3 text-sm font-medium"
                    style={{
                      backgroundColor: pairCardBackground,
                      borderColor: pairCardBorder,
                      color: secondaryTextColor
                    }}
                  >
                    {item.text || 'Przykładowe wejście'}
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wide" style={{ color: mutedLabelColor }}>
                  Oczekiwane odpowiedzi
                </h4>
                {rightItems.map(item => (
                  <div
                    key={item.id}
                    className="rounded-xl border px-4 py-3 text-sm font-medium"
                    style={{
                      backgroundColor: pairCardBackground,
                      borderColor: pairCardBorder,
                      color: secondaryTextColor
                    }}
                  >
                    {item.text || 'Przykładowa odpowiedź'}
                  </div>
                ))}
              </div>
            </div>
          )}
        </TaskTileSection>

        <div className="flex justify-center pt-2">
          <ValidateButton
            state={validationState}
            onClick={() => {}}
            disabled
            colors={validateButtonColors}
            labels={validateButtonLabels}
          />
        </div>
      </div>
    </div>
  );
};

export default OpenInteractive;
