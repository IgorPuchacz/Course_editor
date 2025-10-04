import React from 'react';
import { QuizTile } from 'tiles-core';
import { createRichTextAdapter, RichTextEditor } from '../../components/RichTextEditor';
import { BaseTileRendererProps, getReadableTextColor } from '../../components/shared';
import { QuizInteractive } from 'tiles-runtime/quiz';

export const QuizTileRenderer: React.FC<BaseTileRendererProps<QuizTile>> = ({
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
  const quizTile = tile;
  const quizContent: QuizTile['content'] = {
    question: '',
    richQuestion: undefined,
    answers: [],
    multipleCorrect: false,
    backgroundColor,
    showBorder,
    questionFontFamily: quizTile.content?.questionFontFamily,
    questionFontSize: quizTile.content?.questionFontSize,
    ...quizTile.content,
  } as QuizTile['content'];
  const questionTextColor = getReadableTextColor(quizContent.backgroundColor || backgroundColor);

  const wrapperStyle: React.CSSProperties = {
    borderRadius: 'inherit',
    backgroundColor,
    border: showBorder ? '1px solid rgba(0, 0, 0, 0.08)' : 'none',
  };

  if (isEditingText && isSelected) {
    const questionAdapter = createRichTextAdapter({
      source: quizContent,
      fields: {
        text: 'question',
        richText: 'richQuestion',
        fontFamily: 'questionFontFamily',
        fontSize: 'questionFontSize',
      },
      defaults: {
        fontFamily: quizContent.questionFontFamily || 'Inter',
        fontSize: quizContent.questionFontSize ?? 16,
        verticalAlign: 'top',
        backgroundColor: quizContent.backgroundColor || backgroundColor,
        showBorder: typeof quizContent.showBorder === 'boolean' ? quizContent.showBorder : true,
      },
    });

    return (
      <div className="w-full h-full overflow-hidden" style={wrapperStyle}>
        <QuizInteractive
          tile={{ ...quizTile, content: quizContent }}
          isPreview
          instructionContent={(
            <RichTextEditor
              content={questionAdapter.content}
              onChange={(updatedContent) => {
                onUpdateTile(tile.id, {
                  content: questionAdapter.applyChanges(updatedContent),
                });
              }}
              onFinish={onFinishTextEditing}
              onEditorReady={onEditorReady}
              textColor={questionTextColor}
            />
          )}
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden" style={wrapperStyle}>
      <QuizInteractive
        tile={quizTile}
        isTestingMode={isTestingMode}
        onRequestTextEditing={onDoubleClick}
      />
    </div>
  );
};
