import React, { useState } from 'react';
import { Plus, Trash2, Sparkles, Square, Link2 } from 'lucide-react';
import { MatchingTile } from '../../../types/lessonEditor';

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
  const [draggedPairId, setDraggedPairId] = useState<string | null>(null);

  const handleContentUpdate = (field: keyof MatchingTile['content'], value: any) => {
    onUpdateTile(tile.id, {
      content: {
        ...tile.content,
        [field]: value
      },
      updated_at: new Date().toISOString()
    });
  };

  const handlePairUpdate = (pairId: string, field: 'left' | 'right', value: string) => {
    const updatedPairs = tile.content.pairs.map(pair =>
      pair.id === pairId ? { ...pair, [field]: value } : pair
    );
    handleContentUpdate('pairs', updatedPairs);
  };

  const addPair = () => {
    const index = tile.content.pairs.length + 1;
    const newPair = {
      id: `pair-${Date.now()}`,
      left: `Element ${index}`,
      right: `Dopasowanie ${index}`
    };
    handleContentUpdate('pairs', [...tile.content.pairs, newPair]);
  };

  const removePair = (pairId: string) => {
    const updatedPairs = tile.content.pairs.filter(pair => pair.id !== pairId);
    handleContentUpdate('pairs', updatedPairs);
  };

  const handleDragStart = (e: React.DragEvent, pairId: string) => {
    setDraggedPairId(pairId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetPairId: string) => {
    e.preventDefault();

    if (!draggedPairId || draggedPairId === targetPairId) {
      setDraggedPairId(null);
      return;
    }

    const pairs = [...tile.content.pairs];
    const draggedIndex = pairs.findIndex(pair => pair.id === draggedPairId);
    const targetIndex = pairs.findIndex(pair => pair.id === targetPairId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedPairId(null);
      return;
    }

    const [draggedPair] = pairs.splice(draggedIndex, 1);
    pairs.splice(targetIndex, 0, draggedPair);

    handleContentUpdate('pairs', pairs);
    setDraggedPairId(null);
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
          >
            <Plus className="w-3 h-3" />
            <span>Dodaj</span>
          </button>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto">
          {tile.content.pairs.map((pair, index) => (
            <div
              key={pair.id}
              draggable
              onDragStart={e => handleDragStart(e, pair.id)}
              onDragOver={handleDragOver}
              onDrop={e => handleDrop(e, pair.id)}
              className={`p-4 bg-white border rounded-lg transition-all ${
                draggedPairId === pair.id ? 'opacity-50 scale-95' : 'hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-semibold">
                    {String.fromCharCode(65 + index)}
                  </div>
                  <div className="flex items-center gap-1 text-gray-500 text-xs">
                    <Link2 className="w-3 h-3" />
                    <span>Para</span>
                  </div>
                </div>
                <button
                  onClick={() => removePair(pair.id)}
                  disabled={tile.content.pairs.length <= 2}
                  className="p-1 text-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Usuń parę"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Lewy element</label>
                  <input
                    type="text"
                    value={pair.left}
                    onChange={e => handlePairUpdate(pair.id, 'left', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Wprowadź treść elementu po lewej stronie"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Dopasowanie</label>
                  <input
                    type="text"
                    value={pair.right}
                    onChange={e => handlePairUpdate(pair.id, 'right', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Wprowadź treść elementu po prawej stronie"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {tile.content.pairs.length < 2 && (
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded mt-2">
            ⚠️ Dodaj co najmniej 2 pary, aby ćwiczenie było funkcjonalne.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Kolor tła kafelka</label>
          <input
            type="color"
            value={tile.content.backgroundColor}
            onChange={e => handleContentUpdate('backgroundColor', e.target.value)}
            className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Informacja zwrotna - odpowiedź poprawna</label>
          <textarea
            value={tile.content.correctFeedback}
            onChange={e => handleContentUpdate('correctFeedback', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
            rows={3}
            placeholder="Tekst wyświetlany po poprawnym rozwiązaniu"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Informacja zwrotna - odpowiedź niepoprawna</label>
          <textarea
            value={tile.content.incorrectFeedback}
            onChange={e => handleContentUpdate('incorrectFeedback', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
            rows={3}
            placeholder="Tekst wyświetlany po błędnym rozwiązaniu"
          />
        </div>
      </div>
    </div>
  );
};

