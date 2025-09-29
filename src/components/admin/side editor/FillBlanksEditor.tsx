import React from 'react';
import { ArrowDown, ArrowUp, CheckCircle2, Plus, Sparkles, Trash2 } from 'lucide-react';
import { FillBlanksTile, LessonTile } from '../../../types/lessonEditor.ts';

interface FillBlanksEditorProps {
  tile: FillBlanksTile;
  onUpdateTile: (tileId: string, updates: Partial<LessonTile>) => void;
  isTesting?: boolean;
  onToggleTesting?: (tileId: string) => void;
}

export const FillBlanksEditor: React.FC<FillBlanksEditorProps> = ({
  tile,
  onUpdateTile,
  isTesting = false,
  onToggleTesting
}) => {
  const handleContentUpdate = <K extends keyof FillBlanksTile['content']>(
    field: K,
    value: FillBlanksTile['content'][K]
  ) => {
    onUpdateTile(tile.id, {
      content: {
        ...tile.content,
        [field]: value
      },
      updated_at: new Date().toISOString()
    });
  };

  const handleOptionTextChange = (optionId: string, value: string) => {
    const updatedOptions = tile.content.options.map(option =>
      option.id === optionId ? { ...option, text: value } : option
    );
    handleContentUpdate('options', updatedOptions);
  };

  const handleAddOption = () => {
    const newOption = {
      id: `option-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text: `Nowy wyraz ${tile.content.options.length + 1}`
    };
    handleContentUpdate('options', [...tile.content.options, newOption]);
  };

  const handleRemoveOption = (optionId: string) => {
    const updatedOptions = tile.content.options.filter(option => option.id !== optionId);
    const fallbackId = updatedOptions[0]?.id ?? '';
    const updatedSegments = tile.content.segments.map(segment => {
      if (segment.type === 'blank' && segment.correctOptionId === optionId) {
        return { ...segment, correctOptionId: fallbackId };
      }
      return segment;
    });

    onUpdateTile(tile.id, {
      content: {
        ...tile.content,
        options: updatedOptions,
        segments: updatedSegments
      },
      updated_at: new Date().toISOString()
    });
  };

  const handleAddTextSegment = () => {
    const newSegment = {
      id: `segment-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'text' as const,
      text: 'Nowy fragment tekstu'
    };
    handleContentUpdate('segments', [...tile.content.segments, newSegment]);
  };

  const handleAddBlankSegment = () => {
    const defaultOptionId = tile.content.options[0]?.id ?? '';
    const newSegment = {
      id: `segment-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'blank' as const,
      correctOptionId: defaultOptionId
    };
    handleContentUpdate('segments', [...tile.content.segments, newSegment]);
  };

  const handleSegmentTextChange = (segmentId: string, value: string) => {
    const updatedSegments = tile.content.segments.map(segment =>
      segment.type === 'text' && segment.id === segmentId
        ? { ...segment, text: value }
        : segment
    );
    handleContentUpdate('segments', updatedSegments);
  };

  const handleSegmentAnswerChange = (segmentId: string, optionId: string) => {
    const updatedSegments = tile.content.segments.map(segment =>
      segment.type === 'blank' && segment.id === segmentId
        ? { ...segment, correctOptionId: optionId }
        : segment
    );
    handleContentUpdate('segments', updatedSegments);
  };

  const handleRemoveSegment = (segmentId: string) => {
    const updatedSegments = tile.content.segments.filter(segment => segment.id !== segmentId);
    handleContentUpdate('segments', updatedSegments);
  };

  const moveSegment = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= tile.content.segments.length) return;

    const updatedSegments = [...tile.content.segments];
    const [moved] = updatedSegments.splice(index, 1);
    updatedSegments.splice(targetIndex, 0, moved);
    handleContentUpdate('segments', updatedSegments);
  };

  const renderSegmentEditor = (
    segment: FillBlanksTile['content']['segments'][number],
    index: number
  ) => {
    const isText = segment.type === 'text';
    const segmentLabel = isText ? 'Tekst' : `Luka ${index + 1}`;

    return (
      <div
        key={segment.id}
        className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm space-y-3"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-sm font-semibold text-gray-900">{segmentLabel}</span>
            <p className="text-xs text-gray-600 mt-1">
              {isText
                ? 'Treść, która pojawi się w zadaniu.'
                : 'Wybierz prawidłowe słowo z bazy, które powinno trafić w tę lukę.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => moveSegment(index, -1)}
              disabled={index === 0}
              className={`p-2 rounded-lg border text-xs font-medium transition-colors ${
                index === 0
                  ? 'text-gray-300 border-gray-200 cursor-not-allowed'
                  : 'text-gray-500 border-gray-200 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => moveSegment(index, 1)}
              disabled={index === tile.content.segments.length - 1}
              className={`p-2 rounded-lg border text-xs font-medium transition-colors ${
                index === tile.content.segments.length - 1
                  ? 'text-gray-300 border-gray-200 cursor-not-allowed'
                  : 'text-gray-500 border-gray-200 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <ArrowDown className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleRemoveSegment(segment.id)}
              className="p-2 rounded-lg border border-transparent text-rose-500 hover:bg-rose-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isText ? (
          <textarea
            value={segment.text}
            onChange={(e) => handleSegmentTextChange(segment.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
            rows={3}
            placeholder="Wpisz tekst, który pojawi się w zadaniu"
          />
        ) : (
          <div className="space-y-3">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-[0.2em]">
              Prawidłowa odpowiedź
            </label>
            {tile.content.options.length > 0 ? (
              <select
                value={segment.correctOptionId}
                onChange={(e) => handleSegmentAnswerChange(segment.id, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                {tile.content.options.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.text}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-700">
                Dodaj najpierw wyrazy do bazy, aby przypisać poprawną odpowiedź.
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Tryb testowania</h3>
            <p className="text-xs text-gray-600 mt-1">
              {isTesting
                ? 'Tryb ucznia aktywny — kafelek na płótnie działa jak w podglądzie ucznia.'
                : 'Wyłącz edycję kafelka i sprawdź zadanie tak, jak zobaczy je uczeń.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onToggleTesting?.(tile.id)}
            disabled={!onToggleTesting}
            className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors shadow-sm ${
              isTesting ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            {isTesting ? 'Wyłącz tryb testowania' : 'Przetestuj zadanie'}
          </button>
        </div>
      </div>

      <div className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kolor przewodni kafelka
          </label>
          <input
            type="color"
            value={tile.content.backgroundColor}
            onChange={(e) => handleContentUpdate('backgroundColor', e.target.value)}
            className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
          />
        </div>

        <label className="flex items-center justify-between gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <span className="text-sm font-semibold text-gray-900">Wyświetl obramowanie kafelka</span>
            <p className="text-xs text-gray-600 mt-1">
              Dodaje delikatną ramkę wokół zadania na płótnie.
            </p>
          </div>
          <input
            type="checkbox"
            checked={tile.content.showBorder}
            onChange={(e) => handleContentUpdate('showBorder', e.target.checked)}
            className="w-5 h-5 text-blue-600"
          />
        </label>
      </div>

      <div className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Baza wyrazów</h3>
            <p className="text-xs text-gray-600 mt-1">
              Te wyrazy będą widoczne dla ucznia i można je przypisywać do luk.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddOption}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
          >
            <Plus className="w-4 h-4" />
            Dodaj wyraz
          </button>
        </div>

        <div className="space-y-3">
          {tile.content.options.length > 0 ? (
            tile.content.options.map((option, index) => (
              <div
                key={option.id}
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50"
              >
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-[0.2em]">
                  {index + 1}
                </span>
                <input
                  type="text"
                  value={option.text}
                  onChange={(e) => handleOptionTextChange(option.id, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Wpisz wyraz"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveOption(option.id)}
                  className="p-2 rounded-lg border border-transparent text-rose-500 hover:bg-rose-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="p-4 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 text-center">
              Dodaj pierwsze wyrazy, aby stworzyć bazę do przeciągania.
            </div>
          )}
        </div>
      </div>

      <div className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Struktura tekstu</h3>
            <p className="text-xs text-gray-600 mt-1">
              Ułóż kolejno fragmenty tekstu i luki, aby przygotować zadanie.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddTextSegment}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              Dodaj tekst
            </button>
            <button
              type="button"
              onClick={handleAddBlankSegment}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              <CheckCircle2 className="w-4 h-4" />
              Dodaj lukę
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {tile.content.segments.length > 0 ? (
            tile.content.segments.map((segment, index) => renderSegmentEditor(segment, index))
          ) : (
            <div className="p-4 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 text-center">
              Dodaj pierwsze fragmenty tekstu lub lukę, aby zbudować zadanie.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
