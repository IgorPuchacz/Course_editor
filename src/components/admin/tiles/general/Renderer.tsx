import React from 'react';
import { GeneralTile } from '../../../../types/lessonEditor';
import { createRichTextAdapter, type RichTextEditorProps } from '../RichTextEditor.tsx';
import { BaseTileRendererProps, getReadableTextColor } from '../shared';
import { GeneralInteractive } from './Interactive';

export const GeneralTileRenderer: React.FC<BaseTileRendererProps<GeneralTile>> = ({
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
  const generalTile = tile;
  const textColor = getReadableTextColor(generalTile.content.backgroundColor || backgroundColor);

  const wrapperStyle: React.CSSProperties = {
    borderRadius: 'inherit',
    backgroundColor,
    border: showBorder ? '1px solid rgba(0, 0, 0, 0.08)' : 'none',
  };

  const renderInteractive = (
    instructionEditorProps?: RichTextEditorProps,
    isPreviewMode = false,
  ) => (
    <GeneralInteractive
      tile={generalTile}
      isTestingMode={isTestingMode}
      instructionEditorProps={instructionEditorProps}
      isPreview={isPreviewMode}
      onRequestTextEditing={isPreviewMode ? undefined : onDoubleClick}
    />
  );

  if (isEditingText && isSelected) {
    const instructionAdapter = createRichTextAdapter({
      source: generalTile.content,
      fields: {
        text: 'instruction',
        richText: 'richInstruction',
      },
      defaults: {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 16,
        verticalAlign: 'top',
        backgroundColor: generalTile.content.backgroundColor,
        showBorder: true,
      },
    });

    return (
      <div className="w-full h-full overflow-hidden" style={wrapperStyle}>
        {renderInteractive(
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
      {renderInteractive()}
    </div>
  );
};

export default GeneralTileRenderer;
