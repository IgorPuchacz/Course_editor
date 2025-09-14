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
  ChevronDown,
  X
} from 'lucide-react';

interface TopToolbarProps {
  // Normal mode props
  tilesCount: number;
  gridColumns: number;
  gridRows: number;
  currentMode: string;
  
  // Text editing mode props
  isTextEditing: boolean;
  editor?: any; // TipTap editor instance
  onFinishTextEditing?: () => void;
  className?: string;
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
  tilesCount,
  gridColumns,
  gridRows,
  currentMode,
  isTextEditing,
  editor,
  onFinishTextEditing,
  className = ''
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [selectedSize, setSelectedSize] = useState(16);
  const [savedSelection, setSavedSelection] = useState<any>(null);
  const [isFormattingActive, setIsFormattingActive] = useState(false);
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

  // Save current selection
  const saveSelection = () => {
    if (!editor || editor.isDestroyed) return null;
    
    const selection = editor.state.selection;
    if (selection && !selection.empty) {
      setSavedSelection({
        from: selection.from,
        to: selection.to,
        content: editor.state.doc.textBetween(selection.from, selection.to)
      });
      return selection;
    }
    return null;
  };

  // Restore saved selection
  const restoreSelection = () => {
    if (!editor || editor.isDestroyed || !savedSelection) return false;
    
    try {
      editor.commands.focus();
      editor.commands.setTextSelection({
        from: savedSelection.from,
        to: savedSelection.to
      });
      return true;
    } catch (error) {
      console.warn('Failed to restore selection:', error);
      return false;
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Don't close dropdowns if we're actively formatting
      if (!isFormattingActive) {
        if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
          setShowColorPicker(false);
        }
        if (sizePickerRef.current && !sizePickerRef.current.contains(event.target as Node)) {
          setShowSizePicker(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFormattingActive]);

  // Update selected color and size based on current selection
  useEffect(() => {
    if (!editor) return;

    const updateState = () => {
      // Only update state if editor is not destroyed
      if (editor.isDestroyed) return;
      
      // Get current color
      const currentColor = editor.getAttributes('textStyle').color || '#000000';
      setSelectedColor(currentColor);
      
      // Get current font size (this would need custom extension for full support)
      const currentSize = 16; // Default size
      setSelectedSize(currentSize);
      
      // Save selection if text is selected
      const selection = editor.state.selection;
      if (selection && !selection.empty) {
        saveSelection();
      }
    };

    editor.on('selectionUpdate', updateState);
    editor.on('transaction', updateState);

    return () => {
      if (!editor.isDestroyed) {
        editor.off('selectionUpdate', updateState);
        editor.off('transaction', updateState);
      }
    };
  }, [editor]);

  const handleColorSelect = (color: string) => {
    setIsFormattingActive(true);
    
    if (!editor || editor.isDestroyed) {
      setIsFormattingActive(false);
      return;
    }

    // Restore selection before applying formatting
    if (savedSelection) {
      restoreSelection();
    }
    
    // Apply formatting and maintain selection
    editor.chain().focus().setColor(color).run();
    setSelectedColor(color);
    
    // Keep selection active after formatting
    setTimeout(() => {
      if (savedSelection) {
        restoreSelection();
      }
      setIsFormattingActive(false);
    }, 50);
    
    // Don't close color picker immediately - let user apply more colors if needed
    // setShowColorPicker(false);
  };

  const handleSizeSelect = (size: number) => {
    setIsFormattingActive(true);
    
    if (!editor || editor.isDestroyed) {
      setIsFormattingActive(false);
      return;
    }

    // Restore selection before applying formatting
    if (savedSelection) {
      restoreSelection();
    }
    
    // Apply formatting and maintain selection
    editor.chain().focus().setFontSize(`${size}px`).run();
    setSelectedSize(size);
    
    // Keep selection active after formatting
    setTimeout(() => {
      if (savedSelection) {
        restoreSelection();
      }
      setIsFormattingActive(false);
    }, 50);
    
    // Don't close size picker immediately
    // setShowSizePicker(false);
  };

  const isActive = (name: string, attributes?: any) => {
    return editor && !editor.isDestroyed ? editor.isActive(name, attributes) : false;
  };

  const canUndo = editor && !editor.isDestroyed ? editor.can().undo() : false;
  const canRedo = editor && !editor.isDestroyed ? editor.can().redo() : false;

  // Handle formatting commands with proper focus management
  const executeCommand = (commandFn: () => any, commandName?: string) => {
    setIsFormattingActive(true);
    
    if (!editor || editor.isDestroyed) return;
    
    // Save current selection before executing command
    const currentSelection = saveSelection();
    
    // Restore selection if we have one saved
    if (savedSelection) {
      restoreSelection();
    }
    
    // Execute the command
    commandFn();
    
    // Restore selection after command execution
    setTimeout(() => {
      if (savedSelection) {
        restoreSelection();
      }
      setIsFormattingActive(false);
    }, 50);
  };

  // Render normal mode (canvas info)
  const renderNormalMode = () => (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2 lg:space-x-4 text-xs lg:text-sm">
        <span className="text-gray-600">
          Kafelki: {tilesCount}
        </span>
        <span className="text-gray-600 hidden sm:inline">
          Siatka: {gridColumns} × {gridRows}
        </span>
        <span className="text-gray-600 hidden md:inline">
          {currentMode}
        </span>
      </div>
      
      {/* Context indicator */}
      <div className="flex items-center space-x-2 text-xs text-gray-500">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span>Dodaj nowy kafelek</span>
      </div>
    </div>
  );

  // Render text editing mode (formatting toolbar)
  const renderTextEditingMode = () => (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-1">
        {/* Basic formatting buttons */}
        <div className="flex items-center space-x-1 border-r border-gray-200 pr-3 mr-3">
          <button
            onMouseDown={(e) => {
              e.preventDefault(); // Prevent losing focus
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              executeCommand(() => editor.chain().focus().toggleBold().run(), 'bold');
            }}
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
            onMouseDown={(e) => {
              e.preventDefault(); // Prevent losing focus
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              executeCommand(() => editor.chain().focus().toggleItalic().run(), 'italic');
            }}
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
            onMouseDown={(e) => {
              e.preventDefault(); // Prevent losing focus
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              executeCommand(() => editor.chain().focus().toggleUnderline().run(), 'underline');
            }}
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
            onMouseDown={(e) => {
              e.preventDefault(); // Prevent losing focus
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              executeCommand(() => editor.chain().focus().toggleBulletList().run(), 'bulletList');
            }}
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
            onMouseDown={(e) => {
              e.preventDefault(); // Prevent losing focus
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              executeCommand(() => editor.chain().focus().toggleOrderedList().run(), 'orderedList');
            }}
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
            onMouseDown={(e) => {
              e.preventDefault(); // Prevent losing focus
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              executeCommand(() => editor.chain().focus().toggleCode().run(), 'code');
            }}
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
            onMouseDown={(e) => {
              e.preventDefault(); // Prevent losing focus
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              executeCommand(() => editor.chain().focus().toggleCodeBlock().run(), 'codeBlock');
            }}
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
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent losing focus
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowColorPicker(!showColorPicker);
              }}
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
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevent losing focus
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleColorSelect(color);
                      }}
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
                  onChange={(e) => {
                    e.preventDefault();
                    handleColorSelect(e.target.value);
                  }}
                  className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                  title="Wybierz inny kolor"
                />
              </div>
            )}
          </div>

          {/* Font Size Picker */}
          <div className="relative" ref={sizePickerRef}>
            <button
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent losing focus
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowSizePicker(!showSizePicker);
              }}
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
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevent losing focus
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSizeSelect(size);
                    }}
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
            onMouseDown={(e) => {
              e.preventDefault(); // Prevent losing focus
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              executeCommand(() => editor.chain().focus().undo().run(), 'undo');
            }}
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
            onMouseDown={(e) => {
              e.preventDefault(); // Prevent losing focus
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              executeCommand(() => editor.chain().focus().redo().run(), 'redo');
            }}
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
        {/* Selection info */}
        {savedSelection && (
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span>Zaznaczono: {savedSelection.content.length > 20 ? savedSelection.content.substring(0, 20) + '...' : savedSelection.content}</span>
          </div>
        )}
        
        <div className="flex items-center space-x-2 text-sm text-blue-600">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="font-medium hidden sm:inline">Edytujesz tekst</span>
        </div>
        
        <button
          onClick={() => {
            // Clear saved selection when finishing editing
            setSavedSelection(null);
            setIsFormattingActive(false);
            onFinishTextEditing?.();
          }}
          className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <X className="w-4 h-4" />
          <span className="hidden sm:inline">Zakończ</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className={`bg-white border-b border-gray-200 px-4 lg:px-6 py-3 transition-all duration-200 ${className}`}>
      {isTextEditing ? renderTextEditingMode() : renderNormalMode()}
    </div>
  );
};