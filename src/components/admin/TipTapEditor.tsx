import React, { useEffect } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Underline from '../../extensions/Underline';

interface TipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
  onBlur?: () => void;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  onEditorChange?: (editor: Editor | null) => void;
}

export const TipTapEditor: React.FC<TipTapEditorProps> = ({
  content,
  onChange,
  onBlur,
  className = '',
  placeholder = 'Wpisz tekst...',
  autoFocus = false,
  onEditorChange,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable some features we don't need for now
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      TextStyle,
      Color,
      Underline,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    onBlur: () => {
      onBlur?.();
    },
    editorProps: {
      attributes: {
        class: `focus:outline-none ${className}`,
        'data-placeholder': placeholder,
      },
    },
  });

  useEffect(() => {
    onEditorChange?.(editor);
    return () => onEditorChange?.(null);
  }, [editor, onEditorChange]);

  useEffect(() => {
    if (editor && autoFocus) {
      // Focus the editor and move cursor to end
      setTimeout(() => {
        editor.commands.focus('end');
      }, 0);
    }
  }, [editor, autoFocus]);

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false);
    }
  }, [editor, content]);

  if (!editor) {
    return null;
  }

  return (
    <div className="tiptap-editor w-full h-full">
      <EditorContent 
        editor={editor} 
        className="w-full h-full overflow-auto"
      />
    </div>
  );
};