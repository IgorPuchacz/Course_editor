import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Plus, Edit, Trash2, Clock, FileText } from 'lucide-react';
import { Course } from '../../types';
import { Module, Lesson } from '../../types/course';
import { CourseService } from '../../services/courseService';
import { ModuleService } from '../../services/moduleService';
import { usePermissions } from '../../hooks/usePermissions';
import { PermissionGate } from '../../components/common/PermissionGate';
import { ToastContainer } from '../../components/common/Toast';
import { useToast } from '../../hooks/useToast';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { AddModuleModal } from '../../components/admin/AddModuleModal';
import { AddLessonModal } from '../../components/admin/AddLessonModal';
import { EditModuleModal } from '../../components/admin/EditModuleModal';
import { EditLessonModal } from '../../components/admin/EditLessonModal';
import { LessonEditor } from '../../components/admin/LessonEditor';
import { logger } from '../../utils/logger';

interface CourseEditPageProps {
  courseId: string;
  onBack: () => void;
}

const CourseEditPage: React.FC<CourseEditPageProps> = ({ courseId, onBack }) => {
  const { hasAnyRole } = usePermissions();
  const { toasts, removeToast, success, error, warning } = useToast();

  // Early validation of courseId
  if (!courseId || courseId.trim() === '') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Nieprawidłowy identyfikator kursu</h2>
          <p className="text-gray-600 mb-6">Nie można załadować kursu - brak identyfikatora.</p>
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

  // State management
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Modal states
  const [showAddModuleModal, setShowAddModuleModal] = useState(false);
  const [showAddLessonModal, setShowAddLessonModal] = useState(false);
  const [showEditModuleModal, setShowEditModuleModal] = useState(false);
  const [showEditLessonModal, setShowEditLessonModal] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [selectedLessonForEditor, setSelectedLessonForEditor] = useState<Lesson | null>(null);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'module' | 'lesson';
    id: string;
    name: string;
    action: () => void;
  }>({
    isOpen: false,
    type: 'module',
    id: '',
    name: '',
    action: () => {}
  });

  // Statistics
  const [statistics, setStatistics] = useState({
    totalModules: 0,
    totalLessons: 0,
    totalDuration: 0
  });

  // Check permissions
  const canManageCourses = hasAnyRole(['admin', 'moderator']);

  // Load course data on mount
  useEffect(() => {
    if (courseId) {
      loadCourseData();
    }
  }, [courseId]);

  // Load lessons when selected module changes
  useEffect(() => {
    if (selectedModuleId) {
      loadLessons(selectedModuleId);
    } else {
      setLessons([]);
    }
  }, [selectedModuleId]);

  // Update statistics when modules or lessons change
  useEffect(() => {
    updateStatistics();
  }, [modules, lessons]);

  const loadCourseData = async () => {
    if (!courseId || courseId.trim() === '') {
      error('Błąd parametrów', 'Nieprawidłowy identyfikator kursu');
      onBack();
      return;
    }

    try {
      setIsLoading(true);
      
      // Load course details
      const courseData = await CourseService.getCourseById(courseId);
      if (!courseData) {
        error('Kurs nie znaleziony', 'Nie można znaleźć kursu o podanym ID');
        onBack();
        return;
      }
      setCourse(courseData);

      // Load modules for this course
      const modulesData = await ModuleService.getModulesByCourse(courseId);
      setModules(modulesData);

      // Select first module if available
      if (modulesData.length > 0) {
        setSelectedModuleId(modulesData[0].id);
      }

      logger.info(`Loaded course: ${courseData.title} with ${modulesData.length} modules`);
    } catch (err) {
      logger.error('Failed to load course data:', err);
      error('Błąd ładowania', 'Nie udało się załadować danych kursu');
      // Don't stay on loading screen forever - go back after error
      setTimeout(() => {
        onBack();
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLessons = async (moduleId: string) => {
    try {
      const lessonsData = await ModuleService.getLessonsByModule(moduleId);
      setLessons(lessonsData);
      logger.info(`Loaded ${lessonsData.length} lessons for module ${moduleId}`);
    } catch (err) {
      logger.error('Failed to load lessons:', err);
      error('Błąd ładowania', 'Nie udało się załadować lekcji');
    }
  };

  const updateStatistics = async () => {
    if (!courseId) return;

    try {
      const stats = await ModuleService.getCourseStatistics(courseId);
      setStatistics(stats);
    } catch (err) {
      logger.error('Failed to update statistics:', err);
    }
  };

  // Module management functions
  const handleAddModule = async (moduleData: { title: string; description?: string }) => {
    if (!courseId) return;

    try {
      const newModule = await ModuleService.createModule({
        course_id: courseId,
        title: moduleData.title,
        description: moduleData.description,
      });

      setModules(prev => [...prev, newModule]);
      
      // Select the new module
      setSelectedModuleId(newModule.id);
      
      success('Moduł dodany', `Moduł "${newModule.title}" został pomyślnie utworzony`);
      setShowAddModuleModal(false);
    } catch (err) {
      logger.error('Failed to add module:', err);
      error('Błąd dodawania', 'Nie udało się dodać modułu');
    }
  };

  const handleEditModule = (module: Module) => {
    setEditingModule(module);
    setShowEditModuleModal(true);
  };

  const handleUpdateModule = async (moduleData: { title: string; description?: string }) => {
    if (!editingModule) return;

    try {
      const updatedModule = await ModuleService.updateModule(editingModule.id, moduleData);
      
      setModules(prev => prev.map(m => m.id === updatedModule.id ? updatedModule : m));
      
      success('Moduł zaktualizowany', `Moduł "${updatedModule.title}" został pomyślnie zaktualizowany`);
      setShowEditModuleModal(false);
      setEditingModule(null);
    } catch (err) {
      logger.error('Failed to update module:', err);
      error('Błąd aktualizacji', 'Nie udało się zaktualizować modułu');
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    try {
      setIsDeleting(moduleId);
      await ModuleService.deleteModule(moduleId);
      
      setModules(prev => prev.filter(m => m.id !== moduleId));
      
      // If deleted module was selected, select first remaining module
      if (selectedModuleId === moduleId) {
        const remainingModules = modules.filter(m => m.id !== moduleId);
        setSelectedModuleId(remainingModules.length > 0 ? remainingModules[0].id : null);
      }
      
      success('Moduł usunięty', 'Moduł i wszystkie jego lekcje zostały usunięte');
    } catch (err) {
      logger.error('Failed to delete module:', err);
      error('Błąd usuwania', 'Nie udało się usunąć modułu');
    } finally {
      setIsDeleting(null);
      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    }
  };

  // Lesson management functions
  const handleAddLesson = async (lessonData: { title: string; description?: string; duration_minutes: number }) => {
    if (!selectedModuleId) return;

    try {
      const newLesson = await ModuleService.createLesson({
        module_id: selectedModuleId,
        title: lessonData.title,
        description: lessonData.description,
        duration_minutes: lessonData.duration_minutes,
      });

      setLessons(prev => [...prev, newLesson]);
      
      success('Lekcja dodana', `Lekcja "${newLesson.title}" została pomyślnie utworzona`);
      setShowAddLessonModal(false);
    } catch (err) {
      logger.error('Failed to add lesson:', err);
      error('Błąd dodawania', 'Nie udało się dodać lekcji');
    }
  };

  const handleEditLesson = (lesson: Lesson) => {
    setSelectedLessonForEditor(lesson);
  };

  const handleUpdateLesson = async (lessonData: { title: string; description?: string; duration_minutes: number }) => {
    if (!editingLesson) return;

    try {
      const updatedLesson = await ModuleService.updateLesson(editingLesson.id, lessonData);
      
      setLessons(prev => prev.map(l => l.id === updatedLesson.id ? updatedLesson : l));
      
      success('Lekcja zaktualizowana', `Lekcja "${updatedLesson.title}" została pomyślnie zaktualizowana`);
      setShowEditLessonModal(false);
      setEditingLesson(null);
    } catch (err) {
      logger.error('Failed to update lesson:', err);
      error('Błąd aktualizacji', 'Nie udało się zaktualizować lekcji');
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    try {
      setIsDeleting(lessonId);
      await ModuleService.deleteLesson(lessonId);
      
      setLessons(prev => prev.filter(l => l.id !== lessonId));
      
      success('Lekcja usunięta', 'Lekcja została pomyślnie usunięta');
    } catch (err) {
      logger.error('Failed to delete lesson:', err);
      error('Błąd usuwania', 'Nie udało się usunąć lekcji');
    } finally {
      setIsDeleting(null);
      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    }
  };

  // Confirmation dialog helpers
  const openDeleteConfirm = (type: 'module' | 'lesson', id: string, name: string, action: () => void) => {
    setConfirmDialog({
      isOpen: true,
      type,
      id,
      name,
      action
    });
  };

  const getConfirmDialogProps = () => {
    const { type, name } = confirmDialog;
    if (type === 'module') {
      return {
        title: 'Usuń moduł',
        message: `Czy na pewno chcesz usunąć moduł "${name}"? Wszystkie lekcje w tym module również zostaną usunięte. Ta operacja jest nieodwracalna.`,
        confirmText: 'Usuń moduł',
        type: 'danger' as const
      };
    } else {
      return {
        title: 'Usuń lekcję',
        message: `Czy na pewno chcesz usunąć lekcję "${name}"? Ta operacja jest nieodwracalna.`,
        confirmText: 'Usuń lekcję',
        type: 'danger' as const
      };
    }
  };

  // Access control
  if (!canManageCourses) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Brak dostępu</h2>
          <p className="text-gray-600 mb-6">Nie masz uprawnień do edycji kursów.</p>
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Ładowanie kursu..." />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Kurs nie znaleziony</h2>
          <p className="text-gray-600 mb-6">Nie można znaleźć kursu o podanym identyfikatorze.</p>
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

  // Show lesson editor if a lesson is selected for editing
  if (selectedLessonForEditor) {
    return (
      <LessonEditor
        lesson={selectedLessonForEditor}
        course={course}
        onBack={() => setSelectedLessonForEditor(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        {...getConfirmDialogProps()}
        onConfirm={confirmDialog.action}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Modals */}
      <AddModuleModal
        isOpen={showAddModuleModal}
        onClose={() => setShowAddModuleModal(false)}
        onSubmit={handleAddModule}
      />

      <AddLessonModal
        isOpen={showAddLessonModal}
        onClose={() => setShowAddLessonModal(false)}
        onSubmit={handleAddLesson}
        selectedModuleId={selectedModuleId}
      />

      <EditModuleModal
        isOpen={showEditModuleModal}
        onClose={() => {
          setShowEditModuleModal(false);
          setEditingModule(null);
        }}
        onSubmit={handleUpdateModule}
        module={editingModule}
      />

      <EditLessonModal
        isOpen={showEditLessonModal}
        onClose={() => {
          setShowEditLessonModal(false);
          setEditingLesson(null);
        }}
        onSubmit={handleUpdateLesson}
        lesson={editingLesson}
      />

      {/* Left Panel - Module List */}
      <div className="w-80 bg-white shadow-lg border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Powrót do edytora kursów</span>
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Edycja kursu:</h1>
              <p className="text-sm text-gray-600">{course.title}</p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{statistics.totalModules}</div>
              <div className="text-xs text-gray-600">Moduły</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{statistics.totalLessons}</div>
              <div className="text-xs text-gray-600">Lekcje</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{Math.round(statistics.totalDuration / 60)}h</div>
              <div className="text-xs text-gray-600">Czas</div>
            </div>
          </div>
        </div>

        {/* Module List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Moduły kursu</h3>
            <PermissionGate allowedRoles={['admin', 'moderator']}>
              <button
                onClick={() => setShowAddModuleModal(true)}
                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                title="Dodaj moduł"
              >
                <Plus className="w-4 h-4" />
              </button>
            </PermissionGate>
          </div>

          <div className="space-y-2">
            {modules.map((module) => (
              <div
                key={module.id}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedModuleId === module.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
                onClick={() => setSelectedModuleId(module.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm">{module.title}</h4>
                    {module.description && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{module.description}</p>
                    )}
                  </div>
                  
                  <PermissionGate allowedRoles={['admin', 'moderator']}>
                    <div className="flex items-center space-x-1 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditModule(module);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edytuj moduł"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteConfirm('module', module.id, module.title, () => handleDeleteModule(module.id));
                        }}
                        disabled={isDeleting === module.id}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                        title="Usuń moduł"
                      >
                        {isDeleting === module.id ? (
                          <div className="w-3 h-3 border border-red-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </PermissionGate>
                </div>
              </div>
            ))}

            {modules.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm">Brak modułów w tym kursie</p>
                <p className="text-xs">Dodaj pierwszy moduł, aby rozpocząć</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area - Lesson Management */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedModuleId 
                  ? `Lekcje: ${modules.find(m => m.id === selectedModuleId)?.title || 'Nieznany moduł'}`
                  : 'Wybierz moduł'
                }
              </h2>
              <p className="text-gray-600">
                {selectedModuleId 
                  ? `Zarządzaj lekcjami w wybranym module`
                  : 'Wybierz moduł z lewego panelu, aby zarządzać lekcjami'
                }
              </p>
            </div>
            
            {selectedModuleId && (
              <PermissionGate allowedRoles={['admin', 'moderator']}>
                <button
                  onClick={() => setShowAddLessonModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Dodaj lekcję</span>
                </button>
              </PermissionGate>
            )}
          </div>
        </div>

        {/* Lesson List */}
        <div className="flex-1 p-6">
          {selectedModuleId ? (
            lessons.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lessons.map((lesson) => (
                  <div key={lesson.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{lesson.title}</h4>
                        {lesson.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">{lesson.description}</p>
                        )}
                      </div>
                      
                      <PermissionGate allowedRoles={['admin', 'moderator']}>
                        <div className="flex items-center space-x-1 ml-2">
                          <button
                            onClick={() => handleEditLesson(lesson)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Edytuj lekcję"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteConfirm('lesson', lesson.id, lesson.title, () => handleDeleteLesson(lesson.id))}
                            disabled={isDeleting === lesson.id}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                            title="Usuń lekcję"
                          >
                            {isDeleting === lesson.id ? (
                              <div className="w-4 h-4 border border-red-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </PermissionGate>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{lesson.duration_minutes} min</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FileText className="w-4 h-4" />
                        <span>Lekcja #{lesson.order_index + 1}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => setSelectedLessonForEditor(lesson)}
                        className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Edytuj zawartość lekcji
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Brak lekcji w tym module</h3>
                <p className="text-gray-600 mb-6">Dodaj pierwszą lekcję, aby rozpocząć tworzenie zawartości</p>
                <PermissionGate allowedRoles={['admin', 'moderator']}>
                  <button
                    onClick={() => setShowAddLessonModal(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Dodaj pierwszą lekcję</span>
                  </button>
                </PermissionGate>
              </div>
            )
          ) : (
            <div className="text-center py-16">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Wybierz moduł</h3>
              <p className="text-gray-600">Wybierz moduł z lewego panelu, aby zarządzać jego lekcjami</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseEditPage;