import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { Bold, Italic, Underline, Palette, Pipette } from 'lucide-react';

interface TextFormattingToolbarProps {
  onFormat: (command: string, value?: string) => void;
  position: { top: number; left: number };
  visible: boolean;
  onToolbarInteraction?: () => void;
}

export const TextFormattingToolbar = forwardRef<HTMLDivElement, TextFormattingToolbarProps>(({
  onFormat,
  position,
  visible,
  onToolbarInteraction
}, ref) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const colorPickerRef = useRef<HTMLDivElement>(null);

  // Remove debug logging and fallback click handler for stability
  const predefinedColors = [
    '#000000', '#494949', '#9c9c9c', '#ffffff',
    '#a10000', '#ff0000', '#ffa500', '#FFFF00',
    '#710071', '#be00ff', '#f700ff', '#e580ff',
    '#00277a', '#0051ff', '#3561ff', '#00fff6'
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
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
    onToolbarInteraction?.();
    onFormat('foreColor', color);
  };

  const handleColorPickerToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowColorPicker((prev) => !prev);
    onToolbarInteraction?.();
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setSelectedColor(color);
    onToolbarInteraction?.();
    onFormat('foreColor', color);
  };

  // Handle formatting button clicks
  const handleFormatClick = (command: string) => {
    onToolbarInteraction?.();
    onFormat(command);
  };

  if (!visible) return null;

  return (
    <div
      ref={ref}
      className="fixed bg-white border border-gray-300 rounded-lg shadow-lg p-2 flex items-center space-x-1 z-50"
      style={{
        top: position.top - 25,
        left: position.left + 150,
        transform: 'translateX(-50%)'
      }}
      onMouseDown={(e) => {
        // Prevent losing focus when clicking toolbar
        e.preventDefault();
      }}
    >
      <button
        onClick={() => handleFormatClick('bold')}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className="p-2 hover:bg-gray-100 rounded transition-colors"
        title="Pogrub (Ctrl+B)"
      >
        <Bold className="w-4 h-4" />
      </button>
      
      <button
        onClick={() => handleFormatClick('italic')}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className="p-2 hover:bg-gray-100 rounded transition-colors"
        title="Kursywa (Ctrl+I)"
      >
        <Italic className="w-4 h-4" />
      </button>
      
      <button
        onClick={() => handleFormatClick('underline')}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className="p-2 hover:bg-gray-100 rounded transition-colors"
        title="Podkreślenie (Ctrl+U)"
      >
        <Underline className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1"></div>

      <div className="relative">
        <button 
          className="p-2 hover:bg-gray-100 rounded transition-colors flex items-center space-x-1 group"
          onClick={(e) => {
            handleColorPickerToggle(e);
          }}
          onMouseDown={(e) => {
            e.preventDefault();
          }}
          title="Kolor tekstu"
          type="button"
        >
          <Palette className="w-4 h-4 group-hover:text-blue-600 transition-colors" />
          <div 
            className="w-3 h-3 rounded border-2 border-gray-300 shadow-sm"
            style={{ backgroundColor: selectedColor }}
          ></div>
        </button>
        
        {showColorPicker && (
          <>
          <div
            ref={colorPickerRef}
            className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl p-4 min-w-[280px]"
            style={{
              zIndex: 9999,
              display: 'block',
              visibility: 'visible',
              opacity: 1
            }}
            onMouseDown={(e) => e.preventDefault()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Pipette className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Wybierz kolor</span>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowColorPicker(false);
                }}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ×
              </button>
            </div>

            {/* Current Color Preview */}
            <div className="mb-4">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-12 h-12 rounded-lg border-2 border-gray-200 shadow-inner"
                  style={{ backgroundColor: selectedColor }}
                ></div>
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">Aktualny kolor</div>
                  <div className="font-mono text-sm font-medium text-gray-800">
                    {selectedColor.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>

            {/* Predefined Colors */}
            <div className="mb-4">
              <div className="text-xs text-gray-600 mb-2 font-medium">Kolory podstawowe</div>
              <div className="grid grid-cols-8 gap-1.5">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorSelect(color)}
                    onMouseDown={(e) => e.preventDefault()}
                    className={`w-7 h-7 rounded-md border-2 transition-all hover:scale-110 shadow-sm ${
                      selectedColor === color 
                        ? 'border-blue-500 ring-2 ring-blue-200' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Color Picker Input */}
            <div>
              <div className="text-xs text-gray-600 mb-2 font-medium">Wybierz inny kolor</div>
              <input
                type="color"
                value={selectedColor}
                onChange={handleCustomColorChange}
                className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                title="Wybierz inny kolor"
              />
            </div>
          </div>
          </>
        )}
      </div>
    </div>
  );
});

TextFormattingToolbar.displayName = 'TextFormattingToolbar';