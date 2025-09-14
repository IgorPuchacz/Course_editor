import React from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Undo, Redo, Code, FileCode, X } from 'lucide-react';
import { Editor } from '@tiptap/react';
import { FontSizeSelector } from './FontSizeSelector';
import { TextColorPicker } from './TextColorPicker';
import { FontFamilySelector } from './FontFamilySelector';


interface TopToolbarProps {
  tilesCount: number;
  gridColumns: number;
  gridRows: number;
  currentMode: string;
  isTextEditing: boolean;
  onFinishTextEditing?: () => void;
  editor?: Editor | null;
  className?: string;
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
  tilesCount,
  gridColumns,
  gridRows,
  currentMode,
  isTextEditing,
  onFinishTextEditing,
  editor,
  className = ''
}) => {
  if (isTextEditing) {
    return (
      <div className={`top-toolbar flex items-center justify-between bg-white border-b border-gray-200 px-4 lg:px-6 py-3 ${className}`}>
        <div className="flex items-center space-x-2 text-gray-600">
          {/* Font Family Selector */}
          <FontFamilySelector
            selectedFont="Inter, system-ui, sans-serif"
            onChange={(font) => {
              console.log('Font changed:', font);
              // Tutaj będzie logika zmiany czcionki w edytorze
            }}
          />
          
          <div className="w-px h-6 bg-gray-300"></div>
          
          {/* Font Size Selector */}
          <FontSizeSelector
            selectedSize={16}
            onChange={(size) => {
              console.log('Size changed:', size);
              // Tutaj będzie logika zmiany rozmiaru w edytorze
            }}
          />
          
          <div className="w-px h-6 bg-gray-300"></div>
          
          {/* Text Color Picker */}
          <TextColorPicker
            selectedColor="#000000"
            onChange={(color) => {
              console.log('Color changed:', color);
              // Tutaj będzie logika zmiany koloru w edytorze
            }}
          />
          
          <div className="w-px h-6 bg-gray-300"></div>
          
          {/* Basic Formatting */}
          <button
            className={`p-2 ${editor?.isActive('bold') ? 'text-gray-900' : ''}`}
            onMouseDown={e => e.preventDefault()}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            className={`p-2 ${editor?.isActive('italic') ? 'text-gray-900' : ''}`}
            onMouseDown={e => e.preventDefault()}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            className={`p-2 ${editor?.isActive('underline') ? 'text-gray-900' : ''}`}
            onMouseDown={e => e.preventDefault()}
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
          >
            <Underline className="w-4 h-4" />
          </button>
          
          <div className="w-px h-6 bg-gray-300"></div>
          
          {/* Lists and Advanced */}
          <button className="p-2" disabled onMouseDown={e => e.preventDefault()}><List className="w-4 h-4" /></button>
          <button className="p-2" disabled onMouseDown={e => e.preventDefault()}><ListOrdered className="w-4 h-4" /></button>
          <button className="p-2" disabled onMouseDown={e => e.preventDefault()}><Code className="w-4 h-4" /></button>
          <button className="p-2" disabled onMouseDown={e => e.preventDefault()}><FileCode className="w-4 h-4" /></button>
          
          <div className="w-px h-6 bg-gray-300"></div>
          
          {/* History */}
          <button className="p-2" disabled onMouseDown={e => e.preventDefault()}><Undo className="w-4 h-4" /></button>
          <button className="p-2" disabled onMouseDown={e => e.preventDefault()}><Redo className="w-4 h-4" /></button>
        </div>
        
        <button
          onClick={onFinishTextEditing}
          onMouseDown={e => e.preventDefault()}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title="Zakończ edycję tekstu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between bg-white border-b border-gray-200 px-4 lg:px-6 py-3 ${className}`}>
      <div className="text-sm text-gray-500">
        Kafelki: {tilesCount} • Siatka: {gridColumns}×{gridRows}
      </div>
      <div className="font-medium text-gray-700">
        {currentMode}
      </div>
    </div>
  );
};