import { LessonContent, LessonTile, TextTile } from '../types/lessonEditor';
import { ProgrammingTile, SequencingTile } from '../types/lessonEditor';
import { GridUtils } from '../utils/gridUtils';
import { logger } from '../utils/logger';

export class LessonContentService {
  /**
   * Get lesson content by lesson ID
   */
  static async getLessonContent(lessonId: string): Promise<LessonContent | null> {
    try {
      // Simulate API call - replace with actual Supabase call
      const mockContent: LessonContent = {
        id: `content-${lessonId}`,
        lesson_id: lessonId,
        tiles: [],
        canvas_settings: {
          width: GridUtils.GRID_COLUMNS,
          height: 6,
          gridSize: GridUtils.GRID_CELL_SIZE,
          snapToGrid: true
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return mockContent;
    } catch (error) {
      logger.error('Failed to load lesson content:', error);
      return null;
    }
  }

  /**
   * Save lesson content
   */
  static async saveLessonContent(content: LessonContent): Promise<void> {
    try {
      // Update canvas height based on tiles
      content.canvas_settings.height = GridUtils.calculateCanvasHeight(content.tiles);
      content.updated_at = new Date().toISOString();

      // Simulate API call - replace with actual Supabase call
      logger.info('Saving lesson content:', content);
      
      // Here you would make the actual API call to save to Supabase
      // await supabase.from('lesson_content').upsert(content);
    } catch (error) {
      logger.error('Failed to save lesson content:', error);
      throw error;
    }
  }

  /**
   * Create a new text tile
   */
  static createTextTile(position: { x: number; y: number }): TextTile {
    const id = `tile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    // Convert pixel position to grid position
    const gridPos = GridUtils.pixelToGrid(position, {
      width: GridUtils.GRID_COLUMNS,
      height: 6,
      gridSize: GridUtils.GRID_CELL_SIZE,
      snapToGrid: true
    });

    // Default to 2x1 grid size for text tiles
    gridPos.colSpan = 2;
    gridPos.rowSpan = 1;

    const pixelPos = GridUtils.gridToPixel(gridPos, {
      width: GridUtils.GRID_COLUMNS,
      height: 6,
      gridSize: GridUtils.GRID_CELL_SIZE,
      snapToGrid: true
    });

    const pixelSize = GridUtils.gridSizeToPixel(gridPos, {
      width: GridUtils.GRID_COLUMNS,
      height: 6,
      gridSize: GridUtils.GRID_CELL_SIZE,
      snapToGrid: true
    });

    return {
      id,
      type: 'text',
      position: pixelPos,
      size: pixelSize,
      gridPosition: gridPos,
      content: {
        text: 'Nowy tekst',
        richText: '<p style="margin: 0;">Nowy tekst</p>',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 16,
        verticalAlign: 'top',
        backgroundColor: '#ffffff',
        showBorder: true,
      },
      created_at: now,
      updated_at: now,
      z_index: 1
    };
  }

  /**
   * Create a new image tile
   */
  static createImageTile(position: { x: number; y: number }): LessonTile {
    const id = `tile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const gridPos = GridUtils.pixelToGrid(position, {
      width: GridUtils.GRID_COLUMNS,
      height: 6,
      gridSize: GridUtils.GRID_CELL_SIZE,
      snapToGrid: true
    });

    // Default to 2x2 grid size for image tiles
    gridPos.colSpan = 2;
    gridPos.rowSpan = 2;

    const pixelPos = GridUtils.gridToPixel(gridPos, {
      width: GridUtils.GRID_COLUMNS,
      height: 6,
      gridSize: GridUtils.GRID_CELL_SIZE,
      snapToGrid: true
    });

    const pixelSize = GridUtils.gridSizeToPixel(gridPos, {
      width: GridUtils.GRID_COLUMNS,
      height: 6,
      gridSize: GridUtils.GRID_CELL_SIZE,
      snapToGrid: true
    });

    return {
      id,
      type: 'image',
      position: pixelPos,
      size: pixelSize,
      gridPosition: gridPos,
      content: {
        url: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400',
        alt: 'Przykładowy obraz',
        caption: 'Opis obrazu',
        position: { x: 0, y: 0 },
        scale: 1,
        objectFit: 'contain'
      },
      created_at: now,
      updated_at: now,
      z_index: 1
    };
  }

  /**
   * Create a new visualization tile
   */
  static createVisualizationTile(position: { x: number; y: number }): LessonTile {
    const id = `tile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const gridPos = GridUtils.pixelToGrid(position, {
      width: GridUtils.GRID_COLUMNS,
      height: 6,
      gridSize: GridUtils.GRID_CELL_SIZE,
      snapToGrid: true
    });

    // Default to 3x3 grid size for visualization tiles
    gridPos.colSpan = 3;
    gridPos.rowSpan = 3;

    const pixelPos = GridUtils.gridToPixel(gridPos, {
      width: GridUtils.GRID_COLUMNS,
      height: 6,
      gridSize: GridUtils.GRID_CELL_SIZE,
      snapToGrid: true
    });

    const pixelSize = GridUtils.gridSizeToPixel(gridPos, {
      width: GridUtils.GRID_COLUMNS,
      height: 6,
      gridSize: GridUtils.GRID_CELL_SIZE,
      snapToGrid: true
    });

    return {
      id,
      type: 'visualization',
      position: pixelPos,
      size: pixelSize,
      gridPosition: gridPos,
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
      },
      created_at: now,
      updated_at: now,
      z_index: 1
    };
  }

  /**
   * Create a new quiz tile
   */
  static createQuizTile(position: { x: number; y: number }): LessonTile {
    const id = `tile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const gridPos = GridUtils.pixelToGrid(position, {
      width: GridUtils.GRID_COLUMNS,
      height: 6,
      gridSize: GridUtils.GRID_CELL_SIZE,
      snapToGrid: true
    });

    // Default to 3x2 grid size for quiz tiles
    gridPos.colSpan = 3;
    gridPos.rowSpan = 2;

    const pixelPos = GridUtils.gridToPixel(gridPos, {
      width: GridUtils.GRID_COLUMNS,
      height: 6,
      gridSize: GridUtils.GRID_CELL_SIZE,
      snapToGrid: true
    });

    const pixelSize = GridUtils.gridSizeToPixel(gridPos, {
      width: GridUtils.GRID_COLUMNS,
      height: 6,
      gridSize: GridUtils.GRID_CELL_SIZE,
      snapToGrid: true
    });

    const createAnswer = (text: string, isCorrect: boolean) => ({
      id: `answer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text,
      isCorrect
    });

    return {
      id,
      type: 'quiz',
      position: pixelPos,
      size: pixelSize,
      gridPosition: gridPos,
      content: {
        question: 'Przykładowe pytanie?',
        richQuestion: '<p style="margin: 0;">Przykładowe pytanie?</p>',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 16,
        backgroundColor: '#f0fdf4',
        showBorder: true,
        answers: [
          createAnswer('Odpowiedź A', false),
          createAnswer('Odpowiedź B', true),
          createAnswer('Odpowiedź C', false)
        ],
        multipleCorrect: false
      },
      created_at: now,
      updated_at: now,
      z_index: 1
    };
  }

  /**
   * Create a new programming task tile
   */
  static createProgrammingTile(position: { x: number; y: number }): ProgrammingTile {
    const id = `tile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const gridPos = GridUtils.pixelToGrid(position, {
      width: GridUtils.GRID_COLUMNS,
      height: 6,
      gridSize: GridUtils.GRID_CELL_SIZE,
      snapToGrid: true
    });

    // Default to 4x3 grid size for programming tiles
    gridPos.colSpan = 4;
    gridPos.rowSpan = 3;

    const pixelPos = GridUtils.gridToPixel(gridPos, {
      width: GridUtils.GRID_COLUMNS,
      height: 6,
      gridSize: GridUtils.GRID_CELL_SIZE,
      snapToGrid: true
    });

    const pixelSize = GridUtils.gridSizeToPixel(gridPos, {
      width: GridUtils.GRID_COLUMNS,
      height: 6,
      gridSize: GridUtils.GRID_CELL_SIZE,
      snapToGrid: true
    });

    return {
      id,
      type: 'programming',
      position: pixelPos,
      size: pixelSize,
      gridPosition: gridPos,
      content: {
        description: 'Opis zadania programistycznego',
        richDescription: '<p style="margin: 0;">Opis zadania programistycznego</p>',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 16,
        backgroundColor: '#ffffff',
        showBorder: true,
        code: 'Wpisz swój kod tutaj',
        language: 'python',
        startingCode: '',
        endingCode: ''
      },
      created_at: now,
      updated_at: now,
      z_index: 1
    };
  }

  /**
   * Create a new sequencing tile
   */
  static createSequencingTile(position: { x: number; y: number }): SequencingTile {
    const id = `tile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const gridPos = GridUtils.pixelToGrid(position, {
      width: GridUtils.GRID_COLUMNS,
      height: 6,
      gridSize: GridUtils.GRID_CELL_SIZE,
      snapToGrid: true
    });

    // Default to 3x3 grid size for sequencing tiles
    gridPos.colSpan = 3;
    gridPos.rowSpan = 3;

    const pixelPos = GridUtils.gridToPixel(gridPos, {
      width: GridUtils.GRID_COLUMNS,
      height: 6,
      gridSize: GridUtils.GRID_CELL_SIZE,
      snapToGrid: true
    });

    const pixelSize = GridUtils.gridSizeToPixel(gridPos, {
      width: GridUtils.GRID_COLUMNS,
      height: 6,
      gridSize: GridUtils.GRID_CELL_SIZE,
      snapToGrid: true
    });

    return {
      id,
      type: 'sequencing',
      position: pixelPos,
      size: pixelSize,
      gridPosition: gridPos,
      content: {
        question: 'Ułóż elementy w prawidłowej kolejności',
        richQuestion: '<p style="margin: 0;">Ułóż elementy w prawidłowej kolejności</p>',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 16,
        verticalAlign: 'top',
        backgroundColor: '#ffffff',
        showBorder: true,
        items: [
          { id: 'item-1', text: 'Pierwszy element', correctPosition: 0 },
          { id: 'item-2', text: 'Drugi element', correctPosition: 1 },
          { id: 'item-3', text: 'Trzeci element', correctPosition: 2 }
        ],
        correctFeedback: 'Świetnie! Prawidłowa kolejność.',
        incorrectFeedback: 'Spróbuj ponownie. Sprawdź kolejność elementów.'
      },
      created_at: now,
      updated_at: now,
      z_index: 1
    };
  }
}