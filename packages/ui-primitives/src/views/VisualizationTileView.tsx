import React, { useMemo } from 'react';
import { VisualizationTile } from 'tiles-core';
import { TileChrome } from '../TileChrome';

export interface VisualizationTileViewProps {
  tile: VisualizationTile;
  className?: string;
  style?: React.CSSProperties;
  contentClassName?: string;
  contentStyle?: React.CSSProperties;
  overlay?: React.ReactNode;
}

type ChartType = NonNullable<VisualizationTile['content']['chartType']>;

type ChartData = {
  labels: string[];
  values: number[];
};

type ChartItem = {
  label: string;
  value: number;
  color: string;
};

const joinClassNames = (...values: Array<string | undefined | false>) =>
  values.filter(Boolean).join(' ');

const DEFAULT_CHART_DATA: ChartData = {
  labels: ['A', 'B', 'C', 'D'],
  values: [24, 36, 18, 42],
};

const CHART_TYPE_LABELS: Record<ChartType, string> = {
  bar: 'Wykres słupkowy',
  line: 'Wykres liniowy',
  pie: 'Wykres kołowy',
  scatter: 'Wykres punktowy',
};

const CHART_ACCENT_COLORS: Record<ChartType, string> = {
  bar: '#2563eb',
  line: '#0ea5e9',
  pie: '#f97316',
  scatter: '#7c3aed',
};

const CHART_COLOR_PALETTE = ['#2563eb', '#7c3aed', '#22c55e', '#f97316', '#ec4899', '#14b8a6'];

const isChartData = (value: unknown): value is ChartData => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const maybeData = value as Partial<ChartData>;
  return Array.isArray(maybeData.labels) && Array.isArray(maybeData.values);
};

const createChartItems = (tile: VisualizationTile): ChartItem[] => {
  if (tile.content.contentType !== 'chart') {
    return [];
  }

  const rawData = isChartData(tile.content.data) ? tile.content.data : DEFAULT_CHART_DATA;

  return rawData.labels.map((label, index) => {
    const fallbackLabel = `Pozycja ${index + 1}`;
    const safeLabel = typeof label === 'string' && label.trim().length > 0 ? label : fallbackLabel;

    const numericValue = Number(rawData.values[index] ?? 0);
    const safeValue = Number.isFinite(numericValue) ? numericValue : 0;

    return {
      label: safeLabel,
      value: safeValue,
      color: CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length],
    };
  });
};

const formatNumber = (formatter: Intl.NumberFormat, value: number) =>
  formatter.format(Number.isFinite(value) ? value : 0);

const renderEmptyState = (message: string) => (
  <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-8 text-center text-sm text-slate-500">
    {message}
  </div>
);

const renderBarChart = (items: ChartItem[]) => {
  const width = 120;
  const height = 80;
  const offset = 10;
  const availableWidth = width - offset * 2;
  const rawMin = Math.min(...items.map((item) => item.value));
  const rawMax = Math.max(...items.map((item) => item.value));
  const spanMin = Math.min(rawMin, 0);
  const spanMax = Math.max(rawMax, 0);
  const span = spanMax - spanMin || 1;
  const availableHeight = height - offset * 2;
  const spacing = availableWidth / Math.max(items.length, 1);
  const barWidth = Math.max(Math.min(spacing * 0.6, 18), 6);
  const gap = (spacing - barWidth) / 2;
  const axisColor = 'rgba(15, 23, 42, 0.12)';
  const zeroOffsetRatio = Math.min(Math.max((0 - spanMin) / span, 0), 1);
  const baselineY = height - offset - zeroOffsetRatio * availableHeight;

  return (
    <div className="h-full w-full rounded-2xl border border-slate-900/10 bg-white/80 px-6 py-5 shadow-[inset_0_1px_0_rgba(148,163,184,0.12)]">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <line x1={offset} y1={baselineY} x2={width - offset / 2} y2={baselineY} stroke={axisColor} strokeWidth={1} />
        <line x1={offset} y1={offset} x2={offset} y2={height - offset} stroke={axisColor} strokeWidth={1} />
        {items.map((item, index) => {
          const normalizedHeight = Math.abs(item.value) / span * availableHeight;
          const barHeight = Math.min(normalizedHeight, availableHeight);
          const x = offset + spacing * index + gap;
          const isPositive = item.value >= 0;
          const y = isPositive ? baselineY - barHeight : baselineY;

          return (
            <rect
              key={item.label + index}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={4}
              fill={item.color}
              opacity={0.9}
            />
          );
        })}
      </svg>
    </div>
  );
};

const renderLineChart = (items: ChartItem[], gradientId: string) => {
  const width = 120;
  const height = 80;
  const offset = 10;
  const availableWidth = width - offset * 2;
  const rawMin = Math.min(...items.map((item) => item.value));
  const rawMax = Math.max(...items.map((item) => item.value));
  const spanMin = Math.min(rawMin, 0);
  const spanMax = Math.max(rawMax, 0);
  const span = spanMax - spanMin || 1;
  const availableHeight = height - offset * 2;
  const spacing = items.length > 1 ? availableWidth / (items.length - 1) : 0;
  const axisColor = 'rgba(15, 23, 42, 0.12)';
  const zeroOffsetRatio = Math.min(Math.max((0 - spanMin) / span, 0), 1);
  const baselineY = height - offset - zeroOffsetRatio * availableHeight;

  const points = items.map((item, index) => {
    const x = items.length > 1 ? offset + spacing * index : offset + availableWidth / 2;
    const normalized = (item.value - spanMin) / span;
    const y = height - offset - normalized * availableHeight;
    return { x, y };
  });

  const pathData = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');

  const areaPath = [
    `M${offset} ${baselineY.toFixed(2)}`,
    ...points.map((point) => `L${point.x.toFixed(2)} ${point.y.toFixed(2)}`),
    `L${offset + availableWidth} ${baselineY.toFixed(2)}`,
    'Z',
  ].join(' ');

  return (
    <div className="h-full w-full rounded-2xl border border-slate-900/10 bg-white/80 px-6 py-5 shadow-[inset_0_1px_0_rgba(148,163,184,0.12)]">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.25)" />
            <stop offset="100%" stopColor="rgba(59, 130, 246, 0.02)" />
          </linearGradient>
        </defs>
        <line x1={offset} y1={baselineY} x2={width - offset / 2} y2={baselineY} stroke={axisColor} strokeWidth={1} />
        <line x1={offset} y1={offset} x2={offset} y2={height - offset} stroke={axisColor} strokeWidth={1} />
        <path d={areaPath} fill={`url(#${gradientId})`} opacity={0.65} />
        <path d={pathData} fill="none" stroke="#1d4ed8" strokeWidth={2.2} strokeLinecap="round" />
        {points.map((point, index) => (
          <circle key={items[index].label + index} cx={point.x} cy={point.y} r={2.8} fill="#1d4ed8" />
        ))}
      </svg>
    </div>
  );
};

const renderScatterChart = (items: ChartItem[]) => {
  const width = 120;
  const height = 80;
  const offset = 10;
  const availableWidth = width - offset * 2;
  const availableHeight = height - offset * 2;
  const minValue = Math.min(...items.map((item) => item.value));
  const maxValue = Math.max(...items.map((item) => item.value));
  const range = maxValue - minValue || 1;
  const axisColor = 'rgba(15, 23, 42, 0.12)';

  return (
    <div className="h-full w-full rounded-2xl border border-slate-900/10 bg-white/80 px-6 py-5 shadow-[inset_0_1px_0_rgba(148,163,184,0.12)]">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <line x1={offset} y1={height - offset} x2={width - offset / 2} y2={height - offset} stroke={axisColor} strokeWidth={1} />
        <line x1={offset} y1={offset} x2={offset} y2={height - offset} stroke={axisColor} strokeWidth={1} />
        {items.map((item, index) => {
          const x = offset + (availableWidth / Math.max(items.length, 1)) * (index + 0.5);
          const normalized = (item.value - minValue) / range;
          const y = height - offset - normalized * availableHeight;

          return (
            <circle
              key={item.label + index}
              cx={x}
              cy={y}
              r={4}
              fill={item.color}
              opacity={0.85}
            />
          );
        })}
      </svg>
    </div>
  );
};

const renderPieChart = (items: ChartItem[]) => {
  const total = items.reduce((sum, item) => sum + Math.max(item.value, 0), 0);

  if (total <= 0) {
    return renderEmptyState('Dodaj dodatnie wartości, aby zbudować wykres kołowy.');
  }

  let cumulative = 0;

  return (
    <div className="flex h-full w-full items-center justify-center rounded-2xl border border-slate-900/10 bg-white/80 px-6 py-5 shadow-[inset_0_1px_0_rgba(148,163,184,0.12)]">
      <svg viewBox="0 0 32 32" className="h-48 w-48" aria-label="Wykres kołowy">
        {items.map((item, index) => {
          const value = Math.max(item.value, 0);

          if (value <= 0) {
            return null;
          }

          const startAngle = (cumulative / total) * Math.PI * 2;
          cumulative += value;
          const endAngle = (cumulative / total) * Math.PI * 2;
          const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
          const x1 = 16 + 15 * Math.sin(startAngle);
          const y1 = 16 - 15 * Math.cos(startAngle);
          const x2 = 16 + 15 * Math.sin(endAngle);
          const y2 = 16 - 15 * Math.cos(endAngle);
          const pathData = `M16 16 L ${x1.toFixed(4)} ${y1.toFixed(4)} A 15 15 0 ${largeArc} 1 ${x2.toFixed(4)} ${y2.toFixed(4)} Z`;

          return (
            <path
              key={item.label + index}
              d={pathData}
              fill={item.color}
              stroke="white"
              strokeWidth={0.5}
              opacity={0.95}
            />
          );
        })}
      </svg>
    </div>
  );
};

export const VisualizationTileView: React.FC<VisualizationTileViewProps> = ({
  tile,
  className,
  style,
  contentClassName,
  contentStyle,
  overlay,
}) => {
  const chartItems = tile.content.contentType === 'chart' ? createChartItems(tile) : [];
  const chartValues = chartItems.map((item) => item.value);
  const chartMin = chartValues.length > 0 ? Math.min(...chartValues) : 0;
  const chartMax = chartValues.length > 0 ? Math.max(...chartValues) : 0;
  const chartAvg = chartValues.length > 0 ? chartValues.reduce((sum, value) => sum + value, 0) / chartValues.length : 0;
  const numberFormatter = useMemo(() => new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 1 }), []);

  const chartType = tile.content.chartType ?? 'bar';
  const accentColor = tile.content.contentType === 'chart'
    ? CHART_ACCENT_COLORS[chartType]
    : '#4338ca';

  const title = tile.content.title?.trim() || (tile.content.contentType === 'chart'
    ? 'Wizualizacja danych'
    : 'Materiał wideo');

  const subtitle = tile.content.contentType === 'chart'
    ? CHART_TYPE_LABELS[chartType]
    : (() => {
        const rawUrl = tile.content.videoUrl?.trim();

        if (!rawUrl) {
          return 'Dodaj adres URL, aby osadzić materiał.';
        }

        try {
          const { hostname } = new URL(rawUrl);
          return `Źródło: ${hostname.replace(/^www\./, '')}`;
        } catch (error) {
          return `Źródło: ${rawUrl}`;
        }
      })();

  const legend = chartItems.length > 0 ? (
    <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
      {chartItems.map((item, index) => (
        <div key={item.label + index} className="flex items-center gap-2 rounded-lg bg-slate-100/60 px-3 py-2">
          <span
            className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="flex-1 truncate font-medium text-slate-600">
            {item.label}
            <span className="ml-2 font-semibold text-slate-900">{formatNumber(numberFormatter, item.value)}</span>
          </span>
        </div>
      ))}
    </div>
  ) : null;

  const summary = chartItems.length > 0 ? (
    <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
      <span>
        Min: <span className="font-semibold text-slate-700">{formatNumber(numberFormatter, chartMin)}</span>
      </span>
      <span>
        Średnia:{' '}
        <span className="font-semibold text-slate-700">{formatNumber(numberFormatter, chartAvg)}</span>
      </span>
      <span>
        Max: <span className="font-semibold text-slate-700">{formatNumber(numberFormatter, chartMax)}</span>
      </span>
    </div>
  ) : null;

  const chartVisualization = tile.content.contentType === 'chart'
    ? chartItems.length === 0
      ? renderEmptyState('Dodaj dane w panelu edycji, aby zbudować wykres.')
      : (() => {
          switch (chartType) {
            case 'line':
              return renderLineChart(chartItems, `visualization-line-${tile.id}`);
            case 'pie':
              return renderPieChart(chartItems);
            case 'scatter':
              return renderScatterChart(chartItems);
            case 'bar':
            default:
              return renderBarChart(chartItems);
          }
        })()
    : null;

  const videoVisualization = tile.content.contentType === 'video'
    ? (() => {
        const videoUrl = tile.content.videoUrl?.trim();
        let videoHost: string | null = null;

        if (videoUrl) {
          try {
            videoHost = new URL(videoUrl).hostname.replace(/^www\./, '');
          } catch (error) {
            videoHost = videoUrl;
          }
        }

        return (
          <div className="relative flex h-full min-h-[240px] w-full items-center justify-center overflow-hidden rounded-2xl border border-slate-900/10 bg-slate-950 text-white shadow-[inset_0_1px_0_rgba(148,163,184,0.15)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.45),transparent_65%)]" />
            <div className="absolute inset-0 opacity-60 mix-blend-screen bg-[linear-gradient(135deg,rgba(59,130,246,0.45),rgba(14,165,233,0.3),rgba(236,72,153,0.35))]" />
            <div className="relative z-10 flex flex-col items-center gap-5 px-8 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/40 bg-white/10 backdrop-blur">
                <span className="ml-1 border-l-[18px] border-l-white border-y-[12px] border-y-transparent" />
              </div>
              <div className="flex flex-col gap-2 text-sm leading-relaxed text-slate-100">
                <p className="font-medium">Odtwórz materiał wideo</p>
                <p className="text-xs text-slate-300">
                  {videoUrl
                    ? `Źródło: ${videoHost ?? videoUrl}`
                    : 'Dodaj adres URL filmu w panelu edycji, aby zastąpić to miejsce.'}
                </p>
              </div>
            </div>
            {tile.content.videoLoop ? (
              <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-medium text-emerald-100">
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                Zapętlenie włączone
              </div>
            ) : null}
          </div>
        );
      })()
    : null;

  return (
    <TileChrome
      backgroundColor="#ffffff"
      showBorder
      className={className}
      style={style}
      contentClassName={joinClassNames('relative flex h-full flex-col gap-6', contentClassName)}
      contentStyle={contentStyle}
      padding="1.5rem"
    >
      <header className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold leading-tight text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-sm"
            style={{ backgroundColor: accentColor }}
          >
            {tile.content.contentType === 'chart' ? 'Wykres' : tile.content.videoLoop ? 'Wideo · pętla' : 'Wideo'}
          </span>
        </div>
      </header>

      <div className="flex-1 min-h-[240px]">
        {tile.content.contentType === 'chart' ? chartVisualization : videoVisualization}
      </div>

      {tile.content.contentType === 'chart' ? (
        <>
          {legend}
          {summary}
        </>
      ) : null}

      {overlay ?? null}
    </TileChrome>
  );
};

export default VisualizationTileView;
