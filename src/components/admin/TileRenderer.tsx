import React, { useState, useEffect } from 'react';
import { Move, Trash2, Play, Code2 } from 'lucide-react';
import {
  LessonTile,
  TextTile,
  ImageTile,
  QuizTile,
  ProgrammingTile,
  SequencingTile,
  FillBlanksTile
} from '../../types/lessonEditor';
import { GridUtils } from '../../utils/gridUtils';
import { Editor, EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import FontSize from '../../extensions/FontSize';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import TextAlign from '../../extensions/TextAlign';
import { SequencingInteractive } from './SequencingInteractive';
import { TaskInstructionPanel } from './common/TaskInstructionPanel';
import { QuizInteractive } from './QuizInteractive';
import { FillBlanksInteractive } from './FillBlanksInteractive';

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  if (!hex) return null;

  let normalized = hex.replace('#', '').trim();
  if (normalized.length === 3) {
    normalized = normalized.split('').map((char) => `${char}${char}`).join('');
  }

  if (normalized.length !== 6) return null;

  const intValue = Number.parseInt(normalized, 16);
  if (Number.isNaN(intValue)) return null;

  return {
    r: (intValue >> 16) & 255,
    g: (intValue >> 8) & 255,
    b: intValue & 255,
  };
};

const channelToLinear = (value: number): number => {
  const scaled = value / 255;
  return scaled <= 0.03928 ? scaled / 12.92 : Math.pow((scaled + 0.055) / 1.055, 2.4);
};

const getReadableTextColor = (hex: string): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#0f172a';

  const luminance = (0.2126 * channelToLinear(rgb.r)) +
    (0.7152 * channelToLinear(rgb.g)) +
    (0.0722 * channelToLinear(rgb.b));

  return luminance > 0.6 ? '#0f172a' : '#f8fafc';
};

const lightenColor = (hex: string, amount: number): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const lightenChannel = (channel: number) => Math.round(channel + (255 - channel) * amount);
  return `rgb(${lightenChannel(rgb.r)}, ${lightenChannel(rgb.g)}, ${lightenChannel(rgb.b)})`;
};

const darkenColor = (hex: string, amount: number): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const darkenChannel = (channel: number) => Math.round(channel * (1 - amount));
  return `rgb(${darkenChannel(rgb.r)}, ${darkenChannel(rgb.g)}, ${darkenChannel(rgb.b)})`;
};

const surfaceColor = (accent: string, textColor: string, lightenAmount: number, darkenAmount: number): string =>
  textColor === '#0f172a' ? lightenColor(accent, lightenAmount) : darkenColor(accent, darkenAmount);

const TILE_CORNER = 'rounded-xl';

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

interface RichTextEditorProps {
  textTile: TextTile;
  tileId: string;
  onUpdateTile: (tileId: string, updates: Partial<LessonTile>) => void;
  onFinishTextEditing: () => void;
  onEditorReady: (editor: Editor | null) => void;
  textColor?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ textTile, tileId, onUpdateTile, onFinishTextEditing, onEditorReady, textColor }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      BulletList.configure({
        HTMLAttributes: { class: 'bullet-list' },
        keepMarks: true,
        keepAttributes: true,
      }),
      OrderedList.configure({
        HTMLAttributes: { class: 'ordered-list' },
        keepMarks: true,
        keepAttributes: true,
      }),
      ListItem,
      Underline,
      TextStyle,
      Color.configure({ types: ['textStyle'] }),
      FontFamily.configure({ types: ['textStyle'] }),
      FontSize,
      TextAlign.configure({ types: ['paragraph'] }),
    ],
    content:
      textTile.content.richText ||
      `<p style="margin: 0;">${textTile.content.text || ''}</p>`,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const plain = editor.getText();
      onUpdateTile(tileId, {
        content: {
          ...textTile.content,
          text: plain,
          richText: html
        }
      });
    },
    autofocus: true
  });

  useEffect(() => {
    onEditorReady(editor);
    return () => onEditorReady(null);
  }, [editor, onEditorReady]);

  if (!editor) return null;

  const handleBlur = (e: React.FocusEvent) => {
    const toolbar = document.querySelector('.top-toolbar');
    if (toolbar && e.relatedTarget && toolbar.contains(e.relatedTarget as Node)) {
      e.preventDefault();
      editor.commands.focus();
      return;
    }
    onFinishTextEditing();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      if (editor.isActive('listItem')) {
        if (e.shiftKey) {
          editor.chain().focus().liftListItem('listItem').run();
        } else {
          editor.chain().focus().sinkListItem('listItem').run();
        }
      } else {
        editor.chain().focus().insertContent('\t').run();
      }
    }
  };

  return (
    <div
      className="w-full h-full p-3 overflow-hidden relative tile-text-content tiptap-editor"
      style={{
        fontSize: `${textTile.content.fontSize}px`,
        fontFamily: textTile.content.fontFamily,
        color: textColor,
        display: 'flex',
        flexDirection: 'column',
        justifyContent:
          textTile.content.verticalAlign === 'center'
            ? 'center'
            : textTile.content.verticalAlign === 'bottom'
            ? 'flex-end'
            : 'flex-start',
      }}
    >
      <EditorContent
        editor={editor}
        className="w-full focus:outline-none break-words rich-text-content tile-formatted-text"
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};

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
  const [isHovered, setIsHovered] = useState(false);

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

  const handleResizeStart = (e: React.MouseEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // This will be handled by the parent component
    const resizeEvent = new CustomEvent('tileResizeStart', {
      detail: { tileId: tile.id, handle, startEvent: e }
    });
    document.dispatchEvent(resizeEvent);
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

  // Handle mouse events carefully to preserve text selection
  const handleMouseEnter = () => {
    // Only set hover state if not in text editing mode
    if (!isEditingText) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    // Only clear hover state if not in text editing mode
    if (!isEditingText) {
      setIsHovered(false);
    }
  };

  const renderTileContent = () => {
    let contentToRender: JSX.Element;

    switch (tile.type) {

      case 'text':
        {
          const textTile = tile as TextTile;

          // If this text tile is being edited, use Tiptap editor
          if (isEditingText && isSelected) {
            contentToRender = (
              <RichTextEditor
                textTile={textTile}
                tileId={tile.id}
                onUpdateTile={onUpdateTile}
                onFinishTextEditing={onFinishTextEditing}
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
          contentToRender = (
            <div className="w-full h-full flex flex-col gap-5 p-5" style={{ color: textColor }}>
              {renderDescriptionBlock(
                <RichTextEditor
                  textTile={{
                    ...tile,
                    type: 'text',
                    content: {
                      text: programmingTile.content.description,
                      richText: programmingTile.content.richDescription,
                      fontFamily: programmingTile.content.fontFamily,
                      fontSize: programmingTile.content.fontSize,
                      verticalAlign: 'top',
                      backgroundColor: programmingTile.content.backgroundColor,
                      showBorder: programmingTile.content.showBorder
                    }
                  } as TextTile}
                  tileId={tile.id}
                  textColor={textColor}
                  onUpdateTile={(tileId, updates) => {
                    if (updates.content) {
                      onUpdateTile(tileId, {
                        content: {
                          ...programmingTile.content,
                          description: updates.content.text || programmingTile.content.description,
                          richDescription: updates.content.richText || programmingTile.content.richDescription
                        }
                      });
                    }
                  }}
                  onFinishTextEditing={onFinishTextEditing}
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
                  : true
            }
          };

          contentToRender = (
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
                          updates.content.fontSize ?? quizTile.content.questionFontSize
                      }
                    });
                  }}
                  onFinishTextEditing={onFinishTextEditing}
                  onEditorReady={onEditorReady}
                  textColor={questionTextColor}
                />
              }
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

      case 'fillBlanks': {
        const fillTile = tile as FillBlanksTile;
        const accentColor = fillTile.content.backgroundColor || computedBackground;
        const textColor = getReadableTextColor(accentColor);

        const renderFillBlanksContent = (
          instructionContent?: React.ReactNode,
          isPreviewMode = false
        ) => (
          <FillBlanksInteractive
            tile={fillTile}
            isTestingMode={isTestingMode}
            isPreview={isPreviewMode}
            instructionContent={instructionContent}
            onRequestTextEditing={isPreviewMode ? undefined : onDoubleClick}
          />
        );

        if (isEditingText && isSelected) {
          const instructionEditorTile: TextTile = {
            ...tile,
            type: 'text',
            content: {
              text: fillTile.content.instruction,
              richText: fillTile.content.richInstruction,
              fontFamily: fillTile.content.fontFamily,
              fontSize: fillTile.content.fontSize,
              verticalAlign: 'top',
              backgroundColor: fillTile.content.backgroundColor,
              showBorder: fillTile.content.showBorder
            }
          };

          contentToRender = renderFillBlanksContent(
            <RichTextEditor
              textTile={instructionEditorTile}
              tileId={tile.id}
              textColor={textColor}
              onUpdateTile={(tileId, updates) => {
                if (!updates.content) return;

                onUpdateTile(tileId, {
                  content: {
                    ...fillTile.content,
                    instruction:
                      updates.content.text ?? fillTile.content.instruction,
                    richInstruction:
                      updates.content.richText ?? fillTile.content.richInstruction,
                    fontFamily:
                      updates.content.fontFamily ?? fillTile.content.fontFamily,
                    fontSize:
                      updates.content.fontSize ?? fillTile.content.fontSize
                  }
                });
              }}
              onFinishTextEditing={onFinishTextEditing}
              onEditorReady={onEditorReady}
            />,
            true
          );
        } else {
          contentToRender = renderFillBlanksContent();
        }
        break;
      }

      case 'sequencing': {
        const sequencingTile = tile as SequencingTile;
        const accentColor = sequencingTile.content.backgroundColor || computedBackground;
        const textColor = getReadableTextColor(accentColor);

        const renderSequencingContent = (instructionContent?: React.ReactNode, isPreviewMode = false) => (
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
              showBorder: sequencingTile.content.showBorder
            }
          } as TextTile;

          contentToRender = renderSequencingContent(
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
                    verticalAlign: updates.content.verticalAlign ?? sequencingTile.content.verticalAlign
                  }
                });
              }}
              onFinishTextEditing={onFinishTextEditing}
              onEditorReady={onEditorReady}
            />,
            true
          );
        } else {
          contentToRender = renderSequencingContent();
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
  const renderResizeHandles = () => {
    if (!isSelected || isEditingText || isImageEditing || isTestingMode) return null;

    const handles = GridUtils.getResizeHandles(tile.gridPosition);
    
    return (
      <>
        {handles.map(({ handle, position, cursor }) => (
          <div
            key={handle}
            className={`absolute w-3 h-3 rounded-full transition-colors ${
              isFramelessTextTile 
                ? 'bg-blue-500 border-2 border-white shadow-lg hover:bg-blue-600 opacity-90 hover:opacity-100' 
                : 'bg-blue-500 border-2 border-white shadow-md hover:bg-blue-600'
            }`}
            style={{
              left: `${position.x * 100}%`,
              top: `${position.y * 100}%`,
              transform: 'translate(-50%, -50%)',
              cursor,
              zIndex: 10
            }}
            onMouseDown={(e) => handleResizeStart(e, handle)}
          />
        ))}
      </>
    );
  };

  const elevationClass = isSelected ? 'shadow-lg' : 'shadow-sm';

  return (
    <div
      className={`absolute select-none transition-all duration-200 ${TILE_CORNER} ${
        isEditing || isImageEditing || isEditingText ? 'z-20' : 'z-10'
      } ${
        isSelected ? 'ring-2 ring-blue-500 ring-opacity-75' : ''
      } ${elevationClass}`}
      style={{
        left: tile.position.x,
        top: tile.position.y,
        width: tile.size.width,
        height: tile.size.height
      }}
      onMouseDown={isDraggingImage || isTestingMode ? undefined : onMouseDown}
      onDoubleClick={tile.type === 'sequencing' ? undefined : onDoubleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Tile Content */}
      <div className="w-full h-full overflow-hidden" style={cardWrapperStyle}>
        {renderTileContent()}
      </div>

      {/* Tile Controls */}
      {(isSelected || isHovered) && !isEditingText && !isImageEditing && (
        <div className="absolute -top-8 left-0 flex items-center space-x-1 bg-white rounded-md shadow-md border border-gray-200 px-2 py-1">
          <Move className="w-3 h-3 text-gray-500" />
          <span className="text-xs text-gray-600 capitalize">{tile.type}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(tile.id);
            }}
            className="ml-2 p-1 text-red-500 hover:text-red-700 transition-colors"
            title="Usuń kafelek"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Text Editing Indicator */}
      {/* Text editing toolbar is now in the top bar - no need for overlay */}

      {/* Image Editing Indicator */}
      {isSelected && isImageEditing && tile.type === 'image' && (
        <div className="absolute -top-8 left-0 flex items-center space-x-1 bg-blue-100 rounded-md shadow-md border border-blue-300 px-2 py-1">
          <Move className="w-3 h-3 text-blue-600" />
          <span className="text-xs text-blue-700 font-medium">Przeciągnij obraz aby zmienić pozycję</span>
        </div>
      )}

      {/* Grid Position Info */}
      {showGrid && isSelected && (
        <div className="absolute -bottom-6 left-0 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
          {tile.gridPosition.col},{tile.gridPosition.row} 
          ({tile.gridPosition.colSpan}×{tile.gridPosition.rowSpan})
        </div>
      )}

      {/* Resize Handles - Always Available When Selected */}
      {!isEditingText && !isImageEditing && renderResizeHandles()}
    </div>
  );
};