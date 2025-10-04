import { z } from 'zod';

export const TILE_VERSION = '1.0.0';

export const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export type Position = z.infer<typeof positionSchema>;

export const sizeSchema = z.object({
  width: z.number(),
  height: z.number(),
});

export type Size = z.infer<typeof sizeSchema>;

export const gridPositionSchema = z.object({
  col: z.number(),
  row: z.number(),
  colSpan: z.number(),
  rowSpan: z.number(),
});

export type GridPosition = z.infer<typeof gridPositionSchema>;

export const tileBaseSchema = z.object({
  id: z.string(),
  position: positionSchema,
  size: sizeSchema,
  gridPosition: gridPositionSchema,
  page: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  z_index: z.number(),
  version: z.string().default(TILE_VERSION),
});

export type TileType =
  | 'text'
  | 'image'
  | 'interactive'
  | 'visualization'
  | 'quiz'
  | 'programming'
  | 'sequencing'
  | 'blanks'
  | 'open'
  | 'pairing';

export const verticalAlignSchema = z.union([
  z.literal('top'),
  z.literal('center'),
  z.literal('bottom'),
]);

export const textTileContentSchema = z.object({
  text: z.string(),
  richText: z.string().optional(),
  fontFamily: z.string(),
  fontSize: z.number(),
  verticalAlign: verticalAlignSchema,
  backgroundColor: z.string(),
  showBorder: z.boolean(),
});

export type TextTileContent = z.infer<typeof textTileContentSchema>;

export const imageTileContentSchema = z.object({
  url: z.string(),
  alt: z.string(),
  caption: z.string().optional(),
  position: positionSchema.optional(),
  scale: z.number().optional(),
  objectFit: z.enum(['cover', 'contain', 'fill', 'custom']).optional(),
});

export type ImageTileContent = z.infer<typeof imageTileContentSchema>;

export const interactiveTileContentSchema = z.object({
  title: z.string(),
  description: z.string(),
  interactionType: z.enum(['quiz', 'drag-drop', 'click', 'input']),
  data: z.unknown(),
});

export type InteractiveTileContent = z.infer<typeof interactiveTileContentSchema>;

export const visualizationTileContentSchema = z.object({
  title: z.string(),
  contentType: z.enum(['chart', 'video']),
  chartType: z.enum(['bar', 'line', 'pie', 'scatter']).optional(),
  data: z.unknown().optional(),
  videoUrl: z.string().optional(),
  videoLoop: z.boolean().optional(),
});

export type VisualizationTileContent = z.infer<typeof visualizationTileContentSchema>;

export const quizTileContentSchema = z.object({
  question: z.string(),
  richQuestion: z.string().optional(),
  answers: z
    .array(
      z.object({
        text: z.string(),
        isCorrect: z.boolean(),
      }),
    )
    .min(1),
  multipleCorrect: z.boolean(),
  backgroundColor: z.string(),
  showBorder: z.boolean(),
  questionFontFamily: z.string().optional(),
  questionFontSize: z.number().optional(),
});

export type QuizTileContent = z.infer<typeof quizTileContentSchema>;

export const programmingTileContentSchema = z.object({
  description: z.string(),
  richDescription: z.string().optional(),
  fontFamily: z.string(),
  fontSize: z.number(),
  backgroundColor: z.string(),
  showBorder: z.boolean(),
  code: z.string(),
  language: z.string(),
  startingCode: z.string().optional(),
  endingCode: z.string().optional(),
});

export type ProgrammingTileContent = z.infer<typeof programmingTileContentSchema>;

export const sequencingItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  correctPosition: z.number(),
});

export const sequencingTileContentSchema = z.object({
  question: z.string(),
  richQuestion: z.string().optional(),
  fontFamily: z.string(),
  fontSize: z.number(),
  verticalAlign: verticalAlignSchema,
  backgroundColor: z.string(),
  showBorder: z.boolean(),
  items: z.array(sequencingItemSchema),
  correctFeedback: z.string(),
  incorrectFeedback: z.string(),
});

export type SequencingTileContent = z.infer<typeof sequencingTileContentSchema>;

export const blanksTileBlankSchema = z.object({
  id: z.string(),
  correctOptionId: z.string(),
});

export const blanksTileOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  isAuto: z.boolean().optional(),
});

export const blanksTileContentSchema = z.object({
  instruction: z.string(),
  richInstruction: z.string().optional(),
  textTemplate: z.string(),
  backgroundColor: z.string(),
  blanks: z.array(blanksTileBlankSchema),
  options: z.array(blanksTileOptionSchema),
});

export type BlanksTileContent = z.infer<typeof blanksTileContentSchema>;

export const attachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
});

export const openTileContentSchema = z.object({
  instruction: z.string(),
  richInstruction: z.string().optional(),
  fontFamily: z.string(),
  fontSize: z.number(),
  verticalAlign: verticalAlignSchema,
  backgroundColor: z.string(),
  showBorder: z.boolean(),
  expectedFormat: z.string(),
  correctAnswer: z.string(),
  ignoreCase: z.boolean(),
  ignoreWhitespace: z.boolean(),
  attachments: z.array(attachmentSchema),
});

export type OpenTileContent = z.infer<typeof openTileContentSchema>;

export const pairingTilePairSchema = z.object({
  id: z.string(),
  left: z.string(),
  right: z.string(),
});

export const pairingTileContentSchema = z.object({
  instruction: z.string(),
  richInstruction: z.string().optional(),
  fontFamily: z.string(),
  fontSize: z.number(),
  verticalAlign: verticalAlignSchema,
  backgroundColor: z.string(),
  pairs: z.array(pairingTilePairSchema),
});

export type PairingTileContent = z.infer<typeof pairingTileContentSchema>;

const textTileSchema = tileBaseSchema.extend({
  type: z.literal('text'),
  content: textTileContentSchema,
});

const imageTileSchema = tileBaseSchema.extend({
  type: z.literal('image'),
  content: imageTileContentSchema,
});

const interactiveTileSchema = tileBaseSchema.extend({
  type: z.literal('interactive'),
  content: interactiveTileContentSchema,
});

const visualizationTileSchema = tileBaseSchema.extend({
  type: z.literal('visualization'),
  content: visualizationTileContentSchema,
});

const quizTileSchema = tileBaseSchema.extend({
  type: z.literal('quiz'),
  content: quizTileContentSchema,
});

const programmingTileSchema = tileBaseSchema.extend({
  type: z.literal('programming'),
  content: programmingTileContentSchema,
});

const sequencingTileSchema = tileBaseSchema.extend({
  type: z.literal('sequencing'),
  content: sequencingTileContentSchema,
});

const blanksTileSchema = tileBaseSchema.extend({
  type: z.literal('blanks'),
  content: blanksTileContentSchema,
});

const openTileSchema = tileBaseSchema.extend({
  type: z.literal('open'),
  content: openTileContentSchema,
});

const pairingTileSchema = tileBaseSchema.extend({
  type: z.literal('pairing'),
  content: pairingTileContentSchema,
});

export const TileSchemas = {
  text: textTileSchema,
  image: imageTileSchema,
  interactive: interactiveTileSchema,
  visualization: visualizationTileSchema,
  quiz: quizTileSchema,
  programming: programmingTileSchema,
  sequencing: sequencingTileSchema,
  blanks: blanksTileSchema,
  open: openTileSchema,
  pairing: pairingTileSchema,
} as const;

export const TileSchema = z.discriminatedUnion('type', [
  textTileSchema,
  imageTileSchema,
  interactiveTileSchema,
  visualizationTileSchema,
  quizTileSchema,
  programmingTileSchema,
  sequencingTileSchema,
  blanksTileSchema,
  openTileSchema,
  pairingTileSchema,
]);

export type TileData = z.infer<typeof TileSchema>;

export type TileDataByType<TType extends TileType> = Extract<TileData, { type: TType }>;

export type LessonTile<TType extends TileType = TileType> = TileDataByType<TType>;

export type TextTile = TileDataByType<'text'>;
export type ImageTile = TileDataByType<'image'>;
export type InteractiveTile = TileDataByType<'interactive'>;
export type VisualizationTile = TileDataByType<'visualization'>;
export type QuizTile = TileDataByType<'quiz'>;
export type ProgrammingTile = TileDataByType<'programming'>;
export type SequencingTile = TileDataByType<'sequencing'>;
export type BlanksTile = TileDataByType<'blanks'>;
export type OpenTile = TileDataByType<'open'>;
export type PairingTile = TileDataByType<'pairing'>;

export const canvasSettingsSchema = z.object({
  width: z.number(),
  height: z.number(),
  gridSize: z.number(),
  snapToGrid: z.boolean(),
});

export type CanvasSettings = z.infer<typeof canvasSettingsSchema>;

export const lessonSchema = z.object({
  id: z.string(),
  lesson_id: z.string(),
  tiles: z.array(TileSchema),
  canvas_settings: canvasSettingsSchema,
  total_pages: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Lesson = z.infer<typeof lessonSchema>;

export type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';

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
  type: TileType;
  title: string;
  icon: string;
}

export function migrateTileConfig<TType extends TileType>(tile: TileDataByType<TType>): TileDataByType<TType> {
  // Future migrations will adjust tile configuration shape based on version metadata.
  return tile;
}
