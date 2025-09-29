import React, { useMemo, useRef } from 'react';
import { Plus, Trash2, Type, Info, Hash } from 'lucide-react';
import { MatchingTile, MatchingBlank, MatchingWord } from '../../../types/lessonEditor.ts';

interface MatchingEditorProps {
  tile: MatchingTile;
  onUpdateTile: (tileId: string, updates: Partial<MatchingTile>) => void;
}

const PLACEHOLDER_REGEX = /\[\[([^\[\]]+)\]\]/g;

const extractPlaceholderIds = (text: string): string[] => {
  const ids: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = PLACEHOLDER_REGEX.exec(text)) !== null) {
    if (match[1]) {
      ids.push(match[1]);
    }
  }
  return ids;
};

export const MatchingEditor: React.FC<MatchingEditorProps> = ({ tile, onUpdateTile }) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const updateContent = (contentUpdates: Partial<MatchingTile['content']>) => {
    onUpdateTile(tile.id, {
      content: {
        ...tile.content,
        ...contentUpdates
      },
      updated_at: new Date().toISOString()
    });
  };

  const handleStoryTextChange = (value: string) => {
    const placeholderIds = extractPlaceholderIds(value);
    const existingBlanks = new Map(tile.content.blanks.map(blank => [blank.id, blank]));

    const normalizedBlanks: MatchingBlank[] = placeholderIds.map((id, index) => {
      const existing = existingBlanks.get(id);
      return {
        id,
        label: existing?.label ?? `Luka ${index + 1}`,
        correctWordId: existing?.correctWordId ?? null
      };
    });

    updateContent({
      storyText: value,
      blanks: normalizedBlanks
    });
  };

  const handleInsertBlank = () => {
    const textarea = textAreaRef.current;
    const currentText = tile.content.storyText ?? '';
    const newBlankId = `blank-${Date.now().toString(36)}`;
    const placeholder = `[[${newBlankId}]]`;

    if (!textarea) {
      handleStoryTextChange(`${currentText}${currentText.endsWith(' ') || !currentText ? '' : ' '}${placeholder}`);
      return;
    }

    const { selectionStart, selectionEnd } = textarea;
    const before = currentText.slice(0, selectionStart);
    const after = currentText.slice(selectionEnd);
    const updatedText = `${before}${placeholder}${after}`;

    handleStoryTextChange(updatedText);

    requestAnimationFrame(() => {
      const cursor = selectionStart + placeholder.length;
      textarea.focus();
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  const handleBlankLabelChange = (blankId: string, value: string) => {
    const updatedBlanks = tile.content.blanks.map(blank =>
      blank.id === blankId ? { ...blank, label: value } : blank
    );
    updateContent({ blanks: updatedBlanks });
  };

  const handleBlankCorrectWordChange = (blankId: string, wordId: string) => {
    const normalizedId = wordId === '' ? null : wordId;
    const updatedBlanks = tile.content.blanks.map(blank =>
      blank.id === blankId ? { ...blank, correctWordId: normalizedId } : blank
    );
    updateContent({ blanks: updatedBlanks });
  };

  const handleWordTextChange = (wordId: string, value: string) => {
    const updatedWords = tile.content.wordBank.map(word =>
      word.id === wordId ? { ...word, text: value } : word
    );
    updateContent({ wordBank: updatedWords });
  };

  const handleAddWord = () => {
    const newWord: MatchingWord = {
      id: `word-${Date.now().toString(36)}`,
      text: `Nowe słowo ${tile.content.wordBank.length + 1}`
    };
    updateContent({ wordBank: [...tile.content.wordBank, newWord] });
  };

  const handleRemoveWord = (wordId: string) => {
    const updatedWords = tile.content.wordBank.filter(word => word.id !== wordId);
    const updatedBlanks = tile.content.blanks.map(blank =>
      blank.correctWordId === wordId ? { ...blank, correctWordId: null } : blank
    );

    updateContent({
      wordBank: updatedWords,
      blanks: updatedBlanks
    });
  };

  const placeholders = useMemo(() => extractPlaceholderIds(tile.content.storyText || ''), [tile.content.storyText]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kolor wiodący kafelka
          </label>
          <input
            type="color"
            value={tile.content.backgroundColor}
            onChange={(e) => updateContent({ backgroundColor: e.target.value })}
            className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
          />
        </div>

        <label className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
          <input
            type="checkbox"
            checked={tile.content.showBorder}
            onChange={(e) => updateContent({ showBorder: e.target.checked })}
            className="w-5 h-5 text-blue-600"
          />
          <div>
            <span className="text-sm font-medium text-gray-900">Pokaż dekoracyjną ramkę</span>
            <p className="text-xs text-gray-600 mt-1">
              Obramowanie dodaje subtelny akcent i pomaga oddzielić ćwiczenie od tła
            </p>
          </div>
        </label>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Tekst zadania z lukami
          </label>
          <button
            type="button"
            onClick={handleInsertBlank}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Wstaw lukę
          </button>
        </div>

        <textarea
          ref={textAreaRef}
          value={tile.content.storyText}
          onChange={(e) => handleStoryTextChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm leading-relaxed resize-vertical min-h-[140px]"
          placeholder="np. Fotony są nośnikami [[blank-1]] i przemieszczają się w [[blank-2]]."
        />

        <div className="flex items-start gap-2 text-xs text-gray-600 bg-blue-50 border border-blue-100 rounded-lg p-3">
          <Info className="w-4 h-4 text-blue-500 mt-0.5" />
          <div className="space-y-1">
            <p>
              Używaj nawiasów podwójnych, aby oznaczyć luki, np. <code className="font-mono text-blue-600">[[blank-1]]</code>.
              Każdy identyfikator musi być unikalny.
            </p>
            <p>
              Przycisk <strong>Wstaw lukę</strong> automatycznie doda nowy identyfikator w bieżącej pozycji kursora.
            </p>
          </div>
        </div>

        {placeholders.length === 0 && (
          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg p-3">
            <Type className="w-4 h-4" />
            <span>Dodaj przynajmniej jedną lukę, aby zadanie było interaktywne.</span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-800">Luki ({tile.content.blanks.length})</h3>
        </div>

        {tile.content.blanks.length === 0 ? (
          <div className="text-xs text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-lg p-4 text-center">
            Dodaj luki w tekście, aby zarządzać ich poprawnymi odpowiedziami.
          </div>
        ) : (
          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {tile.content.blanks.map((blank, index) => (
              <div key={blank.id} className="p-3 bg-white border border-gray-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5" />
                    {blank.id}
                  </span>
                  <span className="text-gray-400">Luka {index + 1}</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Etykieta pomocnicza
                    </label>
                    <input
                      type="text"
                      value={blank.label}
                      onChange={(e) => handleBlankLabelChange(blank.id, e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder={`Opis luki ${index + 1}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Poprawna odpowiedź
                    </label>
                    <select
                      value={blank.correctWordId ?? ''}
                      onChange={(e) => handleBlankCorrectWordChange(blank.id, e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                    >
                      <option value="">Wybierz z puli słów</option>
                      {tile.content.wordBank.map(word => (
                        <option key={word.id} value={word.id}>
                          {word.text}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-800">Pula słów ({tile.content.wordBank.length})</h3>
          <button
            type="button"
            onClick={handleAddWord}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Dodaj słowo
          </button>
        </div>

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {tile.content.wordBank.map((word) => (
            <div key={word.id} className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg">
              <input
                type="text"
                value={word.text}
                onChange={(e) => handleWordTextChange(word.id, e.target.value)}
                className="flex-1 px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Treść słowa"
              />
              <button
                type="button"
                onClick={() => handleRemoveWord(word.id)}
                className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Usuń słowo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {tile.content.wordBank.length === 0 && (
            <div className="text-xs text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-lg p-4 text-center">
              Dodaj słowa, aby uczniowie mogli przeciągać je do odpowiednich luk.
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Komunikat po poprawnym rozwiązaniu
          </label>
          <textarea
            value={tile.content.successFeedback}
            onChange={(e) => updateContent({ successFeedback: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm resize-vertical"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Komunikat po błędnej próbie
          </label>
          <textarea
            value={tile.content.failureFeedback}
            onChange={(e) => updateContent({ failureFeedback: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm resize-vertical"
            rows={3}
          />
        </div>
      </div>
    </div>
  );
};

