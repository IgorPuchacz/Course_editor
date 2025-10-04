import React, { useState } from 'react';
import { Type, ChevronDown } from 'lucide-react';

interface SimpleFontSelectorProps {
  selectedFont?: string;
  onChange?: (font: string) => void;
  className?: string;
}

const ESSENTIAL_FONTS = [
  { name: 'Inter', value: 'Inter, system-ui, sans-serif', category: 'Sans-serif', popular: true },
  { name: 'Arial', value: 'Arial, sans-serif', category: 'Sans-serif', popular: true },
  { name: 'Helvetica', value: 'Helvetica, Arial, sans-serif', category: 'Sans-serif', popular: true },
  { name: 'Times New Roman', value: '"Times New Roman", serif', category: 'Serif', popular: true },
  { name: 'Georgia', value: 'Georgia, serif', category: 'Serif', popular: true },
  { name: 'Roboto', value: 'Roboto, sans-serif', category: 'Sans-serif', popular: false },
  { name: 'Open Sans', value: '"Open Sans", sans-serif', category: 'Sans-serif', popular: false },
  { name: 'Monaco', value: 'Monaco, monospace', category: 'Monospace', popular: false }
];

export const FontSelector: React.FC<SimpleFontSelectorProps> = ({
  selectedFont = 'Inter, system-ui, sans-serif',
  onChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedFontData = ESSENTIAL_FONTS.find(font => font.value === selectedFont) || ESSENTIAL_FONTS[0];

  const handleFontSelect = (fontValue: string) => {
    onChange?.(fontValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseDown={(e) => e.preventDefault()}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 min-w-[120px] group"
      >
        <Type className="w-4 h-4 text-gray-600 group-hover:text-gray-800" />
        <span 
          className="text-sm font-medium text-gray-700 group-hover:text-gray-900 truncate flex-1 text-left"
          style={{ fontFamily: selectedFont }}
        >
          {selectedFontData.name}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Content */}
          <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">

            {/* Font List */}
            <div className="max-h-64 overflow-y-auto">
              {/* Popular Fonts Section */}
              <div className="p-2">
                <div className="text-xs font-medium text-gray-500 px-2 py-1 mb-1">Popularne</div>
                {ESSENTIAL_FONTS.filter(font => font.popular).map((font) => (
                  <button
                    key={font.value}
                    onClick={() => handleFontSelect(font.value)}
                    onMouseDown={(e) => e.preventDefault()}
                    className={`w-full px-3 py-2.5 text-left hover:bg-blue-50 transition-colors duration-150 rounded-lg ${
                      selectedFont === font.value ? 'bg-blue-100 border border-blue-200' : 'border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div 
                          className="text-base font-medium text-gray-900 mb-1"
                          style={{ fontFamily: font.value }}
                        >
                          {font.name}
                        </div>
                        <div className="text-xs text-gray-500">{font.category}</div>
                      </div>
                      {selectedFont === font.value && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Other Fonts Section */}
              <div className="p-2 border-t border-gray-100">
                <div className="text-xs font-medium text-gray-500 px-2 py-1 mb-1">Inne</div>
                {ESSENTIAL_FONTS.filter(font => !font.popular).map((font) => (
                  <button
                    key={font.value}
                    onClick={() => handleFontSelect(font.value)}
                    onMouseDown={(e) => e.preventDefault()}
                    className={`w-full px-3 py-2.5 text-left hover:bg-blue-50 transition-colors duration-150 rounded-lg ${
                      selectedFont === font.value ? 'bg-blue-100 border border-blue-200' : 'border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div 
                          className="text-base font-medium text-gray-900 mb-1"
                          style={{ fontFamily: font.value }}
                        >
                          {font.name}
                        </div>
                        <div className="text-xs text-gray-500">{font.category}</div>
                      </div>
                      {selectedFont === font.value && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};