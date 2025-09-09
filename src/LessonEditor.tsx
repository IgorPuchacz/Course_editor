import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, RotateCcw, Grid, Settings } from 'lucide-react';
import { Lesson } from './types/course';
import { Course } from './types';
import { LessonContent, LessonTile, TextTile, EditorState } from './types/lessonEditor';
import { LessonContentService } from './services/lessonContentService';
import { TilePalette } from './components/admin/TilePalette';
import { LessonCanvas } from './LessonCanvas';
import { TextTileEditor } from './TextTileEditor';
import { ToastContainer } from './components/common/Toast';
import { useToast } from './hooks/useToast';
import { ConfirmDialog } from './components/common/ConfirmDialog';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { GridUtils } from './utils/gridUtils';
import { logger } from './utils/logger';

interface LessonEditorProps {
  lesson: Lesson;
  course: Course;
  onBack: () => void;
}

export const LessonEditor: React.FC<LessonEditorProps> = ({ lesson, course, onBack }) => {
  const { toasts, removeToast, success, error, warning } = useToast();
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Core state
  const [lessonContent, setLessonContent] = useState<LessonContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Editor state
  const [editorState, setEditorState] = useState<EditorState>({
    selectedTileId: null,
    isEditing: false,
    dragState: {
      isDragging: false,
      draggedTile: null,
      dragOffset: { x: 0, y: 0 },
      isFromPalette: false
    },
    resizeState: {
      isResizing: false,
      resizingTileId: null,
      resizeHandle: null,
      startPosition: { x: 0, y: 0 },
      startSize: { width: 0, height: 0 }
    },
    canvasSize: { width: 1000, height: 600 },
    hasUnsavedChanges: false,
    showGrid: true
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

  // Load lesson content on mount
  useEffect(() => {
    loadLessonContent();
  }, [lesson.id]);

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
        setLessonContent(content);
        logger.info(`Loaded lesson content with ${content.tiles.length} tiles`);
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
      
      setEditorState(prev => ({ ...prev, hasUnsavedChanges: false }));
      
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
        newTile = LessonContentService.createTextTile(position);
        break;
      case 'image':
        newTile = LessonContentService.createImageTile(position);
        break;
      case 'visualization':
        newTile = LessonContentService.createVisualizationTile(position);
        break;
      case 'quiz':
        newTile = LessonContentService.createQuizTile(position);
        break;
      default:
        logger.warn(`Tile type ${tileType} not implemented yet`);
        warning('Funkcja niedostępna', `Typ kafelka "${tileType}" nie jest jeszcze dostępny`);
        return;
    }

    if (!newTile) return;

    // Find available position using grid system
    const availableGridPos = GridUtils.findNextAvailablePosition(
      newTile.gridPosition,
      lessonContent.canvas_settings,
      lessonContent.tiles
    );
    
    // Update tile with available position
    const finalPixelPos = GridUtils.gridToPixel(availableGridPos, lessonContent.canvas_settings);
    const finalPixelSize = GridUtils.gridSizeToPixel(availableGridPos, lessonContent.canvas_settings);
    
    newTile.gridPosition = availableGridPos;
    newTile.position = finalPixelPos;
    newTile.size = finalPixelSize;

    const updatedContent = {
      ...lessonContent,
      tiles: [...lessonContent.tiles, newTile],
      canvas_settings: {
        ...lessonContent.canvas_settings,
        height: GridUtils.calculateCanvasHeight([...lessonContent.tiles, newTile])
      },
      updated_at: new Date().toISOString()
    };

    setLessonContent(updatedContent);
    setEditorState(prev => ({ 
      ...prev, 
      hasUnsavedChanges: true,
      selectedTileId: newTile.id 
    }));

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
        
        // Special handling for text tiles to ensure rich text is preserved
        if (tile.type === 'text' && updates.content) {
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
      updated_at: new Date().toISOString()
    };
    
    setLessonContent(newContent);

    setEditorState(prev => ({ ...prev, hasUnsavedChanges: true }));
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
        
        setLessonContent({
          ...lessonContent,
          tiles: updatedTiles,
          updated_at: new Date().toISOString()
        });

        setEditorState(prev => ({ 
          ...prev, 
          hasUnsavedChanges: true,
          selectedTileId: prev.selectedTileId === tileId ? null : prev.selectedTileId
        }));

        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        success('Kafelek usunięty', 'Kafelek został pomyślnie usunięty');
      }
    });
  };

  const handleSelectTile = (tileId: string | null) => {
    setEditorState(prev => ({ 
      ...prev, 
      selectedTileId: tileId,
      isEditing: false 
    }));
  };

  const handleStartEditing = (tileId: string) => {
    setEditorState(prev => ({ 
      ...prev, 
      selectedTileId: tileId,
      isEditing: true 
    }));
  };

  const handleStopEditing = () => {
    setEditorState(prev => ({ ...prev, isEditing: false }));
  };

  const handleToggleGrid = () => {
    setEditorState(prev => ({ ...prev, showGrid: !prev.showGrid }));
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
          updated_at: new Date().toISOString()
        });

        setEditorState(prev => ({ 
          ...prev, 
          hasUnsavedChanges: true,
          selectedTileId: null,
          isEditing: false
        }));

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


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-full overflow-hidden">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
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
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 lg:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackWithConfirmation}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Powrót do edytora kursów</span>
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
        {/* Left Panel - Tile Palette */}
        <div className="w-64 lg:w-80 bg-white shadow-lg border-r border-gray-200 flex-shrink-0">
          <TilePalette
            onAddTile={handleAddTile}
            selectedTileId={editorState.selectedTileId}
          />
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col min-w-0 max-w-none" style={{ width: 'calc(100% - 32rem)' }}>
          {/* Canvas Toolbar - Mobile Responsive */}
          <div className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 lg:space-x-4 text-xs lg:text-sm">
                <span className="text-gray-600">
                  Kafelki: {lessonContent.tiles.length}
                </span>
                <span className="text-gray-600 hidden sm:inline">
                  Siatka: {GridUtils.GRID_COLUMNS} × {lessonContent.canvas_settings.height}
                </span>
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 p-4 lg:p-6 overflow-auto bg-gray-100">
            <LessonCanvas
              ref={canvasRef}
              content={lessonContent}
              editorState={editorState}
              onUpdateTile={handleUpdateTile}
              onSelectTile={handleSelectTile}
              onStartEditing={handleStartEditing}
              onDeleteTile={handleDeleteTile}
              onAddTile={handleAddTile}
              onUpdateEditorState={setEditorState}
              showGrid={editorState.showGrid}
            />
          </div>
        </div>

        {/* Right Panel - Always Present */}
        <div className="w-64 lg:w-80 bg-white shadow-lg border-l border-gray-200 flex-shrink-0">
          {editorState.selectedTileId ? (
            <TextTileEditor
              tile={lessonContent.tiles.find(t => t.id === editorState.selectedTileId) as TextTile}
              onUpdateTile={handleUpdateTile}
              onStopEditing={handleStopEditing}
              isEditing={editorState.isEditing}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Settings className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Wybierz kafelek
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Kliknij na kafelek na planszy, aby edytować jego właściwości
              </p>
              <div className="text-xs text-gray-500 space-y-1">
                <p>💡 Podwójne kliknięcie - edycja treści</p>
                <p>🎯 Pojedyncze kliknięcie - wybór kafelka</p>
                <p>🗑️ Delete - usuń wybrany kafelek</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};