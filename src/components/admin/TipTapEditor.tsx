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
      
      // Check if we're interacting with toolbar or formatting controls
      const isToolbarInteraction = relatedTarget && (
        relatedTarget.closest('.top-toolbar') ||
        relatedTarget.closest('[data-formatting-toolbar]') ||
        relatedTarget.matches('button') ||
        relatedTarget.closest('button') ||
        relatedTarget.matches('input[type="color"]') ||
        relatedTarget.closest('input[type="color"]')
      );
      
      if (isToolbarInteraction) {
        console.log('Preventing blur - toolbar interaction detected');
        return;
      }
      
      console.log('Editor blur triggered');
      onBlur?.();
    },
    editorProps: {
      attributes: {
        class: `focus:outline-none ${className}`,
        'data-placeholder': placeholder,
      },
      handleDOMEvents: {
        // Enhanced blur prevention
        blur: (view, event) => {
          const relatedTarget = event.relatedTarget as HTMLElement;
          
          const isToolbarClick = relatedTarget && (
            relatedTarget.closest('.top-toolbar') ||
            relatedTarget.matches('button') ||
            relatedTarget.closest('button') ||
            relatedTarget.matches('input') ||
            relatedTarget.closest('input')
          );
          
          if (isToolbarClick) {
            console.log('DOM blur prevented - toolbar interaction');
            event.preventDefault();
            return true;
          }
          return false;
        },
        // Prevent selection loss on mouse events
        mousedown: (view, event) => {
          // Allow normal text selection within editor
          return false;
        },
        mouseup: (view, event) => {
          // Ensure selection is maintained
          return false;
        }
      }
    },
  });

  useEffect(() => {
    if (editor && autoFocus) {
      // Focus the editor and move cursor to end
      setTimeout(() => {
        if (!editor.isDestroyed) {
          editor.commands.focus('end');
        }
      }, 0);
    }
  }, [editor, autoFocus]);

  useEffect(() => {
    // Only update content if it's actually different and editor is not focused
    if (editor && !editor.isDestroyed && content !== editor.getHTML()) {
      // Don't update content if editor is focused or has selection
      if (!editor.isFocused) {
        const hasSelection = !editor.state.selection.empty;
        if (!hasSelection) {
          editor.commands.setContent(content, false);
        }
      }
    }
  }, [editor, content]);

  // Enhanced selection preservation
  useEffect(() => {
    if (!editor) return;

    let selectionBackup: any = null;

    const backupSelection = () => {
      if (!editor.isDestroyed) {
        const { selection } = editor.state;
        if (!selection.empty) {
          selectionBackup = {
            from: selection.from,
            to: selection.to
          };
        }
      }
    };

    const restoreSelection = () => {
      if (selectionBackup && !editor.isDestroyed) {
        try {
          editor.commands.setTextSelection(selectionBackup);
        } catch (error) {
          console.warn('Failed to restore selection backup:', error);
        }
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      const relatedTarget = e.relatedTarget as HTMLElement;
      if (relatedTarget?.closest('.top-toolbar')) {
        backupSelection();
      }
    };

    const handleFocusIn = () => {
      setTimeout(restoreSelection, 10);
    };

    const editorElement = editor.view.dom;
    editorElement.addEventListener('focusout', handleFocusOut);
    editorElement.addEventListener('focusin', handleFocusIn);

    return () => {
      editorElement.removeEventListener('focusout', handleFocusOut);
      editorElement.removeEventListener('focusin', handleFocusIn);
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