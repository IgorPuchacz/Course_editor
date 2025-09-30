import React, { useState, useEffect } from 'react';
import { Play, Code2 } from 'lucide-react';
import { GridUtils } from '../../utils/gridUtils';
import {
  getReadableTextColor,
  darkenColor,
  surfaceColor,
} from '../../utils/colorUtils';
import { Editor } from '@tiptap/react';
import { LessonTile, TextTile, ImageTile, QuizTile, ProgrammingTile, SequencingTile, MatchPairsTile } from '../../types/lessonEditor';
import { SequencingInteractive } from './SequencingInteractive';
import { MatchPairsInteractive } from './MatchPairsInteractive';
import { TaskInstructionPanel } from './common/TaskInstructionPanel';
import { QuizInteractive } from './QuizInteractive';
import { RichTextEditor, createRichTextAdapter, RichTextEditorProps } from './common/RichTextEditor';
import { TileFrame } from './tiles/TileFrame';

interface TileRendererProps {
  tile: LessonTile;
  isSelected: boolean;
  isEditing: boolean;
  isEditingText: boolean;
  isImageEditing: boolean;
  isTestingMode?: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onImageMouseDown: (e: React.MouseEvent) => void;
  isDraggingImage: boolean;
  onDoubleClick: () => void;
  onUpdateTile: (tileId: string, updates: Partial<LessonTile>) => void;
  onDelete: (tileId: string) => void;
  onFinishTextEditing: () => void;
  showGrid: boolean;
  onEditorReady: (editor: Editor | null) => void;
}

export const TileRenderer: React.FC<TileRendererProps> = ({
  tile,
  isSelected,
  isEditing,
  isImageEditing,
  isTestingMode = false,
  onMouseDown,
  onImageMouseDown,
  isDraggingImage,
  isEditingText,
  onDoubleClick,
  onUpdateTile,
  onDelete,
  onFinishTextEditing,
  showGrid,
  onEditorReady
}) => {
  const tileContent = tile.content ?? {};
  const hasBackgroundColor =
    typeof tileContent.backgroundColor === 'string' && tileContent.backgroundColor.trim().length > 0;
  const computedBackground = hasBackgroundColor ? tileContent.backgroundColor : '#ffffff';
  const showBorder = typeof tileContent.showBorder === 'boolean' ? tileContent.showBorder : true;

  // Check if this is a frameless text tile
  const isFramelessTextTile = tile.type === 'text' && !showBorder;
  const defaultTextColor = getReadableTextColor(computedBackground);
  const cardWrapperStyle: React.CSSProperties = {
    borderRadius: 'inherit',
    backgroundColor: computedBackground,
    border: showBorder ? '1px solid rgba(0, 0, 0, 0.08)' : 'none'
  };

  const handleImageDragStart = (e: React.MouseEvent, imageTile: ImageTile) => {
    console.log('🖱️ Image drag start in TileRenderer - delegating to parent');
    onImageMouseDown(e, imageTile);
  };

  const handleImageWheel = (e: React.WheelEvent, imageTile: ImageTile) => {
    // Only handle wheel events when tile is selected and in image editing mode
    if (!isSelected || !isImageEditing) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🎯 Image wheel event - deltaY:', e.deltaY);
    
    const currentScale = imageTile.content.scale || 1;
    const zoomSpeed = 0.1;
    const zoomDirection = e.deltaY > 0 ? -1 : 1; // Negative deltaY = zoom in, positive = zoom out
    const newScale = Math.max(0.1, Math.min(3, currentScale + (zoomDirection * zoomSpeed)));
    
    console.log('🎯 Zoom - current:', currentScale, 'new:', newScale, 'direction:', zoomDirection);
    
    // Update the tile with new scale
    onUpdateTile(tile.id, {
      content: {
        ...imageTile.content,
        scale: newScale
      }
    });
  };

  const renderTileContent = () => {
    let contentToRender: JSX.Element;

    switch (tile.type) {

      case 'text':
        {
          const textTile = tile as TextTile;

          // If this text tile is being edited, use Tiptap editor
          if (isEditingText && isSelected) {
            const adapter = createRichTextAdapter({
              source: textTile.content,
              fields: {
                text: 'text',
                richText: 'richText',
                fontFamily: 'fontFamily',
                fontSize: 'fontSize',
                verticalAlign: 'verticalAlign'
              },
              defaults: {
                backgroundColor: textTile.content.backgroundColor,
                showBorder: textTile.content.showBorder
              }
            });

            contentToRender = (
              <RichTextEditor
                content={adapter.content}
                onChange={(updatedContent) => {
                  onUpdateTile(tile.id, {
                    content: adapter.applyChanges(updatedContent)
                  });
                }}
                onFinish={onFinishTextEditing}
                onEditorReady={onEditorReady}
                textColor={defaultTextColor}
              />
            );
          } else {
            // Normal text tile display
            contentToRender = (
              <>
                <div
                  className="w-full h-full p-3 overflow-hidden tile-text-content"
                  style={{
                    fontSize: `${textTile.content.fontSize}px`,
                    fontFamily: textTile.content.fontFamily,
                    color: defaultTextColor,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: textTile.content.verticalAlign === 'center' ? 'center' :
                                   textTile.content.verticalAlign === 'bottom' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div
                    className="break-words rich-text-content tile-formatted-text w-full"
                    style={{
                      minHeight: '1em',
                      outline: 'none'
                    }}
                    dangerouslySetInnerHTML={{
                      __html: textTile.content.richText || `<p style="margin: 0;">${textTile.content.text || 'Kliknij dwukrotnie, aby edytować'}</p>`
                    }}
                  />
                </div>
              </>
            );
          }
          break;
        }

      case 'image':
        {
          const imageTile = tile as ImageTile;
          const imagePosition = imageTile.content.position || { x: 0, y: 0 };
          const imageScale = imageTile.content.scale || 1;

          console.log('Rendering image tile:', imageTile.id, 'position:', imagePosition, 'scale:', imageScale, 'updated_at:', imageTile.updated_at);

          contentToRender = (
            <div className="w-full h-full overflow-hidden relative">
              <div
                className="w-full h-full relative overflow-hidden"
                style={{ cursor: isSelected && isImageEditing ? 'grab' : 'default' }}
              >
                <img
                  src={imageTile.content.url}
                  alt={imageTile.content.alt}
                  className={`absolute select-none ${
                    isSelected && isImageEditing ? 'cursor-grab active:cursor-grabbing' : ''
                  }`}
                  style={{
                    left: imagePosition.x,
                    top: imagePosition.y,
                    transform: `scale(${imageScale})`,
                    transformOrigin: '0 0',
                    maxWidth: 'none',
                    maxHeight: 'none',
                    cursor: isSelected && isImageEditing ? (isDraggingImage ? 'grabbing' : 'grab') : 'default'
                  }}
                  onMouseDown={isSelected && isImageEditing ? (e) => {
                    console.log('🖱️ Image onMouseDown triggered in TileRenderer');
                    handleImageDragStart(e, imageTile);
                  } : undefined}
                  onWheel={isSelected && isImageEditing ? (e) => {
                    handleImageWheel(e, imageTile);
                  } : undefined}
                  draggable={false}
                  onError={(e) => {
                    console.error('Image failed to load:', imageTile.content.url.substring(0, 100));
                    (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400';
                  }}
                  onLoad={() => {
                    console.log('Image loaded successfully');
                  }}
                />
              </div>
              {imageTile.content.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white text-xs p-3">
                  {imageTile.content.caption}
                </div>
              )}
            </div>
          );
          break;
        }



      case 'programming': {
        const programmingTile = tile as ProgrammingTile;

        const accentColor = programmingTile.content.backgroundColor || computedBackground;
        const textColor = getReadableTextColor(accentColor);
        const isDarkText = textColor === '#0f172a';
        const mutedTextColor = isDarkText ? '#475569' : '#e2e8f0';
        const panelBackground = surfaceColor(accentColor, textColor, 0.6, 0.4);
        const panelBorderColor = surfaceColor(accentColor, textColor, 0.48, 0.55);
        const chipBackground = surfaceColor(accentColor, textColor, 0.52, 0.48);
        const statusDotColor = surfaceColor(accentColor, textColor, 0.35, 0.35);

        const descriptionContainerStyle: React.CSSProperties = {
          backgroundColor: panelBackground,
          color: textColor,
          border: `1px solid ${panelBorderColor}`
        };

        const codeContainerStyle: React.CSSProperties = {
          borderColor: darkenColor(accentColor, isDarkText ? 0.35 : 0.55),
          backgroundColor: darkenColor(accentColor, isDarkText ? 0.55 : 0.75),
          color: '#f8fafc'
        };

        let codeDisplayContent = '';

        if (programmingTile.content.startingCode) {
          codeDisplayContent += programmingTile.content.startingCode + '\n\n';
        }

        codeDisplayContent += 'wpisz swój kod tutaj';

        if (programmingTile.content.endingCode) {
          codeDisplayContent += '\n\n' + programmingTile.content.endingCode;
        }

        const codeLines = codeDisplayContent.split('\n');

        const renderDescriptionBlock = (content: React.ReactNode) => (
          <TaskInstructionPanel
            icon={<Code2 className="w-4 h-4" />}
            label="Zadanie"
            className="flex-shrink-0 max-h-[45%] overflow-hidden border transition-colors duration-300"
            style={descriptionContainerStyle}
            iconWrapperStyle={{ backgroundColor: chipBackground, color: textColor }}
            labelStyle={{ color: mutedTextColor }}
          >
            {content}
          </TaskInstructionPanel>
        );

        const renderCodePreview = () => (
          <div className="flex-1 flex flex-col rounded-xl overflow-hidden border" style={codeContainerStyle}>
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{
                borderColor: surfaceColor(accentColor, textColor, 0.42, 0.62),
                backgroundColor: darkenColor(accentColor, isDarkText ? 0.45 : 0.7)
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-xl"
                  style={{
                    backgroundColor: darkenColor(accentColor, isDarkText ? 0.3 : 0.55),
                    color: '#f8fafc'
                  }}
                >
                  <Play className="w-4 h-4 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white">Python</span>
                  <span className="text-xs" style={{ color: '#cbd5f5' }}>
                    Tryb nauki
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs" style={{ color: '#cbd5f5' }}>
                <span className="flex items-center gap-1">
                  <span
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: statusDotColor }}
                  />
                  Gotowy do uruchomienia
                </span>
              </div>
            </div>

            <div className="flex-1 font-mono text-[13px] leading-6 px-5 py-4 text-slate-100 overflow-auto">
              {codeLines.map((line, index) => (
                <div key={index} className="flex">
                  <span className="w-8 pr-4 text-right text-slate-500 select-none">{index + 1}</span>
                  <code className="flex-1 whitespace-pre">{line}</code>
                </div>
              ))}
            </div>
          </div>
        );

        if (isEditingText && isSelected) {
          const adapter = createRichTextAdapter({
            source: programmingTile.content,
            fields: {
              text: 'description',
              richText: 'richDescription',
              fontFamily: 'fontFamily',
              fontSize: 'fontSize'
            },
            defaults: {
              backgroundColor: programmingTile.content.backgroundColor,
              showBorder: programmingTile.content.showBorder,
              verticalAlign: 'top'
            }
          });

          contentToRender = (
            <div className="w-full h-full flex flex-col gap-5 p-5" style={{ color: textColor }}>
              {renderDescriptionBlock(
                <RichTextEditor
                  textColor={textColor}
                  content={adapter.content}
                  onChange={(updatedContent) => {
                    onUpdateTile(tile.id, {
                      content: adapter.applyChanges(updatedContent)
                    });
                  }}
                  onFinish={onFinishTextEditing}
                  onEditorReady={onEditorReady}
                />
              )}

              {renderCodePreview()}
            </div>
          );
        } else {
          contentToRender = (
            <div className="w-full h-full flex flex-col gap-5 p-5" style={{ color: textColor }}>
              {renderDescriptionBlock(
                <div
                  className="text-sm leading-relaxed"
                  style={{
                    fontFamily: programmingTile.content.fontFamily,
                    fontSize: `${programmingTile.content.fontSize}px`
                  }}
                  dangerouslySetInnerHTML={{
                    __html: programmingTile.content.richDescription || programmingTile.content.description
                  }}
                />
              )}

              {renderCodePreview()}
            </div>
          );
        }
        break;
      }
      case 'quiz': {
        const quizTile = tile as QuizTile;
        const questionTextColor = getReadableTextColor(
          quizTile.content.backgroundColor || computedBackground
        );

        if (isEditingText && isSelected) {
          const questionAdapter = createRichTextAdapter({
            source: quizTile.content,
            fields: {
              text: 'question',
              richText: 'richQuestion',
              fontFamily: 'questionFontFamily',
              fontSize: 'questionFontSize'
            },
            defaults: {
              fontFamily: quizTile.content.questionFontFamily || 'Inter',
              fontSize: quizTile.content.questionFontSize ?? 16,
              verticalAlign: 'top',
              backgroundColor: quizTile.content.backgroundColor || computedBackground,
              showBorder:
                typeof quizTile.content.showBorder === 'boolean'
                  ? quizTile.content.showBorder
                  : true
            }
          });

          contentToRender = (
            <QuizInteractive
              tile={quizTile}
              isPreview
              instructionEditorProps={{
                content: questionAdapter.content,
                onChange: (updatedContent) => {
                  onUpdateTile(tile.id, {
                    content: questionAdapter.applyChanges(updatedContent)
                  });
                },
                onFinish: onFinishTextEditing,
                onEditorReady,
                textColor: questionTextColor
              }}
            />
          );
        } else {
          contentToRender = (
            <QuizInteractive
              tile={quizTile}
              isTestingMode={isTestingMode}
              onRequestTextEditing={onDoubleClick}
            />
          );
        }
        break;
      }

      case 'sequencing': {
        const sequencingTile = tile as SequencingTile;
        const accentColor = sequencingTile.content.backgroundColor || computedBackground;
        const textColor = getReadableTextColor(accentColor);

        const renderSequencingContent = (
          instructionEditorProps?: RichTextEditorProps,
          isPreviewMode = false
        ) => (
          <SequencingInteractive
            tile={sequencingTile}
            isTestingMode={isTestingMode}
            instructionEditorProps={instructionEditorProps}
            isPreview={isPreviewMode}
            onRequestTextEditing={isPreviewMode ? undefined : onDoubleClick}
          />
        );

        if (isEditingText && isSelected) {
          const instructionAdapter = createRichTextAdapter({
            source: sequencingTile.content,
            fields: {
              text: 'question',
              richText: 'richQuestion',
              fontFamily: 'fontFamily',
              fontSize: 'fontSize',
              verticalAlign: 'verticalAlign'
            },
            defaults: {
              backgroundColor: sequencingTile.content.backgroundColor,
              showBorder: sequencingTile.content.showBorder
            }
          });

          contentToRender = renderSequencingContent(
            {
              content: instructionAdapter.content,
              onChange: (updatedContent) => {
                onUpdateTile(tile.id, {
                  content: instructionAdapter.applyChanges(updatedContent)
                });
              },
              onFinish: onFinishTextEditing,
              onEditorReady,
              textColor
            },
            true
          );
        } else {
          contentToRender = renderSequencingContent();
        }
        break;
      }

      case 'matchPairs': {
        const matchPairsTile = tile as MatchPairsTile;
        const accentColor = matchPairsTile.content.backgroundColor || computedBackground;
        const textColor = getReadableTextColor(accentColor);

        const renderMatchPairs = (
          instructionEditorProps?: RichTextEditorProps,
          isPreviewMode = false
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
              richText: 'richInstruction'
            },
            defaults: {
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 16,
              verticalAlign: 'top',
              backgroundColor: matchPairsTile.content.backgroundColor,
              showBorder: true
            }
          });

          contentToRender = renderMatchPairs(
            {
              content: instructionAdapter.content,
              onChange: (updatedContent) => {
                onUpdateTile(tile.id, {
                  content: instructionAdapter.applyChanges(updatedContent)
                });
              },
              onFinish: onFinishTextEditing,
              onEditorReady,
              textColor
            },
            true
          );
        } else {
          contentToRender = renderMatchPairs();
        }
        break;
      }
      default:
        contentToRender = (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-500 text-sm">Nieznany typ kafelka</span>
          </div>
        );
        break;
      }

    return contentToRender;
  };
  const handleDoubleClick = tile.type === 'sequencing' || tile.type === 'matchPairs' ? undefined : onDoubleClick;

  return (
    <TileFrame
      tile={tile}
      isSelected={isSelected}
      isEditing={isEditing}
      isEditingText={isEditingText}
      isImageEditing={isImageEditing}
      isTestingMode={isTestingMode}
      isDraggingImage={isDraggingImage}
      showGrid={showGrid}
      isFramelessTextTile={isFramelessTextTile}
      onMouseDown={onMouseDown}
      onDoubleClick={handleDoubleClick}
      onDelete={onDelete}
    >
      {() => (
        <div className="w-full h-full overflow-hidden" style={cardWrapperStyle}>
          {renderTileContent()}
        </div>
      )}
    </TileFrame>
  );
};