import type { Editor } from '@tiptap/react';
import type {
  LessonTile,
  TextTile,
  ImageTile,
  ProgrammingTile,
  QuizTile,
  SequencingTile,
  MatchPairsTile,
} from '../../../types/lessonEditor';

export interface BaseTileViewProps<T extends LessonTile> {
  tile: T;
  isSelected: boolean;
  isEditingText: boolean;
  computedBackground: string;
  onUpdateTile: (tileId: string, updates: Partial<LessonTile>) => void;
  onFinishTextEditing: () => void;
  onEditorReady: (editor: Editor | null) => void;
  isTestingMode?: boolean;
  onDoubleClick?: () => void;
}

export interface TextTileViewProps extends BaseTileViewProps<TextTile> {
  textColor: string;
}

export interface ImageTileViewProps extends BaseTileViewProps<ImageTile> {
  isImageEditing: boolean;
  isDraggingImage: boolean;
  onImageMouseDown: (event: React.MouseEvent, tile: ImageTile) => void;
}

export type ProgrammingTileViewProps = BaseTileViewProps<ProgrammingTile>;

export type QuizTileViewProps = BaseTileViewProps<QuizTile>;

export type SequencingTileViewProps = BaseTileViewProps<SequencingTile>;

export type MatchPairsTileViewProps = BaseTileViewProps<MatchPairsTile>;
