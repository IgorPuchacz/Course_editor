import React, { useEffect, useState } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Undo, Redo, Code, FileCode, X } from 'lucide-react';
import { Editor } from '@tiptap/react';
import { FontSizeSelector } from './FontSizeSelector';
import { TextColorPicker } from './TextColorPicker';
import { FontFamilySelector } from './FontFamilySelector';


interface TopToolbarProps {
  tilesCount: number;
  gridColumns: number;
  gridRows: number;
  currentMode: string;
  isTextEditing: boolean;
  onFinishTextEditing?: () => void;
  editor?: Editor | null;
  className?: string;
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
  tilesCount,
  gridColumns,
  gridRows,
  currentMode,
  isTextEditing,
  onFinishTextEditing,
  editor,
  className = ''
}) => {
  const [currentFont, setCurrentFont] = useState('Inter, system-ui, sans-serif');
  const [currentSize, setCurrentSize] = useState(16);
  const [currentColor, setCurrentColor] = useState('#000000');

  useEffect(() => {
    if (!editor) return;

    const updateAttributes = () => {
      const attrs = editor.getAttributes('textStyle');
      setCurrentFont(attrs.fontFamily || 'Inter, system-ui, sans-serif');
      const sizeAttr = attrs.fontSize ? parseInt(attrs.fontSize) : 16;
      setCurrentSize(sizeAttr || 16);
      setCurrentColor(attrs.color || '#000000');
    };

    updateAttributes();

    editor.on('selectionUpdate', updateAttributes);
    editor.on('transaction', updateAttributes);

    return () => {
      editor.off('selectionUpdate', updateAttributes);
      editor.off('transaction', updateAttributes);
    };
  }, [editor]);

  if (isTextEditing) {
    return (
      <div
        data-toolbar
        onMouseDown={(e) => {
          const target = e.target as HTMLElement;
          if (!target.closest('input,textarea,select')) {
            e.preventDefault();
          }
        }}
        className={`top-toolbar flex items-center justify-between bg-white border-b border-gray-200 px-4 lg:px-6 py-3 ${className}`}
      >
        <div className="flex items-center space-x-2 text-gray-600">
          {/* Font Family Selector */}
          <FontFamilySelector
            selectedFont={currentFont}
            onChange={(font) => {
              editor?.chain().focus().setFontFamily(font).run();
            }}
          />
          
          <div className="w-px h-6 bg-gray-300"></div>
          
          {/* Font Size Selector */}
          <FontSizeSelector
            selectedSize={currentSize}
            onChange={(size) => {
              editor?.chain().focus().setFontSize(size).run();
            }}
          />
          
          <div className="w-px h-6 bg-gray-300"></div>
          
          {/* Text Color Picker */}
          <TextColorPicker
            selectedColor={currentColor}
            onChange={(color) => {
              editor?.chain().focus().setColor(color).run();
            }}
          />
          
          <div className="w-px h-6 bg-gray-300"></div>
          
          {/* Basic Formatting */}
          <button
            className={`p-2 ${editor?.isActive('bold') ? 'text-gray-900' : ''}`}
            onMouseDown={e => e.preventDefault()}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            className={`p-2 ${editor?.isActive('italic') ? 'text-gray-900' : ''}`}
            onMouseDown={e => e.preventDefault()}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            className={`p-2 ${editor?.isActive('underline') ? 'text-gray-900' : ''}`}
            onMouseDown={e => e.preventDefault()}
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
          >
            <Underline className="w-4 h-4" />
          </button>
          
          <div className="w-px h-6 bg-gray-300"></div>
          
          {/* Lists and Advanced */}
          <button
            className={`p-2 ${editor?.isActive('bulletList') ? 'text-gray-900' : ''}`}
            onMouseDown={e => e.preventDefault()}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            className={`p-2 ${editor?.isActive('orderedList') ? 'text-gray-900' : ''}`}
            onMouseDown={e => e.preventDefault()}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            className={`p-2 ${editor?.isActive('code') ? 'text-gray-900' : ''}`}
            onMouseDown={e => e.preventDefault()}
            onClick={() => editor?.chain().focus().toggleCode().run()}
          >
            <Code className="w-4 h-4" />
          </button>
          <button
            className={`p-2 ${editor?.isActive('codeBlock') ? 'text-gray-900' : ''}`}
            onMouseDown={e => e.preventDefault()}
            onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
          >
            <FileCode className="w-4 h-4" />
          </button>
          
          <div className="w-px h-6 bg-gray-300"></div>
          
          {/* History */}
          <button
            className="p-2"
            onMouseDown={e => e.preventDefault()}
            disabled={!editor?.can().undo()}
            onClick={() => editor?.chain().focus().undo().run()}
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            className="p-2"
            onMouseDown={e => e.preventDefault()}
            disabled={!editor?.can().redo()}
            onClick={() => editor?.chain().focus().redo().run()}
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>
        
        <button
          onClick={onFinishTextEditing}
          onMouseDown={e => e.preventDefault()}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title="Zakończ edycję tekstu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between bg-white border-b border-gray-200 px-4 lg:px-6 py-3 ${className}`}>
      <div className="text-sm text-gray-500">
        Kafelki: {tilesCount} • Siatka: {gridColumns}×{gridRows}
      </div>
      <div className="font-medium text-gray-700">
        {currentMode}
      </div>
    </div>
  );
};