import React, { useState } from 'react';
import { Type, ChevronDown } from 'lucide-react';

interface FontSizeSelectorProps {
  selectedSize?: number;
  onChange?: (size: number) => void;
  className?: string;
}

const FONT_SIZES = [
  { value: 8, label: '8px', description: 'Bardzo mały' },
  { value: 10, label: '10px', description: 'Mały' },
  { value: 12, label: '12px', description: 'Normalny' },
  { value: 14, label: '14px', description: 'Średni' },
  { value: 16, label: '16px', description: 'Duży' },
  { value: 18, label: '18px', description: 'Większy' },
  { value: 20, label: '20px', description: 'Bardzo duży' },
  { value: 24, label: '24px', description: 'Nagłówek' },
  { value: 28, label: '28px', description: 'Duży nagłówek' },
  { value: 32, label: '32px', description: 'Tytuł' },
  { value: 36, label: '36px', description: 'Duży tytuł' },
  { value: 48, label: '48px', description: 'Bardzo duży tytuł' }
];

export const FontSizeSelector: React.FC<FontSizeSelectorProps> = ({
  selectedSize = 16,
  onChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredSize, setHoveredSize] = useState<number | null>(null);

  const selectedSizeData = FONT_SIZES.find(size => size.value === selectedSize) || FONT_SIZES[4];

  const handleSizeSelect = (size: number) => {
    onChange?.(size);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 min-w-[80px] group"
      >
        <Type className="w-4 h-4 text-gray-600 group-hover:text-gray-800" />
        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
          {selectedSizeData.value}px
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
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Content */}
          <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">Rozmiar czcionki</h3>
              <p className="text-xs text-gray-600 mt-1">Wybierz rozmiar tekstu</p>
            </div>

            {/* Size Options */}
            <div className="max-h-64 overflow-y-auto">
              {FONT_SIZES.map((size) => (
                <button
                  key={size.value}
                  onClick={() => handleSizeSelect(size.value)}
                  onMouseEnter={() => setHoveredSize(size.value)}
                  onMouseLeave={() => setHoveredSize(null)}
                  className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors duration-150 border-b border-gray-50 last:border-b-0 ${
                    selectedSize === size.value ? 'bg-blue-100 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span 
                          className="font-medium text-gray-900 transition-all duration-200"
                          style={{ 
                            fontSize: Math.min(size.value, 20) + 'px',
                            transform: hoveredSize === size.value ? 'scale(1.05)' : 'scale(1)'
                          }}
                        >
                          Aa
                        </span>
                        <div>
                          <div className="text-sm font-medium text-gray-800">{size.label}</div>
                          <div className="text-xs text-gray-500">{size.description}</div>
                        </div>
                      </div>
                    </div>
                    {selectedSize === size.value && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Preview Section */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
              <div className="text-xs text-gray-600 mb-2">Podgląd:</div>
              <div 
                className="text-gray-800 font-medium transition-all duration-200"
                style={{ fontSize: (hoveredSize || selectedSize) + 'px' }}
              >
                Przykładowy tekst
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};