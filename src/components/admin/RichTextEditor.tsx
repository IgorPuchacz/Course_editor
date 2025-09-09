import React, { useRef, useEffect, useState } from 'react';
import { Bold, Palette } from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  className = ''
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = content;
    }
  }, []);

  const handleInput = () => {
    if (editorRef.current) {
      console.log('Rich text content updated:', editorRef.current.innerHTML);
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle Ctrl+B for bold
    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      applyFormat('bold');
    }
  };

  const handleSelectionChange = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      setToolbarPosition({
        top: rect.top - 50,
        left: rect.left + (rect.width / 2) - 100
      });
      setShowToolbar(true);
    } else {
      setShowToolbar(false);
    }
  };

  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const applyColor = (colorValue: string) => {
    applyFormat('foreColor', colorValue);
    setSelectedColor(colorValue);
  };

  const predefinedColors = [
    '#000000', '#333333', '#666666', '#999999',
    '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
    '#FF00FF', '#00FFFF', '#FFA500', '#800080'
  ];

  return (
    <div className="relative">
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onMouseUp={handleSelectionChange}
        onKeyUp={handleSelectionChange}
        onKeyDown={handleKeyDown}
        className={`w-full h-full p-3 outline-none overflow-hidden border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
        style={{ minHeight: '120px' }}
        suppressContentEditableWarning={true}
      />

      {/* Floating Toolbar */}
      {showToolbar && (
        <div
          className="fixed bg-white border border-gray-300 rounded-lg shadow-lg p-2 flex items-center space-x-1 z-50 pointer-events-auto"
          style={{
            top: toolbarPosition.top,
            left: toolbarPosition.left,
            transform: 'translateX(-50%)'
          }}
        >
          <button
            onClick={() => applyFormat('bold')}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Pogrub"
          >
            <Bold className="w-4 h-4" />
          </button>
          
          <div className="w-px h-6 bg-gray-300 mx-1"></div>

          {/* Color Picker */}
          <div className="relative">
            <button 
              className="p-2 hover:bg-gray-100 rounded transition-colors flex items-center space-x-1"
              onMouseEnter={() => setShowColorPicker(true)}
            >
              <Palette className="w-4 h-4" />
              <div 
                className="w-3 h-3 rounded border border-gray-300"
                style={{ backgroundColor: selectedColor }}
              ></div>
            </button>
            
            {showColorPicker && (
              <div 
                className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3 pointer-events-auto"
                onMouseEnter={() => setShowColorPicker(true)}
                onMouseLeave={() => setShowColorPicker(false)}
              >
              <div className="grid grid-cols-4 gap-1">
                {predefinedColors.map((colorValue) => (
                  <button
                    key={colorValue}
                    onClick={() => applyColor(colorValue)}
                    className="w-7 h-7 rounded border-2 border-gray-300 hover:border-gray-500 transition-all hover:scale-105 shadow-sm"
                    style={{ backgroundColor: colorValue }}
                    title={colorValue}
                  />
                ))}
              </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};