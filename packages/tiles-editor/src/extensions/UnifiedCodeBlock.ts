import CodeBlock from '@tiptap/extension-code-block';
import { TextSelection } from '@tiptap/pm/state';

const UnifiedCodeBlock = CodeBlock.extend({
  addCommands() {
    return {
      ...this.parent?.(),
      toggleCodeBlock:
        (attributes) =>
        ({ editor, state, commands }) => {
          if (editor.isActive(this.name)) {
            return commands.toggleNode(this.name, 'paragraph', attributes);
          }

          const { from, to } = state.selection;

          if (from === to) {
            return commands.toggleNode(this.name, 'paragraph', attributes);
          }

          const { schema } = state;
          const codeBlockType = schema.nodes[this.name];

          if (!codeBlockType) {
            return false;
          }

          const selectedText = state.doc.textBetween(from, to, '\n', '\n');

          return commands.command(({ tr, dispatch }) => {
            const textNode = selectedText.length ? schema.text(selectedText) : undefined;
            const codeBlockNode = codeBlockType.create(attributes, textNode);
            tr.replaceRangeWith(from, to, codeBlockNode);

            const mappedFrom = tr.mapping.map(from);
            const textLength = codeBlockNode.textContent.length;
            const cursorPosition = mappedFrom + textLength + 1;
            const safeCursorPosition = Math.min(cursorPosition, tr.doc.content.size);

            tr.setSelection(TextSelection.create(tr.doc, safeCursorPosition));

            if (dispatch) {
              dispatch(tr);
            }

            return true;
          });
        },
    };
  },
});

export default UnifiedCodeBlock;

