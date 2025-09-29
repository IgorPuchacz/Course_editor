import React from 'react';
import { MatchPairsInteractive } from '../MatchPairsInteractive';
import { RichTextEditor } from './RichTextEditor';
import type { MatchPairsTile, TextTile } from '../../../types/lessonEditor';
import type { MatchPairsTileViewProps } from './types';
import { getReadableTextColor } from './utils';

export const MatchPairsTileView: React.FC<MatchPairsTileViewProps> = ({
  tile,
  isSelected,
  isEditingText,
  isTestingMode,
  computedBackground,
  onUpdateTile,
  onFinishTextEditing,
  onEditorReady,
  onDoubleClick,
}) => {
  const matchPairsTile = tile as MatchPairsTile;
  const accentColor = matchPairsTile.content.backgroundColor || computedBackground;
  const textColor = getReadableTextColor(accentColor);

  const renderMatchPairs = (instructionContent?: React.ReactNode, isPreviewMode = false) => (
    <MatchPairsInteractive
      tile={matchPairsTile}
      isTestingMode={isTestingMode}
      instructionContent={instructionContent}
      isPreview={isPreviewMode}
      onRequestTextEditing={isPreviewMode ? undefined : onDoubleClick}
    />
  );

  if (isEditingText && isSelected) {
    const instructionEditorTile = {
      ...tile,
      type: 'text',
      content: {
        text: matchPairsTile.content.instruction,
        richText: matchPairsTile.content.richInstruction,
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 16,
        verticalAlign: 'top',
        backgroundColor: matchPairsTile.content.backgroundColor,
        showBorder: true,
      },
    } as TextTile;

    return renderMatchPairs(
      <RichTextEditor
        textTile={instructionEditorTile}
        tileId={tile.id}
        textColor={textColor}
        onUpdateTile={(tileId, updates) => {
          if (!updates.content) return;

          onUpdateTile(tileId, {
            content: {
              ...matchPairsTile.content,
              instruction: updates.content.text ?? matchPairsTile.content.instruction,
              richInstruction:
                updates.content.richText ?? matchPairsTile.content.richInstruction,
            },
          });
        }}
        onFinishTextEditing={onFinishTextEditing}
        onEditorReady={onEditorReady}
      />,
      true,
    );
  }

  return renderMatchPairs();
};
