import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import {
  CheckCircle,
  Link2,
  RotateCcw,
  Shuffle,
  Sparkles,
  XCircle
} from 'lucide-react';
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

interface Connection {
  leftId: string;
  rightId: string;
}

interface DragState {
  leftId: string;
}

interface Point {
  x: number;
  y: number;
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

const surfaceColor = (
  accent: string,
  textColor: string,
  lightenAmount: number,
  darkenAmount: number
): string => (textColor === '#0f172a' ? lightenColor(accent, lightenAmount) : darkenColor(accent, darkenAmount));

export const MatchingInteractive: React.FC<MatchingInteractiveProps> = ({
  tile,
  isPreview = false,
  isTestingMode = false,
  onRequestTextEditing,
  instructionContent,
  variant = 'embedded'
}) => {
  const canInteract = !isPreview;
  const isEmbedded = variant === 'embedded';
  const pairs = tile.content.pairs;

  const leftItems = useMemo(
    () =>
      pairs.map((pair, index) => ({
        id: pair.id,
        text: pair.leftText,
        index
      })),
    [pairs]
  );

  const rightItems = useMemo(
    () =>
      pairs.map(pair => ({
        id: pair.id,
        text: pair.rightText
      })),
    [pairs]
  );

  const [rightOrder, setRightOrder] = useState<string[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dragPosition, setDragPosition] = useState<Point | null>(null);
  const [hoveredRightId, setHoveredRightId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const leftConnectorRefs = useRef(new Map<string, HTMLDivElement | null>());
  const rightConnectorRefs = useRef(new Map<string, HTMLDivElement | null>());

  const [connectorPositions, setConnectorPositions] = useState<{
    left: Record<string, Point>;
    right: Record<string, Point>;
  }>({ left: {}, right: {} });

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
  const columnBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.58, 0.42),
    [accentColor, textColor]
  );
  const columnBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.48, 0.6),
    [accentColor, textColor]
  );
  const itemBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.52, 0.46),
    [accentColor, textColor]
  );
  const itemBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.42, 0.58),
    [accentColor, textColor]
  );
  const connectorBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.48, 0.5),
    [accentColor, textColor]
  );
  const connectorBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.38, 0.58),
    [accentColor, textColor]
  );
  const connectorActiveBackground = useMemo(
    () => surfaceColor(accentColor, textColor, 0.68, 0.32),
    [accentColor, textColor]
  );
  const connectorActiveBorder = useMemo(
    () => surfaceColor(accentColor, textColor, 0.56, 0.48),
    [accentColor, textColor]
  );
  const connectionColor = textColor === '#0f172a' ? darkenColor(accentColor, 0.2) : lightenColor(accentColor, 0.3);
  const connectionInactiveColor = textColor === '#0f172a' ? '#cbd5f5' : '#e2e8f0';
  const successFeedbackBackground = surfaceColor(accentColor, textColor, 0.7, 0.34);
  const successFeedbackBorder = surfaceColor(accentColor, textColor, 0.6, 0.44);
  const failureFeedbackBackground = '#fee2e2';
  const failureFeedbackBorder = '#fca5a5';
  const primaryButtonBackground = textColor === '#0f172a' ? darkenColor(accentColor, 0.25) : lightenColor(accentColor, 0.28);
  const primaryButtonTextColor = textColor === '#0f172a' ? '#f8fafc' : '#0f172a';
  const secondaryButtonBackground = surfaceColor(accentColor, textColor, 0.52, 0.5);
  const secondaryButtonBorder = surfaceColor(accentColor, textColor, 0.46, 0.58);
  const showBorder = tile.content.showBorder !== false;

  const shuffleRightColumn = useCallback(() => {
    const baseOrder = rightItems.map(item => item.id);
    if (baseOrder.length <= 1) {
      setRightOrder(baseOrder);
      return;
    }

    const correctOrder = rightItems.map(item => item.id);
    const shuffled = [...baseOrder];
    let attemptsCount = 0;
    const maxAttempts = 15;

    const isCorrectOrder = (order: string[]) =>
      order.every((id, index) => id === correctOrder[index]);

    do {
      shuffled.sort(() => Math.random() - 0.5);
      attemptsCount += 1;
    } while (attemptsCount < maxAttempts && isCorrectOrder(shuffled));

    if (isCorrectOrder(shuffled)) {
      const [first, ...rest] = shuffled;
      setRightOrder([...rest, first]);
      return;
    }

    setRightOrder(shuffled);
  }, [rightItems]);

  useEffect(() => {
    shuffleRightColumn();
    setConnections([]);
    setIsChecked(false);
    setIsCorrect(null);
    setAttempts(0);
  }, [rightItems, shuffleRightColumn]);

  useEffect(() => {
    if (isTestingMode) {
      shuffleRightColumn();
      setConnections([]);
      setIsChecked(false);
      setIsCorrect(null);
      setAttempts(0);
    }
  }, [isTestingMode, shuffleRightColumn]);

  const updateConnectorPositions = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const leftPositions: Record<string, Point> = {};
    const rightPositions: Record<string, Point> = {};

    leftConnectorRefs.current.forEach((node, id) => {
      if (!node) return;
      const rect = node.getBoundingClientRect();
      leftPositions[id] = {
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top + rect.height / 2
      };
    });

    rightConnectorRefs.current.forEach((node, id) => {
      if (!node) return;
      const rect = node.getBoundingClientRect();
      rightPositions[id] = {
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top + rect.height / 2
      };
    });

    setConnectorPositions({ left: leftPositions, right: rightPositions });
  }, []);

  useLayoutEffect(() => {
    updateConnectorPositions();
  }, [rightOrder, leftItems, connections, updateConnectorPositions]);

  useEffect(() => {
    window.addEventListener('resize', updateConnectorPositions);
    return () => window.removeEventListener('resize', updateConnectorPositions);
  }, [updateConnectorPositions]);

  const resetCheckState = () => {
    if (isChecked) {
      setIsChecked(false);
      setIsCorrect(null);
    }
  };

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      if (!dragState) return;
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      setDragPosition({ x: event.clientX - rect.left, y: event.clientY - rect.top });
    },
    [dragState]
  );

  const handlePointerUp = useCallback(() => {
    if (!dragState) return;

    if (hoveredRightId) {
      setConnections(prevConnections => {
        const filtered = prevConnections.filter(
          connection => connection.leftId !== dragState.leftId && connection.rightId !== hoveredRightId
        );
        return [...filtered, { leftId: dragState.leftId, rightId: hoveredRightId }];
      });
      resetCheckState();
    }

    setDragState(null);
    setDragPosition(null);
    setHoveredRightId(null);
  }, [dragState, hoveredRightId]);

  useEffect(() => {
    if (!dragState) return;
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState, handlePointerMove, handlePointerUp]);

  const handleStartDrag = (leftId: string) => {
    if (!canInteract) return;
    setDragState({ leftId });
    setHoveredRightId(null);
    const startPoint = connectorPositions.left[leftId];
    if (startPoint) {
      setDragPosition(startPoint);
    }
    resetCheckState();
  };

  const removeConnection = (leftId: string) => {
    setConnections(prev => prev.filter(connection => connection.leftId !== leftId));
    resetCheckState();
  };

  const handleCheck = () => {
    const expectedMatches = new Map(pairs.map(pair => [pair.id, pair.id]));
    const allMatched = leftItems.length > 0 && leftItems.every(item => connections.some(conn => conn.leftId === item.id));

    if (!allMatched) {
      setIsChecked(true);
      setIsCorrect(false);
      setAttempts(prev => prev + 1);
      return;
    }

    const isAllCorrect = connections.every(connection => expectedMatches.get(connection.leftId) === connection.rightId);

    setIsChecked(true);
    setIsCorrect(isAllCorrect);
    setAttempts(prev => prev + 1);
  };

  const handleReset = () => {
    setConnections([]);
    setIsChecked(false);
    setIsCorrect(null);
    setAttempts(0);
    shuffleRightColumn();
  };

  const allMatched = leftItems.length > 0 && leftItems.every(item => connections.some(conn => conn.leftId === item.id));

  const currentFeedback = useMemo(() => {
    if (!isChecked) return null;
    if (isCorrect) {
      return {
        type: 'success' as const,
        icon: <CheckCircle className="w-5 h-5" />,
        title: 'Świetnie!',
        message: tile.content.correctFeedback
      };
    }
    return {
      type: 'error' as const,
      icon: <XCircle className="w-5 h-5" />,
      title: 'Spróbuj ponownie',
      message: tile.content.incorrectFeedback
    };
  }, [isChecked, isCorrect, tile.content.correctFeedback, tile.content.incorrectFeedback]);

  return (
    <div
      className={`relative w-full h-full flex flex-col ${
        showBorder ? 'border-2' : 'border'
      } rounded-[28px] overflow-hidden transition-colors duration-300 ${
        isEmbedded ? 'shadow-[0_16px_32px_rgba(15,23,42,0.12)]' : 'shadow-none'
      }`}
      style={{
        borderColor: frameBorderColor,
        background: `linear-gradient(155deg, ${gradientStart}, ${gradientEnd})`,
        fontFamily: tile.content.fontFamily,
        color: textColor
      }}
      ref={containerRef}
    >
      <div className="flex-1 flex flex-col md:flex-row gap-6 p-6" style={{ color: textColor }}>
        <div className="md:w-1/3 flex flex-col gap-4">
          <TaskInstructionPanel
            icon={<Sparkles className="w-5 h-5" style={{ color: textColor }} />}
            label="Instrukcja"
            className="h-full"
            style={{
              background: panelBackground,
              border: `1px solid ${panelBorder}`,
              color: textColor
            }}
            iconWrapperClassName="w-10 h-10 rounded-2xl flex items-center justify-center"
            iconWrapperStyle={{
              background: iconBackground,
              color: textColor
            }}
            labelClassName="text-xs uppercase tracking-[0.24em] font-semibold"
            labelStyle={{
              color: mutedLabelColor
            }}
            bodyClassName="space-y-3"
          >
            <div
              className="leading-relaxed text-sm"
              style={{ fontFamily: tile.content.fontFamily, color: textColor }}
            >
              {tile.content.richQuestion ? (
                <div
                  className="prose prose-sm max-w-none"
                  style={{ color: textColor }}
                  dangerouslySetInnerHTML={{ __html: tile.content.richQuestion }}
                />
              ) : (
                <p className="m-0" style={{ color: textColor }}>
                  {tile.content.question}
                </p>
              )}
            </div>

            {instructionContent}

            {!isPreview && (
              <button
                type="button"
                onClick={onRequestTextEditing}
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border transition-colors"
                style={{
                  borderColor: secondaryButtonBorder,
                  background: secondaryButtonBackground,
                  color: textColor
                }}
              >
                <FileTextIcon className="w-4 h-4" />
                <span>Edytuj treść</span>
              </button>
            )}

            {isTestingMode && (
              <div
                className="text-xs rounded-xl px-3 py-2"
                style={{
                  background: testingCaptionColor,
                  color: textColor
                }}
              >
                Tryb ucznia — sprawdź, jak działa ćwiczenie
              </div>
            )}
          </TaskInstructionPanel>
        </div>

        <div className="flex-1 relative flex flex-col">
          <div
            className="relative flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-[26px]"
            style={{
              background: columnBackground,
              border: `1px solid ${columnBorder}`,
              color: textColor
            }}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.24em] font-semibold">
                <span style={{ color: mutedLabelColor }}>LEWA STRONA</span>
                <span style={{ color: subtleCaptionColor }}>{connections.length}/{leftItems.length}</span>
              </div>
              <div className="space-y-3">
                {leftItems.map(item => {
                  const connection = connections.find(conn => conn.leftId === item.id);
                  return (
                    <div
                      key={item.id}
                      className="relative px-4 py-3 rounded-2xl border shadow-sm"
                      style={{
                        background: itemBackground,
                        borderColor: itemBorder
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          ref={node => {
                            if (node) {
                              leftConnectorRefs.current.set(item.id, node);
                            } else {
                              leftConnectorRefs.current.delete(item.id);
                            }
                          }}
                          onMouseDown={() => handleStartDrag(item.id)}
                          className={`w-9 h-9 rounded-full border-2 flex items-center justify-center cursor-grab active:cursor-grabbing transition-colors ${
                            dragState?.leftId === item.id ? 'scale-95' : ''
                          }`}
                          style={{
                            background: dragState?.leftId === item.id ? connectorActiveBackground : connectorBackground,
                            borderColor: dragState?.leftId === item.id ? connectorActiveBorder : connectorBorder,
                            color: textColor
                          }}
                        >
                          <Link2 className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium m-0" style={{ color: textColor }}>
                            {item.text}
                          </p>
                          {connection && (
                            <p className="text-xs mt-1" style={{ color: subtleCaptionColor }}>
                              Połączono z: {rightItems.find(right => right.id === connection.rightId)?.text ?? '–'}
                            </p>
                          )}
                        </div>
                        {connection && !isPreview && (
                          <button
                            type="button"
                            onClick={() => removeConnection(item.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-full border text-xs font-semibold"
                            style={{
                              borderColor: connectorBorder,
                              color: textColor
                            }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.24em] font-semibold">
                <span style={{ color: mutedLabelColor }}>PRAWA STRONA</span>
                <button
                  type="button"
                  onClick={shuffleRightColumn}
                  disabled={!canInteract}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold rounded-full border transition-colors disabled:opacity-60"
                  style={{
                    borderColor: connectorBorder,
                    color: textColor,
                    background: secondaryButtonBackground
                  }}
                >
                  <Shuffle className="w-3 h-3" />
                  Mieszaj
                </button>
              </div>
              <div className="space-y-3">
                {rightOrder.map(id => {
                  const item = rightItems.find(right => right.id === id);
                  if (!item) return null;
                  const isTarget = hoveredRightId === item.id && dragState;
                  const isConnected = connections.some(connection => connection.rightId === item.id);
                  return (
                    <div
                      key={item.id}
                      ref={node => {
                        if (node) {
                          rightConnectorRefs.current.set(item.id, node);
                        } else {
                          rightConnectorRefs.current.delete(item.id);
                        }
                      }}
                      onMouseEnter={() => dragState && setHoveredRightId(item.id)}
                      onMouseLeave={() => dragState && setHoveredRightId(prev => (prev === item.id ? null : prev))}
                      className={`px-4 py-3 rounded-2xl border shadow-sm transition-all ${
                        isTarget ? 'scale-[1.01]' : ''
                      }`}
                      style={{
                        background: itemBackground,
                        borderColor: isTarget
                          ? connectorActiveBorder
                          : isConnected
                            ? connectorBorder
                            : itemBorder
                      }}
                    >
                      <p className="text-sm font-medium m-0" style={{ color: textColor }}>
                        {item.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <svg className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
              {connections.map(connection => {
                const start = connectorPositions.left[connection.leftId];
                const end = connectorPositions.right[connection.rightId];
                if (!start || !end) return null;
                const deltaX = end.x - start.x;
                const controlPointOffset = Math.max(Math.abs(deltaX) / 2, 60);
                const path = `M ${start.x} ${start.y} C ${start.x + controlPointOffset} ${start.y}, ${end.x - controlPointOffset} ${end.y}, ${end.x} ${end.y}`;
                return (
                  <path
                    key={`${connection.leftId}-${connection.rightId}`}
                    d={path}
                    fill="none"
                    stroke={isChecked ? (isCorrect ? connectionColor : failureFeedbackBorder) : connectionColor}
                    strokeWidth={4}
                    strokeLinecap="round"
                    opacity={isChecked && !isCorrect ? 0.65 : 0.9}
                  />
                );
              })}

              {dragState && dragPosition && (() => {
                const start = connectorPositions.left[dragState.leftId];
                if (!start) return null;
                const deltaX = dragPosition.x - start.x;
                const controlPointOffset = Math.max(Math.abs(deltaX) / 2, 60);
                const path = `M ${start.x} ${start.y} C ${start.x + controlPointOffset} ${start.y}, ${dragPosition.x - controlPointOffset} ${dragPosition.y}, ${dragPosition.x} ${dragPosition.y}`;
                return (
                  <path
                    d={path}
                    fill="none"
                    stroke={connectionInactiveColor}
                    strokeWidth={3.5}
                    strokeDasharray="6 6"
                    strokeLinecap="round"
                  />
                );
              })()}
            </svg>
          </div>

          <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2 text-xs" style={{ color: subtleCaptionColor }}>
              <span>{attempts} prób</span>
              <span>•</span>
              <span>{connections.length} połączeń</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full border transition-colors"
                style={{
                  borderColor: connectorBorder,
                  background: secondaryButtonBackground,
                  color: textColor
                }}
              >
                <RotateCcw className="w-4 h-4" />
                Resetuj
              </button>
              <button
                type="button"
                onClick={handleCheck}
                disabled={!canInteract}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-full shadow-md transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: primaryButtonBackground,
                  color: primaryButtonTextColor,
                  transform: !canInteract ? 'none' : 'translateY(0)',
                  opacity: allMatched ? 1 : 0.8
                }}
              >
                <CheckCircle className="w-4 h-4" />
                Sprawdź
              </button>
            </div>
          </div>

          {currentFeedback && (
            <div
              className="mt-4 p-4 rounded-2xl border flex items-start gap-3"
              style={{
                background: currentFeedback.type === 'success' ? successFeedbackBackground : failureFeedbackBackground,
                borderColor: currentFeedback.type === 'success' ? successFeedbackBorder : failureFeedbackBorder,
                color: textColor
              }}
            >
              <div className={`mt-0.5 ${currentFeedback.type === 'success' ? 'text-emerald-600' : 'text-rose-500'}`}>
                {currentFeedback.icon}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold uppercase tracking-wide m-0">
                  {currentFeedback.title}
                </p>
                <p className="text-sm leading-relaxed m-0" style={{ color: textColor }}>
                  {currentFeedback.message}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const FileTextIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12h6m-6 4h6m-6-8h6m-7-4h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
    />
  </svg>
);
