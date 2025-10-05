import React from 'react';
import type { RefObject } from 'react';

export type LineColorResolver = (leftId: string) => string;

export interface Temp {
  active: boolean;
  x: number;
  y: number;
  leftId: string | null;
}

interface Props {
  containerRef: RefObject<HTMLDivElement>;
  leftRefs: Record<string, HTMLDivElement | null>;
  rightRefs: Record<string, HTMLDivElement | null>;
  connections: Map<string, string>;
  getLineColor: LineColorResolver;
  temp?: Temp;
  curve?: number;
  outline?: {
    width?: number;
    color?: string;
    opacity?: number;
  };
  colorForLeftId?: (leftId: string) => string;
}

interface LineDefinition {
  leftId: string;
  path: string;
  color: string;
}

const strokeWidth = 4;

const cubicPath = (
    x1: number, y1: number,
    x2: number, y2: number,
    k: number
) => {
  const dx = x2 - x1;
  const cx1 = x1 + dx * k;
  const cy1 = y1;
  const cx2 = x2 - dx * k;
  const cy2 = y2;
  return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
};


const calculateAnchor = (
  element: HTMLDivElement,
  containerRect: DOMRect,
  position: 'left' | 'right'
) => {
  const rect = element.getBoundingClientRect();
  const xOffset = rect.left - containerRect.left;
  const yOffset = rect.top - containerRect.top;

  if (position === 'left') {
    return {
      x: xOffset + rect.width,
      y: yOffset + rect.height / 2
    };
  }

  return {
    x: xOffset,
    y: yOffset + rect.height / 2
  };
};

/**
 * Renders SVG lines representing committed and temporary pairing connections.
 */
export const PairConnectionLayer: React.FC<Props> = ({
  containerRef,
  leftRefs,
  rightRefs,
  connections,
  getLineColor,
  temp,
  curve=0.33,
  outline,
  colorForLeftId,
}) => {
  const container = containerRef.current;
  if (!container) {
    return null;
  }

  const containerRect = container.getBoundingClientRect();
  const ow = outline?.width ?? 3;
  const oc = outline?.color ?? '#fff';
  const oo = outline?.opacity ?? 0.95;

  const lines = Array.from(connections.entries()).reduce<LineDefinition[]>((acc, [leftId, rightId]) => {
    const leftElement = leftRefs[leftId];
    const rightElement = rightRefs[rightId];
    if (!leftElement || !rightElement) {
      return acc;
    }

    const start = calculateAnchor(leftElement, containerRect, 'left');
    const end = calculateAnchor(rightElement, containerRect, 'right');
    const color = getLineColor(leftId);

    acc.push({
      leftId,
      path: cubicPath(start.x, start.y, end.x, end.y, curve),
      color
    });

    return acc;
  }, []);

  let tempLine: LineDefinition | null = null;

  if (temp && temp.active && temp.leftId) {
    const activeElement = leftRefs[temp.leftId];
    if (activeElement) {
      const start = calculateAnchor(activeElement, containerRect, 'left');
      const end = {
        x: temp.x - containerRect.left,
        y: temp.y - containerRect.top
      };

      tempLine = {
        leftId: temp.leftId,
        path: cubicPath(start.x, start.y, end.x, end.y, curve),
        color: getLineColor(temp.leftId)
      };
    }
  }

  if (!lines.length && !tempLine) {
    return null;
  }

  return (


    <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
      {lines.map(line => (
        <>
          <path
              d={line.path}
              fill="none"
              stroke={oc}
              strokeOpacity={oo}
              strokeWidth={strokeWidth + ow}
              strokeLinecap="round"
          />
          <path
          d={line.path}
          fill="none"
          stroke={colorForLeftId ? colorForLeftId(line.leftId) : line.color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          />
        </>
      ))}
      {tempLine && (
          <>
            <path
                d={tempLine.path}
                fill="none"
                stroke={oc}
                strokeOpacity={oo}
                strokeWidth={strokeWidth + Math.max(ow - 1, 2)}
                strokeLinecap="round"
            />
            <path
                d={tempLine.path}
                fill="none"
                stroke={colorForLeftId ? colorForLeftId(tempLine.leftId) : tempLine.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray="4 4"
            />
          </>
      )}

    </svg>
  );
};

export default PairConnectionLayer;
