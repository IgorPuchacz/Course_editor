import React, { useState } from 'react';
import { Palette, Pipette, RotateCcw } from 'lucide-react';

interface TextColorPickerProps {
  selectedColor?: string;
  onChange?: (color: string) => void;
  className?: string;
}

const PRESET_COLORS = [
  // Grayscale
  { color: '#000000', name: 'Czarny' },
  { color: '#374151', name: 'Ciemnoszary' },
  { color: '#6B7280', name: 'Szary' },
  { color: '#9CA3AF', name: 'Jasnoszary' },
  { color: '#FFFFFF', name: 'Biały' },
  
  // Primary colors
  { color: '#DC2626', name: 'Czerwony' },
  { color: '#EA580C', name: 'Pomarańczowy' },
  { color: '#D97706', name: 'Żółty' },
  { color: '#16A34A', name: 'Zielony' },
  { color: '#2563EB', name: 'Niebieski' },
  { color: '#7C3AED', name: 'Fioletowy' },
  { color: '#DB2777', name: 'Różowy' },
  
  // Light variants
  { color: '#FEE2E2', name: 'Jasny czerwony' },
  { color: '#FED7AA', name: 'Jasny pomarańczowy' },
  { color: '#FEF3C7', name: 'Jasny żółty' },
  { color: '#DCFCE7', name: 'Jasny zielony' },
  { color: '#DBEAFE', name: 'Jasny niebieski' },
  { color: '#E9D5FF', name: 'Jasny fioletowy' },
  { color: '#FCE7F3', name: 'Jasny różowy' },
  
  // Dark variants
  { color: '#991B1B', name: 'Ciemny czerwony' },
  { color: '#C2410C', name: 'Ciemny pomarańczowy' },
  { color: '#A16207', name: 'Ciemny żółty' },
  { color: '#15803D', name: 'Ciemny zielony' },
  { color: '#1D4ED8', name: 'Ciemny niebieski' },
  { color: '#6D28D9', name: 'Ciemny fioletowy' },
  { color: '#BE185D', name: 'Ciemny różowy' }
];

const RECENT_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'
];

export const TextColorPicker: React.FC<TextColorPickerProps> = ({
  selectedColor = '#000000',
  onChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'preset' | 'custom' | 'recent'>('preset');
  const [customColor, setCustomColor] = useState(selectedColor);

  const handleColorSelect = (color: string) => {
    onChange?.(color);
    setIsOpen(false);
  };

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color);
    onChange?.(color);
  };

  const resetToDefault = () => {
    handleColorSelect('#000000');
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
       onMouseDown={(e) => e.preventDefault()}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 group"
      >
        <div className="relative">
          <Palette className="w-4 h-4 text-gray-600 group-hover:text-gray-800" />
          <div 
            className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white shadow-sm"
            style={{ backgroundColor: selectedColor }}
          />
        </div>
        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
          Kolor
        </span>
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
          <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">Kolor tekstu</h3>
                  <p className="text-xs text-gray-600 mt-1">Wybierz kolor dla zaznaczonego tekstu</p>
                </div>
                <button
                  onClick={resetToDefault}
                 onMouseDown={(e) => e.preventDefault()}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Resetuj do domyślnego"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              {[
                { id: 'preset', label: 'Paleta', icon: Palette },
                { id: 'custom', label: 'Własny', icon: Pipette },
                { id: 'recent', label: 'Ostatnie', icon: null }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                 onMouseDown={(e) => e.preventDefault()}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === id
                      ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    {Icon && <Icon className="w-4 h-4" />}
                    <span>{label}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-4">
              {activeTab === 'preset' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-7 gap-2">
                    {PRESET_COLORS.map((colorData, index) => (
                      <button
                        key={index}
                        onClick={() => handleColorSelect(colorData.color)}
                       onMouseDown={(e) => e.preventDefault()}
                        className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 hover:scale-110 hover:shadow-md ${
                          selectedColor === colorData.color 
                            ? 'border-blue-500 ring-2 ring-blue-200' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={{ backgroundColor: colorData.color }}
                        title={colorData.name}
                      />
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'custom' && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => handleCustomColorChange(e.target.value)}
                      className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <div className="flex-1">
                      <input
                        type="text"
                        value={customColor}
                        onChange={(e) => handleCustomColorChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                        placeholder="#000000"
                      />
                      <p className="text-xs text-gray-500 mt-1">Wprowadź kod HEX koloru</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-600">Podgląd:</div>
                    <div 
                      className="px-3 py-2 rounded-lg text-sm font-medium"
                      style={{ color: customColor }}
                    >
                      Przykładowy tekst
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'recent' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-6 gap-2">
                    {RECENT_COLORS.map((color, index) => (
                      <button
                        key={index}
                        onClick={() => handleColorSelect(color)}
                       onMouseDown={(e) => e.preventDefault()}
                        className={`w-10 h-10 rounded-lg border-2 transition-all duration-200 hover:scale-110 hover:shadow-md ${
                          selectedColor === color 
                            ? 'border-blue-500 ring-2 ring-blue-200' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    Ostatnio używane kolory
                  </p>
                </div>
              )}
            </div>

            {/* Current Selection */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-6 h-6 rounded-lg border border-gray-300"
                    style={{ backgroundColor: selectedColor }}
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-800">Wybrany kolor</div>
                    <div className="text-xs text-gray-500 font-mono">{selectedColor}</div>
                  </div>
                </div>
                <div 
                  className="text-sm font-medium px-3 py-1 rounded-lg bg-white border"
                  style={{ color: selectedColor }}
                >
                  Przykład
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};