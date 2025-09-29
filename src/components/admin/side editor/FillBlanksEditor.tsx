import React, { useMemo } from 'react';
import { FillBlanksSlot, FillBlanksTile, FillBlanksWord, LessonTile } from '../../../types/lessonEditor';
import { Plus, Trash2 } from 'lucide-react';

interface FillBlanksEditorProps {
  tile: FillBlanksTile;
  onUpdateTile: (tileId: string, updates: Partial<LessonTile>) => void;
}

const FONT_OPTIONS = [
  { label: 'Inter', value: 'Inter, system-ui, sans-serif' },
  { label: 'Roboto', value: 'Roboto, sans-serif' },
  { label: 'Lora', value: 'Lora, serif' },
  { label: 'Poppins', value: 'Poppins, sans-serif' }
];

const generateSlotId = (index: number) => `fill-slot-${index}-${Math.random().toString(36).slice(2, 7)}`;

export const FillBlanksEditor: React.FC<FillBlanksEditorProps> = ({ tile, onUpdateTile }) => {
  const placeholderCount = useMemo(() => (tile.content.textTemplate.match(/___/g) || []).length, [tile.content.textTemplate]);

  const ensureSlotsMatchTemplate = (textTemplate: string, currentSlots: FillBlanksSlot[]): FillBlanksSlot[] => {
    const matches = textTemplate.match(/___/g) || [];
    return matches.map((_, index) => currentSlots[index] ?? { id: generateSlotId(index), correctWordId: null });
  };

  const handleContentUpdate = (updates: Partial<FillBlanksTile['content']>) => {
    onUpdateTile(tile.id, {
      content: {
        ...tile.content,
        ...updates
      },
      updated_at: new Date().toISOString()
    });
  };

  const handleTemplateChange = (value: string) => {
    const updatedSlots = ensureSlotsMatchTemplate(value, tile.content.slots);
    handleContentUpdate({
      textTemplate: value,
      slots: updatedSlots
    });
  };

  const handleWordUpdate = (wordId: string, value: string) => {
    const updatedWordBank = tile.content.wordBank.map(word =>
      word.id === wordId ? { ...word, text: value } : word
    );
    handleContentUpdate({ wordBank: updatedWordBank });
  };

  const handleAddWord = () => {
    const newWord: FillBlanksWord = {
      id: `word-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text: `Nowe słowo ${tile.content.wordBank.length + 1}`
    };
    handleContentUpdate({ wordBank: [...tile.content.wordBank, newWord] });
  };

  const handleRemoveWord = (wordId: string) => {
    const updatedWordBank = tile.content.wordBank.filter(word => word.id !== wordId);
    const updatedSlots = tile.content.slots.map(slot =>
      slot.correctWordId === wordId ? { ...slot, correctWordId: null } : slot
    );
    handleContentUpdate({
      wordBank: updatedWordBank,
      slots: updatedSlots
    });
  };

  const handleCorrectWordChange = (slotId: string, wordId: string | null) => {
    const updatedSlots = tile.content.slots.map(slot =>
      slot.id === slotId ? { ...slot, correctWordId: wordId } : slot
    );
    handleContentUpdate({ slots: updatedSlots });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Kolor akcentu</label>
        <input
          type="color"
          value={tile.content.backgroundColor}
          onChange={(event) => handleContentUpdate({ backgroundColor: event.target.value })}
          className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
        />
      </div>

      <div>
        <label className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
          <input
            type="checkbox"
            checked={tile.content.showBorder}
            onChange={(event) => handleContentUpdate({ showBorder: event.target.checked })}
            className="w-5 h-5 text-blue-600"
          />
          <div>
            <span className="text-sm font-medium text-gray-900">Pokaż obramowanie kafelka</span>
            <p className="text-xs text-gray-600 mt-1">
              Obwódka pomaga wyróżnić kafelek na tle innych elementów.
            </p>
          </div>
        </label>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Treść zadania</label>
        <p className="text-xs text-gray-500">
          Użyj sekwencji <span className="font-semibold">___</span> w miejscach, które mają zostać uzupełnione.
        </p>
        <textarea
          value={tile.content.textTemplate}
          onChange={(event) => handleTemplateChange(event.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-vertical"
          rows={5}
        />
        <p className="text-xs text-gray-500">Liczba luk w tekście: {placeholderCount}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Rodzina czcionki</label>
          <select
            value={tile.content.fontFamily}
            onChange={(event) => handleContentUpdate({ fontFamily: event.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            {FONT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Rozmiar tekstu</label>
          <input
            type="number"
            min={12}
            max={36}
            value={tile.content.fontSize}
            onChange={(event) => handleContentUpdate({ fontSize: Number(event.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-800">Bank słów</h4>
          <button
            type="button"
            onClick={handleAddWord}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition"
          >
            <Plus className="w-4 h-4" />
            Dodaj słowo
          </button>
        </div>

        <div className="space-y-3">
          {tile.content.wordBank.map(word => (
            <div key={word.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Słowo</span>
                <button
                  type="button"
                  onClick={() => handleRemoveWord(word.id)}
                  className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-50 transition"
                >
                  <Trash2 className="w-4 h-4" />
                  Usuń
                </button>
              </div>
              <input
                type="text"
                value={word.text}
                onChange={(event) => handleWordUpdate(word.id, event.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-800">Poprawne odpowiedzi</h4>
        {tile.content.slots.length === 0 ? (
          <p className="text-sm text-gray-600">
            Dodaj w treści zadania sekwencję <span className="font-semibold">___</span>, aby utworzyć lukę do uzupełnienia.
          </p>
        ) : (
          <div className="space-y-3">
            {tile.content.slots.map((slot, index) => (
              <div key={slot.id} className="border border-gray-200 rounded-xl p-4 bg-white flex flex-col gap-2">
                <span className="text-sm font-medium text-gray-700">Luka {index + 1}</span>
                <select
                  value={slot.correctWordId ?? ''}
                  onChange={(event) => handleCorrectWordChange(slot.id, event.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">Wybierz poprawne słowo</option>
                  {tile.content.wordBank.map(word => (
                    <option key={word.id} value={word.id}>
                      {word.text}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
