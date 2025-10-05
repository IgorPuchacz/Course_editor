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
  ValidateButton,
  ValidateButtonState
} from 'ui-primitives';
import { PairConnectionLayer, type LineColorResolver, type Temp } from './PairConnectionLayer';
import { useElementSize } from './useElementSize';

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

export type ValidationResult = {
  correct: Set<string>;
  incorrect: Set<string>;
  missing: Set<string>;
};

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

const VERTICAL_GAP = 12; // px, matches gap-3

const initialDragState: Temp = { active: false, x: 0, y: 0, leftId: null };

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
  const [connections, setConnections] = useState<Map<string, string>>(() => new Map());
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [validateState, setValidateState] = useState<ValidateButtonState>('idle');
  const [drag, setDrag] = useState<Temp>(initialDragState);
  const contentRef = useRef<HTMLDivElement>(null);
  const templateRef = useRef<HTMLDivElement>(null);
  const leftRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const rightRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { w: contentWidth, h: contentHeight } = useElementSize(contentRef);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [verticalPadding, setVerticalPadding] = useState(0);
  const [itemHeight, setItemHeight] = useState(0);

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
  const neutralLineColor = badgeBorder;
  const successLineColor = '#16a34a';
  const errorLineColor = '#ef4444';

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

  const measureLayout = useCallback(() => {
    const container = contentRef.current;
    if (!container) return;

    const wrapper = container.parentElement as HTMLElement | null;
    if (wrapper) {
      const styles = window.getComputedStyle(wrapper);
      const paddingTop = parseFloat(styles.paddingTop || '0');
      const paddingBottom = parseFloat(styles.paddingBottom || '0');
      setVerticalPadding(paddingTop + paddingBottom);
    }

    const headerElement = wrapper?.previousElementSibling as HTMLElement | null;
    if (headerElement) {
      const rect = headerElement.getBoundingClientRect();
      setHeaderHeight(rect.height);
    }

    const template = templateRef.current;
    if (template) {
      const rect = template.getBoundingClientRect();
      if (rect.height > 0) {
        setItemHeight(rect.height);
      }
    }
  }, []);

  useLayoutEffect(() => {
    measureLayout();
  }, [measureLayout, contentWidth, tile.content.pairs]);

  const pairsCount = tile.content.pairs.length;
  const availableHeight = headerHeight + verticalPadding + contentHeight;
  const itemsTotalHeight = pairsCount > 0 ? pairsCount * (itemHeight + VERTICAL_GAP) - VERTICAL_GAP : 0;
  const requiredHeight = headerHeight + verticalPadding + itemsTotalHeight;
  const metricsReady = itemHeight > 0 && contentHeight > 0;
  const exceedsAvailableHeight = metricsReady && pairsCount > 0 && requiredHeight > availableHeight;

  const connectPair = useCallback(
    (leftId: string, rightId: string) => {
      setConnections(prev => {
        const next = new Map(prev);
        for (const [existingLeftId, existingRightId] of next.entries()) {
          if (existingRightId === rightId && existingLeftId !== leftId) {
            next.delete(existingLeftId);
          }
        }
        next.set(leftId, rightId);
        return next;
      });
    },
    []
  );

  const handleLeftMouseDown = useCallback(
    (leftId: string) => (event: React.MouseEvent<HTMLDivElement>) => {
      if (!canInteract || event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      setDrag({ active: true, leftId, x: event.clientX, y: event.clientY });
    },
    [canInteract]
  );

  // Geometry-based hit test for right cards
  const hitTestRightId = useCallback((clientX: number, clientY: number): string | null => {
    const entries = Object.entries(rightRefs.current) as Array<[string, HTMLDivElement | null]>;
    for (const [rightId, el] of entries) {
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
        return rightId;
      }
    }
    return null;
  }, []);

  useEffect(() => {
    if (!drag.active || !drag.leftId || !canInteract) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      setDrag(prev => {
        if (!prev.active) return prev;
        return { ...prev, x: event.clientX, y: event.clientY };
      });
    };

    const handleMouseUp = (event: MouseEvent) => {
      setDrag(prev => {
        if (!prev.active || !prev.leftId) {
          return initialDragState;
        }

        const rightId = hitTestRightId(event.clientX, event.clientY);
        if (rightId) {
          connectPair(prev.leftId, rightId);
        }

        return initialDragState;
      });
    };

    window.addEventListener('mousemove', handleMouseMove, true);
    window.addEventListener('mouseup', handleMouseUp, true);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove, true);
      window.removeEventListener('mouseup', handleMouseUp, true);
    };
  }, [drag.active, drag.leftId, canInteract, connectPair, hitTestRightId]);

  useEffect(() => {
    if (!onAnswerChange) return;
    onAnswerChange(
      Array.from(connections.entries()).map(([leftId, rightId]) => ({ leftId, rightId }))
    );
  }, [connections, onAnswerChange]);

  useEffect(() => {
    if (!validationResult) {
      return;
    }
    setValidationResult(null);
    setValidateState('idle');
  }, [connections]);

  useEffect(() => {
    setConnections(prev => {
      const validIds = new Set(tile.content.pairs.map(pair => pair.id));
      const next = new Map<string, string>();
      let changed = prev.size > tile.content.pairs.length;

      for (const [leftId, rightId] of prev.entries()) {
        if (validIds.has(leftId) && validIds.has(rightId)) {
          next.set(leftId, rightId);
        } else {
          changed = true;
        }
      }

      if (!changed && next.size === prev.size) {
        return prev;
      }

      return next;
    });
    setValidationResult(null);
    setValidateState('idle');
  }, [tile.content.pairs]);

  const getLineColor = useCallback<LineColorResolver>(
    leftId => {
      if (!validationResult) {
        return neutralLineColor;
      }

      if (validationResult.correct.has(leftId)) {
        return successLineColor;
      }

      if (validationResult.incorrect.has(leftId)) {
        return errorLineColor;
      }

      return neutralLineColor;
    },
    [errorLineColor, neutralLineColor, successLineColor, validationResult]
  );

  const handleValidate = useCallback(() => {
    const correct = new Set<string>();
    const incorrect = new Set<string>();
    const missing = new Set<string>();

    tile.content.pairs.forEach(pair => {
      const linked = connections.get(pair.id);
      if (!linked) {
        missing.add(pair.id);
        return;
      }

      if (linked === pair.id) {
        correct.add(pair.id);
      } else {
        incorrect.add(pair.id);
      }
    });

    const result: ValidationResult = { correct, incorrect, missing };
    setValidationResult(result);
    const isSuccess = incorrect.size === 0 && missing.size === 0 && correct.size === pairsCount;
    setValidateState(isSuccess ? 'success' : 'error');
    onValidate?.(result);
  }, [connections, onValidate, pairsCount, tile.content.pairs]);

  const handleRetry = useCallback(() => {
    setValidationResult(null);
    setValidateState('idle');
  }, []);

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
          <div ref={contentRef} className="relative h-full overflow-hidden">
            {pairsCount === 0 ? (
              <div
                className="absolute inset-0 flex items-center justify-center text-sm"
                style={{ color: columnCaptionColor }}
              >
                Dodaj pary w panelu edycji, aby zobaczyć podgląd układu.
              </div>
            ) : exceedsAvailableHeight ? (
              <div
                className="absolute inset-0 flex items-center justify-center text-center text-sm"
                style={{ color: columnCaptionColor }}
              >
                Nie można wyświetlić zawartości. Zwiększ wysokość kafelka.
              </div>
            ) : (
              <>
                <PairConnectionLayer
                  containerRef={contentRef}
                  leftRefs={leftRefs.current}
                  rightRefs={rightRefs.current}
                  connections={connections}
                  getLineColor={getLineColor}
                  temp={drag}
                />
                <div className="relative z-10 flex h-full gap-6 overflow-hidden">
                  <div className="flex-1 flex flex-col gap-3 overflow-hidden">
                    {tile.content.pairs.map((pair, index) => {
                      const isActive = drag.active && drag.leftId === pair.id;
                      return (
                        <div
                          key={pair.id}
                          ref={element => {
                            leftRefs.current[pair.id] = element;
                          }}
                          onMouseDown={handleLeftMouseDown(pair.id)}
                          className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-sm select-none transition-colors ${
                            canInteract ? 'cursor-grab active:cursor-grabbing' : ''
                          } ${isActive ? 'cursor-grabbing' : ''}`}
                          style={{
                            backgroundColor: itemBackground,
                            borderColor: itemBorder,
                            color: textColor
                          }}
                          data-testid={`pair-left-${index}`}
                        >
                          <span
                            className="flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-semibold"
                            style={{
                              backgroundColor: badgeBackground,
                              borderColor: badgeBorder,
                              color: textColor
                            }}
                          >
                            {index + 1}
                          </span>
                          <span
                            className="text-sm font-medium leading-snug break-words"
                            style={{ color: textColor }}
                          >
                            {pair.left}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex-1 flex flex-col gap-3 overflow-hidden">
                    {shuffledRightItems.map((item, index) => {
                      const letter = String.fromCharCode(65 + (index % 26));
                      return (
                        <div
                          key={item.id}
                          ref={element => {
                            rightRefs.current[item.id] = element;
                          }}
                          data-right-id={item.id}
                          className="flex items-start gap-3 rounded-xl border px-4 py-3 shadow-sm select-none"
                          style={{
                            backgroundColor: itemBackground,
                            borderColor: itemBorder,
                            color: textColor
                          }}
                          data-testid={`pair-right-${letter}`}
                        >
                          <span
                            className="flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-semibold"
                            style={{
                              backgroundColor: badgeBackground,
                              borderColor: badgeBorder,
                              color: textColor
                            }}
                          >
                            {letter}
                          </span>
                          <span
                            className="text-sm font-medium leading-snug break-words"
                            style={{ color: textColor }}
                          >
                            {item.text}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="pointer-events-none absolute inset-0 opacity-0">
                  <div className="flex h-full gap-6">
                    <div className="flex-1 flex flex-col gap-3">
                      <div
                        ref={templateRef}
                        className="flex items-start gap-3 rounded-xl border px-4 py-3 shadow-sm"
                        style={{
                          backgroundColor: itemBackground,
                          borderColor: itemBorder,
                          color: textColor
                        }}
                      >
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-semibold"
                          style={{
                            backgroundColor: badgeBackground,
                            borderColor: badgeBorder,
                            color: textColor
                          }}
                        >
                          1
                        </span>
                        <span
                          className="text-sm font-medium leading-snug break-words"
                          style={{ color: textColor }}
                        >
                          {tile.content.pairs[0]?.left ?? ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </TaskTileSection>

        <div className="flex items-center justify-center pt-1">
          <ValidateButton
            state={validateState}
            disabled={!canInteract || pairsCount === 0}
            onClick={handleValidate}
            onRetry={handleRetry}
          />
        </div>
      </div>
    </div>
  );
};

export default PairingInteractive;
