import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { CheckCircle, XCircle, RotateCcw, Sparkles, Link2, Shuffle } from 'lucide-react';
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

interface MatchingOption {
  id: string;
  text: string;
}

interface Connection {
  leftId: string;
  rightId: string;
}

interface ActiveConnection {
  leftId: string;
  start: { x: number; y: number };
  pointer: { x: number; y: number };
}

interface ConnectionLine extends Connection {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
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
  if (!rgb) return '#0f172a';

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
  const canInteract = !isPreview;

  const leftItems = useMemo<MatchingOption[]>(
    () => tile.content.pairs.map(pair => ({ id: pair.id, text: pair.left })),
    [tile.content.pairs]
  );

  const buildInitialRight = useCallback((): MatchingOption[] => {
    const normalized = tile.content.pairs.map(pair => ({ id: pair.id, text: pair.right }));

    if (normalized.length <= 1) {
      return normalized;
    }

    const isCorrectOrder = (items: MatchingOption[]) =>
      items.every((item, index) => item.id === normalized[index].id);

    let shuffled = [...normalized];
    let attempts = 0;

    do {
      shuffled = [...normalized].sort(() => Math.random() - 0.5);
      attempts += 1;
    } while (attempts < 12 && isCorrectOrder(shuffled));

    if (isCorrectOrder(shuffled)) {
      const [first, ...rest] = shuffled;
      shuffled = [...rest, first];
    }

    return shuffled;
  }, [tile.content.pairs]);

  const [rightItems, setRightItems] = useState<MatchingOption[]>(() => buildInitialRight());
  const [connections, setConnections] = useState<Connection[]>([]);
  const [activeConnection, setActiveConnection] = useState<ActiveConnection | null>(null);
  const [hoveredRight, setHoveredRight] = useState<string | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [connectionLines, setConnectionLines] = useState<ConnectionLine[]>([]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const leftItemRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const rightItemRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const hoveredRightRef = useRef<string | null>(null);

  useEffect(() => {
    hoveredRightRef.current = hoveredRight;
  }, [hoveredRight]);

  const initializeExercise = useCallback(() => {
    const shuffled = buildInitialRight();
    setRightItems(shuffled);
    setConnections([]);
    setActiveConnection(null);
    setHoveredRight(null);
    setIsChecked(false);
    setIsCorrect(null);
    setAttempts(0);
  }, [buildInitialRight]);

  useEffect(() => {
    initializeExercise();
  }, [initializeExercise]);

  useEffect(() => {
    if (isTestingMode) {
      initializeExercise();
    }
  }, [isTestingMode, initializeExercise]);

  const accentColor = tile.content.backgroundColor || '#0f172a';
  const textColor = useMemo(() => getReadableTextColor(accentColor), [accentColor]);
  const gradientStart = useMemo(() => lightenColor(accentColor, 0.08), [accentColor]);
  const gradientEnd = useMemo(() => darkenColor(accentColor, 0.08), [accentColor]);
  const frameBorderColor = useMemo(
    () => surfaceColor(accentColor, textColor, 0.5, 0.58),
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
    () => surfaceColor(accentColor, textColor, 0.44, 0.4),
    [accentColor, textColor]
  );
  const columnBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.62, 0.46),
    [accentColor, textColor]
  );
  const columnBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.54, 0.54),
    [accentColor, textColor]
  );
  const columnHighlightBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.72, 0.34),
    [accentColor, textColor]
  );
  const itemBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.6, 0.44),
    [accentColor, textColor]
  );
  const itemBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.5, 0.54),
    [accentColor, textColor]
  );
  const itemActiveBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.7, 0.34),
    [accentColor, textColor]
  );
  const itemActiveBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.6, 0.46),
    [accentColor, textColor]
  );
  const itemConnectedBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.66, 0.4),
    [accentColor, textColor]
  );
  const itemConnectedBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.58, 0.48),
    [accentColor, textColor]
  );
  const successIconColor = textColor === '#0f172a' ? darkenColor(accentColor, 0.18) : lightenColor(accentColor, 0.32);
  const successFeedbackBackground = surfaceColor(accentColor, textColor, 0.72, 0.32);
  const successFeedbackBorder = surfaceColor(accentColor, textColor, 0.62, 0.42);
  const failureFeedbackBackground = '#fee2e2';
  const failureFeedbackBorder = '#fca5a5';
  const primaryButtonBackground = textColor === '#0f172a' ? darkenColor(accentColor, 0.25) : lightenColor(accentColor, 0.28);
  const primaryButtonTextColor = textColor === '#0f172a' ? '#f8fafc' : '#0f172a';
  const secondaryButtonBackground = surfaceColor(accentColor, textColor, 0.54, 0.5);
  const secondaryButtonBorder = surfaceColor(accentColor, textColor, 0.46, 0.56);
  const connectionBaseColor = textColor === '#0f172a' ? darkenColor(accentColor, 0.22) : lightenColor(accentColor, 0.32);
  const connectionActiveColor = textColor === '#0f172a' ? darkenColor(accentColor, 0.12) : lightenColor(accentColor, 0.24);
  const connectionSuccessColor = textColor === '#0f172a' ? darkenColor(accentColor, 0.06) : lightenColor(accentColor, 0.2);
  const connectionErrorColor = '#f97316';

  const registerLeftRef = useCallback((id: string, node: HTMLDivElement | null) => {
    if (node) {
      leftItemRefs.current.set(id, node);
    } else {
      leftItemRefs.current.delete(id);
    }
  }, []);

  const registerRightRef = useCallback((id: string, node: HTMLDivElement | null) => {
    if (node) {
      rightItemRefs.current.set(id, node);
    } else {
      rightItemRefs.current.delete(id);
    }
  }, []);

  const updateConnectionLines = useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();

    const lines: ConnectionLine[] = connections
      .map(connection => {
        const leftNode = leftItemRefs.current.get(connection.leftId);
        const rightNode = rightItemRefs.current.get(connection.rightId);
        if (!leftNode || !rightNode) return null;

        const leftRect = leftNode.getBoundingClientRect();
        const rightRect = rightNode.getBoundingClientRect();

        return {
          ...connection,
          x1: leftRect.right - containerRect.left,
          y1: leftRect.top + leftRect.height / 2 - containerRect.top,
          x2: rightRect.left - containerRect.left,
          y2: rightRect.top + rightRect.height / 2 - containerRect.top
        };
      })
      .filter((line): line is ConnectionLine => Boolean(line));

    setConnectionLines(lines);
  }, [connections]);

  useEffect(() => {
    updateConnectionLines();
  }, [connections, rightItems, leftItems, updateConnectionLines]);

  useEffect(() => {
    const handleResize = () => updateConnectionLines();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateConnectionLines]);

  const finalizeConnection = useCallback(
    (leftId: string, rightId: string | null) => {
      setActiveConnection(null);
      setHoveredRight(null);

      if (!canInteract) return;

      if (!rightId) {
        setConnections(prev => prev.filter(connection => connection.leftId !== leftId));
        setIsChecked(false);
        setIsCorrect(null);
        return;
      }

      setConnections(prev => {
        const filtered = prev.filter(connection => connection.leftId !== leftId && connection.rightId !== rightId);
        return [...filtered, { leftId, rightId }];
      });
      setIsChecked(false);
      setIsCorrect(null);
    },
    [canInteract]
  );

  useEffect(() => {
    if (!activeConnection) return;

    const handlePointerMove = (event: PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setActiveConnection(prev =>
        prev
          ? {
              ...prev,
              pointer: {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
              }
            }
          : null
      );
    };

    const handlePointerUp = () => {
      finalizeConnection(activeConnection.leftId, hoveredRightRef.current);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp, { once: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [activeConnection, finalizeConnection]);

  const handleStartConnection = (leftId: string, event: React.PointerEvent<HTMLDivElement>) => {
    if (!canInteract) return;
    if (event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();

    const container = containerRef.current;
    const leftNode = leftItemRefs.current.get(leftId);
    if (!container || !leftNode) return;

    const containerRect = container.getBoundingClientRect();
    const leftRect = leftNode.getBoundingClientRect();

    setActiveConnection({
      leftId,
      start: {
        x: leftRect.right - containerRect.left,
        y: leftRect.top + leftRect.height / 2 - containerRect.top
      },
      pointer: {
        x: event.clientX - containerRect.left,
        y: event.clientY - containerRect.top
      }
    });
    setHoveredRight(null);
  };

  const handleRightPointerEnter = (rightId: string) => {
    if (!activeConnection) return;
    setHoveredRight(rightId);
  };

  const handleRightPointerLeave = (rightId: string) => {
    if (hoveredRight === rightId) {
      setHoveredRight(null);
    }
  };

  const handleRightDoubleClick = (rightId: string) => {
    if (!canInteract) return;
    setConnections(prev => prev.filter(connection => connection.rightId !== rightId));
    setIsChecked(false);
    setIsCorrect(null);
  };

  const resetConnections = () => {
    const shuffled = buildInitialRight();
    setRightItems(shuffled);
    setConnections([]);
    setActiveConnection(null);
    setHoveredRight(null);
    setIsChecked(false);
    setIsCorrect(null);
  };

  const allConnected = connections.length === leftItems.length && leftItems.length > 0;

  const checkConnections = () => {
    if (!allConnected) return;

    const solved = connections.every(connection => connection.leftId === connection.rightId);
    setIsCorrect(solved);
    setIsChecked(true);
    setAttempts(prev => prev + 1);
  };

  const connectionAccuracy = useMemo(() => {
    if (!isChecked) return new Map<string, 'correct' | 'incorrect'>();

    const map = new Map<string, 'correct' | 'incorrect'>();
    connections.forEach(connection => {
      map.set(connection.leftId, connection.leftId === connection.rightId ? 'correct' : 'incorrect');
    });
    return map;
  }, [connections, isChecked]);

  const getConnectionForRight = (rightId: string) => connections.find(connection => connection.rightId === rightId);
  const getConnectionForLeft = (leftId: string) => connections.find(connection => connection.leftId === leftId);

  const showBorder = tile.content.showBorder !== false;
  const isEmbedded = variant === 'embedded';

  return (
    <div
      className={`relative flex h-full flex-col gap-6 rounded-3xl border ${
        showBorder ? 'border-2' : 'border-transparent'
      } p-6 shadow-xl transition-shadow duration-300 ${isPreview ? 'opacity-90' : ''}`}
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
        style={{ backgroundColor: panelBackground, borderColor: panelBorder, color: textColor }}
        iconWrapperStyle={{ backgroundColor: iconBackground, color: textColor }}
        labelStyle={{ color: mutedLabelColor }}
        bodyClassName="px-5 pb-5"
      >
        {instructionContent ?? (
          <div
            className="text-base leading-relaxed"
            style={{ fontFamily: tile.content.fontFamily, fontSize: `${tile.content.fontSize}px` }}
            onDoubleClick={onRequestTextEditing}
            role={onRequestTextEditing ? 'button' : undefined}
            tabIndex={onRequestTextEditing ? 0 : undefined}
            dangerouslySetInnerHTML={{ __html: tile.content.richQuestion || tile.content.question }}
          />
        )}
      </TaskInstructionPanel>

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

      <div
        ref={containerRef}
        className="relative flex-1 rounded-3xl border p-5"
        style={{ backgroundColor: columnBackground, borderColor: columnBorder }}
      >
        <svg className="pointer-events-none absolute inset-0 h-full w-full">
          {connectionLines.map(line => {
            const status = connectionAccuracy.get(line.leftId);
            const strokeColor =
              status === 'correct'
                ? connectionSuccessColor
                : status === 'incorrect'
                ? connectionErrorColor
                : connectionBaseColor;

            return (
              <line
                key={`${line.leftId}-${line.rightId}`}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke={strokeColor}
                strokeWidth={status ? 5 : 4}
                strokeLinecap="round"
                opacity={0.92}
              />
            );
          })}

          {activeConnection && (
            <line
              x1={activeConnection.start.x}
              y1={activeConnection.start.y}
              x2={activeConnection.pointer.x}
              y2={activeConnection.pointer.y}
              stroke={connectionActiveColor}
              strokeWidth={4}
              strokeLinecap="round"
              opacity={0.88}
            />
          )}
        </svg>

        <div className="relative grid h-full grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <div
              className="flex items-center justify-between rounded-2xl border px-4 py-3"
              style={{ borderColor: itemBorder, backgroundColor: columnHighlightBackground, color: subtleCaptionColor }}
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Link2 className="w-4 h-4" />
                <span>Lewa kolumna</span>
              </div>
              <span className="text-xs">{leftItems.length} elementów</span>
            </div>

            <div className="flex-1 space-y-3 overflow-auto pr-1">
              {leftItems.map((item, index) => {
                const connection = getConnectionForLeft(item.id);
                const status = connectionAccuracy.get(item.id);
                const isActive = activeConnection?.leftId === item.id;
                const isConnected = Boolean(connection);

                let background = itemBackground;
                let borderColor = itemBorder;
                let foreground = textColor;

                if (status === 'correct') {
                  background = '#dcfce7';
                  borderColor = '#22c55e';
                  foreground = '#166534';
                } else if (status === 'incorrect') {
                  background = '#fee2e2';
                  borderColor = '#f97316';
                  foreground = '#7f1d1d';
                } else if (isActive) {
                  background = itemActiveBackground;
                  borderColor = itemActiveBorder;
                } else if (isConnected) {
                  background = itemConnectedBackground;
                  borderColor = itemConnectedBorder;
                }

                return (
                  <div
                    key={item.id}
                    ref={node => registerLeftRef(item.id, node)}
                    className="flex cursor-pointer items-center gap-4 rounded-2xl border px-4 py-3 shadow-sm transition-transform duration-200 hover:-translate-y-0.5"
                    style={{ backgroundColor: background, borderColor, color: foreground }}
                    onPointerDown={event => handleStartConnection(item.id, event)}
                    onPointerCancel={() => setActiveConnection(null)}
                    onDoubleClick={() => {
                      if (!canInteract) return;
                      setConnections(prev => prev.filter(connection => connection.leftId !== item.id));
                      setIsChecked(false);
                      setIsCorrect(null);
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-semibold"
                      style={{
                        backgroundColor: surfaceColor(accentColor, textColor, 0.68, 0.36),
                        borderColor: surfaceColor(accentColor, textColor, 0.58, 0.46),
                        color: mutedLabelColor
                      }}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold leading-snug" style={{ color: foreground }}>
                        {item.text}
                      </div>
                      {connection && (
                        <div className="text-xs" style={{ color: subtleCaptionColor }}>
                          Połączono z: {rightItems.find(right => right.id === connection.rightId)?.text ?? '—'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div
              className="flex items-center justify-between rounded-2xl border px-4 py-3"
              style={{ borderColor: itemBorder, backgroundColor: columnHighlightBackground, color: subtleCaptionColor }}
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Shuffle className="w-4 h-4" />
                <span>Prawa kolumna</span>
              </div>
              <span className="text-xs">{rightItems.length} elementów</span>
            </div>

            <div className="flex-1 space-y-3 overflow-auto pl-1">
              {rightItems.map((item, index) => {
                const connection = getConnectionForRight(item.id);
                const leftIndex = leftItems.findIndex(left => left.id === connection?.leftId);
                const status = connection ? connectionAccuracy.get(connection.leftId) : undefined;
                const isHovered = hoveredRight === item.id && Boolean(activeConnection);
                const isConnected = Boolean(connection);

                let background = itemBackground;
                let borderColor = itemBorder;
                let foreground = textColor;

                if (status === 'correct') {
                  background = '#dcfce7';
                  borderColor = '#22c55e';
                  foreground = '#166534';
                } else if (status === 'incorrect') {
                  background = '#fee2e2';
                  borderColor = '#f97316';
                  foreground = '#7f1d1d';
                } else if (isHovered) {
                  background = itemActiveBackground;
                  borderColor = itemActiveBorder;
                } else if (isConnected) {
                  background = itemConnectedBackground;
                  borderColor = itemConnectedBorder;
                }

                return (
                  <div
                    key={item.id}
                    ref={node => registerRightRef(item.id, node)}
                    className="relative flex cursor-pointer items-center gap-4 rounded-2xl border px-4 py-3 shadow-sm transition-transform duration-200 hover:-translate-y-0.5"
                    style={{ backgroundColor: background, borderColor, color: foreground }}
                    onPointerEnter={() => handleRightPointerEnter(item.id)}
                    onPointerLeave={() => handleRightPointerLeave(item.id)}
                    onDoubleClick={() => handleRightDoubleClick(item.id)}
                  >
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-semibold"
                      style={{
                        backgroundColor: surfaceColor(accentColor, textColor, 0.68, 0.36),
                        borderColor: surfaceColor(accentColor, textColor, 0.58, 0.46),
                        color: mutedLabelColor
                      }}
                    >
                      {String.fromCharCode(65 + index)}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold leading-snug" style={{ color: foreground }}>
                        {item.text}
                      </div>
                      {isConnected && (
                        <div className="text-xs" style={{ color: subtleCaptionColor }}>
                          Połączono z elementem #{leftIndex + 1}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {isChecked && isCorrect !== null && (
        <div
          className="flex items-center justify-between gap-4 rounded-2xl border px-6 py-4"
          style={{
            backgroundColor: isCorrect ? successFeedbackBackground : failureFeedbackBackground,
            borderColor: isCorrect ? successFeedbackBorder : failureFeedbackBorder,
            color: isCorrect ? textColor : '#7f1d1d'
          }}
        >
          <div className="flex items-center gap-3 text-sm font-medium">
            {isCorrect ? (
              <CheckCircle className="w-5 h-5" style={{ color: successIconColor }} />
            ) : (
              <XCircle className="w-5 h-5 text-rose-300" />
            )}
            <span>{isCorrect ? tile.content.correctFeedback : tile.content.incorrectFeedback}</span>
          </div>

          {!isCorrect && (
            <div className="text-xs" style={{ color: '#7f1d1d' }}>
              Spróbuj ponownie, zmieniając połączenia.
            </div>
          )}
        </div>
      )}

      {!isPreview && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={checkConnections}
              disabled={!allConnected || (isChecked && isCorrect)}
              className="px-6 py-2 rounded-xl font-semibold shadow-lg transition-transform duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5"
              style={{
                backgroundColor: primaryButtonBackground,
                color: primaryButtonTextColor,
                boxShadow: '0 16px 32px rgba(15, 23, 42, 0.22)'
              }}
            >
              {isChecked && isCorrect ? 'Pary sprawdzone' : 'Sprawdź połączenia'}
            </button>

            {isChecked && !isCorrect && (
              <button
                onClick={resetConnections}
                className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: secondaryButtonBackground,
                  borderColor: secondaryButtonBorder,
                  color: textColor
                }}
              >
                <RotateCcw className="w-4 h-4" />
                <span>Rozpocznij od nowa</span>
              </button>
            )}
          </div>

          <div className="text-xs" style={{ color: subtleCaptionColor }}>
            Wskazówka: przeciągnij z lewej na prawą, aby stworzyć połączenie. Dwuklik na elemencie usuwa parę.
          </div>
        </div>
      )}
    </div>
  );
};
