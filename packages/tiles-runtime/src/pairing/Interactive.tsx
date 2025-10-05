import React, {
  useMemo,
  useState,
  useCallback,
  useLayoutEffect,
  useRef,
  useEffect
} from 'react';
import { Link2, Sparkles } from 'lucide-react';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const leftItemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const rightItemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const hoveredRightIdRef = useRef<string | null>(null);
  const accentColor = tile.content.backgroundColor || '#0f172a';
  const textColor = useMemo(() => getReadableTextColor(accentColor), [accentColor]);
  const canInteract = !isPreview;
  const [connections, setConnections] = useState<Record<string, string>>({});
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [hoveredRightId, setHoveredRightId] = useState<string | null>(null);
  const [activeDrag, setActiveDrag] = useState<
    | {
        leftId: string;
        pointerId: number;
        start: { x: number; y: number };
        current: { x: number; y: number };
      }
    | null
  >(null);
  const [itemPositions, setItemPositions] = useState<{
    left: Record<string, { x: number; y: number }>;
    right: Record<string, { x: number; y: number }>;
  }>({ left: {}, right: {} });
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

  const gradientId = useMemo(() => `pairing-line-${tile.id}`, [tile.id]);

  const resetCheckState = useCallback(() => {
    setIsChecked(false);
    setIsCorrect(null);
  }, []);

  useEffect(() => {
    hoveredRightIdRef.current = hoveredRightId;
  }, [hoveredRightId]);

  const updateItemPositions = useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const leftPositions: Record<string, { x: number; y: number }> = {};
    const rightPositions: Record<string, { x: number; y: number }> = {};

    Object.entries(leftItemRefs.current).forEach(([id, element]) => {
      if (!element) return;
      const rect = element.getBoundingClientRect();
      leftPositions[id] = {
        x: rect.left - containerRect.left + rect.width,
        y: rect.top - containerRect.top + rect.height / 2
      };
    });

    Object.entries(rightItemRefs.current).forEach(([id, element]) => {
      if (!element) return;
      const rect = element.getBoundingClientRect();
      rightPositions[id] = {
        x: rect.left - containerRect.left,
        y: rect.top - containerRect.top + rect.height / 2
      };
    });

    setItemPositions(previous => {
      const isSame = (target: Record<string, { x: number; y: number }>, next: Record<string, { x: number; y: number }>) => {
        const targetIds = Object.keys(target);
        const nextIds = Object.keys(next);
        if (targetIds.length !== nextIds.length) return false;
        return nextIds.every(id => {
          const prevPoint = target[id];
          const nextPoint = next[id];
          if (!prevPoint || !nextPoint) return false;
          return Math.abs(prevPoint.x - nextPoint.x) < 0.5 && Math.abs(prevPoint.y - nextPoint.y) < 0.5;
        });
      };

      if (isSame(previous.left, leftPositions) && isSame(previous.right, rightPositions)) {
        return previous;
      }

      return { left: leftPositions, right: rightPositions };
    });
  }, []);

  useLayoutEffect(() => {
    updateItemPositions();
  });

  useEffect(() => {
    updateItemPositions();
    const handleResize = () => updateItemPositions();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateItemPositions]);

  const finalizeConnection = useCallback(() => {
    setActiveDrag(current => {
      if (!current) return null;
      const targetRightId = hoveredRightIdRef.current;

      if (targetRightId) {
        setConnections(prev => {
          const updated: Record<string, string> = { ...prev };

          Object.entries(updated).forEach(([leftId, rightId]) => {
            if (leftId === current.leftId || rightId === targetRightId) {
              delete updated[leftId];
            }
          });

          updated[current.leftId] = targetRightId;
          return updated;
        });
        resetCheckState();
      }

      const origin = leftItemRefs.current[current.leftId];
      origin?.releasePointerCapture?.(current.pointerId);
      return null;
    });
    setHoveredRightId(null);
    hoveredRightIdRef.current = null;
  }, [resetCheckState]);

  useEffect(() => {
    if (!activeDrag) return;

    const handlePointerMove = (event: PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setActiveDrag(current =>
        current
          ? {
              ...current,
              current: {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
              }
            }
          : null
      );
    };

    const handlePointerUp = () => {
      finalizeConnection();
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [activeDrag, finalizeConnection]);

  useEffect(() => {
    if (isTestingMode) {
      setConnections({});
      setIsChecked(false);
      setIsCorrect(null);
      setHoveredRightId(null);
      hoveredRightIdRef.current = null;
      setActiveDrag(null);
    }
  }, [isTestingMode]);

  const handleLeftPointerDown = useCallback(
    (leftId: string) => (event: React.PointerEvent<HTMLDivElement>) => {
      if (!canInteract) return;
      if (event.button !== 0 && event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
      const container = containerRef.current;
      const element = leftItemRefs.current[leftId];
      if (!container || !element) return;

      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const start = {
        x: elementRect.left - containerRect.left + elementRect.width,
        y: elementRect.top - containerRect.top + elementRect.height / 2
      };

      setActiveDrag({
        leftId,
        pointerId: event.pointerId,
        start,
        current: start
      });
      setHoveredRightId(null);
      hoveredRightIdRef.current = null;
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture?.(event.pointerId);
      resetCheckState();
    },
    [canInteract, resetCheckState]
  );

  const handleLeftPointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  }, []);

  const handleRightPointerEnter = useCallback(
    (rightId: string) => () => {
      if (!activeDrag) return;
      setHoveredRightId(rightId);
    },
    [activeDrag]
  );

  const handleRightPointerLeave = useCallback(
    (rightId: string) => () => {
      setHoveredRightId(current => (current === rightId ? null : current));
    },
    []
  );

  const handleRightPointerUp = useCallback(
    (rightId: string) => (event: React.PointerEvent<HTMLDivElement>) => {
      if (!activeDrag) return;
      setHoveredRightId(rightId);
      hoveredRightIdRef.current = rightId;
      event.preventDefault();
      finalizeConnection();
    },
    [activeDrag, finalizeConnection]
  );

  const handleRightClick = useCallback(
    (rightId: string) => {
      setConnections(prev => {
        const entry = Object.entries(prev).find(([, connectedRight]) => connectedRight === rightId);
        if (!entry) return prev;

        const [leftId] = entry;
        const updated = { ...prev };
        delete updated[leftId];
        return updated;
      });
      resetCheckState();
    },
    [resetCheckState]
  );

  const connectedRightIds = useMemo(() => new Set(Object.values(connections)), [connections]);
  const validationState: ValidateButtonState = isChecked
    ? isCorrect
      ? 'success'
      : 'error'
    : 'idle';
  const isComplete = tile.content.pairs.length > 0 && Object.keys(connections).length === tile.content.pairs.length;

  const checkConnections = useCallback(() => {
    const allCorrect =
      Object.entries(connections).length === tile.content.pairs.length &&
      tile.content.pairs.every(pair => connections[pair.id] === pair.id);

    setIsCorrect(allCorrect);
    setIsChecked(true);
  }, [connections, tile.content.pairs]);

  const handleRetry = useCallback(() => {
    setConnections({});
    setIsChecked(false);
    setIsCorrect(null);
    setHoveredRightId(null);
    hoveredRightIdRef.current = null;
    setActiveDrag(null);
  }, []);

  const connectionPaths = useMemo(() => {
    const paths: Array<{
      leftId: string;
      rightId: string;
      path: string;
    }> = [];

    Object.entries(connections).forEach(([leftId, rightId]) => {
      const start = itemPositions.left[leftId];
      const end = itemPositions.right[rightId];
      if (!start || !end) return;

      const controlOffset = Math.max(Math.abs(end.x - start.x) * 0.35, 60);
      const path = `M ${start.x} ${start.y} C ${start.x + controlOffset} ${start.y}, ${end.x - controlOffset} ${end.y}, ${end.x} ${end.y}`;
      paths.push({ leftId, rightId, path });
    });

    return paths;
  }, [connections, itemPositions.left, itemPositions.right]);

  const activePath = useMemo(() => {
    if (!activeDrag) return null;
    const start = activeDrag.start;
    const current = activeDrag.current;
    const controlOffset = Math.max(Math.abs(current.x - start.x) * 0.35, 60);
    return `M ${start.x} ${start.y} C ${start.x + controlOffset} ${start.y}, ${current.x - controlOffset} ${current.y}, ${current.x} ${current.y}`;
  }, [activeDrag]);

  const getLeftItemStatus = useCallback(
    (leftId: string) => {
      if (activeDrag?.leftId === leftId) return 'active';
      if (connections[leftId]) return 'connected';
      return 'default';
    },
    [activeDrag, connections]
  );

  const getRightItemStatus = useCallback(
    (rightId: string) => {
      if (hoveredRightId === rightId && activeDrag) return 'target';
      if (connectedRightIds.has(rightId)) return 'connected';
      return 'default';
    },
    [activeDrag, connectedRightIds, hoveredRightId]
  );

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
            <div ref={containerRef} className="relative h-full flex flex-col gap-5 lg:flex-row min-h-0">
              <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
                <defs>
                  <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={textColor} stopOpacity={0.22} />
                    <stop offset="50%" stopColor={textColor} stopOpacity={0.38} />
                    <stop offset="100%" stopColor={textColor} stopOpacity={0.22} />
                  </linearGradient>
                </defs>

                {connectionPaths.map(connection => (
                  <path
                    key={`${connection.leftId}-${connection.rightId}`}
                    d={connection.path}
                    stroke={`url(#${gradientId})`}
                    strokeWidth={4}
                    fill="none"
                    strokeLinecap="round"
                    className="drop-shadow-[0_12px_24px_rgba(15,23,42,0.18)]"
                  />
                ))}

                {activePath && (
                  <path
                    d={activePath}
                    stroke={textColor}
                    strokeWidth={3}
                    strokeDasharray="8 8"
                    fill="none"
                    strokeLinecap="round"
                    className="opacity-75"
                  />
                )}
              </svg>

              <div className="flex-1 min-h-0 flex flex-col">
                <div className="text-xs uppercase tracking-[0.28em] font-semibold" style={{ color: columnCaptionColor }}>
                  Elementy
                </div>
                <div className="mt-3 flex-1 min-h-0 overflow-y-auto space-y-3 pr-1" style={{ touchAction: 'none' }}>
                  {tile.content.pairs.map((pair, index) => {
                    const status = getLeftItemStatus(pair.id);
                    const isConnected = status === 'connected';
                    const isActive = status === 'active';
                    const connectedRightId = connections[pair.id];
                    const connectionIndex = connectedRightId
                      ? shuffledRightItems.findIndex(item => item.id === connectedRightId)
                      : -1;
                    const connectionLetter =
                      connectionIndex >= 0 ? String.fromCharCode(65 + (connectionIndex % 26)) : null;

                    return (
                      <div
                        key={pair.id}
                        ref={node => {
                          leftItemRefs.current[pair.id] = node;
                        }}
                        className="relative flex items-start gap-3 rounded-xl border px-4 py-3 shadow-sm cursor-pointer select-none transition-all duration-200"
                        style={{
                          backgroundColor: itemBackground,
                          borderColor:
                            isActive || isConnected
                              ? badgeBorder
                              : itemBorder,
                          color: textColor,
                          boxShadow: isActive ? '0 10px 24px rgba(15, 23, 42, 0.18)' : undefined,
                          transform: isActive ? 'scale(0.98)' : undefined
                        }}
                        onPointerDown={handleLeftPointerDown(pair.id)}
                        onPointerUp={handleLeftPointerUp}
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
                        {connectionLetter && (
                          <span
                            className="absolute -right-2 -top-2 h-6 w-6 rounded-full border flex items-center justify-center text-xs font-semibold"
                            style={{ backgroundColor: badgeBackground, borderColor: badgeBorder, color: textColor }}
                          >
                            {connectionLetter}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex-1 min-h-0 flex flex-col">
                <div className="text-xs uppercase tracking-[0.28em] font-semibold" style={{ color: columnCaptionColor }}>
                  Odpowiedzi
                </div>
                <div className="mt-3 flex-1 min-h-0 overflow-y-auto space-y-3 pr-1" style={{ touchAction: 'none' }}>
                  {shuffledRightItems.map((item, index) => {
                    const status = getRightItemStatus(item.id);
                    const isConnected = status === 'connected';
                    const isTarget = status === 'target';
                    const leftConnection = Object.keys(connections).find(leftId => connections[leftId] === item.id);
                    const leftIndex = leftConnection
                      ? tile.content.pairs.findIndex(pair => pair.id === leftConnection)
                      : -1;
                    const leftBadge = leftIndex >= 0 ? leftIndex + 1 : null;

                    return (
                      <div
                        key={item.id}
                        ref={node => {
                          rightItemRefs.current[item.id] = node;
                        }}
                        className="relative flex items-start gap-3 rounded-xl border px-4 py-3 shadow-sm transition-all duration-200 select-none"
                        style={{
                          backgroundColor: itemBackground,
                          borderColor: isTarget ? badgeBorder : isConnected ? badgeBorder : itemBorder,
                          color: textColor,
                          boxShadow: isTarget ? '0 12px 28px rgba(15, 23, 42, 0.22)' : undefined,
                          transform: isTarget ? 'scale(1.02)' : undefined,
                          cursor: isConnected ? 'pointer' : activeDrag ? 'copy' : canInteract ? 'pointer' : 'default'
                        }}
                        onPointerEnter={handleRightPointerEnter(item.id)}
                        onPointerLeave={handleRightPointerLeave(item.id)}
                        onPointerUp={handleRightPointerUp(item.id)}
                        onClick={() => {
                          if (!canInteract || activeDrag) return;
                          handleRightClick(item.id);
                        }}
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
                        {leftBadge && (
                          <span
                            className="absolute -right-2 -top-2 h-6 w-6 rounded-full border flex items-center justify-center text-xs font-semibold"
                            style={{ backgroundColor: badgeBackground, borderColor: badgeBorder, color: textColor }}
                          >
                            {leftBadge}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </TaskTileSection>

        <div className="flex flex-col items-center gap-2 pt-1">
          <ValidateButton
            state={validationState}
            disabled={!canInteract || !isComplete}
            onClick={checkConnections}
            onRetry={handleRetry}
          />
        </div>
      </div>
    </div>
  );
};
