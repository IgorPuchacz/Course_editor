import React, { useState } from 'react';
import { Type, Image, Puzzle, BarChart3, HelpCircle, Move, Trash2 } from 'lucide-react';
import { LessonTile, TextTile, ImageTile, InteractiveTile, VisualizationTile, QuizTile } from '../../types/lessonEditor';
import { GridUtils } from '../../utils/gridUtils';
import { RichTextEditor } from './RichTextEditor';

interface TileRendererProps {
  tile: LessonTile;
  isSelected: boolean;
  isEditing: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onUpdateTile: (tileId: string, updates: Partial<LessonTile>) => void;
  onDelete: (tileId: string) => void;
  showGrid: boolean;
}

export const TileRenderer: React.FC<TileRendererProps> = ({
  tile,
  isSelected,
  isEditing,
  onMouseDown,
  onDoubleClick,
  onUpdateTile,
  onDelete,
  showGrid
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

  const renderTileContent = () => {
    switch (tile.type) {
      case 'text':
        const textTile = tile as TextTile;
        console.log('Rendering text tile:', textTile.id, 'richText:', textTile.content.richText);
        return (
          <>
            <div
              className="w-full h-full p-3 overflow-hidden"
              style={{
                backgroundColor: textTile.content.backgroundColor,
                fontSize: `${textTile.content.fontSize}px`,
                fontFamily: textTile.content.fontFamily,
                textAlign: textTile.content.textAlign as any,
                display: 'flex',
                alignItems: textTile.content.verticalAlign === 'center' ? 'center' : 
                           textTile.content.verticalAlign === 'bottom' ? 'flex-end' : 'flex-start'
              }}
            >
              <div 
                className="whitespace-pre-wrap break-words flex-1 rich-text-content"
                dangerouslySetInnerHTML={{
                  __html: textTile.content.richText || `<p>${textTile.content.text || 'Kliknij dwukrotnie, aby edytować'}</p>`
                }}
              />
            </div>
          </>
        );

      case 'image':
        const imageTile = tile as ImageTile;
        return (
          <div className="w-full h-full bg-gray-100 rounded-lg overflow-hidden relative">
            <img
              src={imageTile.content.url}
              alt={imageTile.content.alt}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400';
              }}
            />
            {imageTile.content.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white text-xs p-3 rounded-b-lg">
                {imageTile.content.caption}
              </div>
            )}
          </div>
        );

      case 'interactive':
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

      case 'quiz':
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
        );

      default:
        return (
          <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-gray-500 text-sm">Nieznany typ kafelka</span>
          </div>
        );
    }
  };
  const renderResizeHandles = () => {
    if (!isSelected || isEditing) return null;

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
      className={`absolute select-none ${isEditing ? 'z-20' : 'z-10'} ${
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
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Tile Content */}
      <div 
        className={`w-full h-full overflow-hidden ${
          isFramelessTextTile 
            ? '' 
            : 'bg-white border border-gray-200 shadow-sm rounded-lg'
        }`}
        style={isFramelessTextTile ? {
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
          borderRadius: '0'
        } : undefined}
      >
        {renderTileContent()}
      </div>

      {/* Tile Controls */}
      {(isSelected || isHovered) && !isEditing && (
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

      {/* Grid Position Info */}
      {showGrid && isSelected && (
        <div className="absolute -bottom-6 left-0 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
          {tile.gridPosition.col},{tile.gridPosition.row} 
          ({tile.gridPosition.colSpan}×{tile.gridPosition.rowSpan})
        </div>
      )}

      {/* Resize Handles - Always Available When Selected */}
      {renderResizeHandles()}
    </div>
  );
};