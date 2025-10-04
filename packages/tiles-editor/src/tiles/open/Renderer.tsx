import React from 'react';
import { OpenTile } from 'tiles-core';
import { createRichTextAdapter, RichTextEditor } from '../../components/RichTextEditor';
import { BaseTileRendererProps, getReadableTextColor } from '../../components/shared';
import { OpenInteractive } from 'tiles-runtime/open';

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

  const renderOpenTile = (
    instructionContent?: React.ReactNode,
    isPreviewMode = false,
  ) => (
    <OpenInteractive
      tile={openTile}
      isTestingMode={isTestingMode}
      instructionContent={instructionContent}
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
        fontFamily: 'fontFamily',
        fontSize: 'fontSize',
        verticalAlign: 'verticalAlign',
      },
      defaults: {
        backgroundColor: openTile.content.backgroundColor,
        showBorder: openTile.content.showBorder,
      },
    });

    return (
      <div className="w-full h-full overflow-hidden" style={wrapperStyle}>
        {renderOpenTile(
          <RichTextEditor
            content={instructionAdapter.content}
            onChange={(updatedContent) => {
              onUpdateTile(tile.id, {
                content: instructionAdapter.applyChanges(updatedContent),
              });
            }}
            onFinish={onFinishTextEditing}
            onEditorReady={onEditorReady}
            textColor={textColor}
          />,
          true,
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden" style={wrapperStyle}>
      {renderOpenTile()}
    </div>
  );
};
