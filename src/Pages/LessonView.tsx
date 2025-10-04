import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, LayoutGrid, Loader2 } from 'lucide-react';
import { Course, Lesson } from '../types/course';
import { LessonContentService } from '../services/lessonContentService.ts';
import { Lesson as LessonContent } from 'tiles-core';
import { LessonRuntimeCanvas } from 'tiles-runtime';

interface LessonViewProps {
  lesson: Lesson;
  course: Course;
  onBack: () => void;
}

export const LessonView: React.FC<LessonViewProps> = ({ lesson, course, onBack }) => {
  const [content, setContent] = useState<LessonContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    LessonContentService.getLessonContent(lesson.id)
      .then(result => {
        if (!isMounted) return;
        if (result) {
          setContent(result);
          setCurrentPage(Math.min(result.total_pages || 1, 1));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [lesson.id]);

  const totalPages = content?.total_pages ?? 1;

  const pageTilesCount = useMemo(() => {
    if (!content) return 0;
    return content.tiles.filter(tile => (tile.page ?? 1) === currentPage).length;
  }, [content, currentPage]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Powrót
            </button>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Podgląd lekcji</h1>
              <p className="text-sm text-slate-500">Tak uczniowie zobaczą tę lekcję na platformie</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <BookOpen className="w-4 h-4" />
              {course.title}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <LayoutGrid className="w-4 h-4" />
              {totalPages} {totalPages === 1 ? 'strona' : 'strony'}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{lesson.title}</h2>
              <p className="text-sm text-slate-500 max-w-2xl">{lesson.description}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span>⏱️ {lesson.duration_minutes} min</span>
              <span>📝 Lekcja #{lesson.order_index + 1}</span>
              <span>{pageTilesCount} kafelków na stronie</span>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Strona {currentPage} z {totalPages}</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage <= 1}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                Poprzednia
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                Następna
              </button>
            </div>
          </div>

          <div className="bg-slate-100/80 rounded-2xl p-4 overflow-auto">
            {isLoading && (
              <div className="flex items-center justify-center py-16 text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Wczytywanie zawartości lekcji...
              </div>
            )}

            {!isLoading && content && (
              <LessonRuntimeCanvas content={content} page={currentPage} />
            )}

            {!isLoading && !content && (
              <div className="flex items-center justify-center py-16 text-slate-500">
                Nie udało się wczytać zawartości lekcji.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default LessonView;
