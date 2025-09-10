import { Position, Size, GridPosition, CanvasSettings } from '../types/lessonEditor';

export class GridUtils {
  static readonly GRID_COLUMNS = 6;
  static readonly GRID_CELL_SIZE = 120;
  static readonly GRID_GAP = 8;

  /**
   * Convert pixel position to grid position
   */
  static pixelToGrid(pixelPos: Position, canvasSettings: CanvasSettings): GridPosition {
    const cellWidth = canvasSettings.gridSize + GridUtils.GRID_GAP;
    const cellHeight = canvasSettings.gridSize + GridUtils.GRID_GAP;
    
    const col = Math.max(0, Math.min(
      GridUtils.GRID_COLUMNS - 1,
      Math.round(pixelPos.x / cellWidth)
    ));
    
    const row = Math.max(0, Math.round(pixelPos.y / cellHeight));
    
    return {
      col,
      row,
      colSpan: 1,
      rowSpan: 1
    };
  }

  /**
   * Convert grid position to pixel position
   */
  static gridToPixel(gridPos: GridPosition, canvasSettings: CanvasSettings): Position {
    const cellWidth = canvasSettings.gridSize + GridUtils.GRID_GAP;
    const cellHeight = canvasSettings.gridSize + GridUtils.GRID_GAP;
    
    return {
      x: gridPos.col * cellWidth,
      y: gridPos.row * cellHeight
    };
  }

  /**
   * Convert grid size to pixel size
   */
  static gridSizeToPixel(gridPos: GridPosition, canvasSettings: CanvasSettings): Size {
    const cellWidth = canvasSettings.gridSize + GridUtils.GRID_GAP;
    const cellHeight = canvasSettings.gridSize + GridUtils.GRID_GAP;
    
    return {
      width: (gridPos.colSpan * cellWidth) - GridUtils.GRID_GAP,
      height: (gridPos.rowSpan * cellHeight) - GridUtils.GRID_GAP
    };
  }

  /**
   * Convert pixel size to grid span
   */
  static pixelSizeToGrid(size: Size, canvasSettings: CanvasSettings): { colSpan: number; rowSpan: number } {
    const cellWidth = canvasSettings.gridSize + GridUtils.GRID_GAP;
    const cellHeight = canvasSettings.gridSize + GridUtils.GRID_GAP;
    
    const colSpan = Math.max(1, Math.round((size.width + GridUtils.GRID_GAP) / cellWidth));
    const rowSpan = Math.max(1, Math.round((size.height + GridUtils.GRID_GAP) / cellHeight));
    
    return { colSpan, rowSpan };
  }

  /**
   * Snap position to grid
   */
  static snapToGrid(position: Position, canvasSettings: CanvasSettings): Position {
    if (!canvasSettings.snapToGrid) return position;
    
    const gridPos = GridUtils.pixelToGrid(position, canvasSettings);
    return GridUtils.gridToPixel(gridPos, canvasSettings);
  }

  /**
   * Check if grid position is valid (within bounds and not overlapping)
   */
  static isValidGridPosition(
    gridPos: GridPosition, 
    canvasSettings: CanvasSettings,
    existingTiles: any[] = [],
    excludeTileId?: string
  ): boolean {
    // Check bounds
    if (gridPos.col < 0 || gridPos.row < 0) return false;
    if (gridPos.col + gridPos.colSpan > GridUtils.GRID_COLUMNS) return false;
    
    // Check for overlaps with existing tiles
    for (const tile of existingTiles) {
      if (excludeTileId && tile.id === excludeTileId) continue;
      
      const tileGridPos = tile.gridPosition;
      
      // Check if rectangles overlap
      if (!(
        gridPos.col >= tileGridPos.col + tileGridPos.colSpan ||
        gridPos.col + gridPos.colSpan <= tileGridPos.col ||
        gridPos.row >= tileGridPos.row + tileGridPos.rowSpan ||
        gridPos.row + gridPos.rowSpan <= tileGridPos.row
      )) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Find next available grid position
   */
  static findNextAvailablePosition(
    desiredPos: GridPosition,
    canvasSettings: CanvasSettings,
    existingTiles: any[]
  ): GridPosition {
    // Try the desired position first
    if (GridUtils.isValidGridPosition(desiredPos, canvasSettings, existingTiles)) {
      return desiredPos;
    }

    // Search for next available position
    for (let row = 0; row < 50; row++) { // Reasonable limit
      for (let col = 0; col <= GridUtils.GRID_COLUMNS - desiredPos.colSpan; col++) {
        const testPos = {
          ...desiredPos,
          col,
          row
        };
        
        if (GridUtils.isValidGridPosition(testPos, canvasSettings, existingTiles)) {
          return testPos;
        }
      }
    }

    // Fallback to bottom of canvas
    return {
      ...desiredPos,
      col: 0,
      row: Math.max(0, ...existingTiles.map(t => t.gridPosition.row + t.gridPosition.rowSpan))
    };
  }

  /**
   * Calculate required canvas height based on tiles
   */
  static calculateCanvasHeight(tiles: any[]): number {
    if (tiles.length === 0) return 6; // Minimum height
    
    const maxRow = Math.max(...tiles.map(tile => 
      tile.gridPosition.row + tile.gridPosition.rowSpan
    ));
    
    return Math.max(6, maxRow + 2); // Add some padding
  }

  /**
   * Get resize handles for a tile
   */
  static getResizeHandles(gridPos: GridPosition): Array<{
    handle: string;
    position: { x: number; y: number };
    cursor: string;
  }> {
    const handles = [
      { handle: 'nw', position: { x: 0, y: 0 }, cursor: 'nw-resize' },
      { handle: 'ne', position: { x: 1, y: 0 }, cursor: 'ne-resize' },
      { handle: 'sw', position: { x: 0, y: 1 }, cursor: 'sw-resize' },
      { handle: 'se', position: { x: 1, y: 1 }, cursor: 'se-resize' },
      { handle: 'n', position: { x: 0.5, y: 0 }, cursor: 'n-resize' },
      { handle: 's', position: { x: 0.5, y: 1 }, cursor: 's-resize' },
      { handle: 'w', position: { x: 0, y: 0.5 }, cursor: 'w-resize' },
      { handle: 'e', position: { x: 1, y: 0.5 }, cursor: 'e-resize' }
    ];

    return handles;
  }
}