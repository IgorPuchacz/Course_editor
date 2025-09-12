import React from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Undo, Redo, Type, Palette } from 'lucide-react';

interface TextEditingToolbarProps {
  onFinishEditing: () => void;
  className?: string;
}

export const TextEditingToolbar: React.FC<TextEditingToolbarProps> = ({
  onFinishEditing,
  className = ''
}) => {
  return (
    <div className={`flex items-center justify-between bg-white border-b border-gray-200 px-4 lg:px-6 py-3 ${className}`}>
      <div className="flex items-center space-x-1">
        {/* Text formatting buttons */}
        <div className="flex items-center space-x-1 border-r border-gray-200 pr-3 mr-3">
          <button
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Pogrub tekst"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Kursywa"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Podkreślenie"
          >
            <Underline className="w-4 h-4" />
          </button>
        </div>

        {/* List buttons */}
        <div className="flex items-center space-x-1 border-r border-gray-200 pr-3 mr-3">
          <button
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Lista punktowana"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Lista numerowana"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
        </div>

        {/* Color and style buttons */}
        <div className="flex items-center space-x-1 border-r border-gray-200 pr-3 mr-3">
          <button
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Kolor tekstu"
          >
            <Palette className="w-4 h-4" />
          </button>
          <button
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Rozmiar tekstu"
          >
            <Type className="w-4 h-4" />
          </button>
        </div>

        {/* Undo/Redo buttons */}
        <div className="flex items-center space-x-1">
          <button
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Cofnij"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Ponów"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right side - editing status and finish button */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-sm text-blue-600">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="font-medium">Edytujesz tekst</span>
        </div>
        
        <button
          onClick={onFinishEditing}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Zakończ edycję
        </button>
      </div>
    </div>
  );
};