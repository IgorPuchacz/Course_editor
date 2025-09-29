import React, { useMemo } from 'react';
import { Plus, Trash2, Sparkles, Square, RotateCcw } from 'lucide-react';
import { MatchPairsTile, LessonTile } from '../../../types/lessonEditor.ts';
import {
  ensureValidBlankAssignments,
  promptToRichText,
  synchronizeBlanksWithPrompt,
  countBlanksInPrompt
} from '../../../utils/matchPairs.ts';

interface MatchPairsEditorProps {
  tile: MatchPairsTile;
  onUpdateTile: (tileId: string, updates: Partial<LessonTile>) => void;
  isTesting?: boolean;
  onToggleTesting?: (tileId: string) => void;
}

export const MatchPairsEditor: React.FC<MatchPairsEditorProps> = ({
  tile,
  onUpdateTile,
  isTesting = false,
  onToggleTesting
}) => {
  const blankCount = tile.content.blanks.length;
  const optionCount = tile.content.options.length;

  const placeholderCount = useMemo(
    () => countBlanksInPrompt(tile.content.prompt),
    [tile.content.prompt]
  );

  const updateContent = (contentUpdates: Partial<MatchPairsTile['content']>) => {
    onUpdateTile(tile.id, {
      content: {
        ...tile.content,
        ...contentUpdates
      },
      updated_at: new Date().toISOString()
    });
  };

  const handlePromptChange = (value: string) => {
    const synchronizedBlanks = synchronizeBlanksWithPrompt(value, tile.content.blanks);
    updateContent({
      prompt: value,
      richPrompt: promptToRichText(value),
      blanks: ensureValidBlankAssignments(synchronizedBlanks, tile.content.options)
    });
  };

  const handleBackgroundChange = (value: string) => {
    updateContent({ backgroundColor: value });
  };

  const handleToggleBorder = (checked: boolean) => {
    updateContent({ showBorder: checked });
  };

  const handleAddOption = () => {
    const newOption = {
      id: `option-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text: `Nowe słowo ${tile.content.options.length + 1}`
    } as MatchPairsTile['content']['options'][number];

    const updatedOptions = [...tile.content.options, newOption];
    const normalizedBlanks = ensureValidBlankAssignments(tile.content.blanks, updatedOptions);

    updateContent({ options: updatedOptions, blanks: normalizedBlanks });
  };

  const handleOptionTextChange = (optionId: string, text: string) => {
    const updatedOptions = tile.content.options.map((option) =>
      option.id === optionId ? { ...option, text } : option
    );

    updateContent({ options: updatedOptions });
  };

  const handleRemoveOption = (optionId: string) => {
    const updatedOptions = tile.content.options.filter((option) => option.id !== optionId);
    const normalizedBlanks = ensureValidBlankAssignments(tile.content.blanks, updatedOptions);

    updateContent({ options: updatedOptions, blanks: normalizedBlanks });
  };

  const handleBlankAnswerChange = (blankId: string, optionId: string | null) => {
    const updatedBlanks = tile.content.blanks.map((blank) =>
      blank.id === blankId ? { ...blank, correctOptionId: optionId } : blank
    );

    updateContent({ blanks: updatedBlanks });
  };

  const handleResetAssignments = () => {
    const resetBlanks = tile.content.blanks.map((blank) => ({
      ...blank,
      correctOptionId: null
    }));

    updateContent({ blanks: resetBlanks });
  };

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

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Instrukcja z lukami</label>
        <textarea
          value={tile.content.prompt}
          onChange={(e) => handlePromptChange(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          placeholder="Wprowadź treść zadania i użyj dwóch podkreśleń __ w miejscach, które mają zostać uzupełnione"
        />
        <p className="text-xs text-gray-500">
          Użyj dwóch znaków podkreślenia (<code>__</code>) dla każdej luki. Tekst zawiera {placeholderCount}{' '}
          {placeholderCount === 1 ? 'lukę' : 'luki'}.
        </p>
        {placeholderCount !== blankCount && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            Liczba wykrytych luk różni się od zapisanych odpowiedzi ({blankCount}). Zmiany zostaną zsynchronizowane automatycznie.
          </p>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Bank słów ({optionCount})</h3>
          <button
            type="button"
            onClick={handleAddOption}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100 transition"
          >
            <Plus className="w-4 h-4" />
            Dodaj słowo
          </button>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {tile.content.options.map((option) => (
            <div key={option.id} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
              <input
                type="text"
                value={option.text}
                onChange={(e) => handleOptionTextChange(option.id, e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                placeholder="Wyraz lub fraza"
              />
              <button
                type="button"
                onClick={() => handleRemoveOption(option.id)}
                className="p-2 text-red-500 hover:text-red-600 transition-colors"
                title="Usuń słowo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {tile.content.options.length === 0 && (
            <div className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
              Dodaj co najmniej jedno słowo, aby uczniowie mieli elementy do przeciągnięcia.
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Poprawne odpowiedzi</h3>
          <button
            type="button"
            onClick={handleResetAssignments}
            className="flex items-center gap-2 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
          >
            <RotateCcw className="w-3 h-3" />
            Wyczyść przypisania
          </button>
        </div>
        <div className="space-y-2">
          {tile.content.blanks.length === 0 && (
            <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
              Dodaj luki w tekście przy pomocy podwójnego podkreślenia (<code>__</code>), aby można było ustawić poprawne odpowiedzi.
            </p>
          )}
          {tile.content.blanks.map((blank, index) => (
            <div key={blank.id} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl">
              <div className="text-sm font-medium text-gray-700 min-w-[90px]">
                Luka {index + 1}
              </div>
              <select
                value={blank.correctOptionId ?? ''}
                onChange={(e) => handleBlankAnswerChange(blank.id, e.target.value || null)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Wybierz poprawne słowo</option>
                {tile.content.options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.text}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Kolor tła kafelka</label>
          <input
            type="color"
            value={tile.content.backgroundColor}
            onChange={(e) => handleBackgroundChange(e.target.value)}
            className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
          />
        </div>

        <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <input
            type="checkbox"
            checked={tile.content.showBorder}
            onChange={(e) => handleToggleBorder(e.target.checked)}
            className="w-5 h-5 text-blue-600 focus:ring-blue-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-900">Pokaż obramowanie kafelka</span>
            <p className="text-xs text-gray-600 mt-1">
              Gdy wyłączone, kafelek łączy się z tłem i wygląda bardziej minimalistycznie.
            </p>
          </div>
        </label>
      </div>
    </div>
  );
};
