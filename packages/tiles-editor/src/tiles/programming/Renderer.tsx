import React from 'react';
import { Code2, Play } from 'lucide-react';
import { ProgrammingTile } from 'tiles-core';
import { TaskInstructionPanel } from 'tiles-core/ui';
import { RichTextEditor, createRichTextAdapter } from '../../components/RichTextEditor';
import { BaseTileRendererProps, darkenColor, getReadableTextColor, surfaceColor } from '../../components/shared';

export const ProgrammingTileRenderer: React.FC<BaseTileRendererProps<ProgrammingTile>> = ({
  tile,
  isSelected,
  isEditingText,
  onUpdateTile,
  onFinishTextEditing,
  onEditorReady,
  backgroundColor,
  showBorder,
}) => {
  const programmingTile = tile;

  const accentColor = programmingTile.content.backgroundColor || backgroundColor;
  const textColor = getReadableTextColor(accentColor);
  const isDarkText = textColor === '#0f172a';
  const mutedTextColor = isDarkText ? '#475569' : '#e2e8f0';
  const panelBackground = surfaceColor(accentColor, textColor, 0.6, 0.4);
  const panelBorderColor = surfaceColor(accentColor, textColor, 0.48, 0.55);
  const chipBackground = surfaceColor(accentColor, textColor, 0.52, 0.48);
  const statusDotColor = surfaceColor(accentColor, textColor, 0.35, 0.35);

  const descriptionContainerStyle: React.CSSProperties = {
    backgroundColor: panelBackground,
    color: textColor,
    border: `1px solid ${panelBorderColor}`,
  };

  const codeContainerStyle: React.CSSProperties = {
    borderColor: darkenColor(accentColor, isDarkText ? 0.35 : 0.55),
    backgroundColor: darkenColor(accentColor, isDarkText ? 0.55 : 0.75),
    color: '#f8fafc',
  };

  const buildCodePreview = () => {
    let codeDisplayContent = '';

    if (programmingTile.content.startingCode) {
      codeDisplayContent += programmingTile.content.startingCode + '\n\n';
    }

    codeDisplayContent += 'wpisz swój kod tutaj';

    if (programmingTile.content.endingCode) {
      codeDisplayContent += '\n\n' + programmingTile.content.endingCode;
    }

    return codeDisplayContent.split('\n');
  };

  const renderDescriptionBlock = (content: React.ReactNode) => (
    <TaskInstructionPanel
      icon={<Code2 className="w-4 h-4" />}
      label="Zadanie"
      className="flex-shrink-0 max-h-[45%] overflow-hidden border transition-colors duration-300"
      style={descriptionContainerStyle}
      iconWrapperStyle={{ backgroundColor: chipBackground, color: textColor }}
      labelStyle={{ color: mutedTextColor }}
    >
      {content}
    </TaskInstructionPanel>
  );

  const renderCodePreview = () => {
    const codeLines = buildCodePreview();

    return (
      <div className="flex-1 flex flex-col rounded-xl overflow-hidden border" style={codeContainerStyle}>
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{
            borderColor: surfaceColor(accentColor, textColor, 0.42, 0.62),
            backgroundColor: darkenColor(accentColor, isDarkText ? 0.45 : 0.7),
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl"
              style={{
                backgroundColor: darkenColor(accentColor, isDarkText ? 0.3 : 0.55),
                color: '#f8fafc',
              }}
            >
              <Play className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white">Python</span>
              <span className="text-xs" style={{ color: '#cbd5f5' }}>
                Tryb nauki
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs" style={{ color: '#cbd5f5' }}>
            <span className="flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: statusDotColor }}
              />
              Gotowy do uruchomienia
            </span>
          </div>
        </div>

        <div className="flex-1 font-mono text-[13px] leading-6 px-5 py-4 text-slate-100 overflow-auto">
          {codeLines.map((line, index) => (
            <div key={index} className="flex">
              <span className="w-8 pr-4 text-right text-slate-500 select-none">{index + 1}</span>
              <code className="flex-1 whitespace-pre">{line}</code>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (isEditingText && isSelected) {
    const adapter = createRichTextAdapter({
      source: programmingTile.content,
      fields: {
        text: 'description',
        richText: 'richDescription',
        fontFamily: 'fontFamily',
        fontSize: 'fontSize',
      },
      defaults: {
        backgroundColor: programmingTile.content.backgroundColor,
        showBorder: programmingTile.content.showBorder,
        verticalAlign: 'top',
      },
    });

    return (
      <div
        className="w-full h-full overflow-hidden"
        style={{
          borderRadius: 'inherit',
          backgroundColor,
          border: showBorder ? '1px solid rgba(0, 0, 0, 0.08)' : 'none',
        }}
      >
        <div className="w-full h-full flex flex-col gap-5 p-5" style={{ color: textColor }}>
          {renderDescriptionBlock(
            <RichTextEditor
              textColor={textColor}
              content={adapter.content}
              onChange={(updatedContent) => {
                onUpdateTile(tile.id, {
                  content: adapter.applyChanges(updatedContent),
                });
              }}
              onFinish={onFinishTextEditing}
              onEditorReady={onEditorReady}
            />
          )}

          {renderCodePreview()}
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full overflow-hidden"
      style={{
        borderRadius: 'inherit',
        backgroundColor,
        border: showBorder ? '1px solid rgba(0, 0, 0, 0.08)' : 'none',
      }}
    >
      <div className="w-full h-full flex flex-col gap-5 p-5" style={{ color: textColor }}>
        {renderDescriptionBlock(
          <div
            className="text-sm leading-relaxed"
            style={{
              fontFamily: programmingTile.content.fontFamily,
              fontSize: `${programmingTile.content.fontSize}px`,
            }}
            dangerouslySetInnerHTML={{
              __html: programmingTile.content.richDescription || programmingTile.content.description,
            }}
          />
        )}

        {renderCodePreview()}
      </div>
    </div>
  );
};
