import React from 'react';
import { OpenTile } from '../../../../types/lessonEditor';
import { createRichTextAdapter, type RichTextEditorProps } from '../RichTextEditor.tsx';
import { BaseTileRendererProps, getReadableTextColor } from '../shared';
import { OpenInteractive } from './Interactive';

export const OpenTileRenderer: React.FC<BaseTileRendererProps<OpenTile>> = ({
  tile,
  isSelected,
  isEditingText,
  isTestingMode,
  onUpdateTile,
  onFinishTextEditing,
  onEditorReady,
  onDoubleClick,
  backgroundColor,
  showBorder,
}) => {
  const openTile = tile;
  const textColor = getReadableTextColor(openTile.content.backgroundColor || backgroundColor);

  const wrapperStyle: React.CSSProperties = {
    borderRadius: 'inherit',
    backgroundColor,
    border: showBorder ? '1px solid rgba(0, 0, 0, 0.08)' : 'none',
  };

  const renderOpenContent = (
    instructionEditorProps?: RichTextEditorProps,
    isPreviewMode = false,
  ) => (
    <OpenInteractive
      tile={openTile}
      isTestingMode={isTestingMode}
      instructionEditorProps={instructionEditorProps}
      isPreview={isPreviewMode}
      onRequestTextEditing={isPreviewMode ? undefined : onDoubleClick}
    />
  );

  if (isEditingText && isSelected) {
    const instructionAdapter = createRichTextAdapter({
      source: openTile.content,
      fields: {
        text: 'instruction',
        richText: 'richInstruction',
      },
      defaults: {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 16,
        verticalAlign: 'top',
        backgroundColor: openTile.content.backgroundColor,
        showBorder: openTile.content.showBorder,
      },
    });

    return (
      <div className="w-full h-full overflow-hidden" style={wrapperStyle}>
        {renderOpenContent(
          {
            content: instructionAdapter.content,
            onChange: (updatedContent) => {
              onUpdateTile(tile.id, {
                content: instructionAdapter.applyChanges(updatedContent),
              });
            },
            onFinish: onFinishTextEditing,
            onEditorReady,
            textColor,
          },
          true,
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden" style={wrapperStyle}>
      {renderOpenContent()}
    </div>
  );
};
