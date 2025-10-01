import React from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';

interface PageNavigatorProps {
  currentPage: number;
  totalPages: number;
  onSelectPage: (page: number) => void;
  onAddPage?: () => void;
  onDeletePage?: () => void;
  showAddButton?: boolean;
  showDeleteButton?: boolean;
  canDeletePage?: boolean;
  className?: string;
}

export const PageNavigator: React.FC<PageNavigatorProps> = ({
  currentPage,
  totalPages,
  onSelectPage,
  onAddPage,
  onDeletePage,
  showAddButton = true,
  showDeleteButton = true,
  canDeletePage = true,
  className = ''
}) => {
  const safeTotal = Math.max(totalPages, 1);
  const pages = Array.from({ length: safeTotal }, (_, index) => index + 1);
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < safeTotal;

  const handlePrev = () => {
    if (canGoPrev) {
      onSelectPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      onSelectPage(currentPage + 1);
    }
  };

  return (
    <div
      className={`bg-white/80 backdrop-blur border border-gray-200 shadow-sm rounded-2xl px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            disabled={!canGoPrev}
            className={`p-2 rounded-full border transition-colors ${
              canGoPrev
                ? 'text-gray-600 border-gray-200 hover:bg-gray-100 hover:text-gray-900'
                : 'text-gray-300 border-gray-100 cursor-not-allowed'
            }`}
            aria-label="Poprzednia strona"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1 overflow-x-auto max-w-full" aria-label="Lista stron">
            {pages.map((page) => {
              const isActive = page === currentPage;
              return (
                <button
                  key={page}
                  type="button"
                  onClick={() => onSelectPage(page)}
                  className={`min-w-[2.5rem] px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {page}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleNext}
            disabled={!canGoNext}
            className={`p-2 rounded-full border transition-colors ${
              canGoNext
                ? 'text-gray-600 border-gray-200 hover:bg-gray-100 hover:text-gray-900'
                : 'text-gray-300 border-gray-100 cursor-not-allowed'
            }`}
            aria-label="Następna strona"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3">
        <span className="text-sm text-gray-500">
          Strona {currentPage} z {safeTotal}
        </span>
        {showAddButton && onAddPage && (
          <button
            type="button"
            onClick={onAddPage}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium shadow-sm hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nowa strona</span>
            <span className="sm:hidden">Dodaj</span>
          </button>
        )}
        {showDeleteButton && onDeletePage && (
          <button
            type="button"
            onClick={onDeletePage}
            disabled={!canDeletePage}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-medium shadow-sm hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Usuń stronę</span>
            <span className="sm:hidden">Usuń</span>
          </button>
        )}
      </div>
    </div>
  );
};
