import React from 'react';
import { SequencingInteractive } from '../SequencingInteractive';
import { RichTextEditor } from './RichTextEditor';
import type { SequencingTile, TextTile } from '../../../types/lessonEditor';
import type { SequencingTileViewProps } from './types';
import { getReadableTextColor } from './utils';

export const SequencingTileView: React.FC<SequencingTileViewProps> = ({
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
  const sequencingTile = tile as SequencingTile;
  const accentColor = sequencingTile.content.backgroundColor || computedBackground;
  const textColor = getReadableTextColor(accentColor);

  const renderSequencingContent = (
    instructionContent?: React.ReactNode,
    isPreviewMode = false,
  ) => (
    <SequencingInteractive
      tile={sequencingTile}
      isTestingMode={isTestingMode}
      instructionContent={instructionContent}
      isPreview={isPreviewMode}
      onRequestTextEditing={isPreviewMode ? undefined : onDoubleClick}
    />
  );

  if (isEditingText && isSelected) {
    const questionEditorTile = {
      ...tile,
      type: 'text',
      content: {
        text: sequencingTile.content.question,
        richText: sequencingTile.content.richQuestion,
        fontFamily: sequencingTile.content.fontFamily,
        fontSize: sequencingTile.content.fontSize,
        verticalAlign: sequencingTile.content.verticalAlign,
        backgroundColor: sequencingTile.content.backgroundColor,
        showBorder: sequencingTile.content.showBorder,
      },
    } as TextTile;

    return renderSequencingContent(
      <RichTextEditor
        textTile={questionEditorTile}
        tileId={tile.id}
        textColor={textColor}
        onUpdateTile={(tileId, updates) => {
          if (!updates.content) return;

          onUpdateTile(tileId, {
            content: {
              ...sequencingTile.content,
              question: updates.content.text ?? sequencingTile.content.question,
              richQuestion: updates.content.richText ?? sequencingTile.content.richQuestion,
              fontFamily: updates.content.fontFamily ?? sequencingTile.content.fontFamily,
              fontSize: updates.content.fontSize ?? sequencingTile.content.fontSize,
              verticalAlign:
                updates.content.verticalAlign ?? sequencingTile.content.verticalAlign,
            },
          });
        }}
        onFinishTextEditing={onFinishTextEditing}
        onEditorReady={onEditorReady}
      />,
      true,
    );
  }

  return renderSequencingContent();
};
