import React from 'react';
import type { TextTile } from '../../../types/lessonEditor';
import { RichTextEditor } from './RichTextEditor';
import type { TextTileViewProps } from './types';

export const TextTileView: React.FC<TextTileViewProps> = ({
  tile,
  isSelected,
  isEditingText,
  textColor,
  onUpdateTile,
  onFinishTextEditing,
  onEditorReady,
}) => {
  const textTile = tile as TextTile;

  if (isEditingText && isSelected) {
    return (
      <RichTextEditor
        textTile={textTile}
        tileId={tile.id}
        onUpdateTile={onUpdateTile}
        onFinishTextEditing={onFinishTextEditing}
        onEditorReady={onEditorReady}
        textColor={textColor}
      />
    );
  }

  return (
    <div
      className="w-full h-full p-3 overflow-hidden tile-text-content"
      style={{
        fontSize: `${textTile.content.fontSize}px`,
        fontFamily: textTile.content.fontFamily,
        color: textColor,
        display: 'flex',
        flexDirection: 'column',
        justifyContent:
          textTile.content.verticalAlign === 'center'
            ? 'center'
            : textTile.content.verticalAlign === 'bottom'
            ? 'flex-end'
            : 'flex-start',
      }}
    >
      <div
        className="break-words rich-text-content tile-formatted-text w-full"
        style={{
          minHeight: '1em',
          outline: 'none',
        }}
        dangerouslySetInnerHTML={{
          __html:
            textTile.content.richText ||
            `<p style="margin: 0;">${textTile.content.text || 'Kliknij dwukrotnie, aby edytować'}</p>`,
        }}
      />
    </div>
  );
};
