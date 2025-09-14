import React, { useState, useRef, useEffect } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Undo, 
  Redo, 
  Type, 
  Palette,
  Code,
  FileCode,
  ChevronDown
} from 'lucide-react';

interface TextEditingToolbarProps {
  editor: any; // TipTap editor instance
  onFinishEditing: () => void;
  className?: string;
}

export const TextEditingToolbar: React.FC<TextEditingToolbarProps> = ({
  editor,
  onFinishEditing,
  className = ''
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [selectedSize, setSelectedSize] = useState(16);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const sizePickerRef = useRef<HTMLDivElement>(null);

  // Predefined colors for quick selection
  const predefinedColors = [
    '#000000', '#374151', '#6B7280', '#9CA3AF',
    '#EF4444', '#F97316', '#EAB308', '#22C55E',
    '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B'
  ];

  // Font sizes
  const fontSizes = [12, 14, 16, 18, 20, 24, 28, 32, 36, 48];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
      if (sizePickerRef.current && !sizePickerRef.current.contains(event.target as Node)) {
        setShowSizePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update selected color and size based on current selection
  useEffect(() => {
    if (!editor) return;

    const updateState = () => {
      // Get current color
      const currentColor = editor.getAttributes('textStyle').color || '#000000';
      setSelectedColor(currentColor);
      
      // Get current font size (this would need custom extension for full support)
      // For now, we'll use a default approach
      const currentSize = 16; // Default size
      setSelectedSize(currentSize);
    };

    editor.on('selectionUpdate', updateState);
    editor.on('transaction', updateState);

    return () => {
      editor.off('selectionUpdate', updateState);
      editor.off('transaction', updateState);
    };
  }, [editor]);

  if (!editor) {
    return null;
  }

  const handleColorSelect = (color: string) => {
    editor.chain().focus().setColor(color).run();
    setSelectedColor(color);
    setShowColorPicker(false);
  };

  const handleSizeSelect = (size: number) => {
    // Apply font size using inline styles
    editor.chain().focus().setFontSize(`${size}px`).run();
    setSelectedSize(size);
    setShowSizePicker(false);
  };

  const isActive = (name: string, attributes?: any) => {
    return editor.isActive(name, attributes);
  };

  const canUndo = editor.can().undo();
  const canRedo = editor.can().redo();

  return (
    <div className={`flex items-center justify-between bg-white border-b border-gray-200 px-4 lg:px-6 py-3 ${className}`}>
      <div className="flex items-center space-x-1">
        {/* Basic formatting buttons */}
        <div className="flex items-center space-x-1 border-r border-gray-200 pr-3 mr-3">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded-lg transition-colors ${
              isActive('bold')
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
            }`}
            title="Pogrub tekst (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded-lg transition-colors ${
              isActive('italic')
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
            }`}
            title="Kursywa (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-2 rounded-lg transition-colors ${
              isActive('underline')
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
            }`}
            title="Podkreślenie (Ctrl+U)"
          >
            <Underline className="w-4 h-4" />
          </button>
        </div>

        {/* List buttons */}
        <div className="flex items-center space-x-1 border-r border-gray-200 pr-3 mr-3">
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded-lg transition-colors ${
              isActive('bulletList')
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
            }`}
            title="Lista punktowana"
          >
            <List className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded-lg transition-colors ${
              isActive('orderedList')
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
            }`}
            title="Lista numerowana"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
        </div>

        {/* Code buttons */}
        <div className="flex items-center space-x-1 border-r border-gray-200 pr-3 mr-3">
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-2 rounded-lg transition-colors ${
              isActive('code')
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
            }`}
            title="Kod inline"
          >
            <Code className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`p-2 rounded-lg transition-colors ${
              isActive('codeBlock')
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
            }`}
            title="Blok kodu"
          >
            <FileCode className="w-4 h-4" />
          </button>
        </div>

        {/* Color and size controls */}
        <div className="flex items-center space-x-1 border-r border-gray-200 pr-3 mr-3">
          {/* Color Picker */}
          <div className="relative" ref={colorPickerRef}>
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="flex items-center space-x-1 p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Kolor tekstu"
            >
              <Palette className="w-4 h-4" />
              <div 
                className="w-3 h-3 rounded border border-gray-300"
                style={{ backgroundColor: selectedColor }}
              />
              <ChevronDown className="w-3 h-3" />
            </button>
            
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 min-w-[200px]">
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleColorSelect(color)}
                      className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 ${
                        selectedColor === color 
                          ? 'border-blue-500 ring-2 ring-blue-200' 
                          : 'border-gray-300'
                      }`}
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
                  title="Wybierz inny kolor"
                />
              </div>
            )}
          </div>

          {/* Font Size Picker */}
          <div className="relative" ref={sizePickerRef}>
            <button
              onClick={() => setShowSizePicker(!showSizePicker)}
              className="flex items-center space-x-1 p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Rozmiar tekstu"
            >
              <Type className="w-4 h-4" />
              <span className="text-xs font-medium">{selectedSize}px</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            
            {showSizePicker && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50 min-w-[120px]">
                {fontSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => handleSizeSelect(size)}
                    className={`w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors ${
                      selectedSize === size ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
                    }`}
                    style={{ fontSize: `${Math.min(size, 18)}px` }}
                  >
                    {size}px
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Undo/Redo buttons */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!canUndo}
            className={`p-2 rounded-lg transition-colors ${
              canUndo
                ? 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                : 'text-gray-300 cursor-not-allowed'
            }`}
            title="Cofnij (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!canRedo}
            className={`p-2 rounded-lg transition-colors ${
              canRedo
                ? 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                : 'text-gray-300 cursor-not-allowed'
            }`}
            title="Ponów (Ctrl+Y)"
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