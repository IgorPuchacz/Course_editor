import React, { useMemo } from 'react';
import { Link2, Shuffle, Sparkles } from 'lucide-react';
import { PairingTile } from 'tiles-core';
import { createSurfacePalette, createValidateButtonPalette, getReadableTextColor } from 'tiles-core/utils';
import { TaskInstructionPanel, TaskTileSection, ValidateButton, type ValidateButtonColors } from 'tiles-core/ui';

interface PairingInteractiveProps {
  tile: PairingTile;
  isPreview?: boolean;
  isTestingMode?: boolean;
  onRequestTextEditing?: () => void;
  instructionContent?: React.ReactNode;
}

interface ShuffledItem {
  id: string;
  text: string;
}

const hashString = (value: string): number => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(31, hash) + value.charCodeAt(index);
    hash |= 0;
  }
  return hash >>> 0;
};

const ensureDifferentOrder = (originalIds: string[], items: ShuffledItem[]): ShuffledItem[] => {
  if (items.length <= 1) {
    return items;
  }

  const isSameOrder = items.every((item, index) => item.id === originalIds[index]);
  if (!isSameOrder) {
    return items;
  }

  const [first, ...rest] = items;
  return [...rest, first];
};

export const PairingInteractive: React.FC<PairingInteractiveProps> = ({
  tile,
  isPreview = false,
  isTestingMode = false,
  onRequestTextEditing,
  instructionContent
}) => {
  const accentColor = tile.content.backgroundColor || '#0f172a';
  const textColor = useMemo(() => getReadableTextColor(accentColor), [accentColor]);
  const {
    panelBackground,
    panelBorder,
    iconBackground,
    sectionBackground,
    sectionBorder,
    itemBackground,
    itemBorder,
    badgeBackground,
    badgeBorder
  } = useMemo(
    () =>
      createSurfacePalette(accentColor, textColor, {
        panelBackground: { lighten: 0.62, darken: 0.45 },
        panelBorder: { lighten: 0.5, darken: 0.55 },
        iconBackground: { lighten: 0.54, darken: 0.48 },
        sectionBackground: { lighten: 0.68, darken: 0.4 },
        sectionBorder: { lighten: 0.52, darken: 0.54 },
        itemBackground: { lighten: 0.58, darken: 0.44 },
        itemBorder: { lighten: 0.48, darken: 0.56 },
        badgeBackground: { lighten: 0.52, darken: 0.48 },
        badgeBorder: { lighten: 0.44, darken: 0.58 }
      }),
    [accentColor, textColor]
  );
  const mutedLabelColor = textColor === '#0f172a' ? '#475569' : '#d1d5db';
  const columnCaptionColor = textColor === '#0f172a' ? '#64748b' : '#e2e8f0';

  const validateButtonColors = useMemo<ValidateButtonColors>(
    () => createValidateButtonPalette(accentColor, textColor),
    [accentColor, textColor]
  );

  const validateButtonLabels = useMemo(
    () => ({
      idle: (
        <>
          <span>Sprawdź dopasowania</span>
        </>
      )
    }),
    []
  );

  const shuffledRightItems = useMemo(() => {
    const originalIds = tile.content.pairs.map(pair => pair.id);
    const items: ShuffledItem[] = tile.content.pairs.map(pair => ({
      id: pair.id,
      text: pair.right
    }));

    const seededItems = items
      .map(item => ({
        ...item,
        sortKey: hashString(`${tile.id}-${item.id}-${item.text}`)
      }))
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(({ sortKey: _sortKey, ...rest }) => rest);

    return ensureDifferentOrder(originalIds, seededItems);
  }, [tile.content.pairs, tile.id]);

  const handleTileDoubleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isPreview || isTestingMode) return;
    event.preventDefault();
    event.stopPropagation();
    onRequestTextEditing?.();
  };

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
          {instructionContent ? (
            instructionContent
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
          icon={<Link2 className="w-4 h-4" />}
          title="dopasuj pary"
          style={{
            backgroundColor: sectionBackground,
            borderColor: sectionBorder,
            color: textColor
          }}
          headerClassName="px-5 py-4 border-b"
          headerStyle={{ borderColor: sectionBorder, color: mutedLabelColor }}
          titleClassName="uppercase tracking-[0.24em] text-xs"
          contentClassName="flex-1 min-h-0 px-5 py-4 overflow-hidden"
        >
          {tile.content.pairs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm" style={{ color: columnCaptionColor }}>
              Dodaj pary w panelu edycji, aby zobaczyć podgląd układu.
            </div>
          ) : (
            <div className="h-full flex flex-col gap-5 lg:flex-row min-h-0">
              <div className="flex-1 min-h-0 flex flex-col">
                <div className="mt-3 flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
                  {tile.content.pairs.map((pair, index) => (
                    <div
                      key={pair.id}
                      className="flex items-start gap-3 rounded-xl border px-4 py-3 shadow-sm"
                      style={{ backgroundColor: itemBackground, borderColor: itemBorder, color: textColor }}
                    >
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-semibold"
                        style={{ backgroundColor: badgeBackground, borderColor: badgeBorder, color: textColor }}
                      >
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium leading-snug break-words" style={{ color: textColor }}>
                        {pair.left}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1 min-h-0 flex flex-col">
                <div className="mt-3 flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
                  {shuffledRightItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 rounded-xl border px-4 py-3 shadow-sm"
                      style={{ backgroundColor: itemBackground, borderColor: itemBorder, color: textColor }}
                    >
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-semibold"
                        style={{ backgroundColor: badgeBackground, borderColor: badgeBorder, color: textColor }}
                      >
                        {String.fromCharCode(65 + (index % 26))}
                      </span>
                      <span className="text-sm font-medium leading-snug break-words" style={{ color: textColor }}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </TaskTileSection>

        {!isPreview && (
          <div className="flex items-center justify-center pt-1">
            <ValidateButton
              state="idle"
              disabled
              onClick={() => {}}
              colors={validateButtonColors}
              labels={{ idle: 'Sprawdź odpowiedź', success: 'Dobrze!', error: 'Spróbuj ponownie' }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
