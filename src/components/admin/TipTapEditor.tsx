import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';

interface TipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
  onBlur?: () => void;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

export const TipTapEditor: React.FC<TipTapEditorProps> = ({
  content,
  onChange,
  onBlur,
  className = '',
  placeholder = 'Wpisz tekst...',
  autoFocus = false
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable some features we don't need for now
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        dropcursor: false,
        gapcursor: false,
      }),
      TextStyle,
      Color,
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
        class: `prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none ${className}`,
        'data-placeholder': placeholder,
      },
    },
    immediatelyRender: false,
  });

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