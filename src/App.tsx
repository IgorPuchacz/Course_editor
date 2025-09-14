import React from 'react';
import { useState } from 'react';
import { BookOpen, Play, Users, Settings, ArrowRight } from 'lucide-react';
import { LessonEditor } from './components/admin/LessonEditor.tsx';
import { Lesson, Course } from './types/course';

function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'lesson-editor'>('dashboard');
  
  // Mock data for demonstration
  const mockCourse: Course = {
    id: 'course-1',
    title: 'Matematyka - Matura 2024',
    description: 'Kompletny kurs przygotowujący do matury z matematyki',
    price: 299.99,
    image_url: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400',
    instructor_id: 'instructor-1',
    category: 'Matematyka',
    level: 'Średni',
    duration_hours: 120,
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const mockLesson: Lesson = {
    id: 'lesson-1',
    module_id: 'module-1',
    title: 'Funkcje kwadratowe - wprowadzenie',
    description: 'Podstawowe pojęcia związane z funkcjami kwadratowymi',
    content: 'Treść lekcji o funkcjach kwadratowych...',
    duration_minutes: 45,
    order_index: 0,
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (currentView === 'lesson-editor') {
    return (
      <LessonEditor
        lesson={mockLesson}
        course={mockCourse}
        onBack={() => setCurrentView('dashboard')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Platforma Maturalna</h1>
                <p className="text-sm text-gray-600">System zarządzania kursami</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Administrator</span>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Witaj w Edytorze Lekcji
          </h2>
          <p className="text-lg text-gray-600">
            Zaawansowany system drag-and-drop do tworzenia interaktywnych lekcji
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">System Grid</h3>
            <p className="text-gray-600 text-sm">
              Inteligentny system siatki 5×N z automatycznym snap-to-grid i walidacją kolizji
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Play className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Drag & Drop</h3>
            <p className="text-gray-600 text-sm">
              Płynne przeciąganie kafelków z palety na planszę z podglądem w czasie rzeczywistym
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Settings className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Resizing</h3>
            <p className="text-gray-600 text-sm">
              Zaawansowana funkcjonalność zmiany rozmiaru z 8 uchwytami i zachowaniem proporcji
            </p>
          </div>
        </div>

        {/* Demo Course Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <img
                    src={mockCourse.image_url}
                    alt={mockCourse.title}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{mockCourse.title}</h3>
                    <p className="text-gray-600">{mockCourse.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{mockCourse.duration_hours}h</div>
                    <div className="text-sm text-gray-600">Czas trwania</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{mockCourse.level}</div>
                    <div className="text-sm text-gray-600">Poziom</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{mockCourse.price} zł</div>
                    <div className="text-sm text-gray-600">Cena</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{mockCourse.category}</div>
                    <div className="text-sm text-gray-600">Kategoria</div>
                  </div>
                </div>

                {/* Sample Lesson */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2">Przykładowa lekcja:</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium text-gray-800">{mockLesson.title}</h5>
                      <p className="text-sm text-gray-600">{mockLesson.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>⏱️ {mockLesson.duration_minutes} min</span>
                        <span>📝 Lekcja #{mockLesson.order_index + 1}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setCurrentView('lesson-editor')}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 font-medium"
                >
                  <span>Otwórz Edytor Lekcji</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Features List */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Funkcjonalności Edytora:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">4 typy kafelków (tekst, obraz, zadanie, wykres)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Drag & drop z palety na planszę</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Zmiana rozmiaru z 8 uchwytami</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Automatyczne snap-to-grid</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Edycja treści in-place</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Panel właściwości z zakładkami</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Kontrolki zoom (50%-200%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Responsywny design</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;