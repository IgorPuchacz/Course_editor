import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Lesson, Course } from '../types/course.ts';
import { LessonRuntimeView } from 'tiles-runtime';
import { LessonContentService } from '../services/lessonContentService.ts';

interface LessonViewerProps {
  lesson: Lesson;
  course: Course;
  onBack: () => void;
}

export const LessonViewer: React.FC<LessonViewerProps> = ({ lesson, course, onBack }) => {
  const [lessonContent, setLessonContent] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadContent = async () => {
      setIsLoading(true);
      try {
        const content = await LessonContentService.getLessonContent(lesson.id);
        if (isMounted) {
          setLessonContent(content);
        }
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

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4" />
            Powrót
          </button>
          <div className="text-right">
            <h1 className="text-lg font-semibold text-slate-900">{course.title}</h1>
            <p className="text-sm text-slate-500">Podgląd lekcji dla ucznia</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <LessonRuntimeView lesson={lessonContent} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default LessonViewer;
