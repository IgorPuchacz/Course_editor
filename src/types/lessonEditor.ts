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
  type: 'text' | 'image' | 'visualization' | 'quiz';
  position: Position;
  size: Size;
  gridPosition: GridPosition;
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
    textAlign: 'left' | 'center' | 'right';
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
    answers: Array<{
      text: string;
      isCorrect: boolean;
    }>;
    multipleCorrect: boolean;
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
  created_at: string;
  updated_at: string;
}

export interface DragState {
  isDragging: boolean;
  draggedTile: LessonTile | null;
  dragOffset: Position;
  isFromPalette: boolean;
  previewPosition?: GridPosition;
  isDraggingImage: boolean;
  imageDragStart: { x: number; y: number; imageX: number; imageY: number } | null;
}

export interface ResizeState {
  isResizing: boolean;
  resizingTileId: string | null;
  resizeHandle: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null;
  startPosition: Position;
  startSize: Size;
  startGridPosition: GridPosition;
}

export interface EditorState {
  selectedTileId: string | null;
  isEditing: boolean;
  dragState: DragState;
  resizeState: ResizeState;
  canvasSize: Size;
  hasUnsavedChanges: boolean;
  showGrid: boolean;
}

export interface TilePaletteItem {
  type: string;
  title: string;
  description: string;
  icon: string;
  defaultSize: GridPosition;
}