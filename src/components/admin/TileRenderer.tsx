import React, { useState } from 'react';
import type { ComponentProps } from 'react';
import { Move, Trash2 } from 'lucide-react';
import type { Editor } from '@tiptap/react';
import type { LessonTile, ImageTile } from '../../types/lessonEditor';
import { GridUtils } from '../../utils/gridUtils';
import { TILE_COMPONENTS, type TileComponentMap } from './tiles';
import { getReadableTextColor } from './tiles/utils';

const TILE_CORNER = 'rounded-xl';

type SupportedTileType = keyof TileComponentMap;
type TileByType<T extends SupportedTileType> = Extract<LessonTile, { type: T }>;

interface TilePropsBuilderContext {
  isSelected: boolean;
  isEditingText: boolean;
  isImageEditing: boolean;
  isTestingMode: boolean;
  isDraggingImage: boolean;
  computedBackground: string;
  defaultTextColor: string;
  onUpdateTile: (tileId: string, updates: Partial<LessonTile>) => void;
  onFinishTextEditing: () => void;
  onEditorReady: (editor: Editor | null) => void;
  onDoubleClick: () => void;
  onImageMouseDown: (event: React.MouseEvent, tile: ImageTile) => void;
}

const TILE_PROPS_BUILDERS: {
  [K in SupportedTileType]: (
    context: TilePropsBuilderContext & { tile: TileByType<K> }
  ) => ComponentProps<TileComponentMap[K]>;
} = {
  text: ({
    tile,
    isSelected,
    isEditingText,
    computedBackground,
    onUpdateTile,
    onFinishTextEditing,
    onEditorReady,
    defaultTextColor,
  }) => ({
    tile,
    isSelected,
    isEditingText,
    computedBackground,
    onUpdateTile,
    onFinishTextEditing,
    onEditorReady,
    textColor: defaultTextColor,
  }),
  image: ({
    tile,
    isSelected,
    isEditingText,
    computedBackground,
    onUpdateTile,
    onFinishTextEditing,
    onEditorReady,
    isImageEditing,
    isDraggingImage,
    onImageMouseDown,
  }) => ({
    tile,
    isSelected,
    isEditingText,
    computedBackground,
    onUpdateTile,
    onFinishTextEditing,
    onEditorReady,
    isImageEditing,
    isDraggingImage,
    onImageMouseDown,
  }),
  programming: ({
    tile,
    isSelected,
    isEditingText,
    computedBackground,
    onUpdateTile,
    onFinishTextEditing,
    onEditorReady,
  }) => ({
    tile,
    isSelected,
    isEditingText,
    computedBackground,
    onUpdateTile,
    onFinishTextEditing,
    onEditorReady,
  }),
  quiz: ({
    tile,
    isSelected,
    isEditingText,
    computedBackground,
    onUpdateTile,
    onFinishTextEditing,
    onEditorReady,
    isTestingMode,
    onDoubleClick,
  }) => ({
    tile,
    isSelected,
    isEditingText,
    computedBackground,
    onUpdateTile,
    onFinishTextEditing,
    onEditorReady,
    isTestingMode,
    onDoubleClick,
  }),
  sequencing: ({
    tile,
    isSelected,
    isEditingText,
    computedBackground,
    onUpdateTile,
    onFinishTextEditing,
    onEditorReady,
    isTestingMode,
    onDoubleClick,
  }) => ({
    tile,
    isSelected,
    isEditingText,
    computedBackground,
    onUpdateTile,
    onFinishTextEditing,
    onEditorReady,
    isTestingMode,
    onDoubleClick,
  }),
  matchPairs: ({
    tile,
    isSelected,
    isEditingText,
    computedBackground,
    onUpdateTile,
    onFinishTextEditing,
    onEditorReady,
    isTestingMode,
    onDoubleClick,
  }) => ({
    tile,
    isSelected,
    isEditingText,
    computedBackground,
    onUpdateTile,
    onFinishTextEditing,
    onEditorReady,
    isTestingMode,
    onDoubleClick,
  }),
};

interface TileRendererProps {
  tile: LessonTile;
  isSelected: boolean;
  isEditing: boolean;
  isEditingText: boolean;
  isImageEditing: boolean;
  isTestingMode?: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onImageMouseDown: (e: React.MouseEvent, tile: ImageTile) => void;
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

  const tilePropsContext: TilePropsBuilderContext = {
    isSelected,
    isEditingText,
    isImageEditing,
    isTestingMode,
    isDraggingImage,
    computedBackground,
    defaultTextColor,
    onUpdateTile,
    onFinishTextEditing,
    onEditorReady,
    onDoubleClick,
    onImageMouseDown,
  };

  const renderTileContent = () => {
    const type = tile.type as SupportedTileType;
    const TileComponent = TILE_COMPONENTS[type];
    const buildProps = TILE_PROPS_BUILDERS[type];

    if (TileComponent && buildProps) {
      const componentProps = buildProps({
        ...tilePropsContext,
        tile: tile as TileByType<typeof type>,
      });

      return <TileComponent {...componentProps} />;
    }

    return (
      <div className="w-full h-full flex items-center justify-center">
        <span className="text-gray-500 text-sm">Nieznany typ kafelka</span>
      </div>
    );
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
      onDoubleClick={tile.type === 'sequencing' || tile.type === 'matchPairs' ? undefined : onDoubleClick}
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