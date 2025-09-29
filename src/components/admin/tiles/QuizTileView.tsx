import React from 'react';
import { QuizInteractive } from '../QuizInteractive';
import { RichTextEditor } from './RichTextEditor';
import type { QuizTile, TextTile } from '../../../types/lessonEditor';
import type { QuizTileViewProps } from './types';
import { getReadableTextColor } from './utils';

export const QuizTileView: React.FC<QuizTileViewProps> = ({
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
  const quizTile = tile as QuizTile;
  const questionTextColor = getReadableTextColor(
    quizTile.content.backgroundColor || computedBackground,
  );

  if (isEditingText && isSelected) {
    const questionEditorTile: TextTile = {
      ...tile,
      type: 'text',
      content: {
        text: quizTile.content.question,
        richText: quizTile.content.richQuestion,
        fontFamily: quizTile.content.questionFontFamily || 'Inter',
        fontSize: quizTile.content.questionFontSize ?? 16,
        verticalAlign: 'top',
        backgroundColor: quizTile.content.backgroundColor || computedBackground,
        showBorder:
          typeof quizTile.content.showBorder === 'boolean'
            ? quizTile.content.showBorder
            : true,
      },
    };

    return (
      <QuizInteractive
        tile={quizTile}
        isPreview
        instructionContent={
          <RichTextEditor
            textTile={questionEditorTile}
            tileId={tile.id}
            onUpdateTile={(tileId, updates) => {
              if (!updates.content) return;

              onUpdateTile(tileId, {
                content: {
                  ...quizTile.content,
                  question: updates.content.text ?? quizTile.content.question,
                  richQuestion: updates.content.richText ?? quizTile.content.richQuestion,
                  questionFontFamily:
                    updates.content.fontFamily ?? quizTile.content.questionFontFamily,
                  questionFontSize:
                    updates.content.fontSize ?? quizTile.content.questionFontSize,
                },
              });
            }}
            onFinishTextEditing={onFinishTextEditing}
            onEditorReady={onEditorReady}
            textColor={questionTextColor}
          />
        }
      />
    );
  }

  return (
    <QuizInteractive
      tile={quizTile}
      isTestingMode={isTestingMode}
      onRequestTextEditing={onDoubleClick}
    />
  );
};
