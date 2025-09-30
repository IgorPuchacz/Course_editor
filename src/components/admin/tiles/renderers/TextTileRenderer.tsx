import React from 'react';
import { TextTile } from '../../../../types/lessonEditor';
import { RichTextEditor, createRichTextAdapter } from '../../common/RichTextEditor';
import { BaseTileRendererProps, getReadableTextColor } from '../shared';

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

  const wrapperStyle: React.CSSProperties = {
    borderRadius: 'inherit',
    backgroundColor,
    border: showBorder ? '1px solid rgba(0, 0, 0, 0.08)' : 'none',
  };

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
      <div className="w-full h-full overflow-hidden" style={wrapperStyle}>
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
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden" style={wrapperStyle}>
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
    </div>
  );
};
