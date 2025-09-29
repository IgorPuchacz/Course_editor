import React from 'react';
import { Link2, Plus, Sparkles, Square, Trash2 } from 'lucide-react';
import { MatchingTile } from '../../../types/lessonEditor.ts';

interface MatchingEditorProps {
  tile: MatchingTile;
  onUpdateTile: (tileId: string, updates: Partial<MatchingTile>) => void;
  isTesting?: boolean;
  onToggleTesting?: (tileId: string) => void;
}

export const MatchingEditor: React.FC<MatchingEditorProps> = ({
  tile,
  onUpdateTile,
  isTesting = false,
  onToggleTesting
}) => {
  const handleContentUpdate = (field: string, value: any) => {
    onUpdateTile(tile.id, {
      content: {
        ...tile.content,
        [field]: value
      },
      updated_at: new Date().toISOString()
    });
  };

  const handlePairUpdate = (pairId: string, field: 'leftText' | 'rightText', value: string) => {
    const updatedPairs = tile.content.pairs.map(pair =>
      pair.id === pairId ? { ...pair, [field]: value } : pair
    );
    handleContentUpdate('pairs', updatedPairs);
  };

  const addPair = () => {
    const index = tile.content.pairs.length + 1;
    const newPair = {
      id: `pair-${Date.now()}`,
      leftText: `Element ${index}`,
      rightText: `Dopasowanie ${index}`
    };
    handleContentUpdate('pairs', [...tile.content.pairs, newPair]);
  };

  const removePair = (pairId: string) => {
    if (tile.content.pairs.length <= 2) return;
    const updatedPairs = tile.content.pairs.filter(pair => pair.id !== pairId);
    handleContentUpdate('pairs', updatedPairs);
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

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Pary dopasowań ({tile.content.pairs.length})
          </label>
          <button
            onClick={addPair}
            className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
            type="button"
          >
            <Plus className="w-3 h-3" />
            <span>Dodaj</span>
          </button>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {tile.content.pairs.map((pair, index) => (
            <div
              key={pair.id}
              className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Link2 className="w-4 h-4 text-blue-500" />
                  <span>Para {index + 1}</span>
                </div>
                <button
                  onClick={() => removePair(pair.id)}
                  disabled={tile.content.pairs.length <= 2}
                  className="p-1 text-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  type="button"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Lewa strona</label>
                  <input
                    type="text"
                    value={pair.leftText}
                    onChange={(e) => handlePairUpdate(pair.id, 'leftText', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tekst po lewej"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Prawa strona</label>
                  <input
                    type="text"
                    value={pair.rightText}
                    onChange={(e) => handlePairUpdate(pair.id, 'rightText', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tekst po prawej"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {tile.content.pairs.length < 2 && (
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded mt-2">
            ⚠️ Dodaj co najmniej 2 pary, aby ćwiczenie było funkcjonalne
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Kolor tła kafelka</label>
        <input
          type="color"
          value={tile.content.backgroundColor}
          onChange={(e) => handleContentUpdate('backgroundColor', e.target.value)}
          className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
        />
      </div>
    </div>
  );
};
