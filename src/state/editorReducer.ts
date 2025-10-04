import { EditorState, LessonTile, Position, Size, GridPosition, ResizeHandle } from 'tiles-core';

export type EditorAction =
  | { type: 'selectTile'; tileId: string | null }
  | { type: 'startEditing'; tileId: string }
  | { type: 'startTextEditing'; tileId: string }
  | { type: 'startImageEditing'; tileId: string }
  | { type: 'stopEditing' }
  | { type: 'startDrag'; tile: LessonTile; offset: Position }
  | { type: 'startImageDrag'; start: { x: number; y: number; imageX: number; imageY: number } }
  | { type: 'startResize'; tileId: string; handle: ResizeHandle; startPosition: Position; startSize: Size; startGridPosition: GridPosition }
  | { type: 'endInteraction' }
  | { type: 'toggleGrid' }
  | { type: 'markUnsaved' }
  | { type: 'clearUnsaved' }
  | { type: 'setCanvasSize'; size: Size };

export const initialEditorState: EditorState = {
  selectedTileId: null,
  mode: 'idle',
  interaction: { type: 'idle' },
  canvasSize: { width: 1000, height: 600 },
  hasUnsavedChanges: false,
  showGrid: true
};

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'selectTile':
      return { ...state, selectedTileId: action.tileId, mode: action.tileId ? 'editing' : 'idle' };
    case 'startEditing':
      return { ...state, selectedTileId: action.tileId, mode: 'editing' };
    case 'startTextEditing':
      return { ...state, selectedTileId: action.tileId, mode: 'textEditing' };
    case 'startImageEditing':
      return { ...state, selectedTileId: action.tileId, mode: 'imageEditing' };
    case 'stopEditing':
      return { ...state, mode: state.selectedTileId ? 'editing' : 'idle' };
    case 'startDrag':
      return { ...state, mode: 'dragging', interaction: { type: 'drag', tile: action.tile, offset: action.offset } };
    case 'startImageDrag':
      return { ...state, mode: 'dragging', interaction: { type: 'imageDrag', start: action.start } };
    case 'startResize':
      return {
        ...state,
        mode: 'resizing',
        interaction: {
          type: 'resize',
          tileId: action.tileId,
          handle: action.handle,
          startPosition: action.startPosition,
          startSize: action.startSize,
          startGridPosition: action.startGridPosition
        }
      };
    case 'endInteraction':
      return { ...state, mode: state.selectedTileId ? 'editing' : 'idle', interaction: { type: 'idle' } };
    case 'toggleGrid':
      return { ...state, showGrid: !state.showGrid };
    case 'markUnsaved':
      return { ...state, hasUnsavedChanges: true };
    case 'clearUnsaved':
      return { ...state, hasUnsavedChanges: false };
    case 'setCanvasSize':
      return { ...state, canvasSize: action.size };
    default:
      return state;
  }
}
