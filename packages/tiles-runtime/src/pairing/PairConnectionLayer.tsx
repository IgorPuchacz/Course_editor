import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';

export type LineColorResolver = (leftId: string) => string;

export interface TempConnection {
  active: boolean;
  x: number;
  y: number;
  leftId: string | null;
}

interface LineDefinition {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
}

interface PairConnectionLayerProps {
  containerRef: React.RefObject<HTMLDivElement>;
  leftRefs: Record<string, HTMLDivElement | null>;
  rightRefs: Record<string, HTMLDivElement | null>;
  connections: Map<string, string>;
  getLineColor: LineColorResolver;
  temp?: TempConnection;
  version?: number;
}

const toContainerPoint = (rect: DOMRect, containerRect: DOMRect) => ({
  x: rect.left - containerRect.left + rect.width,
  y: rect.top - containerRect.top + rect.height / 2,
});

const toRightPoint = (rect: DOMRect, containerRect: DOMRect) => ({
  x: rect.left - containerRect.left,
  y: rect.top - containerRect.top + rect.height / 2,
});

/**
 * Draws connection lines between left and right items.
 */
export const PairConnectionLayer: React.FC<PairConnectionLayerProps> = ({
  containerRef,
  leftRefs,
  rightRefs,
  connections,
  getLineColor,
  temp,
  version = 0,
}) => {
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);
  const [lines, setLines] = useState<LineDefinition[]>([]);
  const connectionsRef = useRef(connections);
  connectionsRef.current = connections;

  const computeLines = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      setContainerRect(null);
      setLines([]);
      return;
    }

    const currentRect = container.getBoundingClientRect();
    const nextLines: LineDefinition[] = [];

    connectionsRef.current.forEach((rightId, leftId) => {
      const leftEl = leftRefs[leftId];
      const rightEl = rightRefs[rightId];
      if (!leftEl || !rightEl) return;
      const leftRect = leftEl.getBoundingClientRect();
      const rightRect = rightEl.getBoundingClientRect();
      nextLines.push({
        id: leftId,
        from: toContainerPoint(leftRect, currentRect),
        to: toRightPoint(rightRect, currentRect),
      });
    });

    setContainerRect(currentRect);
    setLines(nextLines);
  }, [containerRef, leftRefs, rightRefs]);

  useLayoutEffect(() => {
    computeLines();
  }, [computeLines, version]);

  useLayoutEffect(() => {
    const handle = () => computeLines();
    window.addEventListener('resize', handle);
    window.addEventListener('scroll', handle, true);
    return () => {
      window.removeEventListener('resize', handle);
      window.removeEventListener('scroll', handle, true);
    };
  }, [computeLines]);

  const tempLine = useMemo(() => {
    if (!temp?.active || !temp.leftId || !containerRect) return null;
    const leftEl = leftRefs[temp.leftId];
    if (!leftEl) return null;
    const leftRect = leftEl.getBoundingClientRect();
    const start = toContainerPoint(leftRect, containerRect);
    return {
      from: start,
      to: {
        x: temp.x - containerRect.left,
        y: temp.y - containerRect.top,
      },
    };
  }, [containerRect, leftRefs, temp]);

  if (!containerRect) {
    return null;
  }

  return (
    <svg className="absolute inset-0 z-0 pointer-events-none" data-testid="pair-connections" width="100%" height="100%">
      {lines.map(line => (
        <line
          key={line.id}
          x1={line.from.x}
          y1={line.from.y}
          x2={line.to.x}
          y2={line.to.y}
          stroke={getLineColor(line.id)}
          strokeWidth={4}
          strokeLinecap="round"
          data-testid={`pair-line-${line.id}`}
        />
      ))}
      {tempLine && (
        <line
          x1={tempLine.from.x}
          y1={tempLine.from.y}
          x2={tempLine.to.x}
          y2={tempLine.to.y}
          stroke={getLineColor(temp?.leftId ?? '')}
          strokeWidth={4}
          strokeLinecap="round"
          opacity={0.6}
          data-testid="pair-temp-line"
        />
      )}
    </svg>
  );
};
