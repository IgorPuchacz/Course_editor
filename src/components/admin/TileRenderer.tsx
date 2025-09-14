import React, { useState, useEffect } from 'react';
import { Puzzle, HelpCircle, Move, Trash2 } from 'lucide-react';
import { LessonTile, TextTile, ImageTile, InteractiveTile, QuizTile } from '../../types/lessonEditor';
import { GridUtils } from '../../utils/gridUtils';
import { Editor, EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';

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
    extensions: [StarterKit, Underline],
    content: textTile.content.richText || `<p style="margin: 0;">${textTile.content.text || ''}</p>`,
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

  return (
    <div className="w-full h-full p-3 overflow-hidden relative">
      <EditorContent
        editor={editor}
        className="w-full h-full focus:outline-none"
        onBlur={onFinishTextEditing}
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

  // Check if this is a frameless text tile
  const isFramelessTextTile = tile.type === 'text' && !(tile as TextTile).content.showBorder;

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
    switch (tile.type) {
      case 'text':
        { const textTile = tile as TextTile;

        // If this text tile is being edited, use Tiptap editor
        if (isEditingText && isSelected) {
          return (
            <TextTileEditor
              textTile={textTile}
              tileId={tile.id}
              onUpdateTile={onUpdateTile}
              onFinishTextEditing={onFinishTextEditing}
              onEditorReady={onEditorReady}
            />
          );
        }

        // Normal text tile display
        return (
          <>
            <div
              className="w-full h-full p-3 overflow-hidden tile-text-content"
              style={{
                backgroundColor: textTile.content.backgroundColor,
                fontSize: `${textTile.content.fontSize}px`,
                fontFamily: textTile.content.fontFamily,
                textAlign: textTile.content.textAlign,
                display: 'flex',
                alignItems: textTile.content.verticalAlign === 'center' ? 'center' :
                           textTile.content.verticalAlign === 'bottom' ? 'flex-end' : 'flex-start'
              }}
            >
              <div
                className="break-words flex-1 rich-text-content tile-formatted-text"
                style={{
                  width: '100%',
                  minHeight: '1em',
                  outline: 'none'
                }}
                dangerouslySetInnerHTML={{
                  __html: textTile.content.richText || `<p style="margin: 0;">${textTile.content.text || 'Kliknij dwukrotnie, aby edytować'}</p>`
                }}
              />
            </div>
          </>
        ); }

      case 'image':
        { const imageTile = tile as ImageTile;
        const imagePosition = imageTile.content.position || { x: 0, y: 0 };
        const imageScale = imageTile.content.scale || 1;

        console.log('Rendering image tile:', imageTile.id, 'position:', imagePosition, 'scale:', imageScale, 'updated_at:', imageTile.updated_at);

        return (
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
        ); }

        case 'interactive': {
          const interactiveTile = tile as InteractiveTile;
        
        // Render quiz functionality if interaction type is quiz
        if (interactiveTile.content.interactionType === 'quiz') {
          return (
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
        }
        
        // Default interactive tile rendering
          return (
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

        case 'quiz': {
          const quizTile = tile as QuizTile;
          return (
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
          ); }

        default:
          return (
            <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-500 text-sm">Nieznany typ kafelka</span>
            </div>
          );
      }
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

  return (
    <div
      className={`absolute select-none ${
        isEditing || isImageEditing || isEditingText ? 'z-20' : 'z-10'
      } ${
        isSelected ? 'ring-2 ring-blue-500 ring-opacity-75' : ''
      } ${
        !isFramelessTextTile ? `transition-all duration-200 rounded-lg ${
          isSelected ? 'shadow-lg' : 'shadow-sm'
        }` : ''
      }`}
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
        className={`w-full h-full overflow-hidden ${
          isFramelessTextTile 
            ? '' 
            : 'bg-white border border-gray-200 shadow-sm rounded-lg'
        }`}
        style={isFramelessTextTile ? {
          cursor: isSelected && (isEditing || isEditingText) ? (isDraggingImage ? 'grabbing' : 'grab') : 'default',
          userSelect: 'none',
          border: 'none',
          boxShadow: 'none',
          borderRadius: '0'
        } : undefined}
      >
        {renderTileContent()}
      </div>

      {/* Tile Controls */}
      {(isSelected || isHovered) && !isEditing && !isEditingText && !isImageEditing && (
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