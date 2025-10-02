import React, { useMemo } from 'react';
import { Sparkles, Shuffle, Columns3 } from 'lucide-react';
import { GeneralTile } from '../../../../types/lessonEditor';
import { getReadableTextColor } from '../../../../utils/colorUtils';
import { createSurfacePalette, createValidateButtonPalette } from '../../../../utils/surfacePalette.ts';
import { TaskInstructionPanel } from '../TaskInstructionPanel.tsx';
import { TaskTileSection } from '../TaskTileSection.tsx';
import { RichTextEditor, type RichTextEditorProps } from '../RichTextEditor.tsx';
import { ValidateButton, type ValidateButtonColors } from '../../../common/ValidateButton.tsx';

type ShuffledItem = { id: string; text: string };

type SeededShuffleFn = <T>(items: T[], seed: string) => T[];

const createSeedFromString = (value: string): number => {
  let seed = 0;
  for (let index = 0; index < value.length; index += 1) {
    seed = (seed * 31 + value.charCodeAt(index)) & 0x7fffffff;
  }
  return seed;
};

const shuffleWithSeed: SeededShuffleFn = (items, seedValue) => {
  const shuffled = [...items];
  if (shuffled.length <= 1) {
    return shuffled;
  }

  let seed = createSeedFromString(seedValue) || 1;

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    const random = seed / 4294967296;
    const j = Math.floor(random * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
};

interface GeneralInteractiveProps {
  tile: GeneralTile;
  isPreview?: boolean;
  isTestingMode?: boolean;
  onRequestTextEditing?: () => void;
  instructionEditorProps?: RichTextEditorProps;
}

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
    headerBorder,
    columnBackground,
    columnBorder,
    itemBackground,
    itemBorder
  } = useMemo(
    () =>
      createSurfacePalette(accentColor, textColor, {
        panelBackground: { lighten: 0.64, darken: 0.45 },
        panelBorder: { lighten: 0.52, darken: 0.56 },
        iconBackground: { lighten: 0.56, darken: 0.48 },
        sectionBackground: { lighten: 0.62, darken: 0.42 },
        sectionBorder: { lighten: 0.52, darken: 0.54 },
        headerBorder: { lighten: 0.5, darken: 0.58 },
        columnBackground: { lighten: 0.68, darken: 0.36 },
        columnBorder: { lighten: 0.54, darken: 0.52 },
        itemBackground: { lighten: 0.72, darken: 0.3 },
        itemBorder: { lighten: 0.58, darken: 0.46 }
      }),
    [accentColor, textColor]
  );

  const validateButtonColors = useMemo<ValidateButtonColors>(
    () => createValidateButtonPalette(accentColor, textColor),
    [accentColor, textColor]
  );

  const leftItems = useMemo<ShuffledItem[]>(
    () =>
      shuffleWithSeed(
        tile.content.pairs.map(pair => ({ id: `${pair.id}-left`, text: pair.left })),
        `${tile.id}-left`
      ),
    [tile.content.pairs, tile.id]
  );

  const rightItems = useMemo<ShuffledItem[]>(
    () =>
      shuffleWithSeed(
        tile.content.pairs.map(pair => ({ id: `${pair.id}-right`, text: pair.right })),
        `${tile.id}-right`
      ),
    [tile.content.pairs, tile.id]
  );

  const mutedLabelColor = textColor === '#0f172a' ? '#475569' : '#cbd5f5';

  const handleTileDoubleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isPreview || isTestingMode) return;
    event.preventDefault();
    event.stopPropagation();
    onRequestTextEditing?.();
  };

  const renderColumnItems = (items: ShuffledItem[]) => {
    if (items.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center text-sm text-center px-3" style={{ color: mutedLabelColor }}>
          Dodaj pary w panelu edycji, aby wyświetlić je tutaj.
        </div>
      );
    }

    return items.map(item => (
      <div
        key={item.id}
        className="rounded-xl border px-4 py-3 text-sm font-medium shadow-sm"
        style={{
          backgroundColor: itemBackground,
          borderColor: itemBorder,
          color: textColor
        }}
      >
        {item.text}
      </div>
    ));
  };

  return (
    <div className="relative w-full h-full" onDoubleClick={handleTileDoubleClick}>
      <div
        className="w-full h-full flex flex-col gap-6 p-6 transition-all duration-300 rounded-[inherit]"
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
              style={{ fontFamily: tile.content.fontFamily, fontSize: tile.content.fontSize }}
              dangerouslySetInnerHTML={{
                __html: tile.content.richInstruction || `<p>${tile.content.instruction}</p>`
              }}
            />
          )}
        </TaskInstructionPanel>

        <div className="flex-1 min-h-0 flex flex-col">
          <TaskTileSection
            className="flex-1 min-h-0 shadow-sm"
            style={{
              backgroundColor: sectionBackground,
              borderColor: sectionBorder,
              color: textColor
            }}
            icon={<Shuffle className="w-4 h-4" />}
            title={<span className="uppercase tracking-[0.24em]">dopasuj pary</span>}
            headerClassName="px-6 py-5 border-b"
            headerStyle={{ borderColor: headerBorder, color: mutedLabelColor }}
            contentClassName="flex-1 min-h-0 px-6 py-5"
          >
            <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-2">
              <div
                className="flex h-full min-h-0 flex-col gap-4 rounded-xl border p-4"
                style={{ backgroundColor: columnBackground, borderColor: columnBorder }}
              >
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: mutedLabelColor }}>
                  <Columns3 className="w-4 h-4" />
                  <span>Lewa kolumna</span>
                </div>
                <div
                  className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-3"
                  style={{ scrollbarColor: `${itemBorder} transparent` }}
                >
                  {renderColumnItems(leftItems)}
                </div>
              </div>

              <div
                className="flex h-full min-h-0 flex-col gap-4 rounded-xl border p-4"
                style={{ backgroundColor: columnBackground, borderColor: columnBorder }}
              >
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: mutedLabelColor }}>
                  <Columns3 className="w-4 h-4" />
                  <span>Prawa kolumna</span>
                </div>
                <div
                  className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-3"
                  style={{ scrollbarColor: `${itemBorder} transparent` }}
                >
                  {renderColumnItems(rightItems)}
                </div>
              </div>
            </div>
          </TaskTileSection>
        </div>

        <div className="flex justify-center pt-2">
          <ValidateButton
            state="idle"
            onClick={() => {}}
            disabled
            colors={validateButtonColors}
            labels={{
              idle: (
                <>
                  <Shuffle className="h-5 w-5" aria-hidden="true" />
                  <span>Sprawdź pary</span>
                </>
              )
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default GeneralInteractive;
