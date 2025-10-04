import React from 'react';
import { PairingTile } from 'tiles-core';
import { createRichTextAdapter, type RichTextEditorProps } from '../RichTextEditor.tsx';
import { BaseTileRendererProps, getReadableTextColor } from '../shared';
import { PairingInteractive } from './Interactive';

export const PairingTileRenderer: React.FC<BaseTileRendererProps<PairingTile>> = ({
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
  const pairingTile = tile;
  const textColor = getReadableTextColor(pairingTile.content.backgroundColor || backgroundColor);

  const wrapperStyle: React.CSSProperties = {
    borderRadius: 'inherit',
    backgroundColor,
    border: showBorder ? '1px solid rgba(0, 0, 0, 0.08)' : 'none',
  };

  const renderPairingContent = (
    instructionEditorProps?: RichTextEditorProps,
    isPreviewMode = false,
  ) => (
    <PairingInteractive
      tile={pairingTile}
      isTestingMode={isTestingMode}
      instructionEditorProps={instructionEditorProps}
      isPreview={isPreviewMode}
      onRequestTextEditing={isPreviewMode ? undefined : onDoubleClick}
    />
  );

  if (isEditingText && isSelected) {
    const instructionAdapter = createRichTextAdapter({
      source: pairingTile.content,
      fields: {
        text: 'instruction',
        richText: 'richInstruction',
        fontFamily: 'fontFamily',
        fontSize: 'fontSize',
        verticalAlign: 'verticalAlign',
      },
      defaults: {
        backgroundColor: pairingTile.content.backgroundColor,
        showBorder: true,
      },
    });

    return (
      <div className="w-full h-full overflow-hidden" style={wrapperStyle}>
        {renderPairingContent(
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
      {renderPairingContent()}
    </div>
  );
};
