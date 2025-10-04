import { Dispatch, useCallback, useEffect, useMemo, useState } from 'react';
import { LessonContentService } from '../services/lessonContentService';
import {
  Lesson,
  LessonTile,
  ProgrammingTile,
  SequencingTile,
  TextTile,
  OpenTile,
  PairingTile,
  EditorState,
  BlanksTile,
  migrateTileConfig
} from 'tiles-core';
import { GridUtils } from '../utils/gridUtils';
import { logger } from '../utils/logger';
import { EditorAction } from '../state/editorReducer';

type TileFactory = (position: { x: number; y: number }, page: number) => LessonTile;

const tileFactoryMap: Partial<Record<LessonTile['type'], TileFactory>> = {
  text: (position, page) => LessonContentService.createTextTile(position, page),
  image: (position, page) => LessonContentService.createImageTile(position, page),
  visualization: (position, page) => LessonContentService.createVisualizationTile(position, page),
  quiz: (position, page) => LessonContentService.createQuizTile(position, page),
  programming: (position, page) => LessonContentService.createProgrammingTile(position, page),
  sequencing: (position, page) => LessonContentService.createSequencingTile(position, page),
  blanks: (position, page) => LessonContentService.createBlanksTile(position, page),
  open: (position, page) => LessonContentService.createOpenTile(position, page),
  pairing: (position, page) => LessonContentService.createPairingTile(position, page)
};

const isRichTextTile = (
  tile: LessonTile | null
): tile is TextTile | ProgrammingTile | SequencingTile | BlanksTile | OpenTile | PairingTile => {
  return (
    !!tile &&
    (
      tile.type === 'text' ||
      tile.type === 'programming' ||
      tile.type === 'sequencing' ||
      tile.type === 'blanks' ||
      tile.type === 'open' ||
      tile.type === 'pairing'
    )
  );
};

interface NotificationHandlers {
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

interface UseLessonContentManagerOptions {
  lessonId: string;
  editorState: EditorState;
  dispatch: Dispatch<EditorAction>;
  notifications: NotificationHandlers;
}

export const useLessonContentManager = ({
  lessonId,
  editorState,
  dispatch,
  notifications
}: UseLessonContentManagerOptions) => {
  const { success, error, warning } = notifications;

  const [lessonContent, setLessonContent] = useState<Lesson | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [testingTileIds, setTestingTileIds] = useState<string[]>([]);

  const normalizeTilePage = useCallback((tile: LessonTile): LessonTile => ({
    ...tile,
    page: tile.page ?? 1
  }), []);

  const getMaxPageFromTiles = useCallback((tiles: LessonTile[]): number => {
    if (!tiles.length) return 1;
    return Math.max(1, ...tiles.map(tile => tile.page ?? 1));
  }, []);

  const getTilesForPage = useCallback((tiles: LessonTile[], page: number): LessonTile[] => {
    return tiles.filter(tile => (tile.page ?? 1) === page);
  }, []);

  const computeMaxCanvasHeight = useCallback(
    (tiles: LessonTile[], totalPages: number): number => {
      const pages = Math.max(totalPages, getMaxPageFromTiles(tiles));
      let maxHeight = 6;
      for (let page = 1; page <= pages; page++) {
        const pageTiles = tiles.filter(tile => (tile.page ?? 1) === page);
        maxHeight = Math.max(maxHeight, GridUtils.calculateCanvasHeight(pageTiles));
      }
      return maxHeight;
    },
    [getMaxPageFromTiles]
  );

  const loadLessonContent = useCallback(async () => {
    try {
      setIsLoading(true);
      const content = await LessonContentService.getLessonContent(lessonId);

      if (!content) {
        error('Błąd ładowania', 'Nie udało się załadować zawartości lekcji');
        return;
      }

      const migratedTiles = content.tiles.map(migrateTileConfig);
      const normalizedTiles = migratedTiles.map(normalizeTilePage);
      const totalPages = Math.max(content.total_pages ?? 1, getMaxPageFromTiles(normalizedTiles));
      const normalizedContent: Lesson = {
        ...content,
        tiles: normalizedTiles,
        total_pages: totalPages,
        canvas_settings: {
          ...content.canvas_settings,
          height: computeMaxCanvasHeight(normalizedTiles, totalPages)
        }
      };

      setLessonContent(normalizedContent);
      setCurrentPage(1);
      setTestingTileIds([]);
      logger.info(`Loaded lesson content with ${normalizedTiles.length} tiles across ${totalPages} pages`);
    } catch (err) {
      logger.error('Failed to load lesson content:', err);
      error('Błąd ładowania', 'Wystąpił błąd podczas ładowania zawartości lekcji');
    } finally {
      setIsLoading(false);
    }
  }, [lessonId, error, normalizeTilePage, getMaxPageFromTiles, computeMaxCanvasHeight]);

  useEffect(() => {
    void loadLessonContent();
  }, [loadLessonContent]);

  useEffect(() => {
    if (!lessonContent) return;
    const maxPage = Math.max(1, lessonContent.total_pages);
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [lessonContent, currentPage]);

  const saveLessonContent = useCallback(
    async (showNotification = true) => {
      if (!lessonContent) return;

      try {
        setIsSaving(true);
        await LessonContentService.saveLessonContent(lessonContent);
        dispatch({ type: 'clearUnsaved' });

        if (showNotification) {
          success('Zapisano', 'Zawartość lekcji została zapisana');
        }

        logger.info('Lesson content saved successfully');
      } catch (err) {
        logger.error('Failed to save lesson content:', err);
        error('Błąd zapisu', 'Nie udało się zapisać zawartości lekcji');
      } finally {
        setIsSaving(false);
      }
    },
    [lessonContent, dispatch, success, error]
  );

  useEffect(() => {
    if (!editorState.hasUnsavedChanges || !lessonContent) {
      return;
    }

    const autoSaveTimer = setTimeout(() => {
      void saveLessonContent(false);
    }, 5000);

    return () => clearTimeout(autoSaveTimer);
  }, [editorState.hasUnsavedChanges, lessonContent, saveLessonContent]);

  const addTile = useCallback(
    (tileType: string, position: { x: number; y: number }) => {
      const factory = tileFactoryMap[tileType as LessonTile['type']];
      if (!factory) {
        logger.warn(`Tile type ${tileType} not implemented yet`);
        warning('Funkcja niedostępna', `Typ kafelka "${tileType}" nie jest jeszcze dostępny`);
        return;
      }

      const newTile = factory(position, currentPage);

      let addedTile = false;

      setLessonContent(prev => {
        if (!prev) {
          return prev;
        }

        const pageTiles = getTilesForPage(prev.tiles, currentPage);
        const availableGridPos = GridUtils.findNextAvailablePosition(
          newTile.gridPosition,
          prev.canvas_settings,
          pageTiles
        );

        const finalPixelPos = GridUtils.gridToPixel(availableGridPos, prev.canvas_settings);
        const finalPixelSize = GridUtils.gridSizeToPixel(availableGridPos, prev.canvas_settings);

        newTile.gridPosition = availableGridPos;
        newTile.position = finalPixelPos;
        newTile.size = finalPixelSize;

        const updatedTiles = [...prev.tiles, newTile];
        const totalPages = Math.max(prev.total_pages, currentPage);
        const maxHeight = computeMaxCanvasHeight(updatedTiles, totalPages);

        const updatedContent: Lesson = {
          ...prev,
          tiles: updatedTiles,
          total_pages: totalPages,
          canvas_settings: {
            ...prev.canvas_settings,
            height: maxHeight
          },
          updated_at: new Date().toISOString()
        };

        addedTile = true;

        return updatedContent;
      });

      if (!addedTile) {
        return;
      }

      dispatch({ type: 'markUnsaved' });
      dispatch({ type: 'selectTile', tileId: newTile.id });
      logger.info(`Added new ${tileType} tile to lesson`);
    },
    [currentPage, getTilesForPage, computeMaxCanvasHeight, dispatch, warning]
  );

  const updateTile = useCallback(
    (tileId: string, updates: Partial<LessonTile>) => {
      let wasUpdated = false;

      setLessonContent(prev => {
        if (!prev) {
          return prev;
        }

        const updatedTiles = prev.tiles.map(tile => {
          if (tile.id !== tileId) {
            return tile;
          }

          wasUpdated = true;
          const updatedTile: LessonTile = {
            ...tile,
            ...updates,
            updated_at: updates.updated_at || new Date().toISOString()
          };

          if (
            (
              tile.type === 'text' ||
              tile.type === 'programming' ||
              tile.type === 'sequencing' ||
              tile.type === 'blanks' ||
              tile.type === 'open' ||
              tile.type === 'pairing'
            ) &&
            updates.content
          ) {
            updatedTile.content = {
              ...tile.content,
              ...updates.content
            };
          }

          return updatedTile;
        });

        const pagesFromTiles = getMaxPageFromTiles(updatedTiles);
        const totalPages = Math.max(prev.total_pages, pagesFromTiles);
        const maxHeight = computeMaxCanvasHeight(updatedTiles, totalPages);

        return {
          ...prev,
          tiles: updatedTiles,
          total_pages: totalPages,
          canvas_settings: {
            ...prev.canvas_settings,
            height: maxHeight
          },
          updated_at: new Date().toISOString()
        };
      });

      if (!wasUpdated) {
        return;
      }

      dispatch({ type: 'markUnsaved' });
    },
    [computeMaxCanvasHeight, getMaxPageFromTiles, dispatch]
  );

  const toggleTestingTile = useCallback((tileId: string) => {
    setTestingTileIds(prev =>
      prev.includes(tileId) ? prev.filter(id => id !== tileId) : [...prev, tileId]
    );
  }, []);

  const deleteTile = useCallback(
    (tileId: string) => {
      let removedTileExists = false;

      setLessonContent(prev => {
        if (!prev) {
          return prev;
        }

        const tile = prev.tiles.find(t => t.id === tileId);
        if (!tile) {
          return prev;
        }

        removedTileExists = true;

        const updatedTiles = prev.tiles.filter(t => t.id !== tileId);
        const maxHeight = computeMaxCanvasHeight(updatedTiles, prev.total_pages);

        return {
          ...prev,
          tiles: updatedTiles,
          canvas_settings: {
            ...prev.canvas_settings,
            height: maxHeight
          },
          updated_at: new Date().toISOString()
        };
      });

      if (!removedTileExists) {
        return;
      }

      setTestingTileIds(prev => prev.filter(id => id !== tileId));

      dispatch({ type: 'markUnsaved' });
      if (editorState.selectedTileId === tileId) {
        dispatch({ type: 'selectTile', tileId: null });
        dispatch({ type: 'stopEditing' });
      }

      success('Kafelek usunięty', 'Kafelek został pomyślnie usunięty');
    },
    [computeMaxCanvasHeight, dispatch, editorState.selectedTileId, success]
  );

  const addPage = useCallback(() => {
    let newTotal = 0;

    setLessonContent(prev => {
      if (!prev) {
        return prev;
      }

      newTotal = (prev.total_pages ?? 1) + 1;
      const maxHeight = computeMaxCanvasHeight(prev.tiles, newTotal);

      return {
        ...prev,
        total_pages: newTotal,
        canvas_settings: {
          ...prev.canvas_settings,
          height: maxHeight
        },
        updated_at: new Date().toISOString()
      };
    });

    if (!newTotal) {
      return 0;
    }

    setCurrentPage(newTotal);
    dispatch({ type: 'selectTile', tileId: null });
    dispatch({ type: 'stopEditing' });
    dispatch({ type: 'markUnsaved' });

    return newTotal;
  }, [computeMaxCanvasHeight, dispatch]);

  const deletePage = useCallback(
    (pageToDelete: number) => {
      let operationResult = { nextPage: 0, totalPages: 0 };
      let filteredTiles: LessonTile[] = [];
      let deleted = false;

      setLessonContent(prev => {
        if (!prev) {
          return prev;
        }

        if (prev.total_pages <= 1) {
          operationResult = { nextPage: prev.total_pages, totalPages: prev.total_pages };
          return prev;
        }

        deleted = true;
        filteredTiles = prev.tiles
          .filter(tile => tile.page !== pageToDelete)
          .map(tile => (tile.page > pageToDelete ? { ...tile, page: tile.page - 1 } : tile));

        const newTotalPages = Math.max(1, prev.total_pages - 1);
        const maxHeight = computeMaxCanvasHeight(filteredTiles, newTotalPages);

        const nextPage = Math.min(pageToDelete, newTotalPages);
        operationResult = { nextPage, totalPages: newTotalPages };

        return {
          ...prev,
          tiles: filteredTiles,
          total_pages: newTotalPages,
          canvas_settings: {
            ...prev.canvas_settings,
            height: maxHeight
          },
          updated_at: new Date().toISOString()
        };
      });

      if (!deleted) {
        return operationResult.totalPages;
      }

      setCurrentPage(operationResult.nextPage);
      setTestingTileIds(prev => prev.filter(id => filteredTiles.some(tile => tile.id === id)));

      dispatch({ type: 'selectTile', tileId: null });
      dispatch({ type: 'stopEditing' });
      dispatch({ type: 'markUnsaved' });

      success('Strona usunięta', `Strona ${pageToDelete} została usunięta.`);

      return operationResult.nextPage;
    },
    [computeMaxCanvasHeight, dispatch, success]
  );

  const changePage = useCallback(
    (page: number) => {
      if (!lessonContent) return false;

      const maxPage = Math.max(1, lessonContent.total_pages);
      const nextPage = Math.min(Math.max(1, page), maxPage);
      if (nextPage === currentPage) {
        return false;
      }

      setCurrentPage(nextPage);
      dispatch({ type: 'selectTile', tileId: null });
      dispatch({ type: 'stopEditing' });
      return true;
    },
    [lessonContent, currentPage, dispatch]
  );

  const clearCanvas = useCallback(() => {
    let hadTiles = false;

    setLessonContent(prev => {
      if (!prev || prev.tiles.length === 0) {
        return prev;
      }

      hadTiles = true;

      return {
        ...prev,
        tiles: [],
        canvas_settings: {
          ...prev.canvas_settings,
          height: computeMaxCanvasHeight([], prev.total_pages)
        },
        updated_at: new Date().toISOString()
      };
    });

    if (!hadTiles) {
      return false;
    }

    setTestingTileIds([]);
    dispatch({ type: 'markUnsaved' });
    dispatch({ type: 'selectTile', tileId: null });
    dispatch({ type: 'stopEditing' });

    success('Płótno wyczyszczone', 'Wszystkie kafelki zostały usunięte');
    return true;
  }, [computeMaxCanvasHeight, dispatch, success]);

  const totalPages = useMemo(() => Math.max(1, lessonContent?.total_pages ?? 1), [lessonContent]);

  const safePage = useMemo(() => {
    return Math.min(Math.max(1, currentPage), totalPages);
  }, [currentPage, totalPages]);

  const pageTiles = useMemo(() => {
    if (!lessonContent) return [] as LessonTile[];
    return getTilesForPage(lessonContent.tiles, safePage);
  }, [lessonContent, getTilesForPage, safePage]);

  const pagedCanvasSettings = useMemo(() => {
    if (!lessonContent) return null;
    return {
      ...lessonContent.canvas_settings,
      height: GridUtils.calculateCanvasHeight(pageTiles)
    };
  }, [lessonContent, pageTiles]);

  const pagedContent = useMemo(() => {
    if (!lessonContent || !pagedCanvasSettings) return null;
    return {
      ...lessonContent,
      tiles: pageTiles,
      canvas_settings: pagedCanvasSettings,
      total_pages: lessonContent.total_pages
    };
  }, [lessonContent, pageTiles, pagedCanvasSettings]);

  const selectedTileGlobal = useMemo(() => {
    if (!lessonContent || !editorState.selectedTileId) return null;
    return lessonContent.tiles.find(t => t.id === editorState.selectedTileId) ?? null;
  }, [lessonContent, editorState.selectedTileId]);

  const selectedTile = useMemo(() => {
    if (!selectedTileGlobal) return undefined;
    return selectedTileGlobal.page === safePage ? selectedTileGlobal : undefined;
  }, [selectedTileGlobal, safePage]);

  const selectedRichTextTile = useMemo(() => {
    return isRichTextTile(selectedTile ?? null) ? selectedTile : null;
  }, [selectedTile]);

  return {
    lessonContent,
    isLoading,
    isSaving,
    totalPages,
    safePage,
    currentPage,
    pagedContent,
    selectedTile,
    selectedRichTextTile,
    testingTileIds,
    addTile,
    updateTile,
    deleteTile,
    toggleTestingTile,
    addPage,
    deletePage,
    changePage,
    clearCanvas,
    saveLessonContent,
    loadLessonContent
  };
};
