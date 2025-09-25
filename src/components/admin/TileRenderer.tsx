import React, { useState, useEffect } from 'react';
import { HelpCircle, Move, Trash2, Play, Code2, CheckCircle2, Circle, AlertTriangle } from 'lucide-react';
import { LessonTile, TextTile, ImageTile, QuizTile, ProgrammingTile, SequencingTile } from '../../types/lessonEditor';
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

interface QuizInteractiveProps {
  tile: QuizTile;
  instructionContent?: React.ReactNode;
  isPreview?: boolean;
  isTestingMode?: boolean;
  onRequestTextEditing?: () => void;
}

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

const QuizInteractive: React.FC<QuizInteractiveProps> = ({
  tile,
  instructionContent,
  isPreview = false,
  isTestingMode = false,
  onRequestTextEditing
}) => {
  const accentColor = tile.content.backgroundColor || '#f8fafc';
  const textColor = getReadableTextColor(accentColor);
  const isDarkText = textColor === '#0f172a';
  const gradientStart = lightenColor(accentColor, isDarkText ? 0.08 : 0.16);
  const gradientEnd = darkenColor(accentColor, isDarkText ? 0.18 : 0.28);
  const frameBorderColor = darkenColor(accentColor, isDarkText ? 0.22 : 0.45);
  const panelBackground = surfaceColor(accentColor, textColor, 0.6, 0.45);
  const panelBorder = surfaceColor(accentColor, textColor, 0.38, 0.62);
  const iconBackground = surfaceColor(accentColor, textColor, 0.72, 0.33);
  const subtleCaptionColor = surfaceColor(accentColor, textColor, 0.3, 0.55);
  const answerBackground = surfaceColor(accentColor, textColor, 0.78, 0.6);
  const answerSelectedBackground = darkenColor(accentColor, isDarkText ? 0.27 : 0.45);
  const answerSelectedTextColor = '#f8fafc';
  const answerBorderColor = surfaceColor(accentColor, textColor, 0.42, 0.68);
  const warningBackground = surfaceColor(accentColor, textColor, 0.92, 0.72);
  const missingCorrectBackground = surfaceColor(accentColor, textColor, 0.9, 0.68);

  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);

  useEffect(() => {
    setSelectedAnswers([]);
  }, [tile.id, tile.content.answers.length, tile.content.multipleCorrect, isTestingMode]);

  const handleAnswerSelect = (answerId: string) => {
    if (isPreview) return;

    setSelectedAnswers(prev => {
      if (!tile.content.multipleCorrect) {
        return prev.includes(answerId) ? [] : [answerId];
      }

      if (prev.includes(answerId)) {
        return prev.filter(id => id !== answerId);
      }

      return [...prev, answerId];
    });
  };

  const hasNoAnswers = tile.content.answers.length === 0;
  const hasNoCorrectAnswer = tile.content.answers.every(answer => !answer.isCorrect);
  const modeLabel = tile.content.multipleCorrect
    ? 'Wybierz wszystkie poprawne odpowiedzi'
    : 'Wybierz jedną poprawną odpowiedź';

  const handleTileDoubleClick = (event: React.MouseEvent) => {
    if (isPreview || isTestingMode) return;

    event.preventDefault();
    event.stopPropagation();
    onRequestTextEditing?.();
  };

  return (
    <div className="relative w-full h-full" onDoubleClick={handleTileDoubleClick}>
      <div
        className={`w-full h-full flex flex-col gap-5 transition-all duration-300 ${
          tile.content.showBorder ? 'border' : ''
        } rounded-3xl shadow-2xl shadow-slate-950/30 p-6`}
        style={{
          backgroundColor: accentColor,
          backgroundImage: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
          color: textColor,
          borderColor: tile.content.showBorder ? frameBorderColor : undefined
        }}
      >
        <TaskInstructionPanel
          icon={<HelpCircle className="w-4 h-4" />}
          label="Pytanie"
          className="border"
          style={{
            backgroundColor: panelBackground,
            borderColor: panelBorder,
            color: textColor
          }}
          iconWrapperClassName="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
          iconWrapperStyle={{
            backgroundColor: iconBackground,
            color: textColor
          }}
          labelStyle={{ color: subtleCaptionColor }}
        >
          {instructionContent ?? (
            <div
              className="text-base leading-relaxed"
              style={{
                fontFamily: tile.content.fontFamily,
                fontSize: `${tile.content.fontSize}px`
              }}
              dangerouslySetInnerHTML={{
                __html: tile.content.richQuestion || tile.content.question
              }}
            />
          )}
        </TaskInstructionPanel>

        <div className="text-[11px] uppercase tracking-[0.32em]" style={{ color: subtleCaptionColor }}>
          {modeLabel}
        </div>

        <div className="flex-1 overflow-auto space-y-3 pr-1">
          {tile.content.answers.map((answer, index) => {
            const isSelected = selectedAnswers.includes(answer.id);
            const showAsCorrect = !isTestingMode && answer.isCorrect;

            return (
              <button
                key={answer.id}
                type="button"
                onMouseDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  handleAnswerSelect(answer.id);
                }}
                className="group w-full text-left rounded-2xl border px-4 py-3 transition-all duration-200 hover:-translate-y-[1px]"
                style={{
                  backgroundColor: isSelected ? answerSelectedBackground : answerBackground,
                  borderColor: isSelected
                    ? darkenColor(answerSelectedBackground, 0.25)
                    : answerBorderColor,
                  color: isSelected ? answerSelectedTextColor : textColor,
                  boxShadow: isSelected ? '0 18px 32px rgba(15, 23, 42, 0.25)' : undefined
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-semibold"
                      style={{
                        borderColor: isSelected
                          ? 'rgba(255, 255, 255, 0.45)'
                          : answerBorderColor,
                        backgroundColor: isSelected ? 'rgba(15, 23, 42, 0.18)' : iconBackground,
                        color: isSelected ? answerSelectedTextColor : textColor
                      }}
                    >
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span
                      className="text-sm font-medium leading-snug"
                      style={{ color: isSelected ? answerSelectedTextColor : textColor }}
                    >
                      {answer.text || `Odpowiedź ${index + 1}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {showAsCorrect && (
                      <span
                        className="text-[11px] uppercase tracking-[0.32em] font-semibold"
                        style={{ color: isSelected ? answerSelectedTextColor : subtleCaptionColor }}
                      >
                        Poprawna
                      </span>
                    )}

                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-full border"
                      style={{
                        borderColor: isSelected
                          ? 'rgba(255, 255, 255, 0.6)'
                          : answerBorderColor,
                        backgroundColor: isSelected ? 'rgba(15, 23, 42, 0.22)' : 'transparent',
                        color: isSelected ? answerSelectedTextColor : subtleCaptionColor
                      }}
                    >
                      {isSelected ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}

          {hasNoAnswers && (
            <div
              className="flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm"
              style={{
                backgroundColor: warningBackground,
                borderColor: answerBorderColor,
                color: textColor
              }}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Dodaj odpowiedzi w panelu bocznym, aby quiz był interaktywny.</span>
            </div>
          )}

          {!hasNoAnswers && hasNoCorrectAnswer && (
            <div
              className="flex items-center gap-3 rounded-2xl border px-4 py-3 text-xs"
              style={{
                backgroundColor: missingCorrectBackground,
                borderColor: answerBorderColor,
                color: textColor
              }}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Zaznacz przynajmniej jedną poprawną odpowiedź.</span>
            </div>
          )}
        </div>
      </div>
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
        const accentColor = quizTile.content.backgroundColor || computedBackground;
        const textColor = getReadableTextColor(accentColor);

        const renderQuizContent = (instructionContent?: React.ReactNode, isPreviewMode = false) => (
          <QuizInteractive
            tile={quizTile}
            instructionContent={instructionContent}
            isPreview={isPreviewMode}
            isTestingMode={isTestingMode}
            onRequestTextEditing={isPreviewMode ? undefined : onDoubleClick}
          />
        );

        if (isEditingText && isSelected) {
          const questionEditorTile = {
            ...tile,
            type: 'text',
            content: {
              text: quizTile.content.question,
              richText: quizTile.content.richQuestion,
              fontFamily: quizTile.content.fontFamily,
              fontSize: quizTile.content.fontSize,
              verticalAlign: 'top',
              backgroundColor: quizTile.content.backgroundColor,
              showBorder: quizTile.content.showBorder
            }
          } as TextTile;

          contentToRender = renderQuizContent(
            <RichTextEditor
              textTile={questionEditorTile}
              tileId={tile.id}
              textColor={textColor}
              onUpdateTile={(tileId, updates) => {
                if (!updates.content) return;

                onUpdateTile(tileId, {
                  content: {
                    ...quizTile.content,
                    question: updates.content.text ?? quizTile.content.question,
                    richQuestion: updates.content.richText ?? quizTile.content.richQuestion,
                    fontFamily: updates.content.fontFamily ?? quizTile.content.fontFamily,
                    fontSize: updates.content.fontSize ?? quizTile.content.fontSize
                  }
                });
              }}
              onFinishTextEditing={onFinishTextEditing}
              onEditorReady={onEditorReady}
            />,
            true
          );
        } else {
          contentToRender = renderQuizContent();
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