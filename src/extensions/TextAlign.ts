import { Extension } from '@tiptap/core';

export interface TextAlignOptions {
  types: string[];
  alignments: Array<'left' | 'center' | 'right' | 'justify'>;
  defaultAlignment: 'left' | 'center' | 'right' | 'justify';
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    textAlign: {
      /** Set the text alignment */
      setTextAlign: (alignment: 'left' | 'center' | 'right' | 'justify') => ReturnType;
      /** Unset the text alignment */
      unsetTextAlign: () => ReturnType;
    };
  }
}

export const TextAlign = Extension.create<TextAlignOptions>({
  name: 'textAlign',

  addOptions() {
    return {
      types: ['heading', 'paragraph'],
      alignments: ['left', 'center', 'right', 'justify'],
      defaultAlignment: 'left',
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          textAlign: {
            default: this.options.defaultAlignment,
            parseHTML: element => (element.style.textAlign || this.options.defaultAlignment) as any,
            renderHTML: attributes => {
              if (!attributes.textAlign || attributes.textAlign === this.options.defaultAlignment) {
                return {};
              }
              return { style: `text-align: ${attributes.textAlign}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setTextAlign:
        alignment => ({ commands }) => {
          if (!this.options.alignments.includes(alignment)) {
            return false;
          }
          return this.options.types
            .map(type => commands.updateAttributes(type, { textAlign: alignment }))
            .some(x => x);
        },
      unsetTextAlign:
        () => ({ commands }) => {
          return this.options.types
            .map(type => commands.resetAttributes(type, 'textAlign'))
            .some(x => x);
        },
    };
  },
});

export default TextAlign;
