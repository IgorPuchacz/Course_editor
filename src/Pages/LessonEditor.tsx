import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, RotateCcw, Grid, Edit } from 'lucide-react';
import { Lesson, Course } from '../types/course.ts';
import { LessonContent, LessonTile, ProgrammingTile, TextTile } from '../types/lessonEditor.ts';
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
import { LessonPageSelector } from '../components/admin/LessonPageSelector.tsx';

interface LessonEditorProps {
  lesson: Lesson;
  course: Course;
  onBack: () => void;
}

const isRichTextTile = (tile: LessonTile | null): tile is TextTile | ProgrammingTile | SequencingTile => {
  return !!tile && (tile.type === 'text' || tile.type === 'programming' || tile.type === 'sequencing');
};

export const LessonEditor: React.FC<LessonEditorProps> = ({ lesson, course, onBack }) => {
  const { toasts, removeToast, success, error, warning } = useToast();
  const canvasRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Core state
  const [lessonContent, setLessonContent] = useState<LessonContent | null>(null);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(64);
  const [toolbarHeight, setToolbarHeight] = useState(0);

  const { editorState, dispatch } = useLessonEditor();
  const [activeEditor, setActiveEditor] = useState<Editor | null>(null);
  const [testingTileIds, setTestingTileIds] = useState<string[]>([]);

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

  // Auto-save functionality
  useEffect(() => {
    if (editorState.hasUnsavedChanges && lessonContent) {
      const autoSaveTimer = setTimeout(() => {
        handleSave(false); // Silent auto-save
      }, 5000);

      return () => clearTimeout(autoSaveTimer);
    }
  }, [editorState.hasUnsavedChanges, lessonContent]);

  useEffect(() => {
    if (!lessonContent) return;

    const availablePageIds = lessonContent.pages.map(page => page.id);
    if (!availablePageIds.length) return;

    const fallbackPageId = lessonContent.activePageId && availablePageIds.includes(lessonContent.activePageId)
      ? lessonContent.activePageId
      : availablePageIds[0];

    if (!currentPageId || !availablePageIds.includes(currentPageId)) {
      setCurrentPageId(fallbackPageId);
    }
  }, [lessonContent, currentPageId]);

  const loadLessonContent = async () => {
    try {
      setIsLoading(true);
      const content = await LessonContentService.getLessonContent(lesson.id);
      
      if (content) {
        const pages = (content.pages && content.pages.length > 0
          ? [...content.pages]
          : [
              {
                id: 'page-1',
                title: 'Strona 1',
                order: 1
              }
            ]
        ).sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));

        const fallbackPageId = pages[0]?.id ?? 'page-1';
        const activePageId = content.activePageId && pages.some(page => page.id === content.activePageId)
          ? content.activePageId
          : fallbackPageId;

        const normalizedTiles = (content.tiles ?? []).map(tile => ({
          ...tile,
          pageId: tile.pageId || activePageId
        }));

        const normalizedContent: LessonContent = {
          ...content,
          tiles: normalizedTiles,
          pages,
          activePageId
        };

        setLessonContent(normalizedContent);
        setCurrentPageId(activePageId);
        logger.info(`Loaded lesson content with ${normalizedTiles.length} tiles`);
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

    const targetPageId = currentPageId || lessonContent.activePageId || lessonContent.pages[0]?.id;

    if (!targetPageId) {
      warning('Brak strony', 'Dodaj najpierw stronę, aby umieścić na niej kafelki.');
      return;
    }

    let newTile: LessonTile | null = null;

    switch (tileType) {
      case 'text':
        newTile = LessonContentService.createTextTile(position, targetPageId);
        break;
      case 'image':
        newTile = LessonContentService.createImageTile(position, targetPageId);
        break;
      case 'visualization':
        newTile = LessonContentService.createVisualizationTile(position, targetPageId);
        break;
      case 'quiz':
        newTile = LessonContentService.createQuizTile(position, targetPageId);
        break;
      case 'programming':
        newTile = LessonContentService.createProgrammingTile(position, targetPageId);
        break;
      case 'sequencing':
        newTile = LessonContentService.createSequencingTile(position, targetPageId);
        break;
      default:
        logger.warn(`Tile type ${tileType} not implemented yet`);
        warning('Funkcja niedostępna', `Typ kafelka "${tileType}" nie jest jeszcze dostępny`);
        return;
    }

    if (!newTile) return;

    const tilesOnPage = lessonContent.tiles.filter(tile => tile.pageId === targetPageId);

    // Find available position using grid system limited to the active page
    const availableGridPos = GridUtils.findNextAvailablePosition(
      newTile.gridPosition,
      lessonContent.canvas_settings,
      tilesOnPage
    );

    // Update tile with available position
    const finalPixelPos = GridUtils.gridToPixel(availableGridPos, lessonContent.canvas_settings);
    const finalPixelSize = GridUtils.gridSizeToPixel(availableGridPos, lessonContent.canvas_settings);

    newTile.gridPosition = availableGridPos;
    newTile.position = finalPixelPos;
    newTile.size = finalPixelSize;

    const updatedPageTiles = [...tilesOnPage, newTile];
    const updatedCanvasHeight = GridUtils.calculateCanvasHeight(updatedPageTiles);

    const updatedContent = {
      ...lessonContent,
      tiles: [...lessonContent.tiles, newTile],
      canvas_settings: {
        ...lessonContent.canvas_settings,
        height: Math.max(updatedCanvasHeight, lessonContent.canvas_settings.height)
      },
      activePageId: targetPageId,
      updated_at: new Date().toISOString()
    };

    setLessonContent(updatedContent);
    setCurrentPageId(targetPageId);
    dispatch({ type: 'markUnsaved' });
    dispatch({ type: 'selectTile', tileId: newTile.id });

    logger.info(`Added new ${tileType} tile to lesson on page ${targetPageId}`);
  };

  const handleAddPage = () => {
    if (!lessonContent) return;

    const nextIndex = lessonContent.pages.length + 1;
    const nextOrder = lessonContent.pages.length
      ? Math.max(...lessonContent.pages.map(page => page.order)) + 1
      : 1;

    const newPage = {
      id: `page-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: `Strona ${nextIndex}`,
      order: nextOrder
    };

    const updatedContent = {
      ...lessonContent,
      pages: [...lessonContent.pages, newPage],
      activePageId: newPage.id,
      updated_at: new Date().toISOString()
    };

    setLessonContent(updatedContent);
    setCurrentPageId(newPage.id);
    dispatch({ type: 'selectTile', tileId: null });
    dispatch({ type: 'stopEditing' });
    setActiveEditor(null);
    dispatch({ type: 'markUnsaved' });

    logger.info(`Added new page ${newPage.id}`);
    success('Dodano stronę', `Nowa strona "${newPage.title}" została utworzona.`);
  };

  const handleSelectPage = (pageId: string) => {
    if (!lessonContent) return;
    if (pageId === currentPageId) return;

    const pageExists = lessonContent.pages.some(page => page.id === pageId);
    if (!pageExists) return;

    const selectedTileInstance = lessonContent.tiles.find(tile => tile.id === editorState.selectedTileId);

    if (!selectedTileInstance || selectedTileInstance.pageId !== pageId) {
      dispatch({ type: 'selectTile', tileId: null });
      dispatch({ type: 'stopEditing' });
      setActiveEditor(null);
    }

    setLessonContent(prev => (prev ? { ...prev, activePageId: pageId } : prev));
    setCurrentPageId(pageId);
  };

  const handleRenamePage = (pageId: string, title: string) => {
    if (!lessonContent) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle.length) {
      warning('Nieprawidłowa nazwa', 'Nazwa strony nie może być pusta.');
      return;
    }

    const updatedPages = lessonContent.pages.map(page =>
      page.id === pageId ? { ...page, title: trimmedTitle } : page
    );

    const updatedContent = {
      ...lessonContent,
      pages: updatedPages,
      updated_at: new Date().toISOString()
    };

    setLessonContent(updatedContent);
    dispatch({ type: 'markUnsaved' });
    success('Zmieniono nazwę', `Strona została nazwana "${trimmedTitle}".`);
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
        if ((tile.type === 'text' || tile.type === 'programming' || tile.type === 'sequencing') && updates.content) {
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

    const newContent = {
      ...lessonContent,
      tiles: updatedTiles,
      canvas_settings: {
        ...lessonContent.canvas_settings,
        height: (() => {
          const heightCandidates = lessonContent.pages.map(page =>
            GridUtils.calculateCanvasHeight(updatedTiles.filter(tile => tile.pageId === page.id))
          );
          return heightCandidates.length
            ? Math.max(...heightCandidates)
            : GridUtils.calculateCanvasHeight(updatedTiles);
        })()
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
        const heightCandidates = lessonContent.pages.map(page =>
          GridUtils.calculateCanvasHeight(updatedTiles.filter(tile => tile.pageId === page.id))
        );
        const recalculatedHeight = heightCandidates.length
          ? Math.max(...heightCandidates)
          : GridUtils.calculateCanvasHeight(updatedTiles);

        setLessonContent({
          ...lessonContent,
          tiles: updatedTiles,
          canvas_settings: {
            ...lessonContent.canvas_settings,
            height: recalculatedHeight
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
    if (!lessonContent) return;

    const targetPageId = currentPageId || lessonContent.activePageId || lessonContent.pages[0]?.id;
    if (!targetPageId) return;

    const tilesOnPage = lessonContent.tiles.filter(tile => tile.pageId === targetPageId);
    if (tilesOnPage.length === 0) return;

    const page = lessonContent.pages.find(p => p.id === targetPageId);

    setConfirmDialog({
      isOpen: true,
      title: 'Wyczyść stronę',
      message: `Czy na pewno chcesz usunąć wszystkie kafelki ze strony "${page?.title ?? 'Strona'}"? Ta operacja jest nieodwracalna.`,
      onConfirm: () => {
        const remainingTiles = lessonContent.tiles.filter(tile => tile.pageId !== targetPageId);
        const heightCandidates = lessonContent.pages.map(page =>
          GridUtils.calculateCanvasHeight(remainingTiles.filter(tile => tile.pageId === page.id))
        );
        const recalculatedHeight = heightCandidates.length
          ? Math.max(...heightCandidates)
          : GridUtils.calculateCanvasHeight(remainingTiles);

        setLessonContent({
          ...lessonContent,
          tiles: remainingTiles,
          canvas_settings: {
            ...lessonContent.canvas_settings,
            height: recalculatedHeight
          },
          updated_at: new Date().toISOString()
        });

        setTestingTileIds(prev => prev.filter(id => !tilesOnPage.some(tile => tile.id === id)));

        dispatch({ type: 'markUnsaved' });
        dispatch({ type: 'selectTile', tileId: null });
        dispatch({ type: 'stopEditing' });

        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        success('Strona wyczyszczona', `Wszystkie kafelki zostały usunięte ze strony "${page?.title ?? 'Strona'}"`);
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
  const availablePageIds = lessonContent.pages.map(page => page.id);
  const fallbackPageId = lessonContent.activePageId && availablePageIds.includes(lessonContent.activePageId)
    ? lessonContent.activePageId
    : availablePageIds[0] ?? null;
  const activePageId = currentPageId && availablePageIds.includes(currentPageId)
    ? currentPageId
    : fallbackPageId;
  const activePage = lessonContent.pages.find(page => page.id === activePageId) || null;
  const activePageTiles = activePageId
    ? lessonContent.tiles.filter(tile => tile.pageId === activePageId)
    : [];
  const activeCanvasSettings = {
    ...lessonContent.canvas_settings,
    height: GridUtils.calculateCanvasHeight(activePageTiles)
  };
  const sortedPages = [...lessonContent.pages].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  const activePageTestingTileIds = testingTileIds.filter(id => activePageTiles.some(tile => tile.id === id));

  const selectedTile = activePageTiles.find(t => t.id === editorState.selectedTileId) || null;
  const selectedRichTextTile = isRichTextTile(selectedTile) ? selectedTile : null;

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
                  disabled={!activePageTiles.length}
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
          {editorState.selectedTileId ? (
            // Editing Panel - when tile is selected
            <div className="h-full">
              <TileSideEditor
                tile={selectedTile}
                onUpdateTile={handleUpdateTile}
                onSelectTile={handleSelectTile}
                isTesting={selectedTile ? activePageTestingTileIds.includes(selectedTile.id) : false}
                onToggleTesting={handleToggleTestingTile}
              />
            </div>
          ) : (
            // Tile Palette - when no tile is selected
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
              tilesCount={activePageTiles.length}
              gridColumns={GridUtils.GRID_COLUMNS}
              gridRows={activeCanvasSettings.height}
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
            <div className="mx-auto max-w-5xl space-y-4">
              <LessonPageSelector
                pages={sortedPages}
                activePageId={activePageId ?? ''}
                onSelectPage={handleSelectPage}
                onAddPage={handleAddPage}
                onRenamePage={handleRenamePage}
                activePage={activePage}
              />

              <LessonCanvas
                ref={canvasRef}
                content={{
                  ...lessonContent,
                  tiles: activePageTiles,
                  canvas_settings: activeCanvasSettings
                }}
                editorState={editorState}
                onUpdateTile={handleUpdateTile}
                onSelectTile={handleSelectTile}
                onFinishTextEditing={handleFinishTextEditing}
                onDeleteTile={handleDeleteTile}
                onAddTile={handleAddTile}
                dispatch={dispatch}
                showGrid={editorState.showGrid}
                onEditorReady={setActiveEditor}
                testingTileIds={activePageTestingTileIds}
              />

              <LessonPageSelector
                pages={sortedPages}
                activePageId={activePageId ?? ''}
                onSelectPage={handleSelectPage}
                onAddPage={handleAddPage}
                onRenamePage={handleRenamePage}
                activePage={activePage}
                position="bottom"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};