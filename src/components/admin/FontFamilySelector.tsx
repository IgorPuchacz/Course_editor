import React, { useState } from 'react';
import { Type, ChevronDown, Search } from 'lucide-react';

interface FontFamilySelectorProps {
  selectedFont?: string;
  onChange?: (font: string) => void;
  className?: string;
}

const FONT_CATEGORIES = {
  'Sans-serif': [
    { name: 'Inter', value: 'Inter, system-ui, sans-serif', popular: true },
    { name: 'Arial', value: 'Arial, sans-serif', popular: true },
    { name: 'Helvetica', value: 'Helvetica, Arial, sans-serif', popular: true },
    { name: 'Roboto', value: 'Roboto, sans-serif', popular: true },
    { name: 'Open Sans', value: '"Open Sans", sans-serif', popular: true },
    { name: 'Lato', value: 'Lato, sans-serif', popular: false },
    { name: 'Montserrat', value: 'Montserrat, sans-serif', popular: false },
    { name: 'Source Sans Pro', value: '"Source Sans Pro", sans-serif', popular: false },
    { name: 'Nunito', value: 'Nunito, sans-serif', popular: false }
  ],
  'Serif': [
    { name: 'Times New Roman', value: '"Times New Roman", serif', popular: true },
    { name: 'Georgia', value: 'Georgia, serif', popular: true },
    { name: 'Playfair Display', value: '"Playfair Display", serif', popular: false },
    { name: 'Merriweather', value: 'Merriweather, serif', popular: false },
    { name: 'Crimson Text', value: '"Crimson Text", serif', popular: false }
  ],
  'Monospace': [
    { name: 'Monaco', value: 'Monaco, monospace', popular: true },
    { name: 'Courier New', value: '"Courier New", monospace', popular: true },
    { name: 'Source Code Pro', value: '"Source Code Pro", monospace', popular: false },
    { name: 'JetBrains Mono', value: '"JetBrains Mono", monospace', popular: false }
  ],
  'Display': [
    { name: 'Oswald', value: 'Oswald, sans-serif', popular: false },
    { name: 'Bebas Neue', value: '"Bebas Neue", sans-serif', popular: false },
    { name: 'Abril Fatface', value: '"Abril Fatface", serif', popular: false }
  ]
};

const ALL_FONTS = Object.values(FONT_CATEGORIES).flat();
const POPULAR_FONTS = ALL_FONTS.filter(font => font.popular);

export const FontFamilySelector: React.FC<FontFamilySelectorProps> = ({
  selectedFont = 'Inter, system-ui, sans-serif',
  onChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'popular' | 'all' | 'categories'>('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredFont, setHoveredFont] = useState<string | null>(null);

  const selectedFontData = ALL_FONTS.find(font => font.value === selectedFont) || ALL_FONTS[0];

  const handleFontSelect = (fontValue: string) => {
    onChange?.(fontValue);
    setIsOpen(false);
  };

  const filteredFonts = ALL_FONTS.filter(font =>
    font.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderFontList = (fonts: typeof ALL_FONTS) => (
    <div className="space-y-1">
      {fonts.map((font) => (
        <button
          key={font.value}
          onClick={() => handleFontSelect(font.value)}
         onMouseDown={(e) => e.preventDefault()}
          onMouseEnter={() => setHoveredFont(font.value)}
          onMouseLeave={() => setHoveredFont(null)}
          className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-all duration-200 rounded-lg ${
            selectedFont === font.value ? 'bg-blue-100 border border-blue-200' : 'border border-transparent'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div 
                className="text-lg font-medium text-gray-900 mb-1 transition-all duration-200"
                style={{ 
                  fontFamily: font.value,
                  transform: hoveredFont === font.value ? 'scale(1.02)' : 'scale(1)'
                }}
              >
                {font.name}
              </div>
              <div className="text-xs text-gray-500">
                {font.value.split(',')[0].replace(/"/g, '')}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {font.popular && (
                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                  Popularna
                </span>
              )}
              {selectedFont === font.value && (
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
       onMouseDown={(e) => e.preventDefault()}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 min-w-[140px] group"
      >
        <Type className="w-4 h-4 text-gray-600 group-hover:text-gray-800" />
        <span 
          className="text-sm font-medium text-gray-700 group-hover:text-gray-900 truncate flex-1"
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
          <div className="absolute top-full left-0 mt-2 w-96 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">Rodzina czcionek</h3>
              <p className="text-xs text-gray-600 mt-1">Wybierz czcionkę dla tekstu</p>
            </div>

            {/* Search */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Szukaj czcionki..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Tabs */}
            {!searchQuery && (
              <div className="flex border-b border-gray-100">
                {[
                  { id: 'popular', label: 'Popularne' },
                  { id: 'categories', label: 'Kategorie' },
                  { id: 'all', label: 'Wszystkie' }
                ].map(({ id, label }) => (
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
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* Content */}
            <div className="max-h-80 overflow-y-auto p-4">
              {searchQuery ? (
                <div>
                  <div className="text-sm text-gray-600 mb-3">
                    Wyniki wyszukiwania dla "{searchQuery}" ({filteredFonts.length})
                  </div>
                  {renderFontList(filteredFonts)}
                </div>
              ) : (
                <>
                  {activeTab === 'popular' && (
                    <div>
                      <div className="text-sm text-gray-600 mb-3">Najczęściej używane czcionki</div>
                      {renderFontList(POPULAR_FONTS)}
                    </div>
                  )}

                  {activeTab === 'all' && (
                    <div>
                      <div className="text-sm text-gray-600 mb-3">Wszystkie dostępne czcionki</div>
                      {renderFontList(ALL_FONTS)}
                    </div>
                  )}

                  {activeTab === 'categories' && (
                    <div className="space-y-6">
                      {Object.entries(FONT_CATEGORIES).map(([category, fonts]) => (
                        <div key={category}>
                          <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                            {category}
                          </h4>
                          {renderFontList(fonts)}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Preview Section */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
              <div className="text-xs text-gray-600 mb-2">Podgląd wybranej czcionki:</div>
              <div 
                className="text-lg font-medium text-gray-800 transition-all duration-200"
                style={{ fontFamily: hoveredFont || selectedFont }}
              >
                Przykładowy tekst w wybranej czcionce
              </div>
              <div className="text-xs text-gray-500 mt-1 font-mono">
                {(hoveredFont || selectedFont)}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};