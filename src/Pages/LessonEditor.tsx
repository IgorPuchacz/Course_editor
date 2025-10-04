import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, RotateCcw, Grid, Edit } from 'lucide-react';
import { Lesson, Course } from '../types/course.ts';
import {
  LessonCanvas,
  TilePalette,
  TopToolbar,
  TileSideEditor,
  useLessonEditor,
  useLessonContentManager,
} from 'tiles-editor';
import { Editor } from '@tiptap/react';
import { ToastContainer } from 'ui-primitives';
import { useToast } from '../hooks/useToast.ts';
import { ConfirmDialog } from '../components/common/ConfirmDialog.tsx';
import { LoadingSpinner } from '../components/common/LoadingSpinner.tsx';

interface LessonEditorProps {
  lesson: Lesson;
  course: Course;
  onBack: () => void;
}

export const LessonEditor: React.FC<LessonEditorProps> = ({ lesson, course, onBack }) => {
  const { toasts, removeToast, success, error, warning } = useToast();
  const canvasRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const [headerHeight, setHeaderHeight] = useState(64);
  const [toolbarHeight, setToolbarHeight] = useState(0);

  const { editorState, dispatch } = useLessonEditor();
  const [activeEditor, setActiveEditor] = useState<Editor | null>(null);

  const {
    lessonContent,
    isLoading,
    isSaving,
    totalPages,
    safePage,
    pagedContent,
    selectedTile,
    selectedRichTextTile,
    addTile,
    updateTile,
    deleteTile,
    addPage,
    deletePage,
    changePage,
    clearCanvas,
    saveLessonContent
  } = useLessonContentManager({
    lessonId: lesson.id,
    editorState,
    dispatch,
    notifications: { success, error, warning }
  });

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

  const handleDeleteTile = (tileId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Usuń kafelek',
      message: `Czy na pewno chcesz usunąć ten kafelek? Ta operacja jest nieodwracalna.`,
      onConfirm: () => {
        deleteTile(tileId);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleAddPage = () => {
    const newPage = addPage();
    if (newPage > 0) {
      setActiveEditor(null);
    }
  };

  const handleDeletePage = () => {
    if (!lessonContent || totalPages <= 1) return;

    const pageToDelete = safePage;

    setConfirmDialog({
      isOpen: true,
      title: 'Usuń stronę',
      message: `Czy na pewno chcesz usunąć stronę ${pageToDelete}? Wszystkie kafelki na tej stronie zostaną usunięte, a układ kolejnych stron zostanie zaktualizowany.`,
      onConfirm: () => {
        deletePage(pageToDelete);
        setActiveEditor(null);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handlePageChange = (page: number) => {
    const pageChanged = changePage(page);
    if (pageChanged) {
      setActiveEditor(null);
    }
  };

  const handleBackWithConfirmation = () => {
    if (editorState.hasUnsavedChanges) {
      setConfirmDialog({
        isOpen: true,
        title: 'Niezapisane zmiany',
        message: 'Masz niezapisane zmiany. Czy chcesz je zapisać przed wyjściem?',
        onConfirm: async () => {
          await saveLessonContent();
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
        const cleared = clearCanvas();
        if (cleared) {
          setActiveEditor(null);
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
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

  if (!pagedContent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Ładowanie edytora lekcji..." />
      </div>
    );
  }

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
                  onClick={() => saveLessonContent(true)}
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
                onUpdateTile={updateTile}
                onSelectTile={handleSelectTile}
              />
            </div>
          ) : (
            // Tile Palette - when no tile is selected on the active page
            <div className="h-full">
              <TilePalette
                onAddTile={addTile}
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
              isTextEditing={editorState.mode === 'textEditing'}
              onFinishTextEditing={handleFinishTextEditing}
              editor={activeEditor}
              selectedTile={selectedRichTextTile}
              onUpdateTile={updateTile}
              currentPage={safePage}
              totalPages={totalPages}
              onSelectPage={handlePageChange}
              onAddPage={handleAddPage}
              onDeletePage={handleDeletePage}
              canDeletePage={totalPages > 1}
            />
          </div>
          {/* Canvas */}
          <div className="flex-1 p-4 lg:p-6 overflow-auto overscroll-contain bg-gray-100">
            <div className="max-w-6xl mx-auto flex flex-col gap-4">
              <LessonCanvas
                ref={canvasRef}
                key={`canvas-page-${safePage}`}
                content={pagedContent}
                editorState={editorState}
                onUpdateTile={updateTile}
                onSelectTile={handleSelectTile}
                onDeleteTile={handleDeleteTile}
                onAddTile={addTile}
                onFinishTextEditing={handleFinishTextEditing}
                dispatch={dispatch}
                showGrid={editorState.showGrid}
                onEditorReady={setActiveEditor}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};