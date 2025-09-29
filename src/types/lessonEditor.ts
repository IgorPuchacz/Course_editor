export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface GridPosition {
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
}

export interface LessonTile {
  id: string;
  type: 'text' | 'image' | 'visualization' | 'quiz' | 'programming' | 'sequencing' | 'matching';
  position: Position;
  size: Size;
  gridPosition: GridPosition;
  page: number;
  content: any;
  created_at: string;
  updated_at: string;
  z_index: number;
}

export interface TextTile extends LessonTile {
  type: 'text';
  content: {
    text: string; // Plain text fallback
    richText?: string; // HTML content with formatting
    fontFamily: string;
    fontSize: number;
    verticalAlign: 'top' | 'center' | 'bottom';
    backgroundColor: string;
    showBorder: boolean;
  };
}

export interface ImageTile extends LessonTile {
  type: 'image';
  content: {
    url: string;
    alt: string;
    caption?: string;
    position?: { x: number; y: number };
    scale?: number;
    objectFit?: 'cover' | 'contain' | 'fill' | 'custom';
  };
}

export interface InteractiveTile extends LessonTile {
  type: 'interactive';
  content: {
    title: string;
    description: string;
    interactionType: 'quiz' | 'drag-drop' | 'click' | 'input';
    data: any;
  };
}

export interface VisualizationTile extends LessonTile {
  type: 'visualization';
  content: {
    title: string;
    contentType: 'chart' | 'video';
    chartType?: 'bar' | 'line' | 'pie' | 'scatter';
    data?: any;
    videoUrl?: string;
    videoLoop?: boolean;
  };
}

export interface QuizTile extends LessonTile {
  type: 'quiz';
  content: {
    question: string;
    richQuestion?: string;
    answers: Array<{
      text: string;
      isCorrect: boolean;
    }>;
    multipleCorrect: boolean;
    backgroundColor: string;
    showBorder: boolean;
    questionFontFamily?: string;
    questionFontSize?: number;
  };
}

export interface ProgrammingTile extends LessonTile {
  type: 'programming';
  content: {
    description: string; // Plain text fallback for description
    richDescription?: string; // HTML content with formatting for description
    fontFamily: string;
    fontSize: number;
    backgroundColor: string;
    showBorder: boolean;
    code: string; // Python code in textarea
    language: string; // Programming language (default: 'python')
    startingCode?: string; // Code that appears at the beginning (non-editable for student)
    endingCode?: string; // Code that appears at the end (non-editable for student)
  };
}

export interface SequencingTile extends LessonTile {
  type: 'sequencing';
  content: {
    question: string; // The main question/prompt
    richQuestion?: string; // HTML content with formatting for question
    fontFamily: string;
    fontSize: number;
    verticalAlign: 'top' | 'center' | 'bottom';
    backgroundColor: string;
    showBorder: boolean;
    items: Array<{
      id: string;
      text: string;
      correctPosition: number; // 0-based index for correct order
    }>;
    correctFeedback: string;
    incorrectFeedback: string;
  };
}

export interface MatchingBlank {
  id: string;
  label: string;
  correctWordId: string | null;
}

export interface MatchingWord {
  id: string;
  text: string;
}

export interface MatchingTile extends LessonTile {
  type: 'matching';
  content: {
    instructions: string;
    richInstructions?: string;
    fontFamily: string;
    fontSize: number;
    verticalAlign: 'top' | 'center' | 'bottom';
    backgroundColor: string;
    showBorder: boolean;
    storyText: string;
    blanks: MatchingBlank[];
    wordBank: MatchingWord[];
    successFeedback: string;
    failureFeedback: string;
  };
}

export interface CanvasSettings {
  width: number; // Grid columns (fixed at 5)
  height: number; // Grid rows (dynamic)
  gridSize: number; // Size of each grid cell in pixels
  snapToGrid: boolean;
}

export interface LessonContent {
  id: string;
  lesson_id: string;
  tiles: LessonTile[];
  canvas_settings: CanvasSettings;
  total_pages: number;
  created_at: string;
  updated_at: string;
}

export type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';

// EditorMode represents the high-level state of the editor.
// - 'editing' is used when a tile is selected but not in a specific content editor
// - 'textEditing' and 'imageEditing' lock the tile for content editing
export type EditorMode =
  | 'idle'
  | 'editing'
  | 'textEditing'
  | 'imageEditing'
  | 'dragging'
  | 'resizing';

export type InteractionState =
  | { type: 'idle' }
  | { type: 'drag'; tile: LessonTile; offset: Position }
  | { type: 'imageDrag'; start: { x: number; y: number; imageX: number; imageY: number } }
  | {
      type: 'resize';
      tileId: string;
      handle: ResizeHandle;
      startPosition: Position;
      startSize: Size;
      startGridPosition: GridPosition;
    };

export interface EditorState {
  selectedTileId: string | null;
  mode: EditorMode;
  interaction: InteractionState;
  canvasSize: Size;
  hasUnsavedChanges: boolean;
  showGrid: boolean;
}

export interface TilePaletteItem {
  type: string;
  title: string;
  icon: string;
}