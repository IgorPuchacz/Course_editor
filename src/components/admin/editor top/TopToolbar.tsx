import React, { useEffect, useState } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Undo, Redo, Code, FileCode, X, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { Editor } from '@tiptap/react';
import { FontSizeSelector } from './FontSizeSelector.tsx';
import { TextColorPicker } from './TextColorPicker.tsx';
import { FontSelector } from './FontSelector.tsx';
import { AlignmentControls } from './AlignmentControls.tsx';
import { LessonTile, ProgrammingTile, TextTile, SequencingTile } from '../../../types/lessonEditor.ts';


interface TopToolbarProps {
  tilesCount: number;
  gridColumns: number;
  gridRows: number;
  currentMode: string;
  isTextEditing: boolean;
  onFinishTextEditing?: () => void;
  editor?: Editor | null;
  selectedTile?: TextTile | ProgrammingTile | SequencingTile | null;
  onUpdateTile?: (tileId: string, updates: Partial<LessonTile>) => void;
  currentPage?: number;
  totalPages?: number;
  onSelectPage?: (page: number) => void;
  onAddPage?: () => void;
  onDeletePage?: () => void;
  canDeletePage?: boolean;
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
  selectedTile,
  onUpdateTile,
  currentPage,
  totalPages,
  onSelectPage,
  onAddPage,
  onDeletePage,
  canDeletePage = true,
  className = ''
}) => {
  const [currentFont, setCurrentFont] = useState('Inter, system-ui, sans-serif');
  const [currentSize, setCurrentSize] = useState(16);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [horizontalAlign, setHorizontalAlign] = useState<'left' | 'center' | 'right' | 'justify'>('left');
  const [verticalAlign, setVerticalAlign] = useState<'top' | 'center' | 'bottom'>('top');

  useEffect(() => {
    if (!editor) return;

    const updateAttributes = () => {
      const styleAttrs = editor.getAttributes('textStyle');
      setCurrentFont(styleAttrs.fontFamily || 'Inter, system-ui, sans-serif');
      const sizeAttr = styleAttrs.fontSize ? parseInt(styleAttrs.fontSize) : 16;
      setCurrentSize(sizeAttr || 16);
      setCurrentColor(styleAttrs.color || '#000000');

      const paragraphAttrs = editor.getAttributes('paragraph');
      setHorizontalAlign((paragraphAttrs.textAlign as 'left' | 'center' | 'right' | 'justify') || 'left');
    };

    updateAttributes();

    editor.on('selectionUpdate', updateAttributes);
    editor.on('transaction', updateAttributes);

    return () => {
      editor.off('selectionUpdate', updateAttributes);
      editor.off('transaction', updateAttributes);
    };
  }, [editor]);

  useEffect(() => {
    if (selectedTile?.type === 'text' || selectedTile?.type === 'sequencing') {
      setVerticalAlign(selectedTile.content.verticalAlign || 'top');
    }
  }, [selectedTile]);

  const handleHorizontalChange = (alignment: 'left' | 'center' | 'right' | 'justify') => {
    setHorizontalAlign(alignment);
    editor?.chain().focus().setTextAlign(alignment).run();
  };

  const handleVerticalChange = (alignment: 'top' | 'center' | 'bottom') => {
    setVerticalAlign(alignment);
    if (selectedTile && onUpdateTile) {
      onUpdateTile(selectedTile.id, {
        content: {
          verticalAlign: alignment,
        },
      });
    }
    editor?.commands.focus();
  };

  // Enhanced button styling for formatting buttons
  const getFormattingButtonClass = (isActive: boolean, isDisabled = false) => {
    if (isDisabled) {
      return 'p-2 text-gray-300 cursor-not-allowed rounded-lg transition-all duration-200 min-w-[36px] h-9 flex items-center justify-center pointer-events-none';
    }
    
    if (isActive) {
      return 'p-2 bg-blue-500 text-white shadow-sm border border-blue-600 rounded-lg transition-all duration-200 min-w-[36px] h-9 flex items-center justify-center hover:bg-blue-600';
    }
    
    return 'p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 hover:shadow-sm border border-transparent rounded-lg transition-all duration-200 min-w-[36px] h-9 flex items-center justify-center';
  };
  const toolbarClassName = `top-toolbar z-30 flex items-center justify-between px-4 lg:px-6 py-3 ${className}`;

  if (isTextEditing) {
    return (
      <div
        className={toolbarClassName}
        onMouseDown={(e) => e.preventDefault()}
      >
        <div className="flex items-center space-x-2 text-gray-600" onMouseDown={(e) => e.preventDefault()}>
          {/* Font Family Selector */}
          <FontSelector
            selectedFont={currentFont}
            onChange={(font) => {
              editor?.chain().focus().setFontFamily(font).run();
            }}
          />
          
          {/* Font Size Selector */}
          <FontSizeSelector
            selectedSize={currentSize}
            onChange={(size) => {
              editor?.chain().focus().setFontSize(size).run();
            }}
          />
          
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
            className={getFormattingButtonClass(editor?.isActive('bold') || false)}
            onMouseDown={e => e.preventDefault()}
            onClick={() => editor?.chain().focus().toggleBold().run()}
            title="Pogrubienie (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            className={getFormattingButtonClass(editor?.isActive('italic') || false)}
            onMouseDown={e => e.preventDefault()}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            title="Kursywa (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            className={getFormattingButtonClass(editor?.isActive('underline') || false)}
            onMouseDown={e => e.preventDefault()}
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            title="Podkreślenie (Ctrl+U)"
          >
            <Underline className="w-4 h-4" />
          </button>
          
          <div className="w-px h-6 bg-gray-300"></div>
          
          {/* Alignment Controls */}
          <AlignmentControls
            selectedHorizontal={horizontalAlign}
            selectedVertical={verticalAlign}
            onHorizontalChange={handleHorizontalChange}
            onVerticalChange={selectedTile?.type === 'programming' ? undefined : handleVerticalChange}
          />
          
          <div className="w-px h-6 bg-gray-300"></div>
          
          {/* Lists and Advanced */}
          <button
            className={getFormattingButtonClass(editor?.isActive('bulletList') || false)}
            onMouseDown={e => e.preventDefault()}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            title="Lista punktowana"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            className={getFormattingButtonClass(editor?.isActive('orderedList') || false)}
            onMouseDown={e => e.preventDefault()}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            title="Lista numerowana"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-gray-300"></div>
          
          <button
            className={getFormattingButtonClass(editor?.isActive('code') || false)}
            onMouseDown={e => e.preventDefault()}
            onClick={() => editor?.chain().focus().toggleCode().run()}
            title="Kod inline"
          >

          
            
            <Code className="w-4 h-4" />
          </button>
          <button
            className={getFormattingButtonClass(editor?.isActive('codeBlock') || false)}
            onMouseDown={e => e.preventDefault()}
            onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
            title="Blok kodu"
          >
            <FileCode className="w-4 h-4" />
          </button>
          
          <div className="w-px h-6 bg-gray-300"></div>
          
          {/* History */}
          <button
            className={getFormattingButtonClass(false, !editor?.can().undo())}
            onMouseDown={e => e.preventDefault()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (editor?.can().undo()) {
                editor?.chain().focus().undo().run();
              }
            }}
            disabled={!editor?.can().undo()}
            title="Cofnij (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            className={getFormattingButtonClass(false, !editor?.can().redo())}
            onMouseDown={e => e.preventDefault()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (editor?.can().redo()) {
                editor?.chain().focus().redo().run();
              }
            }}
            disabled={!editor?.can().redo()}
            title="Ponów (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>
        
        <button
          onClick={onFinishTextEditing}
          onMouseDown={e => e.preventDefault()}
          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 border border-transparent hover:border-red-200"
          title="Zakończ edycję tekstu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    );
  }

  const hasPagination =
    typeof currentPage === 'number' &&
    typeof totalPages === 'number' &&
    onSelectPage !== undefined;

  const safeTotalPages = Math.max(totalPages ?? 1, 1);
  const pages = Array.from({ length: safeTotalPages }, (_, index) => index + 1);
  const canGoPrev = hasPagination ? currentPage! > 1 : false;
  const canGoNext = hasPagination ? currentPage! < safeTotalPages : false;

  return (
    <div className={toolbarClassName}>
      <div className="flex items-center gap-4 text-gray-600 overflow-hidden">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900">{currentMode}</span>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{tilesCount} kafelków</span>
            <span className="hidden sm:inline-flex items-center gap-2">
              <span className="w-px h-3 bg-gray-300" aria-hidden="true"></span>
              <span>
                Siatka {gridColumns}×{gridRows}
              </span>
            </span>
          </div>
        </div>
      </div>

      {hasPagination && (
        <div className="flex flex-1 justify-end items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => canGoPrev && onSelectPage(currentPage! - 1)}
              disabled={!canGoPrev}
              className={getFormattingButtonClass(false, !canGoPrev)}
              aria-label="Poprzednia strona"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1 overflow-x-auto max-w-[240px] sm:max-w-[320px]" aria-label="Lista stron">
              {pages.map((page) => {
                const isActive = page === currentPage;
                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => onSelectPage(page)}
                    className={`${getFormattingButtonClass(isActive)} px-3`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => canGoNext && onSelectPage(currentPage! + 1)}
              disabled={!canGoNext}
              className={getFormattingButtonClass(false, !canGoNext)}
              aria-label="Następna strona"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>
              Strona {currentPage} z {safeTotalPages}
            </span>
            {onAddPage && (
              <button
                type="button"
                onClick={onAddPage}
                className="inline-flex items-center gap-2 px-3 h-9 rounded-lg bg-blue-600 text-white text-sm font-medium shadow-sm hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nowa strona</span>
                <span className="sm:hidden">Dodaj</span>
              </button>
            )}
            {onDeletePage && (
              <button
                type="button"
                onClick={onDeletePage}
                disabled={!canDeletePage}
                className="inline-flex items-center gap-2 px-3 h-9 rounded-lg border border-red-200 text-red-600 text-sm font-medium shadow-sm hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Usuń stronę</span>
                <span className="sm:hidden">Usuń</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
