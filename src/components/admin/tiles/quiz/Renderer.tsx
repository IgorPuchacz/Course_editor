import React from 'react';
import { QuizTile } from '../../../../types/lessonEditor';
import { createRichTextAdapter } from '../RichTextEditor.tsx';
import { BaseTileRendererProps, getReadableTextColor } from '../shared';
import { QuizInteractive } from './Interactive';

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
  const questionTextColor = getReadableTextColor(quizTile.content.backgroundColor || backgroundColor);

  const wrapperStyle: React.CSSProperties = {
    borderRadius: 'inherit',
    backgroundColor,
    border: showBorder ? '1px solid rgba(0, 0, 0, 0.08)' : 'none',
  };

  if (isEditingText && isSelected) {
    const questionAdapter = createRichTextAdapter({
      source: quizTile.content,
      fields: {
        text: 'question',
        richText: 'richQuestion',
        fontFamily: 'questionFontFamily',
        fontSize: 'questionFontSize',
      },
      defaults: {
        fontFamily: quizTile.content.questionFontFamily || 'Inter',
        fontSize: quizTile.content.questionFontSize ?? 16,
        verticalAlign: 'top',
        backgroundColor: quizTile.content.backgroundColor || backgroundColor,
        showBorder: typeof quizTile.content.showBorder === 'boolean' ? quizTile.content.showBorder : true,
      },
    });

    return (
      <div className="w-full h-full overflow-hidden" style={wrapperStyle}>
        <QuizInteractive
          tile={quizTile}
          isPreview
          instructionEditorProps={{
            content: questionAdapter.content,
            onChange: (updatedContent) => {
              onUpdateTile(tile.id, {
                content: questionAdapter.applyChanges(updatedContent),
              });
            },
            onFinish: onFinishTextEditing,
            onEditorReady,
            textColor: questionTextColor,
          }}
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
