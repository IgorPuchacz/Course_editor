import React, { useEffect } from 'react';
import { Editor, EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import FontSize from '../extensions/FontSize';
import TextAlignExtension from '../extensions/TextAlign';

export interface RichTextContent {
  text: string;
  richText?: string;
  fontFamily?: string;
  fontSize?: number;
  verticalAlign?: 'top' | 'center' | 'bottom';
  backgroundColor?: string;
  showBorder?: boolean;
}

export interface RichTextEditorProps {
  content: RichTextContent;
  onChange: (content: RichTextContent) => void;
  onFinish: () => void;
  onEditorReady?: (editor: Editor | null) => void;
  textColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

export interface RichTextFieldMapping<T extends Record<string, any>> {
  text: keyof T;
  richText?: keyof T;
  fontFamily?: keyof T;
  fontSize?: keyof T;
  verticalAlign?: keyof T;
}

export interface RichTextAdapterOptions<T extends Record<string, any>> {
  source: T;
  fields: RichTextFieldMapping<T>;
  defaults?: Partial<Omit<RichTextContent, 'text' | 'richText'>>;
}

export interface RichTextAdapter<T extends Record<string, any>> {
  content: RichTextContent;
  applyChanges: (updated: RichTextContent) => T;
}

const defaultParagraph = (text: string) => `<p style="margin: 0;">${text || ''}</p>`;

export const createRichTextAdapter = <T extends Record<string, any>>({
  source,
  fields,
  defaults = {}
}: RichTextAdapterOptions<T>): RichTextAdapter<T> => {
  const content: RichTextContent = {
    text: (source[fields.text] as string) ?? '',
    richText: fields.richText ? ((source[fields.richText] as string | undefined) ?? undefined) : undefined,
    fontFamily:
      (fields.fontFamily ? (source[fields.fontFamily] as string | undefined) : undefined) ??
      defaults.fontFamily ??
      'Inter',
    fontSize:
      (fields.fontSize ? (source[fields.fontSize] as number | undefined) : undefined) ??
      defaults.fontSize ??
      16,
    verticalAlign:
      (fields.verticalAlign ? (source[fields.verticalAlign] as RichTextContent['verticalAlign'] | undefined) : undefined) ??
      defaults.verticalAlign ??
      'top',
    backgroundColor: defaults.backgroundColor,
    showBorder: defaults.showBorder
  };

  return {
    content,
    applyChanges: updated => ({
      ...source,
      [fields.text]: updated.text,
      ...(fields.richText ? { [fields.richText]: updated.richText } : {}),
      ...(fields.fontFamily ? { [fields.fontFamily]: updated.fontFamily } : {}),
      ...(fields.fontSize ? { [fields.fontSize]: updated.fontSize } : {}),
      ...(fields.verticalAlign ? { [fields.verticalAlign]: updated.verticalAlign } : {})
    })
  };
};

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  onFinish,
  onEditorReady,
  textColor,
  className,
  style
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false
      }),
      BulletList.configure({
        HTMLAttributes: { class: 'bullet-list' },
        keepMarks: true,
        keepAttributes: true
      }),
      OrderedList.configure({
        HTMLAttributes: { class: 'ordered-list' },
        keepMarks: true,
        keepAttributes: true
      }),
      ListItem,
      Underline,
      TextStyle,
      Color.configure({ types: ['textStyle'] }),
      FontFamily.configure({ types: ['textStyle'] }),
      FontSize,
      TextAlignExtension.configure({ types: ['paragraph'] })
    ],
    content: content.richText || defaultParagraph(content.text),
    onUpdate: ({ editor: tiptap }) => {
      const html = tiptap.getHTML();
      const plain = tiptap.getText();
      onChange({
        ...content,
        text: plain,
        richText: html
      });
    },
    autofocus: true
  });

  useEffect(() => {
    if (!editor) return;
    const nextContent = content.richText || defaultParagraph(content.text);
    if (editor.getHTML() !== nextContent) {
      editor.commands.setContent(nextContent, false);
    }
  }, [content.richText, content.text, editor]);

  useEffect(() => {
    if (!onEditorReady) return;

    onEditorReady(editor);
    return () => onEditorReady(null);
  }, [editor, onEditorReady]);

  if (!editor) {
    return null;
  }

  const handleBlur = (event: React.FocusEvent) => {
    const toolbar = document.querySelector('.top-toolbar');
    if (toolbar && event.relatedTarget && toolbar.contains(event.relatedTarget as Node)) {
      event.preventDefault();
      editor.commands.focus();
      return;
    }

    onFinish();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      if (editor.isActive('listItem')) {
        if (event.shiftKey) {
          editor.chain().focus().liftListItem('listItem').run();
        } else {
          editor.chain().focus().sinkListItem('listItem').run();
        }
      } else {
        editor.chain().focus().insertContent('\t').run();
      }
    }
  };

  const combinedClassName = `w-full h-full p-3 overflow-hidden relative tile-text-content tiptap-editor${
    className ? ` ${className}` : ''
  }`;

  const combinedStyle: React.CSSProperties = {
    fontSize: content.fontSize ? `${content.fontSize}px` : undefined,
    fontFamily: content.fontFamily,
    color: textColor,
    display: 'flex',
    flexDirection: 'column',
    justifyContent:
      content.verticalAlign === 'center'
        ? 'center'
        : content.verticalAlign === 'bottom'
        ? 'flex-end'
        : 'flex-start',
    ...style
  };

  return (
    <div className={combinedClassName} style={combinedStyle}>
      <EditorContent
        editor={editor}
        className="w-full focus:outline-none break-words rich-text-content tile-formatted-text"
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};

export default RichTextEditor;
