import React, { useState, useEffect } from 'react';
import { Puzzle, HelpCircle, Move, Trash2, Play, Square, Code2 } from 'lucide-react';
import { LessonTile, TextTile, ImageTile, InteractiveTile, QuizTile, ProgrammingTile } from '../../types/lessonEditor';
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

interface TileRendererProps {
  tile: LessonTile;
  isSelected: boolean;
  isEditing: boolean;
  isEditingText: boolean;
  isImageEditing: boolean;
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

interface TextEditorProps {
  textTile: TextTile;
  tileId: string;
  onUpdateTile: (tileId: string, updates: Partial<LessonTile>) => void;
  onFinishTextEditing: () => void;
  onEditorReady: (editor: Editor | null) => void;
}

const TextTileEditor: React.FC<TextEditorProps> = ({ textTile, tileId, onUpdateTile, onFinishTextEditing, onEditorReady }) => {
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
        backgroundColor: textTile.content.backgroundColor,
        fontSize: `${textTile.content.fontSize}px`,
        fontFamily: textTile.content.fontFamily,
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

  const programmingTileData = tile.type === 'programming' ? (tile as ProgrammingTile) : null;

  const isFramelessTile =
    (tile.type === 'text' && !(tile as TextTile).content.showBorder) ||
    (programmingTileData ? !programmingTileData.content.showBorder : false);

  const tileFrameStyle: React.CSSProperties = programmingTileData
    ? {
        backgroundColor: programmingTileData.content.backgroundColor,
        backgroundImage:
          'radial-gradient(circle at 18% 20%, rgba(255, 255, 255, 0.35), transparent 55%), radial-gradient(circle at 82% 78%, rgba(15, 23, 42, 0.12), transparent 60%)',
        transition: 'background-color 150ms ease, box-shadow 150ms ease'
      }
    : {};

  if (isFramelessTile) {
    Object.assign(tileFrameStyle, {
      cursor: isSelected && (isEditing || isEditingText) ? (isDraggingImage ? 'grabbing' : 'grab') : 'default',
      userSelect: 'none',
      border: 'none',
      boxShadow: 'none',
      borderRadius: '0'
    });
  }

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
              <TextTileEditor
                textTile={textTile}
                tileId={tile.id}
                onUpdateTile={onUpdateTile}
                onFinishTextEditing={onFinishTextEditing}
                onEditorReady={onEditorReady}
              />
            );
          } else {
            // Normal text tile display
            contentToRender = (
              <>
                <div
                  className="w-full h-full p-3 overflow-hidden tile-text-content"
                  style={{
                    backgroundColor: textTile.content.backgroundColor,
                    fontSize: `${textTile.content.fontSize}px`,
                    fontFamily: textTile.content.fontFamily,
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
            <div className="w-full h-full bg-gray-100 rounded-lg overflow-hidden relative">
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
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white text-xs p-3 rounded-b-lg">
                  {imageTile.content.caption}
                </div>
              )}
            </div>
          );
          break;
        }

      case 'programming': {
        const programmingTile = tile as ProgrammingTile;
        const descriptionContent =
          programmingTile.content.richDescription ||
          `<p style="margin: 0;">${programmingTile.content.description || 'Kliknij dwukrotnie, aby edytować opis zadania'}</p>`;
        const codePlaceholder = `# Napisz swój kod ${programmingTile.content.language} tutaj...\nprint("Hello, World!")`;
        const codeValue = programmingTile.content.code || '';
        const displayedCode = codeValue || codePlaceholder;

        const renderToolbar = () => (
          <div className="flex items-center justify-between border-b border-slate-800/70 bg-slate-900/90 px-5 py-3">
            <div className="flex items-center space-x-3">
              <button
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 transition-all duration-200 hover:bg-emerald-700 shadow-sm hover:shadow-md"
                title="Uruchom kod"
                onClick={(e) => e.stopPropagation()}
              >
                <Play className="h-4 w-4 text-white" />
              </button>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600 transition-all duration-200 hover:bg-red-700 shadow-sm hover:shadow-md"
                title="Zatrzymaj kod"
                onClick={(e) => e.stopPropagation()}
              >
                <Square className="h-4 w-4 text-white" />
              </button>
              <div className="h-5 w-px bg-slate-700/70" />
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-slate-500" />
                <span className="text-xs text-slate-400">Gotowy</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Code2 className="h-4 w-4 text-slate-400" />
              <span className="font-mono text-xs font-medium uppercase tracking-wider text-slate-300">
                {programmingTile.content.language.toUpperCase()}
              </span>
            </div>
          </div>
        );

        const renderLineNumbers = (lines: string[]) => (
          <div
            className="pointer-events-none absolute inset-y-0 left-0 flex flex-col items-end px-4 py-5 font-mono text-xs text-slate-600/80 select-none"
            style={{ lineHeight: '1.6' }}
          >
            {lines.map((_, index) => (
              <div key={index} className="flex h-[1.6em] items-center">
                <span>{index + 1}</span>
              </div>
            ))}
          </div>
        );

        const baseWrapperClass = 'flex h-full w-full flex-col gap-5 px-6 py-6';

        if (isEditingText && isSelected) {
          const codeLines = (codeValue || '').split('\n');
          contentToRender = (
            <div className={baseWrapperClass}>
              <div
                className="flex flex-col overflow-hidden rounded-2xl border border-white/40 bg-white/80 backdrop-blur-sm shadow-sm"
                style={{ maxHeight: '40%' }}
              >
                <div className="flex items-center gap-3 border-b border-white/60 px-5 pt-5 pb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100">
                    <Code2 className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">Opis zadania</span>
                </div>
                <div className="flex-1 overflow-auto px-5 pb-5">
                  <div className="min-h-[140px]">
                    <TextTileEditor
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
                  </div>
                </div>
              </div>
              <div className="flex-1 flex flex-col overflow-hidden rounded-2xl bg-slate-950 shadow-xl ring-1 ring-slate-900/30">
                {renderToolbar()}
                <div className="relative flex-1">
                  <textarea
                    value={programmingTile.content.code}
                    onChange={(e) =>
                      onUpdateTile(tile.id, {
                        content: {
                          ...programmingTile.content,
                          code: e.target.value
                        }
                      })
                    }
                    className="h-full w-full resize-none border-none bg-transparent px-6 py-5 pl-14 font-mono text-sm leading-relaxed text-emerald-300 outline-none"
                    style={{
                      fontFamily: "'JetBrains Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
                      lineHeight: '1.6',
                      tabSize: 4
                    }}
                    placeholder={`# Napisz swój kod ${programmingTile.content.language} tutaj...`}
                    spellCheck={false}
                    onKeyDown={(e) => {
                      if (e.key === 'Tab') {
                        e.preventDefault();
                        const textarea = e.target as HTMLTextAreaElement;
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const value = textarea.value;
                        const newValue = value.substring(0, start) + '    ' + value.substring(end);

                        onUpdateTile(tile.id, {
                          content: {
                            ...programmingTile.content,
                            code: newValue
                          }
                        });

                        setTimeout(() => {
                          textarea.selectionStart = textarea.selectionEnd = start + 4;
                        }, 0);
                      }
                    }}
                  />
                  {renderLineNumbers(codeLines)}
                </div>
              </div>
            </div>
          );
        } else {
          const displayLines = displayedCode.split('\n');
          contentToRender = (
            <div className={baseWrapperClass}>
              <div
                className="flex flex-col overflow-hidden rounded-2xl border border-white/40 bg-white/80 backdrop-blur-sm shadow-sm"
                style={{ maxHeight: '40%' }}
              >
                <div className="flex items-center gap-3 border-b border-white/60 px-5 pt-5 pb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100">
                    <Code2 className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">Opis zadania</span>
                </div>
                <div className="flex-1 overflow-auto px-5 pb-5">
                  <div
                    className="rich-text-content tile-formatted-text break-words text-slate-700"
                    style={{ minHeight: '1em' }}
                    dangerouslySetInnerHTML={{ __html: descriptionContent }}
                  />
                </div>
              </div>
              <div className="flex-1 flex flex-col overflow-hidden rounded-2xl bg-slate-950 shadow-xl ring-1 ring-slate-900/30">
                {renderToolbar()}
                <div className="relative flex-1">
                  <div
                    className="h-full w-full overflow-auto whitespace-pre-wrap px-6 py-5 pl-14 font-mono text-sm leading-relaxed text-emerald-300"
                    style={{ fontFamily: "'JetBrains Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace", lineHeight: '1.6' }}
                  >
                    {displayedCode}
                  </div>
                  {renderLineNumbers(displayLines)}
                </div>
              </div>
            </div>
          );
        }
        break;
      }

      case 'interactive': {
          const interactiveTile = tile as InteractiveTile;
        
        // Render quiz functionality if interaction type is quiz
        if (interactiveTile.content.interactionType === 'quiz') {
          contentToRender = (
            <div className="w-full h-full bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg p-4 flex flex-col">
              <div className="flex items-center space-x-2 mb-2">
                <HelpCircle className="w-5 h-5 text-purple-600" />
                <h4 className="font-semibold text-purple-900 text-sm">
                  {interactiveTile.content.title}
                </h4>
              </div>
              <p className="text-purple-700 text-xs mb-3 flex-1 overflow-hidden">
                {interactiveTile.content.data?.question || 'Pytanie quiz...'}
              </p>
              <div className="space-y-1">
                {interactiveTile.content.data?.answers?.slice(0, 3).map((answer: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2 text-xs">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-purple-700 truncate">{answer}</span>
                  </div>
                ))}
                {interactiveTile.content.data?.answers?.length > 3 && (
                  <div className="text-xs text-purple-600">
                    +{interactiveTile.content.data.answers.length - 3} więcej...
                  </div>
                )}
              </div>
            </div>
          );
        } else {
          // Default interactive tile rendering
          contentToRender = (
            <div className="w-full h-full bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg p-4 flex flex-col">
              <div className="flex items-center space-x-2 mb-2">
                <Puzzle className="w-5 h-5 text-purple-600" />
                <h4 className="font-semibold text-purple-900 text-sm">
                  {interactiveTile.content.title}
                </h4>
              </div>
              <p className="text-purple-700 text-xs flex-1 overflow-hidden">
                {interactiveTile.content.description}
              </p>
              <div className="mt-2 text-xs text-purple-600">
                Typ: {interactiveTile.content.interactionType}
              </div>
            </div>
          );
        }
        break;
      }
        
      case 'quiz': {
          const quizTile = tile as QuizTile;
          contentToRender = (
            <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-200 rounded-lg p-4 flex flex-col">
              <div className="flex items-center space-x-2 mb-2">
                <HelpCircle className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-green-900 text-sm">Quiz</h4>
              </div>
              <p className="text-green-700 text-xs mb-2 flex-1 overflow-hidden">
                {quizTile.content.question}
              </p>
              <div className="text-xs text-green-600">
                {quizTile.content.answers.length} odpowiedzi
              </div>
            </div>
          );
          break;
        }

      default:
        contentToRender = (
            <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-500 text-sm">Nieznany typ kafelka</span>
            </div>
          );
        break;
      }

    return contentToRender;
  };
  const renderResizeHandles = () => {
    if (!isSelected || isEditingText || isImageEditing) return null;

    const handles = GridUtils.getResizeHandles(tile.gridPosition);

    return (
      <>
        {handles.map(({ handle, position, cursor }) => (
          <div
            key={handle}
            className={`absolute w-3 h-3 rounded-full transition-colors ${
              isFramelessTile
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

  const outerShapeClass = !isFramelessTile
    ? tile.type === 'programming'
      ? `rounded-2xl ${isSelected ? 'shadow-xl' : 'shadow-lg'}`
      : `rounded-lg ${isSelected ? 'shadow-lg' : 'shadow-sm'}`
    : '';

  const innerContainerClass = `w-full h-full overflow-hidden ${
    isFramelessTile
      ? ''
      : tile.type === 'programming'
        ? 'rounded-2xl ring-1 ring-slate-900/20'
        : 'bg-white border border-gray-200 shadow-sm rounded-lg'
  }`;

  const innerContainerStyle = Object.keys(tileFrameStyle).length ? tileFrameStyle : undefined;

  return (
    <div
      className={`absolute select-none transition-all duration-200 ${
        isEditing || isImageEditing || isEditingText ? 'z-20' : 'z-10'
      } ${
        isSelected ? 'ring-2 ring-blue-500 ring-opacity-75' : ''
      } ${outerShapeClass}`}
      style={{
        left: tile.position.x,
        top: tile.position.y,
        width: tile.size.width,
        height: tile.size.height
      }}
      onMouseDown={isDraggingImage ? undefined : onMouseDown}
      onDoubleClick={onDoubleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Tile Content */}
      <div
        className={innerContainerClass}
        style={innerContainerStyle}
      >
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