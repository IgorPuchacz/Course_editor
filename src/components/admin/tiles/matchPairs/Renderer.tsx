import React from 'react';
import { MatchPairsTile } from '../../../../types/lessonEditor';
import { createRichTextAdapter, type RichTextEditorProps } from '../../common/RichTextEditor';
import { BaseTileRendererProps, getReadableTextColor } from '../shared';
import { MatchPairsInteractive } from './Interactive';

export const MatchPairsTileRenderer: React.FC<BaseTileRendererProps<MatchPairsTile>> = ({
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
  const matchPairsTile = tile;
  const textColor = getReadableTextColor(matchPairsTile.content.backgroundColor || backgroundColor);

  const wrapperStyle: React.CSSProperties = {
    borderRadius: 'inherit',
    backgroundColor,
    border: showBorder ? '1px solid rgba(0, 0, 0, 0.08)' : 'none',
  };

  const renderMatchPairs = (
    instructionEditorProps?: RichTextEditorProps,
    isPreviewMode = false,
  ) => (
    <MatchPairsInteractive
      tile={matchPairsTile}
      isTestingMode={isTestingMode}
      instructionEditorProps={instructionEditorProps}
      isPreview={isPreviewMode}
      onRequestTextEditing={isPreviewMode ? undefined : onDoubleClick}
    />
  );

  if (isEditingText && isSelected) {
    const instructionAdapter = createRichTextAdapter({
      source: matchPairsTile.content,
      fields: {
        text: 'instruction',
        richText: 'richInstruction',
      },
      defaults: {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 16,
        verticalAlign: 'top',
        backgroundColor: matchPairsTile.content.backgroundColor,
        showBorder: true,
      },
    });

    return (
      <div className="w-full h-full overflow-hidden" style={wrapperStyle}>
        {renderMatchPairs(
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
      {renderMatchPairs()}
    </div>
  );
};
