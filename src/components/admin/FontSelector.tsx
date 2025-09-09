import React from 'react';
import { Type } from 'lucide-react';

interface FontSelectorProps {
  selectedFont: string;
  onChange: (font: string) => void;
  className?: string;
}

const FONT_OPTIONS = [
  {
    name: 'Inter (Default)',
    value: 'Inter, system-ui, sans-serif',
    category: 'Sans-serif'
  },
  {
    name: 'Arial',
    value: 'Arial, sans-serif',
    category: 'Sans-serif'
  },
  {
    name: 'Helvetica',
    value: 'Helvetica, Arial, sans-serif',
    category: 'Sans-serif'
  },
  {
    name: 'Roboto',
    value: 'Roboto, sans-serif',
    category: 'Sans-serif'
  },
  {
    name: 'Open Sans',
    value: '"Open Sans", sans-serif',
    category: 'Sans-serif'
  },
  {
    name: 'Lato',
    value: 'Lato, sans-serif',
    category: 'Sans-serif'
  },
  {
    name: 'Montserrat',
    value: 'Montserrat, sans-serif',
    category: 'Sans-serif'
  },
  {
    name: 'Times New Roman',
    value: '"Times New Roman", serif',
    category: 'Serif'
  },
  {
    name: 'Georgia',
    value: 'Georgia, serif',
    category: 'Serif'
  },
  {
    name: 'Playfair Display',
    value: '"Playfair Display", serif',
    category: 'Display'
  }
];

export const FontSelector: React.FC<FontSelectorProps> = ({
  selectedFont,
  onChange,
  className = ''
}) => {
  const selectedFontName = FONT_OPTIONS.find(font => font.value === selectedFont)?.name || 'Custom';

  return (
    <div className={className}>
      <label className="block text-xs text-gray-600 mb-2">
        <Type className="w-3 h-3 inline mr-1" />
        Czcionka
      </label>
      
      <select
        value={selectedFont}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
      >
        {FONT_OPTIONS.map((font) => (
          <option 
            key={font.value} 
            value={font.value}
            style={{ fontFamily: font.value }}
          >
            {font.name} ({font.category})
          </option>
        ))}
      </select>
      
      {/* Font Preview */}
      <div className="mt-2 p-2 bg-gray-50 rounded border text-sm">
        <div 
          style={{ fontFamily: selectedFont }}
          className="text-gray-700"
        >
          Przykład tekstu w wybranej czcionce
        </div>
      </div>
    </div>
  );
};