import React from 'react';
import { OpenTile } from 'tiles-core';
import { TileChrome } from 'ui-primitives';
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
      <TileChrome backgroundColor={backgroundColor} showBorder={showBorder}>
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
      </TileChrome>
    );
  }

  return (
    <TileChrome backgroundColor={backgroundColor} showBorder={showBorder}>
      {renderOpenTile()}
    </TileChrome>
  );
};
