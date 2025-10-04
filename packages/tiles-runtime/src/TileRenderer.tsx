import React from 'react';
import {
  LessonTile,
  QuizTile,
  BlanksTile,
  OpenTile,
  PairingTile,
  SequencingTile,
  TextTile,
  ImageTile,
  ProgrammingTile
} from 'tiles-core';
import { Code2, Play } from 'lucide-react';
import {
  QuizInteractive,
  BlanksInteractive,
  OpenInteractive,
  PairingInteractive,
  SequencingInteractive
} from './index';
import { TaskInstructionPanel } from 'tiles-core/ui';
import {
  getReadableTextColor,
  surfaceColor,
  darkenColor
} from 'tiles-core/utils';

interface TileRuntimeRendererProps {
  tile: LessonTile;
}

const renderTextTile = (tile: TextTile) => {
  const backgroundColor = tile.content.backgroundColor ?? '#ffffff';
  const showBorder = tile.content.showBorder ?? true;
  const textColor = getReadableTextColor(backgroundColor);

  return (
    <div
      className="w-full h-full overflow-hidden"
      style={{
        borderRadius: 'inherit',
        backgroundColor,
        border: showBorder ? '1px solid rgba(0, 0, 0, 0.08)' : 'none'
      }}
    >
      <div
        className="w-full h-full p-3 overflow-hidden tile-text-content"
        style={{
          fontSize: `${tile.content.fontSize}px`,
          fontFamily: tile.content.fontFamily,
          color: textColor,
          display: 'flex',
          flexDirection: 'column',
          justifyContent:
            tile.content.verticalAlign === 'center'
              ? 'center'
              : tile.content.verticalAlign === 'bottom'
                ? 'flex-end'
                : 'flex-start'
        }}
      >
        <div
          className="break-words rich-text-content tile-formatted-text w-full"
          style={{ minHeight: '1em' }}
          dangerouslySetInnerHTML={{
            __html:
              tile.content.richText ||
              `<p style="margin: 0;">${tile.content.text || ''}</p>`
          }}
        />
      </div>
    </div>
  );
};

const renderImageTile = (tile: ImageTile) => {
  return (
    <div
      className="w-full h-full overflow-hidden flex items-center justify-center bg-white"
      style={{ borderRadius: 'inherit' }}
    >
      <img
        src={tile.content.url}
        alt={tile.content.alt}
        className="max-w-full max-h-full object-contain"
      />
    </div>
  );
};

const renderProgrammingTile = (tile: ProgrammingTile) => {
  const accentColor = tile.content.backgroundColor || '#1e293b';
  const textColor = getReadableTextColor(accentColor);
  const mutedTextColor = textColor === '#0f172a' ? '#475569' : '#e2e8f0';
  const panelBackground = surfaceColor(accentColor, textColor, 0.6, 0.4);
  const panelBorderColor = surfaceColor(accentColor, textColor, 0.48, 0.55);
  const chipBackground = surfaceColor(accentColor, textColor, 0.52, 0.48);
  const statusDotColor = surfaceColor(accentColor, textColor, 0.35, 0.35);
  const showBorder = tile.content.showBorder ?? true;

  const descriptionContainerStyle: React.CSSProperties = {
    backgroundColor: panelBackground,
    color: textColor,
    border: `1px solid ${panelBorderColor}`
  };

  const codeDisplayLines = [
    tile.content.startingCode,
    'wpisz swój kod tutaj',
    tile.content.endingCode
  ]
    .filter(Boolean)
    .join('\n')
    .split('\n');

  return (
    <div
      className="w-full h-full overflow-hidden"
      style={{
        borderRadius: 'inherit',
        backgroundColor: tile.content.backgroundColor,
        border: showBorder ? '1px solid rgba(0,0,0,0.08)' : 'none'
      }}
    >
      <div className="w-full h-full flex flex-col gap-5 p-5" style={{ color: textColor }}>
        <TaskInstructionPanel
          icon={<Code2 className="w-4 h-4" />}
          label="Zadanie"
          className="flex-shrink-0 max-h-[45%] overflow-hidden border"
          style={descriptionContainerStyle}
          iconWrapperStyle={{ backgroundColor: chipBackground, color: textColor }}
          labelStyle={{ color: mutedTextColor }}
        >
          <div
            className="text-sm leading-relaxed"
            dangerouslySetInnerHTML={{
              __html:
                tile.content.richDescription ||
                `<p style="margin: 0;">${tile.content.description}</p>`
            }}
          />
        </TaskInstructionPanel>

        <div
          className="flex-1 flex flex-col rounded-xl overflow-hidden border"
          style={{
            borderColor: darkenColor(accentColor, textColor === '#0f172a' ? 0.35 : 0.55),
            backgroundColor: darkenColor(accentColor, textColor === '#0f172a' ? 0.55 : 0.75),
            color: '#f8fafc'
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{
              borderColor: surfaceColor(accentColor, textColor, 0.42, 0.62),
              backgroundColor: darkenColor(accentColor, textColor === '#0f172a' ? 0.45 : 0.7)
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center w-10 h-10 rounded-xl"
                style={{
                  backgroundColor: darkenColor(accentColor, textColor === '#0f172a' ? 0.3 : 0.55),
                  color: '#f8fafc'
                }}
              >
                <Play className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">{tile.content.language || 'Język'}</span>
                <span className="text-xs" style={{ color: '#cbd5f5' }}>
                  Podgląd zadania
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs" style={{ color: '#cbd5f5' }}>
              <span className="flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: statusDotColor }}
                />
                Tryb podglądu
              </span>
            </div>
          </div>

          <div className="flex-1 font-mono text-[13px] leading-6 px-5 py-4 text-slate-100 overflow-auto">
            {codeDisplayLines.map((line, index) => (
              <div key={index} className="flex">
                <span className="w-8 pr-4 text-right text-slate-500 select-none">{index + 1}</span>
                <code className="flex-1 whitespace-pre">{line}</code>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const renderQuizTile = (tile: QuizTile) => (
  <QuizInteractive tile={tile} isPreview />
);

const renderBlanksTile = (tile: BlanksTile) => (
  <BlanksInteractive tile={tile} isPreview />
);

const renderOpenTile = (tile: OpenTile) => (
  <OpenInteractive tile={tile} isPreview />
);

const renderPairingTile = (tile: PairingTile) => (
  <PairingInteractive tile={tile} isPreview />
);

const renderSequencingTile = (tile: SequencingTile) => (
  <SequencingInteractive tile={tile} isPreview variant="embedded" />
);

const renderUnsupportedTile = () => (
  <div className="w-full h-full flex items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-100 text-slate-500 text-sm">
    Podgląd dla tego typu kafelka jest niedostępny
  </div>
);

export const TileRuntimeRenderer: React.FC<TileRuntimeRendererProps> = ({ tile }) => {
  switch (tile.type) {
    case 'text':
      return renderTextTile(tile);
    case 'image':
      return renderImageTile(tile);
    case 'programming':
      return renderProgrammingTile(tile);
    case 'quiz':
      return renderQuizTile(tile);
    case 'blanks':
      return renderBlanksTile(tile);
    case 'open':
      return renderOpenTile(tile);
    case 'pairing':
      return renderPairingTile(tile);
    case 'sequencing':
      return renderSequencingTile(tile);
    default:
      return renderUnsupportedTile();
  }
};

export default TileRuntimeRenderer;
