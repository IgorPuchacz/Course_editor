import React, { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Underline, Palette, Type } from 'lucide-react';

interface TextFormattingToolbarProps {
  onFormat: (command: string, value?: string) => void;
  position: { top: number; left: number };
  visible: boolean;
}

export const TextFormattingToolbar: React.FC<TextFormattingToolbarProps> = ({
  onFormat,
  position,
  visible
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const toolbarRef = useRef<HTMLDivElement>(null);

  const predefinedColors = [
    '#000000', '#333333', '#666666', '#999999',
    '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
    '#FF00FF', '#00FFFF', '#FFA500', '#800080',
    '#8B4513', '#006400', '#4B0082', '#DC143C'
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
    };

    if (showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColorPicker]);

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    onFormat('foreColor', color);
    setShowColorPicker(false);
  };

  if (!visible) return null;

  return (
    <div
      ref={toolbarRef}
      className="fixed bg-white border border-gray-300 rounded-lg shadow-lg p-2 flex items-center space-x-1 z-50"
      style={{
        top: position.top - 50,
        left: position.left,
        transform: 'translateX(-50%)'
      }}
    >
      <button
        onClick={() => onFormat('bold')}
        className="p-2 hover:bg-gray-100 rounded transition-colors"
        title="Pogrub (Ctrl+B)"
      >
        <Bold className="w-4 h-4" />
      </button>
      
      <button
        onClick={() => onFormat('italic')}
        className="p-2 hover:bg-gray-100 rounded transition-colors"
        title="Kursywa (Ctrl+I)"
      >
        <Italic className="w-4 h-4" />
      </button>
      
      <button
        onClick={() => onFormat('underline')}
        className="p-2 hover:bg-gray-100 rounded transition-colors"
        title="Podkreślenie (Ctrl+U)"
      >
        <Underline className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1"></div>

      <div className="relative">
        <button 
          className="p-2 hover:bg-gray-100 rounded transition-colors flex items-center space-x-1"
          onClick={() => setShowColorPicker(!showColorPicker)}
          title="Kolor tekstu"
        >
          <Palette className="w-4 h-4" />
          <div 
            className="w-3 h-3 rounded border border-gray-300"
            style={{ backgroundColor: selectedColor }}
          ></div>
        </button>
        
        {showColorPicker && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-60">
            <div className="grid grid-cols-4 gap-1 mb-2">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  className="w-7 h-7 rounded border-2 border-gray-300 hover:border-gray-500 transition-all hover:scale-105 shadow-sm"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => handleColorSelect(e.target.value)}
              className="w-full h-8 border border-gray-300 rounded cursor-pointer"
              title="Wybierz własny kolor"
            />
          </div>
        )}
      </div>
    </div>
  );
};