import React from 'react';
import { BlanksTile } from 'tiles-core';
import { RichTextEditor, createRichTextAdapter } from '../RichTextEditor.tsx';
import { BaseTileRendererProps, getReadableTextColor } from '../shared';
import { BlanksRuntimeTile } from 'tiles-runtime';

export const BlanksTileRenderer: React.FC<BaseTileRendererProps<BlanksTile>> = ({
  tile,
  isSelected,
  isEditingText,
  isTestingMode: _isTestingMode,
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
        <BlanksRuntimeTile
          tile={blanksTile}
          isPreview
          instructionSlot={(
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
            />
          )}
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden" style={wrapperStyle}>
      <BlanksRuntimeTile
        tile={blanksTile}
        onRequestTextEditing={onDoubleClick}
      />
    </div>
  );
};
