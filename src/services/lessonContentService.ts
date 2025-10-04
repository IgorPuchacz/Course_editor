import {
  Lesson,
  LessonTile,
  TextTile,
  ProgrammingTile,
  SequencingTile,
  BlanksTile,
  OpenTile,
  PairingTile,
  CanvasSettings,
  GridPosition,
  TILE_VERSION
} from 'tiles-core';
import { GridUtils } from 'tiles-editor';
import { logger } from '../utils/logger';

const DEFAULT_CANVAS_SETTINGS: CanvasSettings = {
  width: GridUtils.GRID_COLUMNS,
  height: 6,
  gridSize: GridUtils.GRID_CELL_SIZE,
  snapToGrid: true
};

const STORAGE_KEY_PREFIX = 'lesson-content:';

const inMemoryLessonStore = new Map<string, Lesson>();

const isBrowserEnvironment = () => typeof window !== 'undefined' && !!window.localStorage;

const getStorageKey = (lessonId: string) => `${STORAGE_KEY_PREFIX}${lessonId}`;

const cloneLesson = (lesson: Lesson): Lesson => JSON.parse(JSON.stringify(lesson)) as Lesson;

const ensureCanvasSettings = (settings?: CanvasSettings): CanvasSettings => ({
  width: settings?.width ?? DEFAULT_CANVAS_SETTINGS.width,
  height: settings?.height ?? DEFAULT_CANVAS_SETTINGS.height,
  gridSize: settings?.gridSize ?? DEFAULT_CANVAS_SETTINGS.gridSize,
  snapToGrid: settings?.snapToGrid ?? DEFAULT_CANVAS_SETTINGS.snapToGrid
});

export class LessonContentService {
  private static createEmptyContent(lessonId: string): Lesson {
    const timestamp = new Date().toISOString();

    return {
      id: `content-${lessonId}`,
      lesson_id: lessonId,
      tiles: [],
      canvas_settings: { ...DEFAULT_CANVAS_SETTINGS },
      total_pages: 1,
      created_at: timestamp,
      updated_at: timestamp
    };
  }

  private static normalizeContent(content: Lesson): Lesson {
    const cloned = cloneLesson(content);

    const totalPages = Math.max(
      cloned.total_pages || 1,
      ...(cloned.tiles.length ? cloned.tiles.map(tile => tile.page ?? 1) : [1])
    );

    let maxHeight = 6;
    for (let page = 1; page <= totalPages; page++) {
      const pageTiles = cloned.tiles.filter(tile => (tile.page ?? 1) === page);
      maxHeight = Math.max(maxHeight, GridUtils.calculateCanvasHeight(pageTiles));
    }

    cloned.total_pages = totalPages;
    cloned.canvas_settings = ensureCanvasSettings(cloned.canvas_settings);
    cloned.canvas_settings.height = maxHeight;
    cloned.updated_at = new Date().toISOString();

    return cloned;
  }

  private static writeToStores(content: Lesson): void {
    inMemoryLessonStore.set(content.lesson_id, content);

    if (isBrowserEnvironment()) {
      try {
        window.localStorage.setItem(getStorageKey(content.lesson_id), JSON.stringify(content));
      } catch (error) {
        logger.warn('Failed to persist lesson content to localStorage:', error);
      }
    }
  }

  private static readFromStores(lessonId: string): Lesson | null {
    const fromMemory = inMemoryLessonStore.get(lessonId);
    if (fromMemory) {
      return cloneLesson(fromMemory);
    }

    if (isBrowserEnvironment()) {
      try {
        const stored = window.localStorage.getItem(getStorageKey(lessonId));
        if (stored) {
          const parsed = JSON.parse(stored) as Lesson;
          const normalized = this.normalizeContent(parsed);
          this.writeToStores(normalized);
          return cloneLesson(normalized);
        }
      } catch (error) {
        logger.warn('Failed to read lesson content from localStorage:', error);
      }
    }

    return null;
  }

  /**
   * Get lesson content by lesson ID
   */
  static async getLessonContent(lessonId: string): Promise<Lesson | null> {
    try {
      const storedContent = this.readFromStores(lessonId);

      if (storedContent) {
        return storedContent;
      }

      const mockContent = this.createEmptyContent(lessonId);
      this.writeToStores(mockContent);

      return cloneLesson(mockContent);
    } catch (error) {
      logger.error('Failed to load lesson content:', error);
      return null;
    }
  }

  /**
   * Save lesson content
   */
  static async saveLessonContent(content: Lesson): Promise<void> {
    try {
      const normalized = this.normalizeContent(content);

      // Simulate API call - replace with actual Supabase call
      logger.info('Saving lesson content:', normalized);

      this.writeToStores(normalized);

      // Here you would make the actual API call to save to Supabase
      // await supabase.from('lesson_content').upsert(normalized);
    } catch (error) {
      logger.error('Failed to save lesson content:', error);
      throw error;
    }
  }

  static persistLessonContent(content: Lesson): void {
    try {
      const normalized = this.normalizeContent(content);
      this.writeToStores(normalized);
    } catch (error) {
      logger.warn('Failed to persist lesson content draft:', error);
    }
  }

  /**
   * Create a new text tile
   */
  static createTextTile(position: { x: number; y: number }, page = 1): TextTile {
    const base = this.initializeTileBase('text', position, page, { colSpan: 4, rowSpan: 2 });

    return {
      ...base,
      content: {
        text: 'Nowy tekst',
        richText: '<p style="margin: 0;">Nowy tekst</p>',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 16,
        verticalAlign: 'top',
        backgroundColor: '#ffffff',
        showBorder: true,
      }
    };
  }

  /**
   * Create a new image tile
   */
  static createImageTile(position: { x: number; y: number }, page = 1): LessonTile {
    const base = this.initializeTileBase('image', position, page, { colSpan: 4, rowSpan: 4 });

    return {
      ...base,
      content: {
        url: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400',
        alt: 'Przykładowy obraz',
        caption: 'Opis obrazu',
        position: { x: 0, y: 0 },
        scale: 1,
        objectFit: 'contain'
      }
    };
  }

  /**
   * Create a new visualization tile
   */
  static createVisualizationTile(position: { x: number; y: number }, page = 1): LessonTile {
    const base = this.initializeTileBase('visualization', position, page, { colSpan: 6, rowSpan: 6 });

    return {
      ...base,
      content: {
        title: 'Nowa wizualizacja',
        contentType: 'chart',
        chartType: 'bar',
        data: {
          labels: ['A', 'B', 'C', 'D'],
          values: [10, 20, 15, 25]
        },
        videoUrl: '',
        videoLoop: true
      }
    };
  }

  /**
   * Create a new quiz tile
   */
  static createQuizTile(position: { x: number; y: number }, page = 1): LessonTile {
    const base = this.initializeTileBase('quiz', position, page, { colSpan: 8, rowSpan: 6 });

    return {
      ...base,
      content: {
        question: 'Przykładowe pytanie?',
        richQuestion: '<p>Przykładowe pytanie?</p>',
        answers: [
          { text: 'Odpowiedź A', isCorrect: false },
          { text: 'Odpowiedź B', isCorrect: true },
          { text: 'Odpowiedź C', isCorrect: false }
        ],
        multipleCorrect: false,
        backgroundColor: '#D4D4D4',
        showBorder: true,
        questionFontFamily: 'Inter',
        questionFontSize: 18
      }
    };
  }

  /**
   * Create a new programming task tile
   */
  static createProgrammingTile(position: { x: number; y: number }, page = 1): ProgrammingTile {
    const base = this.initializeTileBase('programming', position, page, { colSpan: 8, rowSpan: 6 });

    return {
      ...base,
      content: {
        description: 'Opis zadania programistycznego',
        richDescription: '<p style="margin: 0;">Opis zadania programistycznego</p>',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 16,
        backgroundColor: '#D4D4D4',
        showBorder: true,
        code: 'Wpisz swój kod tutaj',
        language: 'python',
        startingCode: '',
        endingCode: ''
      }
    };
  }

  /**
   * Create a new sequencing tile
   */
  static createSequencingTile(position: { x: number; y: number }, page = 1): SequencingTile {
    const base = this.initializeTileBase('sequencing', position, page, { colSpan: 8, rowSpan: 10 });

    return {
      ...base,
      content: {
        question: 'Ułóż elementy w prawidłowej kolejności',
        richQuestion: '<p style="margin: 0;">Ułóż elementy w prawidłowej kolejności</p>',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 16,
        verticalAlign: 'top',
        backgroundColor: '#D4D4D4',
        showBorder: true,
        items: [
          { id: 'item-1', text: 'Pierwszy element', correctPosition: 0 },
          { id: 'item-2', text: 'Drugi element', correctPosition: 1 },
          { id: 'item-3', text: 'Trzeci element', correctPosition: 2 }
        ],
        correctFeedback: 'Świetnie! Prawidłowa kolejność.',
        incorrectFeedback: 'Spróbuj ponownie. Sprawdź kolejność elementów.'
      }
    };
  }

  /**
   * Create a new pairing tile
   */
  static createPairingTile(position: { x: number; y: number }, page = 1): PairingTile {
    const base = this.initializeTileBase('pairing', position, page, { colSpan: 8, rowSpan: 9 });

    return {
      ...base,
      content: {
        instruction: 'Dopasuj pasujące do siebie elementy z obu kolumn.',
        richInstruction:
          '<p style="margin: 0;">Dopasuj pasujące do siebie elementy z obu kolumn.</p>',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 16,
        verticalAlign: 'top',
        backgroundColor: '#d4d4d4',
        pairs: [
          { id: 'pair-1', left: 'Element A', right: 'Odpowiednik A' },
          { id: 'pair-2', left: 'Element B', right: 'Odpowiednik B' },
          { id: 'pair-3', left: 'Element C', right: 'Odpowiednik C' }
        ]
      }
    };
  }

  /**
   * Create a new match pairs (fill-in-the-blanks) tile
   */
  static createBlanksTile(position: { x: number; y: number }, page = 1): BlanksTile {
    const base = this.initializeTileBase('blanks', position, page, { colSpan: 10, rowSpan: 8 });

    return {
      ...base,
      content: {
        instruction: 'Przeciągnij właściwe wyrażenia do luk w tekście.',
        richInstruction: '<p style="margin: 0;">Przeciągnij właściwe wyrażenia do luk w tekście.</p>',
        textTemplate: 'Stolicą Polski jest {{Warszawa}}. Narodowym symbolem jest {{biało-czerwona flaga}}.',
        backgroundColor: '#d4d4d4',
        blanks: [
          { id: 'blank-warszawa-1', correctOptionId: 'auto-warszawa-1' },
          { id: 'blank-bialo-czerwona-flaga-2', correctOptionId: 'auto-bialo-czerwona-flaga-2' }
        ],
        options: [
          { id: 'auto-warszawa-1', text: 'Warszawa', isAuto: true },
          { id: 'auto-bialo-czerwona-flaga-2', text: 'biało-czerwona flaga', isAuto: true },
          { id: 'distractor-wisla', text: 'Wisła', isAuto: false }
        ]
      }
    };
  }

  /**
   * Create a new open answer tile
   */
  static createOpenTile(position: { x: number; y: number }, page = 1): OpenTile {
    const base = this.initializeTileBase('open', position, page, { colSpan: 8, rowSpan: 9 });

    return {
      ...base,
      content: {
        instruction: 'Odpowiedz na pytanie w formacie opisanym poniżej.',
        richInstruction: '<p style="margin: 0;">Odpowiedz na pytanie w formacie opisanym poniżej.</p>',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 16,
        verticalAlign: 'top',
        backgroundColor: '#d4d4d4',
        showBorder: true,
        expectedFormat: "['napis1', 'napis2', 'napis3']",
        correctAnswer: "['napis1', 'napis2', 'napis3']",
        ignoreCase: true,
        ignoreWhitespace: true,
        attachments: [
          {
            id: 'attachment-instrukcja',
            name: 'instrukcja.pdf',
            url: 'https://example.com/materialy/instrukcja.pdf'
          }
        ]
      }
    };
  }

  private static initializeTileBase<TType extends LessonTile['type']>(
    type: TType,
    position: { x: number; y: number },
    page: number,
    spans: Pick<GridPosition, 'colSpan' | 'rowSpan'>
  ): Omit<Extract<LessonTile, { type: TType }>, 'content'> {
    const id = `tile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const gridPos = GridUtils.pixelToGrid(position, DEFAULT_CANVAS_SETTINGS);
    gridPos.colSpan = spans.colSpan;
    gridPos.rowSpan = spans.rowSpan;

    const pixelPos = GridUtils.gridToPixel(gridPos, DEFAULT_CANVAS_SETTINGS);
    const pixelSize = GridUtils.gridSizeToPixel(gridPos, DEFAULT_CANVAS_SETTINGS);

    return {
      id,
      type,
      position: pixelPos,
      size: pixelSize,
      gridPosition: gridPos,
      page,
      created_at: now,
      updated_at: now,
      z_index: 1,
      version: TILE_VERSION
    } as Omit<Extract<LessonTile, { type: TType }>, 'content'>;
  }
}
