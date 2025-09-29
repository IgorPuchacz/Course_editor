import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, RotateCcw, Grid, Edit } from 'lucide-react';
import { Lesson, Course } from '../types/course.ts';
import { LessonContent, LessonTile, ProgrammingTile, TextTile, FillBlanksTile } from '../types/lessonEditor.ts';
import { SequencingTile } from '../types/lessonEditor.ts';
import { useLessonEditor } from '../hooks/useLessonEditor.ts';
import { LessonContentService } from '../services/lessonContentService.ts';
import { TilePalette } from '../components/admin/side editor/TilePalette.tsx';
import { LessonCanvas } from '../components/admin/LessonCanvas.tsx';
import { TileSideEditor } from '../components/admin/side editor/TileSideEditor.tsx';
import { TopToolbar } from '../components/admin/top editor/TopToolbar.tsx';
import { Editor } from '@tiptap/react';
import { ToastContainer } from '../components/common/Toast.tsx';
import { useToast } from '../hooks/useToast.ts';
import { ConfirmDialog } from '../components/common/ConfirmDialog.tsx';
import { LoadingSpinner } from '../components/common/LoadingSpinner.tsx';
import { GridUtils } from '../utils/gridUtils.ts';
import { logger } from '../utils/logger.ts';
import { PageNavigator } from '../components/admin/PageNavigator.tsx';

interface LessonEditorProps {
  lesson: Lesson;
  course: Course;
  onBack: () => void;
}

const isRichTextTile = (
  tile: LessonTile | null
): tile is TextTile | ProgrammingTile | SequencingTile | FillBlanksTile => {
  return !!tile && (
    tile.type === 'text' ||
    tile.type === 'programming' ||
    tile.type === 'sequencing' ||
    tile.type === 'fillBlanks'
  );
};

export const LessonEditor: React.FC<LessonEditorProps> = ({ lesson, course, onBack }) => {
  const { toasts, removeToast, success, error, warning } = useToast();
  const canvasRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Core state
  const [lessonContent, setLessonContent] = useState<LessonContent | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(64);
  const [toolbarHeight, setToolbarHeight] = useState(0);

  const { editorState, dispatch } = useLessonEditor();
  const [activeEditor, setActiveEditor] = useState<Editor | null>(null);
  const [testingTileIds, setTestingTileIds] = useState<string[]>([]);

  const normalizeTilePage = (tile: LessonTile): LessonTile => ({
    ...tile,
    page: tile.page ?? 1
  });

  const getMaxPageFromTiles = (tiles: LessonTile[]): number => {
    if (!tiles.length) return 1;
    return Math.max(1, ...tiles.map(tile => tile.page ?? 1));
  };

  const computeMaxCanvasHeight = (tiles: LessonTile[], totalPages: number): number => {
    const pages = Math.max(totalPages, getMaxPageFromTiles(tiles));
    let maxHeight = 6;
    for (let page = 1; page <= pages; page++) {
      const pageTiles = tiles.filter(tile => (tile.page ?? 1) === page);
      maxHeight = Math.max(maxHeight, GridUtils.calculateCanvasHeight(pageTiles));
    }
    return maxHeight;
  };

  const getTilesForPage = (tiles: LessonTile[], page: number): LessonTile[] => {
    return tiles.filter(tile => (tile.page ?? 1) === page);
  };

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Load lesson content on mount
  useEffect(() => {
    loadLessonContent();
  }, [lesson.id]);

  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
    };

    const headerElement = headerRef.current;
    if (!headerElement) {
      return;
    }

    updateHeaderHeight();

    let resizeObserver: ResizeObserver | null = null;

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateHeaderHeight();
      });

      resizeObserver.observe(headerElement);
    }

    window.addEventListener('resize', updateHeaderHeight);

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, []);

  useEffect(() => {
    const updateToolbarHeight = () => {
      if (toolbarRef.current) {
        setToolbarHeight(toolbarRef.current.offsetHeight);
      }
    };

    updateToolbarHeight();

    const toolbarElement = toolbarRef.current;
    if (!toolbarElement) {
      return;
    }

    let resizeObserver: ResizeObserver | null = null;

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateToolbarHeight();
      });

      resizeObserver.observe(toolbarElement);
    }

    window.addEventListener('resize', updateToolbarHeight);

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', updateToolbarHeight);
    };
  }, []);

  useEffect(() => {
    if (!lessonContent) return;
    const maxPage = Math.max(1, lessonContent.total_pages);
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [lessonContent, currentPage]);

  // Auto-save functionality
  useEffect(() => {
    if (editorState.hasUnsavedChanges && lessonContent) {
      const autoSaveTimer = setTimeout(() => {
        handleSave(false); // Silent auto-save
      }, 5000);

      return () => clearTimeout(autoSaveTimer);
    }
  }, [editorState.hasUnsavedChanges, lessonContent]);

  const loadLessonContent = async () => {
    try {
      setIsLoading(true);
      const content = await LessonContentService.getLessonContent(lesson.id);

      if (content) {
        const normalizedTiles = content.tiles.map(normalizeTilePage);
        const totalPages = Math.max(content.total_pages ?? 1, getMaxPageFromTiles(normalizedTiles));
        const normalizedContent: LessonContent = {
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
        logger.info(`Loaded lesson content with ${normalizedTiles.length} tiles across ${totalPages} pages`);
      } else {
        error('Błąd ładowania', 'Nie udało się załadować zawartości lekcji');
      }
    } catch (err) {
      logger.error('Failed to load lesson content:', err);
      error('Błąd ładowania', 'Wystąpił błąd podczas ładowania zawartości lekcji');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (showNotification = true) => {
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
  };

  const handleAddTile = (tileType: string, position: { x: number; y: number }) => {
    if (!lessonContent) return;

    let newTile: LessonTile | null = null;

    switch (tileType) {
      case 'text':
        newTile = LessonContentService.createTextTile(position, currentPage);
        break;
      case 'image':
        newTile = LessonContentService.createImageTile(position, currentPage);
        break;
      case 'visualization':
        newTile = LessonContentService.createVisualizationTile(position, currentPage);
        break;
      case 'quiz':
        newTile = LessonContentService.createQuizTile(position, currentPage);
        break;
      case 'programming':
        newTile = LessonContentService.createProgrammingTile(position, currentPage);
        break;
      case 'sequencing':
        newTile = LessonContentService.createSequencingTile(position, currentPage);
        break;
      case 'fillBlanks':
        newTile = LessonContentService.createFillBlanksTile(position, currentPage);
        break;
      default:
        logger.warn(`Tile type ${tileType} not implemented yet`);
        warning('Funkcja niedostępna', `Typ kafelka "${tileType}" nie jest jeszcze dostępny`);
        return;
    }

    if (!newTile) return;

    // Find available position using grid system
    const pageTiles = getTilesForPage(lessonContent.tiles, currentPage);
    const availableGridPos = GridUtils.findNextAvailablePosition(
      newTile.gridPosition,
      lessonContent.canvas_settings,
      pageTiles
    );
    
    // Update tile with available position
    const finalPixelPos = GridUtils.gridToPixel(availableGridPos, lessonContent.canvas_settings);
    const finalPixelSize = GridUtils.gridSizeToPixel(availableGridPos, lessonContent.canvas_settings);
    
    newTile.gridPosition = availableGridPos;
    newTile.position = finalPixelPos;
    newTile.size = finalPixelSize;

    const updatedTiles = [...lessonContent.tiles, newTile];
    const totalPages = Math.max(lessonContent.total_pages, currentPage);
    const maxHeight = computeMaxCanvasHeight(updatedTiles, totalPages);

    const updatedContent = {
      ...lessonContent,
      tiles: updatedTiles,
      total_pages: totalPages,
      canvas_settings: {
        ...lessonContent.canvas_settings,
        height: maxHeight
      },
      updated_at: new Date().toISOString()
    };

    setLessonContent(updatedContent);
    dispatch({ type: 'markUnsaved' });
    dispatch({ type: 'selectTile', tileId: newTile.id });

    logger.info(`Added new ${tileType} tile to lesson`);
  };

  const handleUpdateTile = (tileId: string, updates: Partial<LessonTile>) => {
    if (!lessonContent) return;

    console.log('Updating tile:', tileId, 'with updates:', updates);

    const updatedTiles = lessonContent.tiles.map(tile => {
      if (tile.id === tileId) {
        const updatedTile = {
          ...tile,
          ...updates,
          updated_at: updates.updated_at || new Date().toISOString()
        };

        // Special handling for text-based tiles to ensure content properties are merged
        if (
          (
            tile.type === 'text' ||
            tile.type === 'programming' ||
            tile.type === 'sequencing' ||
            tile.type === 'fillBlanks'
          ) &&
          updates.content
        ) {
          updatedTile.content = {
            ...tile.content,
            ...updates.content
          };
        }

        return updatedTile;
      }
      return tile;
    });

    console.log('Updated tiles:', updatedTiles.find(t => t.id === tileId));

    const pagesFromTiles = getMaxPageFromTiles(updatedTiles);
    const totalPages = Math.max(lessonContent.total_pages, pagesFromTiles);
    const maxHeight = computeMaxCanvasHeight(updatedTiles, totalPages);

    const newContent = {
      ...lessonContent,
      tiles: updatedTiles,
      total_pages: totalPages,
      canvas_settings: {
        ...lessonContent.canvas_settings,
        height: maxHeight
      },
      updated_at: new Date().toISOString()
    };
    
    setLessonContent(newContent);

    dispatch({ type: 'markUnsaved' });
  };

  const handleToggleTestingTile = (tileId: string) => {
    setTestingTileIds(prev =>
      prev.includes(tileId) ? prev.filter(id => id !== tileId) : [...prev, tileId]
    );
  };

  const handleDeleteTile = (tileId: string) => {
    if (!lessonContent) return;

    const tile = lessonContent.tiles.find(t => t.id === tileId);
    if (!tile) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Usuń kafelek',
      message: `Czy na pewno chcesz usunąć ten kafelek? Ta operacja jest nieodwracalna.`,
      onConfirm: () => {
        const updatedTiles = lessonContent.tiles.filter(t => t.id !== tileId);

        const maxHeight = computeMaxCanvasHeight(updatedTiles, lessonContent.total_pages);

        setLessonContent({
          ...lessonContent,
          tiles: updatedTiles,
          canvas_settings: {
            ...lessonContent.canvas_settings,
            height: maxHeight
          },
          updated_at: new Date().toISOString()
        });

        setTestingTileIds(prev => prev.filter(id => id !== tileId));

        dispatch({ type: 'markUnsaved' });
        if (editorState.selectedTileId === tileId) {
          dispatch({ type: 'selectTile', tileId: null });
          dispatch({ type: 'stopEditing' });
        }

        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        success('Kafelek usunięty', 'Kafelek został pomyślnie usunięty');
      }
    });
  };

  const handleSelectTile = (tileId: string | null) => {
    dispatch({ type: 'selectTile', tileId });
  };

  const handleFinishTextEditing = () => {
    dispatch({ type: 'stopEditing' });
    setActiveEditor(null);
  };

  const handleToggleGrid = () => {
    dispatch({ type: 'toggleGrid' });
  };

  const handleAddPage = () => {
    if (!lessonContent) return;

    const newTotal = (lessonContent.total_pages ?? 1) + 1;
    const maxHeight = computeMaxCanvasHeight(lessonContent.tiles, newTotal);
    const updatedContent: LessonContent = {
      ...lessonContent,
      total_pages: newTotal,
      canvas_settings: {
        ...lessonContent.canvas_settings,
        height: maxHeight
      },
      updated_at: new Date().toISOString()
    };

    setLessonContent(updatedContent);
    setCurrentPage(newTotal);
    setActiveEditor(null);
    dispatch({ type: 'selectTile', tileId: null });
    dispatch({ type: 'stopEditing' });
    dispatch({ type: 'markUnsaved' });
  };

  const handleDeletePage = () => {
    if (!lessonContent) return;
    if (lessonContent.total_pages <= 1) return;

    const pageToDelete = currentPage;
    const contentSnapshot = lessonContent;

    setConfirmDialog({
      isOpen: true,
      title: 'Usuń stronę',
      message: `Czy na pewno chcesz usunąć stronę ${pageToDelete}? Wszystkie kafelki na tej stronie zostaną usunięte, a układ kolejnych stron zostanie zaktualizowany.`,
      onConfirm: () => {
        if (!contentSnapshot) return;

        const filteredTiles = contentSnapshot.tiles
          .filter(tile => tile.page !== pageToDelete)
          .map(tile => (tile.page > pageToDelete ? { ...tile, page: tile.page - 1 } : tile));

        const newTotalPages = Math.max(1, contentSnapshot.total_pages - 1);
        const maxHeight = computeMaxCanvasHeight(filteredTiles, newTotalPages);

        const updatedContent: LessonContent = {
          ...contentSnapshot,
          tiles: filteredTiles,
          total_pages: newTotalPages,
          canvas_settings: {
            ...contentSnapshot.canvas_settings,
            height: maxHeight
          },
          updated_at: new Date().toISOString()
        };

        setLessonContent(updatedContent);

        const nextPage = Math.min(pageToDelete, newTotalPages);
        setCurrentPage(nextPage);
        setActiveEditor(null);
        setTestingTileIds(prev => prev.filter(id => filteredTiles.some(tile => tile.id === id)));
        dispatch({ type: 'selectTile', tileId: null });
        dispatch({ type: 'stopEditing' });
        dispatch({ type: 'markUnsaved' });

        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        success('Strona usunięta', `Strona ${pageToDelete} została usunięta.`);
      }
    });
  };

  const handlePageChange = (page: number) => {
    if (!lessonContent) return;

    const maxPage = Math.max(1, lessonContent.total_pages);
    const nextPage = Math.min(Math.max(1, page), maxPage);
    if (nextPage === currentPage) {
      return;
    }

    setCurrentPage(nextPage);
    setActiveEditor(null);
    dispatch({ type: 'selectTile', tileId: null });
    dispatch({ type: 'stopEditing' });
  };

  const handleBackWithConfirmation = () => {
    if (editorState.hasUnsavedChanges) {
      setConfirmDialog({
        isOpen: true,
        title: 'Niezapisane zmiany',
        message: 'Masz niezapisane zmiany. Czy chcesz je zapisać przed wyjściem?',
        onConfirm: async () => {
          await handleSave();
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          onBack();
        }
      });
    } else {
      onBack();
    }
  };

  const handleClearCanvas = () => {
    if (!lessonContent || lessonContent.tiles.length === 0) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Wyczyść płótno',
      message: 'Czy na pewno chcesz usunąć wszystkie kafelki z płótna? Ta operacja jest nieodwracalna.',
      onConfirm: () => {
        setLessonContent({
          ...lessonContent!,
          tiles: [],
          canvas_settings: {
            ...lessonContent.canvas_settings,
            height: computeMaxCanvasHeight([], lessonContent.total_pages)
          },
          updated_at: new Date().toISOString()
        });

        setTestingTileIds([]);

        dispatch({ type: 'markUnsaved' });
        dispatch({ type: 'selectTile', tileId: null });
        dispatch({ type: 'stopEditing' });

        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        success('Płótno wyczyszczone', 'Wszystkie kafelki zostały usunięte');
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Ładowanie edytora lekcji..." />
      </div>
    );
  }

  if (!lessonContent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Edit className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Błąd ładowania</h2>
          <p className="text-gray-600 mb-6">Nie udało się załadować zawartości lekcji</p>
          <button
            onClick={onBack}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Powrót
          </button>
        </div>
      </div>
    );
  }

  const totalPages = Math.max(1, lessonContent.total_pages);
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const pageTiles = getTilesForPage(lessonContent.tiles, safePage);
  const pagedCanvasSettings = {
    ...lessonContent.canvas_settings,
    height: GridUtils.calculateCanvasHeight(pageTiles)
  };
  const pagedContent: LessonContent = {
    ...lessonContent,
    tiles: pageTiles,
    canvas_settings: pagedCanvasSettings,
    total_pages: lessonContent.total_pages
  };

  const selectedTileGlobal = lessonContent.tiles.find(t => t.id === editorState.selectedTileId) || null;
  const selectedTile = selectedTileGlobal && selectedTileGlobal.page === safePage ? selectedTileGlobal : undefined;
  const selectedRichTextTile = isRichTextTile(selectedTile ?? null) ? selectedTile : null;

  const toastOffset = headerHeight + toolbarHeight + 16;

  return (
    <div className="h-screen bg-gray-50 flex flex-col max-w-full">
      <ToastContainer toasts={toasts} onClose={removeToast} topOffset={toastOffset} />
      
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Potwierdź"
        cancelText="Anuluj"
        type="warning"
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Header */}
      <div ref={headerRef} className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 lg:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackWithConfirmation}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Powrót</span>
              </button>
              
              <div className="h-6 w-px bg-gray-300"></div>
              
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{lesson.title}</h1>
                <p className="text-sm text-gray-600 hidden sm:block">{course.title}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 lg:space-x-4">
              {editorState.hasUnsavedChanges && (
                <span className="text-xs lg:text-sm text-orange-600 font-medium hidden sm:block">
                  Niezapisane zmiany
                </span>
              )}
              
              <div className="flex items-center space-x-1 lg:space-x-2">
                {/* Grid Toggle */}
                <button
                  onClick={handleToggleGrid}
                  className={`p-2 rounded-lg transition-colors ${
                    editorState.showGrid 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                  title="Przełącz siatkę"
                >
                  <Grid className="w-4 h-4" />
                </button>
                
                <button
                  onClick={handleClearCanvas}
                  disabled={!lessonContent.tiles.length}
                  className="p-2 text-gray-600 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed hidden sm:block"
                  title="Wyczyść płótno"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
                
                <button
                  onClick={() => handleSave(true)}
                  disabled={isSaving || !editorState.hasUnsavedChanges}
                  className="bg-blue-600 text-white px-3 lg:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 lg:space-x-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="hidden sm:inline">Zapisywanie...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span className="hidden sm:inline">Zapisz</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 flex min-h-0">
        {/* Context-Sensitive Left Panel */}
        <div className="w-64 lg:w-80 bg-white shadow-lg border-r border-gray-200 flex-shrink-0 transition-all duration-300 flex flex-col overflow-hidden">
          {selectedTile ? (
            // Editing Panel - when tile is selected on the active page
            <div className="h-full">
              <TileSideEditor
                tile={selectedTile}
                onUpdateTile={handleUpdateTile}
                onSelectTile={handleSelectTile}
                isTesting={testingTileIds.includes(selectedTile.id)}
                onToggleTesting={handleToggleTestingTile}
              />
            </div>
          ) : (
            // Tile Palette - when no tile is selected on the active page
            <div className="h-full">
              <TilePalette
                onAddTile={handleAddTile}
                selectedTileId={editorState.selectedTileId}
              />
            </div>
          )}
        </div>

        {/* Expanded Canvas Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div
            ref={toolbarRef}
            className="sticky z-40 bg-white border-b border-gray-200"
            style={{ top: headerHeight }}
          >
            <TopToolbar
              key={`toolbar-${editorState.mode}-${editorState.selectedTileId}`}
              tilesCount={pageTiles.length}
              gridColumns={GridUtils.GRID_COLUMNS}
              gridRows={pagedCanvasSettings.height}
              currentMode={editorState.selectedTileId ? 'Tryb edycji' : 'Tryb dodawania'}
              isTextEditing={editorState.mode === 'textEditing'}
              onFinishTextEditing={handleFinishTextEditing}
              editor={activeEditor}
              selectedTile={selectedRichTextTile}
              onUpdateTile={handleUpdateTile}
            />
          </div>
          {/* Canvas */}
          <div className="flex-1 p-4 lg:p-6 overflow-auto overscroll-contain bg-gray-100">
            <div className="max-w-6xl mx-auto flex flex-col gap-4">
              <PageNavigator
                currentPage={safePage}
                totalPages={totalPages}
                onSelectPage={handlePageChange}
                onAddPage={handleAddPage}
                onDeletePage={handleDeletePage}
                canDeletePage={totalPages > 1}
              />

              <LessonCanvas
                ref={canvasRef}
                key={`canvas-page-${safePage}`}
                content={pagedContent}
                editorState={editorState}
                onUpdateTile={handleUpdateTile}
                onSelectTile={handleSelectTile}
                onFinishTextEditing={handleFinishTextEditing}
                onDeleteTile={handleDeleteTile}
                onAddTile={handleAddTile}
                dispatch={dispatch}
                showGrid={editorState.showGrid}
                onEditorReady={setActiveEditor}
                testingTileIds={testingTileIds}
              />

              <PageNavigator
                currentPage={safePage}
                totalPages={totalPages}
                onSelectPage={handlePageChange}
                onAddPage={handleAddPage}
                showAddButton={false}
                onDeletePage={handleDeletePage}
                canDeletePage={totalPages > 1}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};