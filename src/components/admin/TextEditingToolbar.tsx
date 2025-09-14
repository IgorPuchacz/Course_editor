import React from 'react';
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Undo, Redo, Type, Palette } from 'lucide-react';
import type { Editor } from '@tiptap/react';

interface TextEditingToolbarProps {
  onFinishEditing: () => void;
  editor: Editor | null;
  className?: string;
}

export const TextEditingToolbar: React.FC<TextEditingToolbarProps> = ({
  onFinishEditing,
  editor,
  className = '',
}) => {
  const baseBtn = 'p-2 rounded-lg transition-colors';
  const fmtClass = (active: boolean) =>
    `${baseBtn} ${active ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'}`;

  const canUndo = editor?.can().undo() ?? false;
  const canRedo = editor?.can().redo() ?? false;

  return (
    <div className={`flex items-center justify-between bg-white border-b border-gray-200 px-4 lg:px-6 py-3 ${className}`}>
      <div className="flex items-center space-x-1">
        {/* Text formatting buttons */}
        <div className="flex items-center space-x-1 border-r border-gray-200 pr-3 mr-3">
          <button
            className={fmtClass(editor?.isActive('bold') ?? false)}
            title="Pogrub tekst"
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            className={fmtClass(editor?.isActive('italic') ?? false)}
            title="Kursywa"
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            className={fmtClass(editor?.isActive('underline') ?? false)}
            title="Podkreślenie"
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>
        </div>

        {/* List buttons */}
        <div className="flex items-center space-x-1 border-r border-gray-200 pr-3 mr-3">
          <button
            className={fmtClass(editor?.isActive('bulletList') ?? false)}
            title="Lista punktowana"
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            className={fmtClass(editor?.isActive('orderedList') ?? false)}
            title="Lista numerowana"
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="w-4 h-4" />
          </button>
        </div>

        {/* Color and style buttons */}
        <div className="flex items-center space-x-1 border-r border-gray-200 pr-3 mr-3">
          <button
            className={`${baseBtn} text-gray-600 hover:text-blue-600 hover:bg-blue-50`}
            title="Kolor tekstu"
          >
            <Palette className="w-4 h-4" />
          </button>
          <button
            className={`${baseBtn} text-gray-600 hover:text-blue-600 hover:bg-blue-50`}
            title="Rozmiar tekstu"
          >
            <Type className="w-4 h-4" />
          </button>
        </div>

        {/* Undo/Redo buttons */}
        <div className="flex items-center space-x-1">
          <button
            className={`${baseBtn} text-gray-600 hover:text-blue-600 hover:bg-blue-50 ${!canUndo ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Cofnij"
            onClick={() => editor?.chain().focus().undo().run()}
            disabled={!canUndo}
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            className={`${baseBtn} text-gray-600 hover:text-blue-600 hover:bg-blue-50 ${!canRedo ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Ponów"
            onClick={() => editor?.chain().focus().redo().run()}
            disabled={!canRedo}
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