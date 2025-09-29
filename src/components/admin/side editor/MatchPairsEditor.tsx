import React, { useMemo } from 'react';
import { AlertCircle, Plus, Shuffle, Sparkles, Square, Trash2 } from 'lucide-react';
import { MatchPairsTile } from '../../../types/lessonEditor';

interface MatchPairsEditorProps {
  tile: MatchPairsTile;
  onUpdateTile: (tileId: string, updates: Partial<MatchPairsTile>) => void;
  isTesting?: boolean;
  onToggleTesting?: (tileId: string) => void;
}

const extractPlaceholders = (template: string): string[] => {
  const regex = /\{\{\s*([^}]+?)\s*\}\}/g;
  const placeholders: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(template)) !== null) {
    const placeholderId = match[1]?.trim();
    if (placeholderId && !placeholders.includes(placeholderId)) {
      placeholders.push(placeholderId);
    }
  }

  return placeholders;
};

export const MatchPairsEditor: React.FC<MatchPairsEditorProps> = ({
  tile,
  onUpdateTile,
  isTesting = false,
  onToggleTesting
}) => {
  const handleContentUpdate = (updates: Partial<MatchPairsTile['content']>) => {
    onUpdateTile(tile.id, {
      content: {
        ...tile.content,
        ...updates
      },
      updated_at: new Date().toISOString()
    });
  };

  const handleTemplateChange = (value: string) => {
    const placeholders = extractPlaceholders(value);
    const updatedBlanks = placeholders.map((placeholderId, index) => {
      const existing = tile.content.blanks.find(blank => blank.id === placeholderId);
      return (
        existing ?? {
          id: placeholderId,
          label: `Luka ${index + 1}`,
          correctOptionId: null
        }
      );
    });

    handleContentUpdate({
      template: value,
      blanks: updatedBlanks
    });
  };

  const handleBlankUpdate = (blankId: string, updates: Partial<MatchPairsTile['content']['blanks'][number]>) => {
    const updatedBlanks = tile.content.blanks.map(blank =>
      blank.id === blankId ? { ...blank, ...updates } : blank
    );
    handleContentUpdate({ blanks: updatedBlanks });
  };

  const handleOptionTextChange = (optionId: string, value: string) => {
    const updated = tile.content.options.map(option =>
      option.id === optionId ? { ...option, text: value } : option
    );
    handleContentUpdate({ options: updated });
  };

  const handleAddOption = () => {
    const newOption = {
      id: `option-${Date.now()}`,
      text: `Nowy wyraz ${tile.content.options.length + 1}`
    };

    handleContentUpdate({ options: [...tile.content.options, newOption] });
  };

  const handleRemoveOption = (optionId: string) => {
    if (tile.content.options.length <= 3) {
      return;
    }

    const updatedOptions = tile.content.options.filter(option => option.id !== optionId);
    const updatedBlanks = tile.content.blanks.map(blank =>
      blank.correctOptionId === optionId ? { ...blank, correctOptionId: null } : blank
    );

    handleContentUpdate({
      options: updatedOptions,
      blanks: updatedBlanks
    });
  };

  const placeholders = useMemo(
    () => extractPlaceholders(tile.content.template),
    [tile.content.template]
  );

  const missingPlaceholders = placeholders.length === 0;

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Tryb testowania</h3>
            <p className="text-xs text-gray-600 mt-1">
              {isTesting
                ? 'Tryb ucznia jest aktywny. Kafelek na płótnie jest zablokowany przed przypadkową edycją.'
                : 'Wyłącz interakcje edycyjne kafelka i sprawdź zadanie dokładnie tak, jak zobaczy je uczeń.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onToggleTesting?.(tile.id)}
            disabled={!onToggleTesting}
            className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors shadow-sm ${
              isTesting
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : 'bg-blue-600 text-white hover:bg-blue-500'
            } disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {isTesting ? <Square className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            <span>{isTesting ? 'Zakończ testowanie' : 'Przetestuj zadanie'}</span>
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tekst z lukami
        </label>
        <textarea
          value={tile.content.template}
          onChange={event => handleTemplateChange(event.target.value)}
          rows={5}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          placeholder="np. Kot {{blank-1}} na płocie i {{blank-2}} na księżyc."
        />
        <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Użyj nawiasów klamrowych <code className="bg-gray-100 px-1 rounded">{`{{blank-1}}`}</code> aby zaznaczyć miejsce luki. Nazwy luk muszą być unikalne.
        </p>
        {missingPlaceholders && (
          <div className="mt-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded">
            Dodaj co najmniej jedną lukę, aby ćwiczenie było aktywne.
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Luki ({tile.content.blanks.length})
          </label>
        </div>
        <div className="space-y-3">
          {tile.content.blanks.map((blank, index) => (
            <div key={blank.id} className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-gray-500">Luka {index + 1}</p>
                  <p className="text-sm font-semibold text-gray-900">{`{{${blank.id}}}`}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Podpowiedź widoczna w pustym polu
                  </label>
                  <input
                    type="text"
                    value={blank.label}
                    onChange={event => handleBlankUpdate(blank.id, { label: event.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder={`Luka ${index + 1}`}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Poprawna odpowiedź
                  </label>
                  <select
                    value={blank.correctOptionId ?? ''}
                    onChange={event =>
                      handleBlankUpdate(blank.id, {
                        correctOptionId: event.target.value ? event.target.value : null
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">– wybierz z listy –</option>
                    {tile.content.options.map(option => (
                      <option key={option.id} value={option.id}>
                        {option.text}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}

          {tile.content.blanks.length === 0 && (
            <div className="text-xs text-gray-500">Brak zdefiniowanych luk. Dodaj je w treści zadania.</div>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Bank odpowiedzi ({tile.content.options.length})
          </label>
          <button
            type="button"
            onClick={handleAddOption}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Dodaj wyraz
          </button>
        </div>

        <div className="space-y-2">
          {tile.content.options.map(option => (
            <div key={option.id} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
              <input
                type="text"
                value={option.text}
                onChange={event => handleOptionTextChange(option.id, event.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="np. wyraz"
              />
              <button
                type="button"
                onClick={() => handleRemoveOption(option.id)}
                className="p-2 text-red-400 hover:text-red-600 transition-colors"
                title="Usuń odpowiedź"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {tile.content.options.length <= 3 && (
          <p className="text-xs text-amber-600 mt-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Dodaj więcej odpowiedzi, aby zadanie było ciekawsze (minimum 3).
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Losowa kolejność banku</h4>
              <p className="text-xs text-gray-600 mt-1">
                Każde odświeżenie zadania miesza odpowiedzi. Wyłącz, aby zachować stałe ułożenie.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleContentUpdate({ shuffleOptions: !tile.content.shuffleOptions })}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                tile.content.shuffleOptions
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              <Shuffle className="w-4 h-4" />
              {tile.content.shuffleOptions ? 'Włączone' : 'Wyłączone'}
            </button>
          </div>
        </div>

        <div className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm space-y-3">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Kolor tła kafelka
            </label>
            <input
              type="color"
              value={tile.content.backgroundColor}
              onChange={event => handleContentUpdate({ backgroundColor: event.target.value })}
              className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
            />
          </div>

          <label className="flex items-center gap-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={tile.content.showBorder}
              onChange={event => handleContentUpdate({ showBorder: event.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded"
            />
            <span>Pokaż obramowanie kafelka</span>
          </label>
        </div>
      </div>
    </div>
  );
};
