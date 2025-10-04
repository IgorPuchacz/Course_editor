import React from 'react';
import { TextTile } from 'tiles-core';
import { TileChrome, TextTileView } from 'ui-primitives';
import { RichTextEditor, createRichTextAdapter } from '../../components/RichTextEditor';
import { BaseTileRendererProps, getReadableTextColor } from '../../components/shared';

export const TextTileRenderer: React.FC<BaseTileRendererProps<TextTile>> = ({
  tile,
  isSelected,
  isEditingText,
  onUpdateTile,
  onFinishTextEditing,
  onEditorReady,
  backgroundColor,
  showBorder,
}) => {
  const textTile = tile;
  const textColor = getReadableTextColor(backgroundColor);

  if (isEditingText && isSelected) {
    const adapter = createRichTextAdapter({
      source: textTile.content,
      fields: {
        text: 'text',
        richText: 'richText',
        fontFamily: 'fontFamily',
        fontSize: 'fontSize',
        verticalAlign: 'verticalAlign',
      },
      defaults: {
        backgroundColor: textTile.content.backgroundColor,
        showBorder: textTile.content.showBorder,
      },
    });

    return (
      <TileChrome
        backgroundColor={backgroundColor}
        showBorder={showBorder}
        padding="1rem"
        contentClassName="overflow-hidden"
      >
        <RichTextEditor
          content={adapter.content}
          onChange={(updatedContent) => {
            onUpdateTile(tile.id, {
              content: adapter.applyChanges(updatedContent),
            });
          }}
          onFinish={onFinishTextEditing}
          onEditorReady={onEditorReady}
          textColor={textColor}
        />
      </TileChrome>
    );
  }

  return <TextTileView tile={textTile} />;
};
