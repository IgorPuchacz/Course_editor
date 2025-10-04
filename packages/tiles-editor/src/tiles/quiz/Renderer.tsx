import React from 'react';
import { QuizTile } from 'tiles-core';
import { TileChrome } from 'ui-primitives';
import { createRichTextAdapter, RichTextEditor } from '../../components/RichTextEditor';
import { BaseTileRendererProps, getReadableTextColor } from '../../components/shared';
import { QuizInteractive } from 'tiles-runtime/quiz';

export const QuizTileRenderer: React.FC<BaseTileRendererProps<QuizTile>> = ({
  tile,
  isSelected,
  isEditingText,
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
      <TileChrome backgroundColor={backgroundColor} showBorder={showBorder}>
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
      </TileChrome>
    );
  }

  return (
    <TileChrome backgroundColor={backgroundColor} showBorder={showBorder}>
      <QuizInteractive
        tile={quizTile}
        onRequestTextEditing={onDoubleClick}
      />
    </TileChrome>
  );
};
