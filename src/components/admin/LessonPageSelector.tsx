import React, { useEffect, useRef, useState } from 'react';
import { LessonPage } from '../../types/lessonEditor.ts';
import { Check, PencilLine, PlusCircle } from 'lucide-react';

interface LessonPageSelectorProps {
  pages: LessonPage[];
  activePageId: string;
  onSelectPage: (pageId: string) => void;
  onAddPage: () => void;
  onRenamePage?: (pageId: string, title: string) => void;
  activePage: LessonPage | null;
  position?: 'top' | 'bottom';
}

export const LessonPageSelector: React.FC<LessonPageSelectorProps> = ({
  pages,
  activePageId,
  onSelectPage,
  onAddPage,
  onRenamePage,
  activePage,
  position = 'top'
}) => {
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editingPageId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingPageId]);

  const startRenaming = (page: LessonPage) => {
    if (!onRenamePage) return;
    setEditingPageId(page.id);
    setDraftTitle(page.title);
  };

  const commitRename = () => {
    if (!editingPageId || !onRenamePage) {
      setEditingPageId(null);
      return;
    }

    const trimmed = draftTitle.trim();
    const currentPage = pages.find(page => page.id === editingPageId);

    if (currentPage && trimmed && trimmed !== currentPage.title) {
      onRenamePage(editingPageId, trimmed);
    }

    setEditingPageId(null);
  };

  const cancelRename = () => {
    setEditingPageId(null);
    setDraftTitle('');
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commitRename();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancelRename();
    }
  };

  const containerSpacing = position === 'bottom' ? 'mt-6' : 'mt-2';

  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/70 ${containerSpacing}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-600">
            {pages.length}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-900">Strony lekcji</span>
            {activePage && (
              <span className="text-xs text-gray-500">Aktywna: {activePage.title}</span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onAddPage}
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
        >
          <PlusCircle className="h-4 w-4" />
          Nowa strona
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
        {pages.length === 0 && (
          <span className="text-sm text-gray-500">Brak stron. Dodaj pierwszą stronę, aby rozpocząć.</span>
        )}

        {pages.map((page, index) => {
          const isActive = page.id === activePageId;

          if (editingPageId === page.id) {
            return (
              <div
                key={page.id}
                className="flex items-center gap-2 rounded-full border border-blue-300 bg-blue-50/80 px-3 py-1.5 shadow-inner"
              >
                <input
                  ref={inputRef}
                  value={draftTitle}
                  onChange={(event) => setDraftTitle(event.target.value)}
                  onBlur={commitRename}
                  onKeyDown={handleKeyDown}
                  className="w-32 bg-transparent text-sm font-medium text-blue-900 outline-none placeholder:text-blue-300"
                  placeholder="Nazwa strony"
                  aria-label="Zmień nazwę strony"
                />
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={commitRename}
                  className="rounded-full bg-blue-600 p-1 text-white transition-colors hover:bg-blue-700"
                  title="Zapisz nazwę"
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
            );
          }

          return (
            <div key={page.id} className="group relative flex items-center">
              <button
                type="button"
                onClick={() => onSelectPage(page.id)}
                className={`flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 ${
                  isActive
                    ? 'border-blue-500 bg-blue-600 text-white shadow-md'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:text-blue-700'
                }`}
                aria-pressed={isActive}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
                  }`}
                >
                  {index + 1}
                </span>
                <span className="whitespace-nowrap">{page.title}</span>
              </button>

              {onRenamePage && (
                <button
                  type="button"
                  onClick={() => startRenaming(page)}
                  className={`ml-2 hidden items-center justify-center rounded-full p-1 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600 focus:bg-blue-50 focus:text-blue-600 focus:outline-none group-hover:inline-flex ${
                    isActive ? 'inline-flex text-white/90 hover:text-white' : ''
                  }`}
                  title="Zmień nazwę strony"
                >
                  <PencilLine className="h-4 w-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
