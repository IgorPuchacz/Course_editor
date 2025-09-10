import React, { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Underline, Palette, Pipette } from 'lucide-react';

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
  const [rgbValues, setRgbValues] = useState({ r: 0, g: 0, b: 0 });
  const toolbarRef = useRef<HTMLDivElement>(null);

  const predefinedColors = [
    '#000000', '#494949', '#9c9c9c', '#ffffff',
    '#a10000', '#ff0000', '#ffa500', '#FFFF00',
    '#710071', '#be00ff', '#f700ff', '#e580ff',
    '#00277a', '#0051ff', '#3561ff', '#00fff6'
  ];

  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  // Convert RGB to hex
  const rgbToHex = (r: number, g: number, b: number) => {
    const toHex = (n: number) => {
      const hex = Math.max(0, Math.min(255, Math.round(n))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  // Update RGB values when color changes
  useEffect(() => {
    const rgb = hexToRgb(selectedColor);
    setRgbValues(rgb);
  }, [selectedColor]);

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
  };

  // Handle RGB input changes
  const handleRgbChange = (channel: 'r' | 'g' | 'b', value: string) => {
    const numValue = parseInt(value) || 0;
    const clampedValue = Math.max(0, Math.min(255, numValue));
    
    const newRgb = { ...rgbValues, [channel]: clampedValue };
    setRgbValues(newRgb);
    
    const hexColor = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setSelectedColor(hexColor);
    onFormat('foreColor', hexColor);
  };

  // Handle manual hex input
  const handleHexChange = (hex: string) => {
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
      setSelectedColor(hex);
      onFormat('foreColor', hex);
    }
  };

  if (!visible) return null;

  return (
    <div
      ref={toolbarRef}
      className="fixed bg-white border border-gray-300 rounded-lg shadow-lg p-2 flex items-center space-x-1 z-50"
      style={{
        top: position.top - 25,
        left: position.left + 150,
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
          className="p-2 hover:bg-gray-100 rounded transition-colors flex items-center space-x-1 group"
          onClick={() => setShowColorPicker(!showColorPicker)}
          title="Kolor tekstu"
        >
          <Palette className="w-4 h-4 group-hover:text-blue-600 transition-colors" />
          <div 
            className="w-3 h-3 rounded border-2 border-gray-300 shadow-sm"
            style={{ backgroundColor: selectedColor }}
          ></div>
        </button>
        
        {showColorPicker && (
          <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl p-4 z-60 min-w-[280px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Pipette className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Wybierz kolor</span>
              </div>
              <button
                onClick={() => setShowColorPicker(false)}
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
                onChange={(e) => handleColorSelect(e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                title="Wybierz inny kolor"
              />
            </div>

            {/* Apply Button */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <button
                onClick={() => setShowColorPicker(false)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Zastosuj kolor
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};