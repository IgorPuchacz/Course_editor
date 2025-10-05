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
}

interface LineDefinition {
  leftId: string;
  path: string;
  color: string;
}

const strokeWidth = 3;

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
  temp
}) => {
  const container = containerRef.current;
  if (!container) {
    return null;
  }

  const containerRect = container.getBoundingClientRect();

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
      path: `M ${start.x} ${start.y} L ${end.x} ${end.y}`,
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
        path: `M ${start.x} ${start.y} L ${end.x} ${end.y}`,
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
        <path
          key={line.leftId}
          d={line.path}
          stroke={line.color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          data-testid={`pair-line-${line.leftId}`}
        />
      ))}
      {tempLine && (
        <path
          d={tempLine.path}
          stroke={tempLine.color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          data-testid="pair-temp-line"
        />
      )}
    </svg>
  );
};

export default PairConnectionLayer;
