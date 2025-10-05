import React, {
  useMemo,
  useState,
  useCallback,
  useRef,
  useLayoutEffect,
  useEffect
} from 'react';
import { Link2, Shuffle, Sparkles } from 'lucide-react';
import { PairingTile } from 'tiles-core';
import { createSurfacePalette, getReadableTextColor } from 'tiles-core/utils';
import {
  TaskInstructionPanel,
  TaskTileSection,
  TileInstructionContent,
  ValidateButton,
  type ValidateButtonState
} from 'ui-primitives';

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

interface Connection {
  leftId: string;
  rightId: string;
}

interface LineSegment extends Connection {
  id: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
}

interface ActiveConnection {
  source: 'left' | 'right';
  id: string;
  start: { x: number; y: number };
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
  const filterId = useMemo(() => `pairing-line-shadow-${tile.id}`, [tile.id]);
  const canInteract = !isPreview;
  const [connections, setConnections] = useState<Connection[]>([]);
  const [lineSegments, setLineSegments] = useState<LineSegment[]>([]);
  const [activeConnection, setActiveConnection] = useState<ActiveConnection | null>(null);
  const [pointerPosition, setPointerPosition] = useState<{ x: number; y: number } | null>(null);
  const [activePointerId, setActivePointerId] = useState<number | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [hoveredTarget, setHoveredTarget] = useState<{ side: 'left' | 'right'; id: string } | null>(
    null
  );
  const containerRef = useRef<HTMLDivElement | null>(null);
  const leftItemRefs = useRef(new Map<string, HTMLDivElement | null>());
  const rightItemRefs = useRef(new Map<string, HTMLDivElement | null>());

  const validationState: ValidateButtonState = isChecked
    ? isCorrect
      ? 'success'
      : 'error'
    : 'idle';
  const registerLeftItem = useCallback(
    (id: string) => (node: HTMLDivElement | null) => {
      if (node) {
        leftItemRefs.current.set(id, node);
      } else {
        leftItemRefs.current.delete(id);
      }
    },
    []
  );

  const registerRightItem = useCallback(
    (id: string) => (node: HTMLDivElement | null) => {
      if (node) {
        rightItemRefs.current.set(id, node);
      } else {
        rightItemRefs.current.delete(id);
      }
    },
    []
  );

  const resetEvaluation = useCallback(() => {
    if (isChecked) {
      setIsChecked(false);
      setIsCorrect(null);
    }
  }, [isChecked]);

  const finalizeInteraction = useCallback(() => {
    setActiveConnection(null);
    setPointerPosition(null);
    setActivePointerId(null);
    setHoveredTarget(null);
    if (typeof document !== 'undefined') {
      document.body.style.userSelect = '';
    }
  }, []);

  const finalizeConnection = useCallback(
    (leftId: string, rightId: string) => {
      setConnections(previous => {
        const filtered = previous.filter(
          connection => connection.leftId !== leftId && connection.rightId !== rightId
        );

        return [...filtered, { leftId, rightId }];
      });
      resetEvaluation();
    },
    [resetEvaluation]
  );

  const updateLineSegments = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();

    const segments = connections
      .map(connection => {
        const leftNode = leftItemRefs.current.get(connection.leftId);
        const rightNode = rightItemRefs.current.get(connection.rightId);

        if (!leftNode || !rightNode) {
          return null;
        }

        const leftRect = leftNode.getBoundingClientRect();
        const rightRect = rightNode.getBoundingClientRect();

        return {
          id: `${connection.leftId}-${connection.rightId}`,
          leftId: connection.leftId,
          rightId: connection.rightId,
          start: {
            x: leftRect.right - containerRect.left,
            y: leftRect.top + leftRect.height / 2 - containerRect.top
          },
          end: {
            x: rightRect.left - containerRect.left,
            y: rightRect.top + rightRect.height / 2 - containerRect.top
          }
        } satisfies LineSegment;
      })
      .filter((segment): segment is LineSegment => segment !== null);

    setLineSegments(segments);
  }, [connections]);

  useLayoutEffect(() => {
    updateLineSegments();
  }, [updateLineSegments, tile.content.pairs, shuffledRightItems]);

  useEffect(() => {
    const handleResize = () => updateLineSegments();

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [updateLineSegments]);

  useEffect(() => finalizeInteraction, [finalizeInteraction]);

  useEffect(() => {
    if (activePointerId === null) return;

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerId !== activePointerId) return;

      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      setPointerPosition({
        x: event.clientX - containerRect.left,
        y: event.clientY - containerRect.top
      });
    };

    const handlePointerEnd = (event: PointerEvent) => {
      if (event.pointerId !== activePointerId) return;
      finalizeInteraction();
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerEnd);
    window.addEventListener('pointercancel', handlePointerEnd);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerEnd);
      window.removeEventListener('pointercancel', handlePointerEnd);
    };
  }, [activePointerId, finalizeInteraction]);

  useEffect(() => {
    setConnections([]);
    setLineSegments([]);
    setIsChecked(false);
    setIsCorrect(null);
    setHoveredTarget(null);
  }, [tile.id, tile.content.pairs, isTestingMode]);

  const allPairsConnected = useMemo(
    () =>
      tile.content.pairs.length > 0 &&
      connections.length === tile.content.pairs.length &&
      tile.content.pairs.every(pair =>
        connections.some(connection => connection.leftId === pair.id)
      ),
    [connections, tile.content.pairs]
  );

  const handleValidate = useCallback(() => {
    const isSolutionCorrect = tile.content.pairs.every(pair =>
      connections.some(connection => connection.leftId === pair.id && connection.rightId === pair.id)
    );

    setIsChecked(true);
    setIsCorrect(isSolutionCorrect);
  }, [connections, tile.content.pairs]);

  const handleListScroll = useCallback(() => {
    updateLineSegments();
  }, [updateLineSegments]);

  const getConnectionStatus = useCallback(
    (pairId: string, side: 'left' | 'right') => {
      const connection = connections.find(entry =>
        side === 'left' ? entry.leftId === pairId : entry.rightId === pairId
      );
      if (!connection) return null;

      if (!isChecked) {
        return 'active';
      }

      const isMatch = connection.leftId === connection.rightId;
      return isMatch ? 'correct' : 'incorrect';
    },
    [connections, isChecked]
  );

  const getItemStyle = useCallback(
    (id: string, side: 'left' | 'right'): React.CSSProperties => {
      const status = getConnectionStatus(id, side);
      const isActive = activeConnection?.id === id && activeConnection.source === side;
      const isHovered = hoveredTarget?.id === id && hoveredTarget.side === side;

      let backgroundColor = itemBackground;
      let borderColor = itemBorder;
      let boxShadow: string | undefined;

      if (status === 'correct') {
        borderColor = successBorderColor;
        backgroundColor = successBackgroundColor;
      } else if (status === 'incorrect') {
        borderColor = errorBorderColor;
        backgroundColor = errorBackgroundColor;
      } else if (status === 'active') {
        borderColor = accentColor;
        boxShadow = hoverShadow;
      }

      if (isHovered) {
        borderColor = accentColor;
        boxShadow = hoverShadow;
      }

      if (isActive) {
        borderColor = accentColor;
        boxShadow = activeShadow;
      }

      return {
        backgroundColor,
        borderColor,
        color: textColor,
        boxShadow
      };
    },
    [
      accentColor,
      activeConnection,
      activeShadow,
      errorBackgroundColor,
      errorBorderColor,
      getConnectionStatus,
      hoverShadow,
      hoveredTarget,
      itemBackground,
      itemBorder,
      successBackgroundColor,
      successBorderColor,
      textColor
    ]
  );

  const buildConnectionPath = useCallback((start: { x: number; y: number }, end: { x: number; y: number }) => {
    const horizontalDistance = Math.max(Math.abs(end.x - start.x), 120);
    const control = horizontalDistance * 0.35;

    return `M ${start.x} ${start.y} C ${start.x + control} ${start.y}, ${end.x - control} ${end.y}, ${end.x} ${end.y}`;
  }, []);

  const handleStartConnection = useCallback(
    (source: 'left' | 'right', id: string, event: React.PointerEvent<HTMLDivElement>) => {
      if (!canInteract) return;

      event.preventDefault();
      event.stopPropagation();

      const container = containerRef.current;
      if (!container) return;

      const node = (source === 'left' ? leftItemRefs : rightItemRefs).current.get(id);
      if (!node) return;

      const containerRect = container.getBoundingClientRect();
      const nodeRect = node.getBoundingClientRect();

      const start = {
        x:
          source === 'left'
            ? nodeRect.right - containerRect.left
            : nodeRect.left - containerRect.left,
        y: nodeRect.top + nodeRect.height / 2 - containerRect.top
      };

      setActiveConnection({ source, id, start });
      setPointerPosition({
        x: event.clientX - containerRect.left,
        y: event.clientY - containerRect.top
      });
      setActivePointerId(event.pointerId);
      setHoveredTarget(null);
      if (typeof document !== 'undefined') {
        document.body.style.userSelect = 'none';
      }
    },
    [canInteract]
  );

  const handleCompleteConnection = useCallback(
    (target: 'left' | 'right', id: string, event: React.PointerEvent<HTMLDivElement>) => {
      if (!canInteract) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (!activeConnection || activePointerId !== event.pointerId) {
        if (activePointerId === event.pointerId) {
          finalizeInteraction();
        }
        return;
      }

      if (activeConnection.source === target) {
        finalizeInteraction();
        return;
      }

      const leftId = activeConnection.source === 'left' ? activeConnection.id : id;
      const rightId = activeConnection.source === 'right' ? activeConnection.id : id;

      finalizeConnection(leftId, rightId);
      finalizeInteraction();
      updateLineSegments();
      setHoveredTarget(null);
    },
    [
      activeConnection,
      activePointerId,
      canInteract,
      finalizeConnection,
      finalizeInteraction,
      updateLineSegments
    ]
  );
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
  const successBorderColor = textColor === '#0f172a' ? '#16a34a' : '#bbf7d0';
  const successBackgroundColor = textColor === '#0f172a' ? '#dcfce7' : 'rgba(134, 239, 172, 0.28)';
  const errorBorderColor = textColor === '#0f172a' ? '#ef4444' : '#fca5a5';
  const errorBackgroundColor = textColor === '#0f172a' ? '#fee2e2' : 'rgba(248, 113, 113, 0.28)';
  const hoverShadow = textColor === '#0f172a'
    ? '0 18px 36px rgba(15, 23, 42, 0.18)'
    : '0 18px 36px rgba(15, 23, 42, 0.4)';
  const activeShadow = textColor === '#0f172a'
    ? '0 20px 44px rgba(15, 23, 42, 0.22)'
    : '0 20px 44px rgba(15, 23, 42, 0.48)';
  const defaultLineColor = accentColor;
  const successLineColor = textColor === '#0f172a' ? '#16a34a' : '#bbf7d0';
  const errorLineColor = textColor === '#0f172a' ? '#ef4444' : '#fca5a5';

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
          {tile.content.pairs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm" style={{ color: columnCaptionColor }}>
              Dodaj pary w panelu edycji, aby zobaczyć podgląd układu.
            </div>
          ) : (
            <div ref={containerRef} className="relative h-full">
              <svg className="pointer-events-none absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="rgba(15,23,42,0.22)" />
                  </filter>
                </defs>
                {lineSegments.map(segment => {
                  const status = getConnectionStatus(segment.leftId, 'left');
                  const color =
                    status === 'correct'
                      ? successLineColor
                      : status === 'incorrect'
                      ? errorLineColor
                      : defaultLineColor;

                  return (
                    <g key={segment.id} filter={`url(#${filterId})`}>
                      <path
                        d={buildConnectionPath(segment.start, segment.end)}
                        stroke={color}
                        strokeWidth={status === 'incorrect' ? 4 : 3.5}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </g>
                  );
                })}

                {activeConnection && pointerPosition && (
                  <g filter={`url(#${filterId})`}>
                    <path
                      d={buildConnectionPath(activeConnection.start, pointerPosition)}
                      stroke={defaultLineColor}
                      strokeWidth={3}
                      strokeDasharray="6 6"
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </g>
                )}
              </svg>

              <div className="relative z-10 flex h-full flex-col gap-5 lg:flex-row min-h-0">
                <div className="flex-1 min-h-0 flex flex-col">
                  <div
                    className="flex items-center gap-2 text-xs uppercase tracking-[0.2em]"
                    style={{ color: columnCaptionColor }}
                  >
                    <Link2 className="h-4 w-4" />
                    <span>kolumna A</span>
                  </div>
                  <div
                    className="mt-3 flex-1 min-h-0 overflow-y-auto space-y-3 pr-1"
                    onScroll={handleListScroll}
                  >
                    {tile.content.pairs.map((pair, index) => (
                      <div
                        key={pair.id}
                        ref={registerLeftItem(pair.id)}
                        onPointerDown={event => handleStartConnection('left', pair.id, event)}
                        onPointerUp={event => handleCompleteConnection('left', pair.id, event)}
                        onPointerEnter={() => {
                          if (activeConnection && activeConnection.source !== 'left') {
                            setHoveredTarget({ side: 'left', id: pair.id });
                          }
                        }}
                        onPointerLeave={() => {
                          setHoveredTarget(current =>
                            current && current.side === 'left' && current.id === pair.id ? null : current
                          );
                        }}
                        className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-sm transition-all duration-200 ${
                          canInteract ? 'cursor-pointer select-none' : ''
                        }`}
                        style={getItemStyle(pair.id, 'left')}
                      >
                        <span
                          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border text-sm font-semibold"
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
                  <div
                    className="flex items-center gap-2 text-xs uppercase tracking-[0.2em]"
                    style={{ color: columnCaptionColor }}
                  >
                    <Shuffle className="h-4 w-4" />
                    <span>kolumna B</span>
                  </div>
                  <div
                    className="mt-3 flex-1 min-h-0 overflow-y-auto space-y-3 pr-1"
                    onScroll={handleListScroll}
                  >
                    {shuffledRightItems.map((item, index) => (
                      <div
                        key={item.id}
                        ref={registerRightItem(item.id)}
                        onPointerDown={event => handleStartConnection('right', item.id, event)}
                        onPointerUp={event => handleCompleteConnection('right', item.id, event)}
                        onPointerEnter={() => {
                          if (activeConnection && activeConnection.source !== 'right') {
                            setHoveredTarget({ side: 'right', id: item.id });
                          }
                        }}
                        onPointerLeave={() => {
                          setHoveredTarget(current =>
                            current && current.side === 'right' && current.id === item.id ? null : current
                          );
                        }}
                        className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-sm transition-all duration-200 ${
                          canInteract ? 'cursor-pointer select-none' : ''
                        }`}
                        style={getItemStyle(item.id, 'right')}
                      >
                        <span
                          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border text-sm font-semibold"
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
            </div>
          )}
        </TaskTileSection>

        <div className="flex flex-col items-center gap-2 pt-2">
          <ValidateButton
            state={validationState}
            disabled={!canInteract || !allPairsConnected}
            onClick={handleValidate}
          />
          {isChecked && (
            <span
              className="text-xs font-medium"
              style={{ color: isCorrect ? successLineColor : errorLineColor }}
            >
              {isCorrect ? 'Świetnie! Wszystkie pary są poprawnie połączone.' : 'Spróbuj ponownie i sprawdź połączenia.'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
