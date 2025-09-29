import React from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface PageNavigatorProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onAddPage?: () => void;
  variant?: 'default' | 'subtle';
}

export const PageNavigator: React.FC<PageNavigatorProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  onAddPage,
  variant = 'default'
}) => {
  const safeTotal = Math.max(1, totalPages);
  const clampedPage = Math.min(Math.max(1, currentPage), safeTotal);
  const pages = Array.from({ length: safeTotal }, (_, index) => index + 1);
  const canGoPrevious = clampedPage > 1;
  const canGoNext = clampedPage < safeTotal;

  const containerClasses =
    variant === 'subtle'
      ? 'rounded-xl border border-gray-200 bg-white/70 backdrop-blur-sm px-4 py-3 shadow-sm transition-all'
      : 'rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-md shadow-gray-200/70 transition-all';

  const buttonBase =
    'inline-flex items-center justify-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white';

  const pageButton = (page: number) => {
    const isActive = page === clampedPage;
    return (
      <button
        key={page}
        type="button"
        onClick={() => {
          if (page !== clampedPage) {
            onPageChange(page);
          }
        }}
        className={
          'min-w-[2.75rem] px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ' +
          (isActive
            ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
            : 'bg-white text-gray-700 border border-gray-200 hover:bg-blue-50')
        }
        aria-current={isActive ? 'page' : undefined}
      >
        {page}
      </button>
    );
  };

  return (
    <div className="space-y-2">
      <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${containerClasses}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => canGoPrevious && onPageChange(clampedPage - 1)}
              className={buttonBase}
              disabled={!canGoPrevious}
              aria-label="Poprzednia strona"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {pages.map(pageButton)}
            </div>
            <button
              type="button"
              onClick={() => canGoNext && onPageChange(clampedPage + 1)}
              className={buttonBase}
              disabled={!canGoNext}
              aria-label="Następna strona"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        {onAddPage && (
          <button
            type="button"
            onClick={onAddPage}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            Dodaj stronę
          </button>
        )}
      </div>
      <p className="text-center text-xs font-medium uppercase tracking-wide text-gray-500">
        Strona {clampedPage} z {safeTotal}
      </p>
    </div>
  );
};
