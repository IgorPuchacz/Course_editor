import type React from 'react';
import { MatchPairsTileView } from './MatchPairsTileView';
import { ProgrammingTileView } from './ProgrammingTileView';
import { QuizTileView } from './QuizTileView';
import { SequencingTileView } from './SequencingTileView';
import { TextTileView } from './TextTileView';
import { ImageTileView } from './ImageTileView';
import type {
  TextTileViewProps,
  ImageTileViewProps,
  ProgrammingTileViewProps,
  QuizTileViewProps,
  SequencingTileViewProps,
  MatchPairsTileViewProps,
} from './types';
import type { LessonTile } from '../../../types/lessonEditor';

export type TileComponentMap = {
  text: React.ComponentType<TextTileViewProps>;
  image: React.ComponentType<ImageTileViewProps>;
  programming: React.ComponentType<ProgrammingTileViewProps>;
  quiz: React.ComponentType<QuizTileViewProps>;
  sequencing: React.ComponentType<SequencingTileViewProps>;
  matchPairs: React.ComponentType<MatchPairsTileViewProps>;
};

export const TILE_COMPONENTS: Partial<TileComponentMap> = {
  text: TextTileView,
  image: ImageTileView,
  programming: ProgrammingTileView,
  quiz: QuizTileView,
  sequencing: SequencingTileView,
  matchPairs: MatchPairsTileView,
};

export type TileComponentType = LessonTile['type'];
export {
  TextTileView,
  ImageTileView,
  ProgrammingTileView,
  QuizTileView,
  SequencingTileView,
  MatchPairsTileView,
};
