import type React from 'react';
import type { Editor } from '@tiptap/react';
import type { ImageTile, LessonTile } from 'tiles-core';

export interface BaseTileRendererProps<T extends LessonTile = LessonTile> {
  tile: T;
  isSelected: boolean;
  isEditing: boolean;
  isEditingText: boolean;
  isImageEditing: boolean;
  isDraggingImage: boolean;
  onDoubleClick: () => void;
  onUpdateTile: (tileId: string, updates: Partial<LessonTile>) => void;
  onFinishTextEditing: () => void;
  onEditorReady: (editor: Editor | null) => void;
  backgroundColor: string;
  showBorder: boolean;
  onImageMouseDown?: (e: React.MouseEvent, tile?: ImageTile) => void;
}

export {
  getReadableTextColor,
  lightenColor,
  darkenColor,
  surfaceColor,
} from 'tiles-core/utils';
