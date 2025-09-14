import React, { useEffect, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import ListItem from '@tiptap/extension-list-item';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import Code from '@tiptap/extension-code';
import CodeBlock from '@tiptap/extension-code-block';
import History from '@tiptap/extension-history';
import { FontSize } from './TipTapFontSizeExtension';

// Create stable instances of extensions outside the component
const historyExtension = History.configure({
  depth: 50,
});

interface TipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
  onBlur?: () => void;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  onEditorReady?: (editor: any) => void;
}

export const TipTapEditor: React.FC<TipTapEditorProps> = ({
  content,
  onChange,
  onBlur,
  className = '',
  placeholder = 'Wpisz tekst...',
  autoFocus = false,
  onEditorReady
}) => {
  const extensions = useMemo(() => [
    StarterKit.configure({
      // Disable default extensions we're configuring separately
      heading: false,
      bulletList: false,
      orderedList: false,
      listItem: false,
      code: false,
      codeBlock: false,
      undoRedo: false, // Disable StarterKit's built-in history (UndoRedo) to avoid duplicate plugins
      // Keep other useful features
      blockquote: true,
      horizontalRule: true,
    }),
    TextStyle,
    Color,
    Underline,
    Code.configure({
      HTMLAttributes: {
        class: 'inline-code',
      },
    }),
    CodeBlock.configure({
      HTMLAttributes: {
        class: 'code-block',
      },
    }),
    BulletList.configure({
      HTMLAttributes: {
        class: 'bullet-list',
      },
    }),
    OrderedList.configure({
      HTMLAttributes: {
        class: 'ordered-list',
      },
    }),
    ListItem,
    historyExtension, // Use the stable instance
    FontSize,
  ], []);

  const editor = useEditor({
    extensions,
    content: content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    onBlur: ({ event }) => {
      // Only trigger onBlur if we're not clicking on formatting buttons
      const relatedTarget = event?.relatedTarget as HTMLElement;
      if (relatedTarget && (
        relatedTarget.closest('[data-formatting-toolbar]') ||
        relatedTarget.closest('.top-toolbar') ||
        relatedTarget.closest('[role="button"]')
      )) {
        // Don't blur if clicking on formatting controls
        return;
      }
      onBlur?.();
    },
    editorProps: {
      attributes: {
        class: `focus:outline-none ${className}`,
        'data-placeholder': placeholder,
      },
      handleDOMEvents: {
        // Prevent losing selection when interacting with toolbar
        blur: (view, event) => {
          const relatedTarget = event.relatedTarget as HTMLElement;
          if (relatedTarget && (
            relatedTarget.closest('[data-formatting-toolbar]') ||
            relatedTarget.closest('.top-toolbar')
          )) {
            // Prevent blur when clicking toolbar
            event.preventDefault();
            return true;
          }
          return false;
        }
      }
    },
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
    // Only update content if it's actually different and editor is focused
    if (editor && !editor.isDestroyed && content !== editor.getHTML()) {
      // Don't update content if editor is currently focused (user is typing)
      if (!editor.isFocused) {
        editor.commands.setContent(content, false);
      }
    }
  }, [editor, content]);

  // Prevent losing selection when mouse leaves editor area
  useEffect(() => {
    if (!editor) return;

    const handleMouseLeave = (e: MouseEvent) => {
      // Don't clear selection when mouse leaves editor
      e.preventDefault();
    };

    const editorElement = editor.view.dom;
    editorElement.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      editorElement.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [editor]);
  // Notify parent when editor is ready
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

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