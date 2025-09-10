import React from 'react';
import { Type, Image, Puzzle, Eye, HelpCircle, Plus } from 'lucide-react';
import { TilePaletteItem } from '../../types/lessonEditor';

interface TilePaletteProps {
  onAddTile: (tileType: string, position: { x: number; y: number }) => void;
  selectedTileId: string | null;
}

const TILE_TYPES: TilePaletteItem[] = [
  {
    type: 'text',
    title: 'Tekst',
    description: 'Dodaj blok tekstowy z formatowaniem',
    icon: 'Type',
    defaultSize: { col: 0, row: 0, colSpan: 2, rowSpan: 1 }
  },
  {
    type: 'image',
    title: 'Obraz',
    description: 'Wstaw obraz lub grafikę',
    icon: 'Image',
    defaultSize: { col: 0, row: 0, colSpan: 2, rowSpan: 2 }
  },
  {
    type: 'visualization',
    title: 'Wizualizacja',
    description: 'Dodaj zapętlone wideo',
    icon: 'Eye',
    defaultSize: { col: 0, row: 0, colSpan: 3, rowSpan: 3 }
  },
  {
    type: 'quiz',
    title: 'Quiz',
    description: 'Utwórz quiz z pytaniami i odpowiedziami',
    icon: 'HelpCircle',
    defaultSize: { col: 0, row: 0, colSpan: 3, rowSpan: 2 }
  }
];

const getIcon = (iconName: string) => {
  switch (iconName) {
    case 'Type': return Type;
    case 'Image': return Image;
    case 'Puzzle': return Puzzle;
    case 'Eye': return Eye;
    case 'HelpCircle': return HelpCircle;
    default: return Type;
  }
};

export const TilePalette: React.FC<TilePaletteProps> = ({
  onAddTile,
  selectedTileId
}) => {
  const handleDragStart = (e: React.DragEvent, tileType: string) => {
    const data = {
      type: 'palette-tile',
      tileType
    };
    
    e.dataTransfer.setData('application/json', JSON.stringify(data));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleClick = (tileType: string) => {
    // Add tile at default position (top-left of canvas)
    onAddTile(tileType, { x: 0, y: 0 });
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Plus className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-gray-900">Dodaj kafelek</h3>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Przeciągnij kafelki na planszę lub kliknij
        </p>
      </div>

      {/* Tile Types */}
      <div className="flex-1 p-4 space-y-3">
        {TILE_TYPES.map((tileType) => {
          const IconComponent = getIcon(tileType.icon);
          
          return (
            <div
              key={tileType.type}
              draggable
              onDragStart={(e) => handleDragStart(e, tileType.type)}
              onClick={() => handleClick(tileType.type)}
              className="group p-4 bg-white border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:shadow-md transition-all duration-200 active:scale-95"
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <IconComponent className="w-5 h-5 text-blue-600" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 group-hover:text-blue-900 transition-colors">
                    {tileType.title}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                    {tileType.description}
                  </p>
                  <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                    <span>Rozmiar:</span>
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      {tileType.defaultSize.colSpan}×{tileType.defaultSize.rowSpan}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Instructions */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm font-medium text-blue-800">Wskazówka</span>
          </div>
          <p className="text-xs text-blue-700">
            Po wybraniu kafelka ten panel zmieni się na edytor właściwości
          </p>
        </div>
        <div className="text-xs text-gray-600 space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Przeciągnij kafelek na planszę</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Kliknij, aby dodać w lewym górnym rogu</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>Kliknij kafelek, aby go edytować</span>
          </div>
        </div>
      </div>
    </div>
  );
};