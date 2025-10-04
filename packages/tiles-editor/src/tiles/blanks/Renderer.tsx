import React from 'react';
import { BlanksTile } from 'tiles-core';
import { createRichTextAdapter, RichTextEditor } from '../../components/RichTextEditor';
import { BaseTileRendererProps, getReadableTextColor } from '../../components/shared';
import { BlanksInteractive } from 'tiles-runtime/blanks';

export const BlanksTileRenderer: React.FC<BaseTileRendererProps<BlanksTile>> = ({
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
  const blanksTile = tile;
  const textColor = getReadableTextColor(blanksTile.content.backgroundColor || backgroundColor);

  const wrapperStyle: React.CSSProperties = {
    borderRadius: 'inherit',
    backgroundColor,
    border: showBorder ? '1px solid rgba(0, 0, 0, 0.08)' : 'none',
  };

  const renderBlanks = (
    instructionContent?: React.ReactNode,
    isPreviewMode = false,
  ) => (
    <BlanksInteractive
      tile={blanksTile}
      isTestingMode={isTestingMode}
      instructionContent={instructionContent}
      isPreview={isPreviewMode}
      onRequestTextEditing={isPreviewMode ? undefined : onDoubleClick}
    />
  );

  if (isEditingText && isSelected) {
    const instructionAdapter = createRichTextAdapter({
      source: blanksTile.content,
      fields: {
        text: 'instruction',
        richText: 'richInstruction',
      },
      defaults: {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 16,
        verticalAlign: 'top',
        backgroundColor: blanksTile.content.backgroundColor,
        showBorder: true,
      },
    });

    return (
      <div className="w-full h-full overflow-hidden" style={wrapperStyle}>
        {renderBlanks(
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
      {renderBlanks()}
    </div>
  );
};
