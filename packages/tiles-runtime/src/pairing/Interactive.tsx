import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { Link2, Sparkles } from 'lucide-react';
import { PairingTile } from 'tiles-core';
import { createSurfacePalette, getReadableTextColor } from 'tiles-core/utils';
import {
  TaskInstructionPanel,
  TaskTileSection,
  TileInstructionContent,
  ValidateButton
} from 'ui-primitives';

import {
  LineColorResolver,
  PairConnectionLayer,
  TempConnection
} from './PairConnectionLayer';
import { useElementSize } from './useElementSize';

type ValidationResult = {
  correct: Set<string>;
  incorrect: Set<string>;
  missing: Set<string>;
};

interface PairingInteractiveProps {
  tile: PairingTile;
  isPreview?: boolean;
  isTestingMode?: boolean;
  onRequestTextEditing?: () => void;
  instructionContent?: React.ReactNode;
  onAnswerChange?: (connections: { leftId: string; rightId: string }[]) => void;
  onValidate?: (result: ValidationResult) => void;
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

const RIGHT_BADGES = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const CARD_VERTICAL_GAP = 12;
const COLUMN_TOP_OFFSET = 12;

const findRightIdFromEvent = (event: MouseEvent): string | null => {
  const element = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-right-id]');
  return element?.dataset.rightId ?? null;
};

export const PairingInteractive: React.FC<PairingInteractiveProps> = ({
  tile,
  isPreview = false,
  isTestingMode = false,
  onRequestTextEditing,
  instructionContent,
  onAnswerChange,
  onValidate
}) => {
  const accentColor = tile.content.backgroundColor || '#0f172a';
  const textColor = useMemo(() => getReadableTextColor(accentColor), [accentColor]);
  const canInteract = !isPreview;
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

  const [connections, setConnections] = useState<Map<string, string>>(new Map());
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [validateState, setValidateState] = useState<'idle' | 'success' | 'error'>('idle');
  const [drag, setDrag] = useState<TempConnection>({ active: false, x: 0, y: 0, leftId: null });

  const sectionWrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const templateCardRef = useRef<HTMLDivElement>(null);

  const leftRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const rightRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const leftRefCallbacks = useRef<Record<string, (node: HTMLDivElement | null) => void>>({});
  const rightRefCallbacks = useRef<Record<string, (node: HTMLDivElement | null) => void>>({});
  const [leftVersion, setLeftVersion] = useState(0);
  const [rightVersion, setRightVersion] = useState(0);

  const { h: availableHeight, w: availableWidth } = useElementSize(contentRef);

  const [headerHeight, setHeaderHeight] = useState(0);
  const [itemHeight, setItemHeight] = useState(0);
  const [contentVerticalPadding, setContentVerticalPadding] = useState(0);

  useLayoutEffect(() => {
    const section = sectionWrapperRef.current?.querySelector(':scope > div');
    if (!section) return;
    const header = section.firstElementChild as HTMLElement | null;
    if (!header) return;
    setHeaderHeight(header.getBoundingClientRect().height);
  }, [tile.content.pairs.length, sectionBackground, sectionBorder, mutedLabelColor]);

  useLayoutEffect(() => {
    const parent = contentRef.current?.parentElement;
    if (!parent) return;
    const style = window.getComputedStyle(parent);
    const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    setContentVerticalPadding(padding + COLUMN_TOP_OFFSET);
  }, [sectionBackground, sectionBorder]);

  useLayoutEffect(() => {
    if (!templateCardRef.current) return;
    const rect = templateCardRef.current.getBoundingClientRect();
    setItemHeight(rect.height);
  }, [tile.content.pairs, itemBackground, itemBorder, badgeBackground, badgeBorder, textColor]);

  const registerLeftRef = useCallback((id: string) => {
    if (!leftRefCallbacks.current[id]) {
      leftRefCallbacks.current[id] = (node: HTMLDivElement | null) => {
        if (leftRefs.current[id] === node) return;
        leftRefs.current[id] = node;
        setLeftVersion(prev => prev + 1);
      };
    }
    return leftRefCallbacks.current[id];
  }, []);

  const registerRightRef = useCallback((id: string) => {
    if (!rightRefCallbacks.current[id]) {
      rightRefCallbacks.current[id] = (node: HTMLDivElement | null) => {
        if (rightRefs.current[id] === node) return;
        rightRefs.current[id] = node;
        setRightVersion(prev => prev + 1);
      };
    }
    return rightRefCallbacks.current[id];
  }, []);

  const updateConnections = useCallback(
    (updater: (prev: Map<string, string>) => Map<string, string>) => {
      setConnections(prev => {
        const next = updater(prev);
        if (onAnswerChange) {
          const payload = Array.from(next.entries()).map(([leftId, rightId]) => ({ leftId, rightId }));
          onAnswerChange(payload);
        }
        return next;
      });
    },
    [onAnswerChange]
  );

  useEffect(() => {
    if (validateState === 'idle' && !validation) return;
    setValidateState('idle');
    setValidation(null);
  }, [connections, validateState, validation]);

  const isDragging = drag.active;
  const activeLeftId = drag.leftId;

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (event: MouseEvent) => {
      setDrag(prev => ({ ...prev, x: event.clientX, y: event.clientY }));
    };

    const handleMouseUp = (event: MouseEvent) => {
      setDrag({ active: false, x: 0, y: 0, leftId: null });
      if (!activeLeftId) return;
      const rightId = findRightIdFromEvent(event);
      if (!rightId) return;

      updateConnections(prev => {
        const next = new Map(prev);
        Array.from(next.entries()).forEach(([leftId, mappedRightId]) => {
          if (mappedRightId === rightId && leftId !== activeLeftId) {
            next.delete(leftId);
          }
        });
        next.set(activeLeftId, rightId);
        return next;
      });
    };

    window.addEventListener('mousemove', handleMouseMove, true);
    window.addEventListener('mouseup', handleMouseUp, true);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove, true);
      window.removeEventListener('mouseup', handleMouseUp, true);
    };
  }, [activeLeftId, isDragging, updateConnections]);

  const pairsCount = tile.content.pairs.length;
  const requiredHeight = pairsCount
    ? headerHeight + contentVerticalPadding + pairsCount * (itemHeight + CARD_VERTICAL_GAP) - CARD_VERTICAL_GAP
    : 0;

  const canEvaluateFit = pairsCount > 0 && headerHeight > 0 && itemHeight > 0 && availableHeight > 0;
  const fitsWithinHeight = !canEvaluateFit || requiredHeight <= availableHeight;

  const connectionSignature = useMemo(
    () => Array.from(connections.entries()).map(([leftId, rightId]) => `${leftId}:${rightId}`).sort().join('|'),
    [connections]
  );

  const layoutVersion = useMemo(
    () =>
      hashString(
        `${connectionSignature}|${leftVersion}|${rightVersion}|${Math.round(availableHeight)}|${Math.round(availableWidth)}`
      ),
    [availableHeight, availableWidth, connectionSignature, leftVersion, rightVersion]
  );

  const getLineColor: LineColorResolver = useCallback(
    (leftId: string) => {
      if (!validation) {
        return itemBorder;
      }
      if (validation.correct.has(leftId)) {
        return '#22c55e';
      }
      if (validation.incorrect.has(leftId)) {
        return '#ef4444';
      }
      return itemBorder;
    },
    [itemBorder, validation]
  );

  const handleValidate = useCallback(() => {
    const result: ValidationResult = {
      correct: new Set<string>(),
      incorrect: new Set<string>(),
      missing: new Set<string>()
    };

    tile.content.pairs.forEach(pair => {
      const mappedRightId = connections.get(pair.id);
      if (!mappedRightId) {
        result.missing.add(pair.id);
        return;
      }
      if (mappedRightId === pair.id) {
        result.correct.add(pair.id);
      } else {
        result.incorrect.add(pair.id);
      }
    });

    const isSuccess =
      result.correct.size === tile.content.pairs.length &&
      result.incorrect.size === 0 &&
      result.missing.size === 0;

    setValidation(result);
    setValidateState(isSuccess ? 'success' : 'error');
    onValidate?.(result);
  }, [connections, onValidate, tile.content.pairs]);

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

        <div ref={sectionWrapperRef} className="flex-1 min-h-0">
          <TaskTileSection
            className="flex-1 min-h-0 shadow-sm h-full"
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
            contentClassName="flex-1 min-h-0 px-5 py-4"
          >
            {pairsCount === 0 ? (
              <div className="h-full flex items-center justify-center text-sm" style={{ color: columnCaptionColor }}>
                Dodaj pary w panelu edycji, aby zobaczyć podgląd układu.
              </div>
            ) : (
              <div ref={contentRef} className="relative h-full overflow-hidden">
                <div className="pointer-events-none absolute inset-0 opacity-0" aria-hidden="true">
                  <div
                    ref={templateCardRef}
                    className="flex items-start gap-3 rounded-xl border px-4 py-3 shadow-sm"
                    style={{ backgroundColor: itemBackground, borderColor: itemBorder, color: textColor }}
                  >
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-semibold"
                      style={{ backgroundColor: badgeBackground, borderColor: badgeBorder, color: textColor }}
                    >
                      1
                    </span>
                    <span className="text-sm font-medium leading-snug break-words" style={{ color: textColor }}>
                      {tile.content.pairs[0]?.left ?? ''}
                    </span>
                  </div>
                </div>

                {fitsWithinHeight ? (
                  <>
                    <PairConnectionLayer
                      containerRef={contentRef}
                      leftRefs={leftRefs.current}
                      rightRefs={rightRefs.current}
                      connections={connections}
                      getLineColor={getLineColor}
                      temp={drag}
                      version={layoutVersion}
                    />

                    <div className="relative z-10 flex h-full gap-8 overflow-hidden">
                      <div className="flex-1 overflow-hidden">
                        <div className="mt-3 flex flex-col gap-3">
                          {tile.content.pairs.map((pair, index) => {
                            const isActive = drag.active && drag.leftId === pair.id;
                            const cursorClass = canInteract ? (isActive ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default';
                            const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
                              if (!canInteract) return;
                              event.preventDefault();
                              setDrag({ active: true, leftId: pair.id, x: event.clientX, y: event.clientY });
                            };

                            return (
                              <div
                                key={pair.id}
                                ref={registerLeftRef(pair.id)}
                                data-left-id={pair.id}
                                data-testid={`pair-left-${index}`}
                                className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-sm select-none ${cursorClass}`}
                                style={{ backgroundColor: itemBackground, borderColor: itemBorder, color: textColor }}
                                onMouseDown={canInteract ? handleMouseDown : undefined}
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
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex-1 overflow-hidden">
                        <div className="mt-3 flex flex-col gap-3">
                          {shuffledRightItems.map((item, index) => {
                            const badge = RIGHT_BADGES[index % RIGHT_BADGES.length];
                            return (
                              <div
                                key={item.id}
                                ref={registerRightRef(item.id)}
                                data-right-id={item.id}
                                data-testid={`pair-right-${badge}`}
                                className="flex items-start gap-3 rounded-xl border px-4 py-3 shadow-sm"
                                style={{ backgroundColor: itemBackground, borderColor: itemBorder, color: textColor }}
                              >
                                <span
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-semibold"
                                  style={{ backgroundColor: badgeBackground, borderColor: badgeBorder, color: textColor }}
                                >
                                  {badge}
                                </span>
                                <span className="text-sm font-medium leading-snug break-words" style={{ color: textColor }}>
                                  {item.text}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-center px-6" style={{ color: columnCaptionColor }}>
                    Nie można wyświetlić zawartości. Zwiększ wysokość kafelka.
                  </div>
                )}
              </div>
            )}
          </TaskTileSection>
        </div>

        <div className="flex items-center justify-center pt-1">
          <ValidateButton state={validateState} disabled={!canInteract} onClick={handleValidate} />
        </div>
      </div>
    </div>
  );
};

export type { ValidationResult };
