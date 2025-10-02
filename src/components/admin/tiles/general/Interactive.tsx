import React, { useMemo, useCallback } from 'react';
import { Link as LinkIcon, Sparkles } from 'lucide-react';
import { GeneralTile } from '../../../../types/lessonEditor';
import { getReadableTextColor, surfaceColor } from '../../../../utils/colorUtils';
import { createValidateButtonPalette } from '../../../../utils/surfacePalette.ts';
import { TaskInstructionPanel } from '../TaskInstructionPanel.tsx';
import { TaskTileSection } from '../TaskTileSection.tsx';
import { RichTextEditor, RichTextEditorProps } from '../RichTextEditor.tsx';
import { ValidateButton, ValidateButtonColors, ValidateButtonState } from '../../../common/ValidateButton.tsx';

interface GeneralInteractiveProps {
  tile: GeneralTile;
  isPreview?: boolean;
  isTestingMode?: boolean;
  onRequestTextEditing?: () => void;
  instructionEditorProps?: RichTextEditorProps;
}

interface ColumnItem {
  id: string;
  text: string;
}

const createSeedFromString = (value: string): number => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 2147483647;
  }
  return hash || 1;
};

const shuffleWithSeed = <T,>(items: T[], seedKey: string): T[] => {
  const result = [...items];
  let seed = createSeedFromString(seedKey);
  for (let index = result.length - 1; index > 0; index -= 1) {
    seed = (seed * 16807) % 2147483647;
    const random = (seed - 1) / 2147483646;
    const swapIndex = Math.floor(random * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
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
  const sectionBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.66, 0.38),
    [accentColor, textColor]
  );
  const sectionBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.54, 0.5),
    [accentColor, textColor]
  );
  const columnBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.72, 0.32),
    [accentColor, textColor]
  );
  const columnBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.58, 0.46),
    [accentColor, textColor]
  );
  const badgeBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.52, 0.48),
    [accentColor, textColor]
  );
  const mutedLabelColor = textColor === '#0f172a' ? '#475569' : '#dbeafe';
  const badgeTextColor = textColor === '#0f172a' ? '#1f2937' : '#f8fafc';
  const validateButtonColors = useMemo<ValidateButtonColors>(
    () => createValidateButtonPalette(accentColor, textColor),
    [accentColor, textColor]
  );
  const validationState: ValidateButtonState = 'idle';

  const leftItems = useMemo<ColumnItem[]>(
    () =>
      shuffleWithSeed(
        tile.content.pairs.map(pair => ({ id: pair.id, text: pair.left })),
        `${tile.id}-left`
      ),
    [tile.content.pairs, tile.id]
  );

  const rightItems = useMemo<ColumnItem[]>(
    () =>
      shuffleWithSeed(
        tile.content.pairs.map(pair => ({ id: pair.id, text: pair.right })),
        `${tile.id}-right`
      ),
    [tile.content.pairs, tile.id]
  );

  const handleTileDoubleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (isPreview || isTestingMode) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      onRequestTextEditing?.();
    },
    [isPreview, isTestingMode, onRequestTextEditing]
  );

  const renderColumn = (label: string, items: ColumnItem[], position: 'left' | 'right') => (
    <div className={`flex flex-col gap-2 min-h-0 ${position === 'left' ? 'pr-1 md:pr-3' : 'pl-1 md:pl-3'}`}>
      <span className="text-xs uppercase tracking-[0.24em]" style={{ color: mutedLabelColor }}>
        {label}
      </span>
      <div className="flex-1 min-h-0 overflow-auto space-y-3">
        {items.length === 0 ? (
          <div className="flex items-center justify-center text-sm h-full" style={{ color: mutedLabelColor }}>
            Dodaj pary w panelu edycji
          </div>
        ) : (
          items.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-sm"
              style={{
                backgroundColor: columnBackground,
                borderColor: columnBorder,
                color: textColor
              }}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                style={{ backgroundColor: badgeBackground, color: badgeTextColor }}
              >
                {index + 1}
              </span>
              <span className="leading-snug">{item.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );

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
            backgroundColor: surfaceColor(accentColor, textColor, 0.62, 0.42),
            borderColor: surfaceColor(accentColor, textColor, 0.5, 0.52),
            color: textColor
          }}
          iconWrapperClassName="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
          iconWrapperStyle={{
            backgroundColor: surfaceColor(accentColor, textColor, 0.54, 0.48),
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

        {isTestingMode && (
          <div className="text-[11px] uppercase tracking-[0.32em]" style={{ color: mutedLabelColor }}>
            Tryb testowania
          </div>
        )}

        <div className="flex-1 min-h-0">
          <TaskTileSection
            className="h-full shadow-sm min-h-0"
            style={{
              backgroundColor: sectionBackground,
              borderColor: sectionBorder,
              color: textColor
            }}
            icon={<LinkIcon className="w-4 h-4" />}
            title="dopasuj pary"
            headerClassName="px-6 py-5 border-b"
            headerStyle={{ borderColor: sectionBorder, color: mutedLabelColor }}
            titleStyle={{ color: mutedLabelColor }}
            rightContent={
              <span className="text-xs" style={{ color: mutedLabelColor }}>
                {tile.content.pairs.length} elementów
              </span>
            }
            contentClassName="flex-1 overflow-hidden px-6 py-5 flex flex-col gap-5"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
              {renderColumn('Lewy zestaw', leftItems, 'left')}
              {renderColumn('Prawy zestaw', rightItems, 'right')}
            </div>
            <div className="rounded-xl border px-4 py-3 text-xs leading-relaxed" style={{ borderColor: columnBorder, color: mutedLabelColor }}>
              Łączenie par będzie dostępne w widoku ucznia. Ta wersja kafelka prezentuje jedynie treści do dopasowania.
            </div>
          </TaskTileSection>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <ValidateButton
            onClick={() => undefined}
            state={validationState}
            colors={validateButtonColors}
            disabled
          />
        </div>
      </div>
    </div>
  );
};

export default GeneralInteractive;
