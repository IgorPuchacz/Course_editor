import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, LayoutDashboard, Loader2 } from 'lucide-react';
import { Course, Lesson, LessonTile } from 'tiles-core';
import { LessonRuntimeCanvas } from '../components/runtime/LessonRuntimeCanvas';
import { LessonContentService } from 'tiles-editor';

interface LessonViewProps {
  lesson: Lesson;
  course: Course;
  onBack: () => void;
}

export const LessonView: React.FC<LessonViewProps> = ({ lesson, course, onBack }) => {
  const [lessonContent, setLessonContent] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activePage, setActivePage] = useState(1);

  useEffect(() => {
    let isMounted = true;

    const loadContent = async () => {
      setIsLoading(true);
      try {
        const content = await LessonContentService.getLessonContent(lesson.id);
        if (!isMounted) return;
        setLessonContent(content);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadContent();

    return () => {
      isMounted = false;
    };
  }, [lesson.id]);

  const totalPages = lessonContent?.total_pages ?? 1;

  useEffect(() => {
    if (activePage > totalPages) {
      setActivePage(totalPages);
    }
  }, [activePage, totalPages]);

  const tilesForPage = useMemo(() => {
    if (!lessonContent) return [] as LessonTile[];
    return lessonContent.tiles.filter(tile => (tile.page ?? 1) === activePage);
  }, [lessonContent, activePage]);

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Powrót
          </button>

          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <LayoutDashboard className="w-4 h-4" />
            Podgląd lekcji
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">{lesson.title}</h1>
              <p className="text-sm text-slate-600">{course.title}</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 uppercase tracking-[0.24em]">
              <span>Łączne strony: {totalPages}</span>
              <span>Podgląd strony: {activePage}</span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" aria-hidden="true" />
          </div>
        ) : tilesForPage.length === 0 || !lessonContent ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-3xl py-24 text-center text-slate-500">
            Dodaj kafelki w edytorze, aby zobaczyć podgląd lekcji.
          </div>
        ) : (
          <LessonRuntimeCanvas tiles={tilesForPage} canvasSettings={lessonContent.canvas_settings} />
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(page => (
              <button
                key={page}
                type="button"
                onClick={() => setActivePage(page)}
                className={`px-4 py-2 text-sm font-medium rounded-full border transition-colors ${
                  page === activePage
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                }`}
              >
                Strona {page}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonView;
