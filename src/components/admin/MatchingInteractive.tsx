import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle, Link2, RotateCcw, Shuffle, Sparkles, XCircle } from 'lucide-react';
import { MatchingTile } from '../../types/lessonEditor';
import { TaskInstructionPanel } from './common/TaskInstructionPanel';

interface MatchingInteractiveProps {
  tile: MatchingTile;
  isPreview?: boolean;
  isTestingMode?: boolean;
  onRequestTextEditing?: () => void;
  instructionContent?: React.ReactNode;
  variant?: 'standalone' | 'embedded';
}

interface MatchingItem {
  pairId: string;
  text: string;
}

interface Connection {
  leftId: string;
  rightId: string;
}

interface LineSegment {
  leftId: string;
  rightId: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
  isCorrect: boolean | null;
}

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  if (!hex) return null;

  let normalized = hex.replace('#', '').trim();
  if (normalized.length === 3) {
    normalized = normalized
      .split('')
      .map(char => `${char}${char}`)
      .join('');
  }

  if (normalized.length !== 6) return null;

  const intValue = Number.parseInt(normalized, 16);
  if (Number.isNaN(intValue)) return null;

  return {
    r: (intValue >> 16) & 255,
    g: (intValue >> 8) & 255,
    b: intValue & 255
  };
};

const channelToLinear = (value: number): number => {
  const scaled = value / 255;
  return scaled <= 0.03928 ? scaled / 12.92 : Math.pow((scaled + 0.055) / 1.055, 2.4);
};

const getReadableTextColor = (hex: string): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#f8fafc';

  const luminance =
    0.2126 * channelToLinear(rgb.r) +
    0.7152 * channelToLinear(rgb.g) +
    0.0722 * channelToLinear(rgb.b);

  return luminance > 0.6 ? '#0f172a' : '#f8fafc';
};

const lightenColor = (hex: string, amount: number): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const lightenChannel = (channel: number) => Math.round(channel + (255 - channel) * amount);
  return `rgb(${lightenChannel(rgb.r)}, ${lightenChannel(rgb.g)}, ${lightenChannel(rgb.b)})`;
};

const darkenColor = (hex: string, amount: number): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const darkenChannel = (channel: number) => Math.round(channel * (1 - amount));
  return `rgb(${darkenChannel(rgb.r)}, ${darkenChannel(rgb.g)}, ${darkenChannel(rgb.b)})`;
};

const surfaceColor = (accent: string, textColor: string, lightenAmount: number, darkenAmount: number): string =>
  textColor === '#0f172a' ? lightenColor(accent, lightenAmount) : darkenColor(accent, darkenAmount);

export const MatchingInteractive: React.FC<MatchingInteractiveProps> = ({
  tile,
  isPreview = false,
  isTestingMode = false,
  onRequestTextEditing,
  instructionContent,
  variant = 'embedded'
}) => {
  const [rightItems, setRightItems] = useState<MatchingItem[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [activeLeftId, setActiveLeftId] = useState<string | null>(null);
  const [pointerPosition, setPointerPosition] = useState<{ x: number; y: number } | null>(null);
  const [lineSegments, setLineSegments] = useState<LineSegment[]>([]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const leftRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const rightRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const accentColor = tile.content.backgroundColor || '#0f172a';
  const textColor = useMemo(() => getReadableTextColor(accentColor), [accentColor]);
  const gradientStart = useMemo(() => lightenColor(accentColor, 0.08), [accentColor]);
  const gradientEnd = useMemo(() => darkenColor(accentColor, 0.08), [accentColor]);
  const frameBorderColor = useMemo(
    () => surfaceColor(accentColor, textColor, 0.52, 0.6),
    [accentColor, textColor]
  );
  const panelBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.64, 0.45),
    [accentColor, textColor]
  );
  const panelBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.5, 0.58),
    [accentColor, textColor]
  );
  const iconBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.56, 0.5),
    [accentColor, textColor]
  );
  const mutedLabelColor = textColor === '#0f172a' ? '#475569' : '#dbeafe';
  const subtleCaptionColor = textColor === '#0f172a' ? '#64748b' : '#e2e8f0';
  const testingCaptionColor = useMemo(
    () => surfaceColor(accentColor, textColor, 0.42, 0.4),
    [accentColor, textColor]
  );
  const boardBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.6, 0.42),
    [accentColor, textColor]
  );
  const boardBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.5, 0.56),
    [accentColor, textColor]
  );
  const columnBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.64, 0.4),
    [accentColor, textColor]
  );
  const columnBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.54, 0.52),
    [accentColor, textColor]
  );
  const itemBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.56, 0.48),
    [accentColor, textColor]
  );
  const itemBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.46, 0.6),
    [accentColor, textColor]
  );
  const itemActiveBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.7, 0.34),
    [accentColor, textColor]
  );
  const itemActiveBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.62, 0.42),
    [accentColor, textColor]
  );
  const itemConnectedBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.52, 0.5),
    [accentColor, textColor]
  );
  const itemConnectedBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.46, 0.62),
    [accentColor, textColor]
  );
  const itemCorrectBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.72, 0.26),
    [accentColor, textColor]
  );
  const itemCorrectBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.62, 0.36),
    [accentColor, textColor]
  );
  const badgeBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.54, 0.48),
    [accentColor, textColor]
  );
  const badgeBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.46, 0.58),
    [accentColor, textColor]
  );
  const badgeTextColor = textColor === '#0f172a' ? '#1f2937' : '#f8fafc';
  const successIconColor = textColor === '#0f172a' ? darkenColor(accentColor, 0.2) : lightenColor(accentColor, 0.32);
  const successFeedbackBackground = surfaceColor(accentColor, textColor, 0.7, 0.34);
  const successFeedbackBorder = surfaceColor(accentColor, textColor, 0.6, 0.44);
  const failureFeedbackBackground = '#fee2e2';
  const failureFeedbackBorder = '#fca5a5';
  const primaryButtonBackground = textColor === '#0f172a' ? darkenColor(accentColor, 0.25) : lightenColor(accentColor, 0.28);
  const primaryButtonTextColor = textColor === '#0f172a' ? '#f8fafc' : '#0f172a';
  const secondaryButtonBackground = surfaceColor(accentColor, textColor, 0.52, 0.5);
  const secondaryButtonBorder = surfaceColor(accentColor, textColor, 0.46, 0.58);
  const lineColor = surfaceColor(accentColor, textColor, 0.44, 0.58);
  const pointerLineColor = textColor === '#0f172a' ? darkenColor(accentColor, 0.3) : lightenColor(accentColor, 0.3);
  const showBorder = tile.content.showBorder !== false;
  const isEmbedded = variant === 'embedded';
  const canInteract = !isPreview;

  const leftItems = useMemo<MatchingItem[]>(
    () => tile.content.pairs.map(pair => ({ pairId: pair.id, text: pair.left })),
    [tile.content.pairs]
  );
  const baseRightItems = useMemo<MatchingItem[]>(
    () => tile.content.pairs.map(pair => ({ pairId: pair.id, text: pair.right })),
    [tile.content.pairs]
  );
  const leftOrder = useMemo(() => tile.content.pairs.map(pair => pair.id), [tile.content.pairs]);

  const connectionMap = useMemo(
    () => new Map(connections.map(conn => [conn.leftId, conn.rightId])),
    [connections]
  );
  const rightConnectionMap = useMemo(
    () => new Map(connections.map(conn => [conn.rightId, conn.leftId])),
    [connections]
  );

  const shuffleRightItems = useCallback((): MatchingItem[] => {
    if (baseRightItems.length <= 1) return baseRightItems;

    let shuffled = [...baseRightItems];
    const isAligned = (items: MatchingItem[]) =>
      items.every((item, index) => item.pairId === leftOrder[index]);

    let attempt = 0;
    const maxAttempts = 24;
    do {
      shuffled = [...baseRightItems].sort(() => Math.random() - 0.5);
      attempt += 1;
    } while (attempt < maxAttempts && isAligned(shuffled));

    if (isAligned(shuffled)) {
      const [first, ...rest] = shuffled;
      shuffled = [...rest, first];
    }

    return shuffled;
  }, [baseRightItems, leftOrder]);

  const initializeExercise = useCallback(() => {
    const shuffled = shuffleRightItems();
    setRightItems(shuffled);
    setConnections([]);
    setIsChecked(false);
    setIsCorrect(null);
    setAttempts(0);
    setActiveLeftId(null);
    setPointerPosition(null);
  }, [shuffleRightItems]);

  const resetConnections = useCallback(() => {
    const shuffled = shuffleRightItems();
    setRightItems(shuffled);
    setConnections([]);
    setIsChecked(false);
    setIsCorrect(null);
    setActiveLeftId(null);
    setPointerPosition(null);
  }, [shuffleRightItems]);

  const getRelativePosition = useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) {
      return { x: clientX, y: clientY };
    }
    return { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  useEffect(() => {
    initializeExercise();
  }, [initializeExercise]);

  useEffect(() => {
    if (isTestingMode) {
      initializeExercise();
    }
  }, [isTestingMode, initializeExercise]);

  const updateLineSegments = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) {
      setLineSegments([]);
      return;
    }

    const segments: LineSegment[] = [];
    connections.forEach(connection => {
      const leftElement = leftRefs.current[connection.leftId];
      const rightElement = rightRefs.current[connection.rightId];

      if (!leftElement || !rightElement) {
        return;
      }

      const leftRect = leftElement.getBoundingClientRect();
      const rightRect = rightElement.getBoundingClientRect();

      const start = {
        x: leftRect.right - rect.left,
        y: leftRect.top + leftRect.height / 2 - rect.top
      };
      const end = {
        x: rightRect.left - rect.left,
        y: rightRect.top + rightRect.height / 2 - rect.top
      };

      const isConnectionCorrect = tile.content.pairs.some(
        pair => pair.id === connection.leftId && connection.rightId === pair.id
      );

      segments.push({
        leftId: connection.leftId,
        rightId: connection.rightId,
        start,
        end,
        isCorrect: isChecked ? isConnectionCorrect : null
      });
    });

    setLineSegments(segments);
  }, [connections, isChecked, tile.content.pairs]);

  useEffect(() => {
    updateLineSegments();
  }, [updateLineSegments]);

  useEffect(() => {
    const handleResize = () => {
      updateLineSegments();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateLineSegments]);

  const [pointerLine, setPointerLine] = useState<LineSegment | null>(null);

  useEffect(() => {
    if (!activeLeftId || !pointerPosition) {
      setPointerLine(null);
      return;
    }

    const rect = containerRef.current?.getBoundingClientRect();
    const originElement = rect ? leftRefs.current[activeLeftId] : null;
    if (!rect || !originElement) {
      setPointerLine(null);
      return;
    }

    const originRect = originElement.getBoundingClientRect();
    setPointerLine({
      leftId: activeLeftId,
      rightId: '__pointer__',
      start: {
        x: originRect.right - rect.left,
        y: originRect.top + originRect.height / 2 - rect.top
      },
      end: pointerPosition,
      isCorrect: null
    });
  }, [activeLeftId, pointerPosition]);

  useEffect(() => {
    if (!activeLeftId || !canInteract) return;

    const handlePointerMove = (event: PointerEvent) => {
      setPointerPosition(getRelativePosition(event.clientX, event.clientY));
    };

    const handlePointerUp = () => {
      setActiveLeftId(null);
      setPointerPosition(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [activeLeftId, canInteract, getRelativePosition]);

  const resetCheckState = useCallback(() => {
    if (isChecked) {
      setIsChecked(false);
      setIsCorrect(null);
    }
  }, [isChecked]);

  const handleLeftPointerDown = (event: React.PointerEvent<HTMLButtonElement>, pairId: string) => {
    if (!canInteract) return;

    event.preventDefault();
    event.stopPropagation();

    const position = getRelativePosition(event.clientX, event.clientY);
    setPointerPosition(position);
    setActiveLeftId(pairId);
    setConnections(prev => prev.filter(connection => connection.leftId !== pairId));
    resetCheckState();
  };

  const handleRightPointerUp = (event: React.PointerEvent<HTMLButtonElement>, pairId: string) => {
    if (!canInteract || !activeLeftId) return;

    event.preventDefault();
    event.stopPropagation();

    setConnections(prev => {
      const filtered = prev.filter(
        connection => connection.leftId !== activeLeftId && connection.rightId !== pairId
      );
      return [...filtered, { leftId: activeLeftId, rightId: pairId }];
    });

    setActiveLeftId(null);
    setPointerPosition(null);
    resetCheckState();
  };

  const isComplete = connections.length === tile.content.pairs.length;

  const handleCheck = () => {
    if (!canInteract) return;

    const allCorrect = tile.content.pairs.every(pair => connectionMap.get(pair.id) === pair.id);
    setIsCorrect(allCorrect);
    setIsChecked(true);
    setAttempts(prev => prev + 1);
  };

  const handleReset = () => {
    resetConnections();
  };

  const getLeftItemStyles = (pairId: string): React.CSSProperties => {
    const connectedRightId = connectionMap.get(pairId);
    const isActive = activeLeftId === pairId;
    const connectionCorrect = isChecked && connectedRightId ? connectedRightId === pairId : null;

    if (connectionCorrect) {
      return {
        backgroundColor: itemCorrectBackground,
        borderColor: itemCorrectBorder,
        boxShadow: '0 18px 36px rgba(15, 23, 42, 0.16)'
      };
    }

    if (isChecked && connectedRightId && connectedRightId !== pairId) {
      return {
        backgroundColor: '#fee2e2',
        borderColor: '#f87171'
      };
    }

    if (isActive) {
      return {
        backgroundColor: itemActiveBackground,
        borderColor: itemActiveBorder,
        boxShadow: '0 18px 36px rgba(15, 23, 42, 0.2)'
      };
    }

    if (connectedRightId) {
      return {
        backgroundColor: itemConnectedBackground,
        borderColor: itemConnectedBorder
      };
    }

    return {
      backgroundColor: itemBackground,
      borderColor: itemBorder
    };
  };

  const getRightItemStyles = (pairId: string): React.CSSProperties => {
    const connectedLeftId = rightConnectionMap.get(pairId);
    const connectionCorrect = isChecked && connectedLeftId ? connectedLeftId === pairId : null;

    if (connectionCorrect) {
      return {
        backgroundColor: itemCorrectBackground,
        borderColor: itemCorrectBorder,
        boxShadow: '0 18px 36px rgba(15, 23, 42, 0.16)'
      };
    }

    if (isChecked && connectedLeftId && connectedLeftId !== pairId) {
      return {
        backgroundColor: '#fee2e2',
        borderColor: '#f87171'
      };
    }

    if (connectedLeftId) {
      return {
        backgroundColor: itemConnectedBackground,
        borderColor: itemConnectedBorder
      };
    }

    return {
      backgroundColor: itemBackground,
      borderColor: itemBorder
    };
  };

  const segmentsToRender = pointerLine ? [...lineSegments, pointerLine] : lineSegments;

  const getLineStroke = (segment: LineSegment) => {
    if (segment.rightId === '__pointer__') {
      return pointerLineColor;
    }

    if (segment.isCorrect === true) {
      return successIconColor;
    }

    if (segment.isCorrect === false) {
      return '#ef4444';
    }

    return lineColor;
  };

  const handleTileDoubleClick = (event: React.MouseEvent) => {
    if (isPreview || isTestingMode) return;

    event.preventDefault();
    event.stopPropagation();
    onRequestTextEditing?.();
  };

  return (
    <div className="relative w-full h-full" onDoubleClick={handleTileDoubleClick}>
      <div
        className={`w-full h-full flex flex-col gap-6 transition-all duration-300 ${
          isEmbedded
            ? 'p-6'
            : `rounded-3xl ${showBorder ? 'border' : ''} shadow-2xl shadow-slate-950/40 p-6 overflow-hidden`
        }`}
        style={{
          backgroundColor: isEmbedded ? 'transparent' : accentColor,
          backgroundImage: isEmbedded ? undefined : `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
          color: textColor,
          borderColor: !isEmbedded && showBorder ? frameBorderColor : undefined
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
          bodyClassName="px-5 pb-5"
        >
          {instructionContent ?? (
            <div
              className="text-base leading-relaxed"
              style={{
                fontFamily: tile.content.fontFamily,
                fontSize: `${tile.content.fontSize}px`
              }}
              dangerouslySetInnerHTML={{
                __html: tile.content.richQuestion || tile.content.question
              }}
            />
          )}
        </TaskInstructionPanel>

        <div
          className="rounded-2xl border px-5 py-4 flex items-center justify-between"
          style={{ backgroundColor: columnBackground, borderColor: columnBorder, color: subtleCaptionColor }}
        >
          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: subtleCaptionColor }}>
            <Link2 className="w-4 h-4" />
            <span>Połącz elementy z lewej i prawej kolumny</span>
          </div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.28em]" style={{ color: subtleCaptionColor }}>
            <Shuffle className="w-4 h-4" />
            <span>Zacznij przeciągając z lewej</span>
          </div>
        </div>

        {isTestingMode && (
          <div className="text-[11px] uppercase tracking-[0.32em]" style={{ color: testingCaptionColor }}>
            Tryb testowania
          </div>
        )}

        {attempts > 0 && (
          <div className="text-xs uppercase tracking-[0.32em]" style={{ color: testingCaptionColor }}>
            Próba #{attempts}
          </div>
        )}

        <div className="relative flex-1 min-h-[260px]">
          <div
            ref={containerRef}
            className="relative h-full w-full rounded-3xl border overflow-hidden"
            style={{ backgroundColor: boardBackground, borderColor: boardBorder }}
          >
            <svg className="absolute inset-0 w-full h-full pointer-events-none" fill="none">
              {segmentsToRender.map((segment, index) => {
                const stroke = getLineStroke(segment);
                const controlOffset = Math.max(Math.abs(segment.end.x - segment.start.x) * 0.45, 80);

                return (
                  <g key={`${segment.leftId}-${segment.rightId}-${index}`}>
                    <path
                      d={`M ${segment.start.x} ${segment.start.y} C ${segment.start.x + controlOffset} ${segment.start.y}, ${segment.end.x - controlOffset} ${segment.end.y}, ${segment.end.x} ${segment.end.y}`}
                      stroke={stroke}
                      strokeWidth={segment.rightId === '__pointer__' ? 2.5 : 3.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray={segment.rightId === '__pointer__' ? '8 8' : undefined}
                      opacity={segment.rightId === '__pointer__' ? 0.8 : 1}
                    />
                    {segment.rightId !== '__pointer__' && (
                      <circle cx={segment.end.x} cy={segment.end.y} r={5} fill={stroke} />
                    )}
                    <circle cx={segment.start.x} cy={segment.start.y} r={segment.rightId === '__pointer__' ? 4 : 5} fill={stroke} />
                  </g>
                );
              })}
            </svg>

            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-6 h-full px-6 py-6">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em]" style={{ color: subtleCaptionColor }}>
                  <span>Lewa kolumna</span>
                  <span>Element</span>
                </div>
                <div className="space-y-3 overflow-auto pr-1">
                  {leftItems.map((item, index) => (
                    <button
                      key={item.pairId}
                      type="button"
                      className="w-full text-left rounded-2xl border-2 shadow-sm px-4 py-3 transition-all duration-200 cursor-pointer"
                      style={getLeftItemStyles(item.pairId)}
                      onPointerDown={event => handleLeftPointerDown(event, item.pairId)}
                      disabled={!canInteract}
                    >
                      <div
                        className="flex items-center gap-3"
                        ref={element => {
                          if (element) {
                            leftRefs.current[item.pairId] = element;
                          } else {
                            delete leftRefs.current[item.pairId];
                          }
                        }}
                      >
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-xl border text-xs font-semibold"
                          style={{ backgroundColor: badgeBackground, borderColor: badgeBorder, color: badgeTextColor }}
                        >
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium" style={{ color: textColor }}>
                          {item.text}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em]" style={{ color: subtleCaptionColor }}>
                  <span>Prawa kolumna</span>
                  <span>Odpowiedź</span>
                </div>
                <div className="space-y-3 overflow-auto pr-1">
                  {rightItems.map((item, index) => (
                    <button
                      key={item.pairId}
                      type="button"
                      className="w-full text-left rounded-2xl border-2 shadow-sm px-4 py-3 transition-all duration-200"
                      style={getRightItemStyles(item.pairId)}
                      onPointerUp={event => handleRightPointerUp(event, item.pairId)}
                      disabled={!canInteract}
                    >
                      <div
                        className="flex items-center gap-3"
                        ref={element => {
                          if (element) {
                            rightRefs.current[item.pairId] = element;
                          } else {
                            delete rightRefs.current[item.pairId];
                          }
                        }}
                      >
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-xl border text-xs font-semibold"
                          style={{ backgroundColor: badgeBackground, borderColor: badgeBorder, color: badgeTextColor }}
                        >
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span className="text-sm font-medium" style={{ color: textColor }}>
                          {item.text}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleCheck}
              disabled={!canInteract || !isComplete}
              className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold shadow-sm transition-all duration-200 ${
                !canInteract || !isComplete ? 'opacity-60 cursor-not-allowed' : 'hover:brightness-105'
              }`}
              style={{
                backgroundColor: primaryButtonBackground,
                color: primaryButtonTextColor
              }}
            >
              <CheckCircle className="w-4 h-4" />
              <span>Sprawdź odpowiedź</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              disabled={!canInteract}
              className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold border transition-all duration-200 ${
                !canInteract ? 'opacity-60 cursor-not-allowed' : 'hover:brightness-105'
              }`}
              style={{
                backgroundColor: secondaryButtonBackground,
                borderColor: secondaryButtonBorder,
                color: textColor
              }}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Resetuj</span>
            </button>
          </div>

          {isChecked && (
            <div
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium ${
                isCorrect ? 'bg-emerald-100/90 text-emerald-900' : 'bg-rose-100/90 text-rose-900'
              }`}
              style={{
                backgroundColor: isCorrect ? successFeedbackBackground : failureFeedbackBackground,
                borderColor: isCorrect ? successFeedbackBorder : failureFeedbackBorder,
                color: isCorrect ? successIconColor : '#b91c1c'
              }}
            >
              {isCorrect ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              <span>
                {isCorrect ? tile.content.correctFeedback : tile.content.incorrectFeedback}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
