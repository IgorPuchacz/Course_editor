import React from 'react';
import { Type, Image, Puzzle, Eye, HelpCircle, Plus, Code, ArrowUpDown, ArrowLeftRight } from 'lucide-react';
import { TilePaletteItem } from '../../../types/lessonEditor.ts';

interface TilePaletteProps {
  onAddTile: (tileType: string, position: { x: number; y: number }) => void;
  selectedTileId: string | null;
}

const TILE_TYPES: TilePaletteItem[] = [
  {
    type: 'text',
    title: 'Tekst',
    icon: 'Type'
  },
  {
    type: 'image',
    title: 'Obraz',
    icon: 'Image'
  },
  {
    type: 'visualization',
    title: 'Wizualizacja',
    icon: 'Eye'
  },
  {
    type: 'quiz',
    title: 'Quiz',
    icon: 'HelpCircle'
  },
  {
    type: 'programming',
    title: 'Zadanie programistyczne',
    icon: 'Code'
  },
  {
    type: 'sequencing',
    title: 'Ćwiczenie sekwencyjne',
    icon: 'ArrowUpDown'
  },
  {
    type: 'matching',
    title: 'Dopasowywanie par',
    icon: 'ArrowLeftRight'
  }
];

const getIcon = (iconName: string) => {
  switch (iconName) {
    case 'Type': return Type;
    case 'Image': return Image;
    case 'Puzzle': return Puzzle;
    case 'Eye': return Eye;
    case 'HelpCircle': return HelpCircle;
    case 'Code': return Code;
    case 'ArrowUpDown': return ArrowUpDown;
    case 'ArrowLeftRight': return ArrowLeftRight;
    default: return Type;
  }
};

export const TilePalette: React.FC<TilePaletteProps> = ({
  onAddTile,
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
    <div className="h-full flex flex-col bg-white overflow-hidden">
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
      <div className="flex-1 p-4 space-y-3 overflow-y-auto overscroll-contain">
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
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <IconComponent className="w-5 h-5 text-blue-600" />
                  </div>

                  <div className="flex-1 ">
                    <h4 className="font-medium text-gray-900 group-hover:text-blue-900 transition-colors">
                      {tileType.title}
                    </h4>
                  </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};