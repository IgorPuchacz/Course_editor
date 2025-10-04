import React from 'react';
import { PairingTile } from 'tiles-core';
import { TileChrome } from 'ui-primitives';
import { createRichTextAdapter, RichTextEditor } from '../../components/RichTextEditor';
import { BaseTileRendererProps, getReadableTextColor } from '../../components/shared';
import { PairingInteractive } from 'tiles-runtime/pairing';

export const PairingTileRenderer: React.FC<BaseTileRendererProps<PairingTile>> = ({
  tile,
  isSelected,
  isEditingText,
  onUpdateTile,
  onFinishTextEditing,
  onEditorReady,
  onDoubleClick,
  backgroundColor,
  showBorder,
}) => {
  const pairingTile = tile;
  const textColor = getReadableTextColor(pairingTile.content.backgroundColor || backgroundColor);

  const renderPairingContent = (
    instructionContent?: React.ReactNode,
    isPreviewMode = false,
  ) => (
    <PairingInteractive
      tile={pairingTile}
      instructionContent={instructionContent}
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
      <TileChrome backgroundColor={backgroundColor} showBorder={showBorder}>
        {renderPairingContent(
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
      </TileChrome>
    );
  }

  return (
    <TileChrome backgroundColor={backgroundColor} showBorder={showBorder}>
      {renderPairingContent()}
    </TileChrome>
  );
};
