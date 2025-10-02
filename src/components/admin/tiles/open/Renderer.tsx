import React from 'react';
import { OpenTile } from '../../../../types/lessonEditor.ts';
import { createRichTextAdapter } from '../RichTextEditor.tsx';
import { BaseTileRendererProps } from '../shared.ts';
import { OpenInteractive } from './Interactive.tsx';

export const OpenTileRenderer: React.FC<BaseTileRendererProps<OpenTile>> = ({
  tile,
  isSelected,
  isEditingText,
  onUpdateTile,
  onFinishTextEditing,
  onEditorReady,
  onDoubleClick,
  backgroundColor,
}) => {
  const openTile = tile;

  const wrapperStyle: React.CSSProperties = {
    borderRadius: 'inherit',
    backgroundColor,
    border: 'none',
  };

  if (isEditingText && isSelected) {
    const instructionAdapter = createRichTextAdapter({
      source: openTile.content,
      fields: {
        text: 'instruction',
        richText: 'richInstruction',
        fontFamily: 'fontFamily',
        fontSize: 'fontSize',
      },
      defaults: {
        backgroundColor: openTile.content.backgroundColor,
        showBorder: openTile.content.showBorder,
        verticalAlign: 'top',
      },
    });

    return (
      <div className="w-full h-full overflow-hidden" style={wrapperStyle}>
        <OpenInteractive
          tile={openTile}
          instructionEditorProps={{
            content: instructionAdapter.content,
            onChange: (updatedContent) => {
              onUpdateTile(tile.id, {
                content: instructionAdapter.applyChanges(updatedContent),
              });
            },
            onFinish: onFinishTextEditing,
            onEditorReady,
          }}
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden" style={wrapperStyle}>
      <OpenInteractive tile={openTile} onRequestTextEditing={onDoubleClick} />
    </div>
  );
};

export default OpenTileRenderer;
