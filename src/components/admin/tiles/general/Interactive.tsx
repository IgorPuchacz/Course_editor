import React, { useCallback, useMemo } from 'react';
import { Link2, Shuffle, Sparkles } from 'lucide-react';
import { GeneralTile } from '../../../../types/lessonEditor';
import { getReadableTextColor } from '../../../../utils/colorUtils';
import {
  createSurfacePalette,
  createValidateButtonPalette
} from '../../../../utils/surfacePalette.ts';
import { TaskInstructionPanel } from '../TaskInstructionPanel.tsx';
import { TaskTileSection } from '../TaskTileSection.tsx';
import { RichTextEditor, RichTextEditorProps } from '../RichTextEditor.tsx';
import { ValidateButton, ValidateButtonColors, ValidateButtonLabels } from '../../../common/ValidateButton.tsx';

interface GeneralInteractiveProps {
  tile: GeneralTile;
  isPreview?: boolean;
  isTestingMode?: boolean;
  onRequestTextEditing?: () => void;
  instructionEditorProps?: RichTextEditorProps;
}

interface ShuffledItem {
  id: string;
  text: string;
}

const createSeedFromString = (value: string): number => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0; // Convert to 32bit integer
  }

  return hash || 1;
};

const shuffleWithSeed = <T,>(items: T[], seedValue: string): T[] => {
  if (items.length <= 1) {
    return [...items];
  }

  const array = [...items];
  let seed = createSeedFromString(seedValue);

  const random = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
};

export const GeneralInteractive: React.FC<GeneralInteractiveProps> = ({
  tile,
  isPreview = false,
  isTestingMode = false,
  onRequestTextEditing,
  instructionEditorProps
}) => {
  const accentColor = tile.content.backgroundColor || '#0f172a';
  const textColor = useMemo(() => getReadableTextColor(accentColor), [accentColor]);

  const {
    panelBackground,
    panelBorder,
    iconBackground,
    sectionBackground,
    sectionBorder,
    pairBackground,
    pairBorder,
    badgeBackground
  } = useMemo(
    () =>
      createSurfacePalette(accentColor, textColor, {
        panelBackground: { lighten: 0.64, darken: 0.42 },
        panelBorder: { lighten: 0.52, darken: 0.56 },
        iconBackground: { lighten: 0.54, darken: 0.5 },
        sectionBackground: { lighten: 0.6, darken: 0.4 },
        sectionBorder: { lighten: 0.5, darken: 0.54 },
        pairBackground: { lighten: 0.66, darken: 0.36 },
        pairBorder: { lighten: 0.52, darken: 0.58 },
        badgeBackground: { lighten: 0.48, darken: 0.6 }
      }),
    [accentColor, textColor]
  );

  const mutedLabelColor = textColor === '#0f172a' ? '#475569' : '#dbeafe';

  const validateButtonColors = useMemo<ValidateButtonColors>(
    () => createValidateButtonPalette(accentColor, textColor),
    [accentColor, textColor]
  );

  const validateButtonLabels = useMemo<ValidateButtonLabels>(
    () => ({
      idle: (
        <>
          <Shuffle className="h-5 w-5" aria-hidden="true" />
          <span>Sprawdź pary</span>
        </>
      )
    }),
    []
  );

  const leftItems = useMemo<ShuffledItem[]>(
    () =>
      shuffleWithSeed(
        tile.content.pairs.map(pair => ({ id: pair.id, text: pair.left })),
        `${tile.id}-left`
      ),
    [tile.content.pairs, tile.id]
  );

  const rightItems = useMemo<ShuffledItem[]>(
    () =>
      shuffleWithSeed(
        tile.content.pairs.map(pair => ({ id: pair.id, text: pair.right })),
        `${tile.id}-right`
      ),
    [tile.content.pairs, tile.id]
  );

  const handleTileDoubleClick = useCallback(() => {
    if (isPreview || isTestingMode) {
      return;
    }

    onRequestTextEditing?.();
  }, [isPreview, isTestingMode, onRequestTextEditing]);

  return (
    <div className="relative w-full h-full" onDoubleClick={handleTileDoubleClick}>
      <div
        className="w-full h-full flex flex-col gap-6 transition-all duration-300 p-6 rounded-[inherit]"
        style={{
          background: 'transparent',
          color: textColor
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

        <TaskTileSection
          className="flex-1 min-h-0 shadow-sm"
          style={{
            backgroundColor: sectionBackground,
            borderColor: sectionBorder,
            color: textColor
          }}
          icon={<Link2 className="w-4 h-4" />}
          title="dopasuj pary"
          headerClassName="px-6 py-5 border-b"
          headerStyle={{ borderColor: sectionBorder, color: mutedLabelColor }}
          titleStyle={{ color: mutedLabelColor, textTransform: 'uppercase' }}
          contentClassName="flex-1 overflow-hidden px-6 py-5"
        >
          {tile.content.pairs.length === 0 ? (
            <div
              className="flex h-full items-center justify-center text-center text-sm"
              style={{ color: mutedLabelColor }}
            >
              Dodaj pary w panelu bocznym, aby przygotować zadanie.
            </div>
          ) : (
            <div className="h-full min-h-0 overflow-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pr-1">
                <div className="flex flex-col gap-3">
                  {leftItems.map((item, index) => (
                    <div
                      key={`${item.id}-left`}
                      className="flex items-start gap-3 rounded-xl border px-4 py-3 shadow-sm transition-transform duration-200 hover:-translate-y-0.5"
                      style={{
                        backgroundColor: pairBackground,
                        borderColor: pairBorder,
                        color: textColor
                      }}
                    >
                      <span
                        className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-lg text-xs font-semibold uppercase tracking-wide"
                        style={{
                          backgroundColor: badgeBackground,
                          color: textColor
                        }}
                      >
                        {String.fromCharCode(65 + (index % 26))}
                      </span>
                      <span className="text-sm leading-relaxed">{item.text}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-3">
                  {rightItems.map((item, index) => (
                    <div
                      key={`${item.id}-right`}
                      className="flex items-start gap-3 rounded-xl border px-4 py-3 shadow-sm transition-transform duration-200 hover:-translate-y-0.5"
                      style={{
                        backgroundColor: pairBackground,
                        borderColor: pairBorder,
                        color: textColor
                      }}
                    >
                      <span
                        className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-lg text-xs font-semibold tracking-wide"
                        style={{
                          backgroundColor: badgeBackground,
                          color: textColor
                        }}
                      >
                        {index + 1}
                      </span>
                      <span className="text-sm leading-relaxed">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </TaskTileSection>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <ValidateButton
            state="idle"
            onClick={() => {}}
            disabled
            colors={validateButtonColors}
            labels={validateButtonLabels}
          />
          <span
            className="text-xs font-medium uppercase tracking-[0.32em]"
            style={{ color: mutedLabelColor }}
          >
            Widok edytora
          </span>
        </div>
      </div>
    </div>
  );
};

export default GeneralInteractive;
