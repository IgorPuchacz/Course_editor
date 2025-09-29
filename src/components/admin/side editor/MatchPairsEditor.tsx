import React, { useRef } from 'react';
import { Plus, Trash2, Sparkles, Square, Brackets, Info } from 'lucide-react';
import { MatchPairsTile } from '../../../types/lessonEditor.ts';

interface MatchPairsEditorProps {
  tile: MatchPairsTile;
  onUpdateTile: (tileId: string, updates: Partial<MatchPairsTile>) => void;
  isTesting?: boolean;
  onToggleTesting?: (tileId: string) => void;
}

export const MatchPairsEditor: React.FC<MatchPairsEditorProps> = ({
  tile,
  onUpdateTile,
  isTesting = false,
  onToggleTesting
}) => {
  const templateRef = useRef<HTMLTextAreaElement | null>(null);

  const updateContent = (updates: Partial<MatchPairsTile['content']>) => {
    onUpdateTile(tile.id, {
      content: {
        ...tile.content,
        ...updates
      },
      updated_at: new Date().toISOString()
    });
  };

  const handleContentUpdate = <K extends keyof MatchPairsTile['content']>(field: K, value: MatchPairsTile['content'][K]) => {
    updateContent({ [field]: value } as Partial<MatchPairsTile['content']>);
  };

  const handleTemplateChange = (value: string) => {
    handleContentUpdate('textTemplate', value);
  };

  // Allow authors to quickly insert placeholder markers at the caret position.
  const insertPlaceholder = (blankId: string) => {
    const placeholder = `[[${blankId}]]`;
    const textarea = templateRef.current;

    if (textarea) {
      const { selectionStart, selectionEnd, value } = textarea;
      const newValue = `${value.slice(0, selectionStart)}${placeholder}${value.slice(selectionEnd)}`;
      handleTemplateChange(newValue);

      requestAnimationFrame(() => {
        textarea.focus();
        const cursorPosition = selectionStart + placeholder.length;
        textarea.selectionStart = cursorPosition;
        textarea.selectionEnd = cursorPosition;
      });
    } else {
      handleTemplateChange(`${tile.content.textTemplate} ${placeholder}`.trim());
    }
  };

  const addBlank = () => {
    const newBlankId = `blank-${Date.now()}`;
    const updatedBlanks = [
      ...tile.content.blanks,
      { id: newBlankId, label: `Nowa luka ${tile.content.blanks.length + 1}`, correctOptionId: null }
    ];

    updateContent({
      blanks: updatedBlanks,
      textTemplate: `${tile.content.textTemplate}${tile.content.textTemplate ? ' ' : ''}[[${newBlankId}]]`
    });
  };

  // Removing a blank also purges any stale markers from the template string.
  const removeBlank = (blankId: string) => {
    const updatedBlanks = tile.content.blanks.filter(blank => blank.id !== blankId);
    const cleanedTemplate = tile.content.textTemplate.replace(new RegExp(`\\[\\[${blankId}\\]\\]`, 'g'), '');

    updateContent({
      blanks: updatedBlanks,
      textTemplate: cleanedTemplate
    });
  };

  const updateBlankLabel = (blankId: string, value: string) => {
    const updatedBlanks = tile.content.blanks.map(blank =>
      blank.id === blankId ? { ...blank, label: value } : blank
    );
    handleContentUpdate('blanks', updatedBlanks);
  };

  const updateBlankCorrectOption = (blankId: string, optionId: string | null) => {
    const updatedBlanks = tile.content.blanks.map(blank =>
      blank.id === blankId ? { ...blank, correctOptionId: optionId } : blank
    );
    handleContentUpdate('blanks', updatedBlanks);
  };

  const addOption = () => {
    const newOptionId = `option-${Date.now()}`;
    const updatedOptions = [
      ...tile.content.options,
      { id: newOptionId, text: `Nowe słowo ${tile.content.options.length + 1}` }
    ];
    handleContentUpdate('options', updatedOptions);
  };

  const updateOptionText = (optionId: string, value: string) => {
    const updatedOptions = tile.content.options.map(option =>
      option.id === optionId ? { ...option, text: value } : option
    );
    handleContentUpdate('options', updatedOptions);
  };

  const removeOption = (optionId: string) => {
    const updatedOptions = tile.content.options.filter(option => option.id !== optionId);
    const updatedBlanks = tile.content.blanks.map(blank => ({
      ...blank,
      correctOptionId: blank.correctOptionId === optionId ? null : blank.correctOptionId
    }));
    updateContent({ options: updatedOptions, blanks: updatedBlanks });
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

      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Tekst zadania z lukami</label>
        <textarea
          ref={templateRef}
          value={tile.content.textTemplate}
          onChange={(e) => handleTemplateChange(e.target.value)}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          placeholder="Np. Zdanie z [[blank-1]] lukami i [[blank-2]] słowami."
        />
        <div className="flex items-start gap-2 text-xs text-gray-600 bg-blue-50 border border-blue-100 rounded-lg p-3">
          <Info className="w-4 h-4 text-blue-500 mt-0.5" />
          <p>
            Użyj składni <code className="bg-white px-1 py-0.5 rounded border">[[identyfikator-luki]]</code> aby wstawić miejsce na słowo.
            Przyciski przy każdej luce pozwalają wstawić odpowiedni znacznik dokładnie w miejscu kursora.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900">Luki ({tile.content.blanks.length})</h4>
          <button
            type="button"
            onClick={addBlank}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Dodaj lukę
          </button>
        </div>

        <div className="space-y-3">
          {tile.content.blanks.map((blank, index) => (
            <div key={blank.id} className="p-3 border border-gray-200 rounded-lg bg-white shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Luka {index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeBlank(blank.id)}
                  className="text-xs text-red-500 hover:text-red-600 inline-flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Usuń
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Opis luki</label>
                  <input
                    type="text"
                    value={blank.label}
                    onChange={(e) => updateBlankLabel(blank.id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Krótki opis lub podpowiedź"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Poprawna odpowiedź</label>
                  <select
                    value={blank.correctOptionId ?? ''}
                    onChange={(e) => updateBlankCorrectOption(blank.id, e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">Wybierz poprawną odpowiedź</option>
                    {tile.content.options.map(option => (
                      <option key={option.id} value={option.id}>
                        {option.text}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => insertPlaceholder(blank.id)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg border border-blue-100"
                >
                  <Brackets className="w-3 h-3" />
                  Wstaw [[{blank.id}]] w tekście
                </button>
              </div>
            </div>
          ))}

          {tile.content.blanks.length === 0 && (
            <div className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg p-3">
              Dodaj co najmniej jedną lukę, aby zadanie było interaktywne.
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900">Bank słów ({tile.content.options.length})</h4>
          <button
            type="button"
            onClick={addOption}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white text-xs rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Dodaj słowo
          </button>
        </div>

        <div className="space-y-2">
          {tile.content.options.map(option => (
            <div key={option.id} className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg bg-white shadow-sm">
              <input
                type="text"
                value={option.text}
                onChange={(e) => updateOptionText(option.id, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Wpisz słowo lub frazę"
              />
              <button
                type="button"
                onClick={() => removeOption(option.id)}
                className="p-2 text-red-500 hover:text-red-600 rounded-lg hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {tile.content.options.length === 0 && (
            <div className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg p-3">
              Dodaj słowa lub frazy, aby uczniowie mogli je przeciągać w odpowiednie miejsca.
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Feedback poprawny</label>
          <textarea
            value={tile.content.correctFeedback}
            onChange={(e) => handleContentUpdate('correctFeedback', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            placeholder="Świetnie, udało Ci się uzupełnić wszystkie luki!"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Feedback niepoprawny</label>
          <textarea
            value={tile.content.incorrectFeedback}
            onChange={(e) => handleContentUpdate('incorrectFeedback', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            placeholder="Spróbuj ponownie — upewnij się, że każde słowo pasuje do kontekstu zdania."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Kolor tła kafelka</label>
          <input
            type="color"
            value={tile.content.backgroundColor}
            onChange={(e) => handleContentUpdate('backgroundColor', e.target.value)}
            className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 w-full cursor-pointer">
            <input
              type="checkbox"
              checked={tile.content.showBorder}
              onChange={(e) => handleContentUpdate('showBorder', e.target.checked)}
              className="w-5 h-5 text-blue-600"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">Pokaż obramowanie kafelka</span>
              <p className="text-xs text-gray-600">Dzięki obramowaniu kafelek będzie bardziej wyeksponowany na planszy.</p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};
