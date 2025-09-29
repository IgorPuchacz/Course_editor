import React, { useMemo } from 'react';
import { Plus, Trash2, Sparkles, Square, Info } from 'lucide-react';
import { FillBlanksTile } from '../../../types/lessonEditor.ts';

interface FillBlanksEditorProps {
  tile: FillBlanksTile;
  onUpdateTile: (tileId: string, updates: Partial<FillBlanksTile>) => void;
  isTesting?: boolean;
  onToggleTesting?: (tileId: string) => void;
}

const BLANK_REGEX = /_{3,}/g;

export const FillBlanksEditor: React.FC<FillBlanksEditorProps> = ({
  tile,
  onUpdateTile,
  isTesting = false,
  onToggleTesting
}) => {
  const blankCount = useMemo(
    () => (tile.content.text.match(BLANK_REGEX) || []).length,
    [tile.content.text]
  );

  const updateContent = (updates: Partial<FillBlanksTile['content']>) => {
    onUpdateTile(tile.id, {
      content: {
        ...tile.content,
        ...updates
      },
      updated_at: new Date().toISOString()
    });
  };

  const syncBlanksWithText = (text: string) => {
    const matches = text.match(BLANK_REGEX) || [];
    let blanks = [...tile.content.blanks];

    if (matches.length > blanks.length) {
      const additions = Array.from({ length: matches.length - blanks.length }, (_, index) => ({
        id: `${tile.id}-blank-${Date.now()}-${index}`,
        correctAnswer: tile.content.wordBank[0] || ''
      }));
      blanks = [...blanks, ...additions];
    } else if (matches.length < blanks.length) {
      blanks = blanks.slice(0, matches.length);
    }

    return blanks;
  };

  const handleTextChange = (value: string) => {
    const blanks = syncBlanksWithText(value);
    updateContent({ text: value, blanks });
  };

  const handleWordBankChange = (index: number, value: string) => {
    const wordBank = tile.content.wordBank.map((word, idx) => (idx === index ? value : word));
    const blanks = tile.content.blanks.map(blank =>
      wordBank.includes(blank.correctAnswer) ? blank : { ...blank, correctAnswer: '' }
    );
    updateContent({ wordBank, blanks });
  };

  const handleAddWord = () => {
    updateContent({ wordBank: [...tile.content.wordBank, `Nowe słowo ${tile.content.wordBank.length + 1}`] });
  };

  const handleRemoveWord = (index: number) => {
    const wordBank = tile.content.wordBank.filter((_, idx) => idx !== index);
    const blanks = tile.content.blanks.map(blank =>
      wordBank.includes(blank.correctAnswer) ? blank : { ...blank, correctAnswer: '' }
    );
    updateContent({ wordBank, blanks });
  };

  const handleCorrectAnswerChange = (blankIndex: number, value: string) => {
    const blanks = tile.content.blanks.map((blank, idx) =>
      idx === blankIndex ? { ...blank, correctAnswer: value } : blank
    );
    updateContent({ blanks });
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
        <label className="block text-sm font-medium text-gray-700">
          Tekst zadania ({blankCount} {blankCount === 1 ? 'luka' : 'luki'})
        </label>
        <textarea
          value={tile.content.text}
          onChange={(event) => handleTextChange(event.target.value)}
          className="w-full min-h-[120px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          placeholder="Użyj ___ aby zaznaczyć miejsce na lukę"
        />
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <Info className="w-4 h-4" />
          Każde wystąpienie symbolu ___ zostanie zamienione na miejsce do przeciągnięcia słowa.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">Bank słów</h3>
          <button
            type="button"
            onClick={handleAddWord}
            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-100 transition"
          >
            <Plus className="w-4 h-4" />
            Dodaj słowo
          </button>
        </div>

        <div className="space-y-3">
          {tile.content.wordBank.length === 0 && (
            <div className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
              Dodaj co najmniej jedno słowo, aby przygotować bank wyrazów.
            </div>
          )}

          {tile.content.wordBank.map((word, index) => (
            <div key={`${tile.id}-word-${index}`} className="flex items-center gap-3">
              <input
                type="text"
                value={word}
                onChange={(event) => handleWordBankChange(index, event.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder={`Słowo ${index + 1}`}
              />
              <button
                type="button"
                onClick={() => handleRemoveWord(index)}
                className="p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                title="Usuń słowo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">Poprawne odpowiedzi</h3>
        {blankCount === 0 ? (
          <div className="text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
            Dodaj co najmniej jedną lukę w tekście, aby przypisać poprawne odpowiedzi.
          </div>
        ) : (
          <div className="space-y-3">
            {tile.content.blanks.map((blank, index) => (
              <div key={blank.id} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-semibold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Wybierz poprawne słowo dla luki {index + 1}
                  </label>
                  <select
                    value={blank.correctAnswer}
                    onChange={(event) => handleCorrectAnswerChange(index, event.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">— Wybierz słowo —</option>
                    {tile.content.wordBank.map((word) => (
                      <option key={`${blank.id}-${word}`} value={word}>
                        {word}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Kolor akcentu</label>
          <input
            type="color"
            value={tile.content.backgroundColor}
            onChange={(event) => updateContent({ backgroundColor: event.target.value })}
            className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Widoczna ramka</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => updateContent({ showBorder: true })}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition ${
                tile.content.showBorder
                  ? 'border-blue-500 bg-blue-50 text-blue-600'
                  : 'border-gray-200 text-gray-600 hover:border-blue-200'
              }`}
            >
              Włączona
            </button>
            <button
              type="button"
              onClick={() => updateContent({ showBorder: false })}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition ${
                !tile.content.showBorder
                  ? 'border-blue-500 bg-blue-50 text-blue-600'
                  : 'border-gray-200 text-gray-600 hover:border-blue-200'
              }`}
            >
              Wyłączona
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
