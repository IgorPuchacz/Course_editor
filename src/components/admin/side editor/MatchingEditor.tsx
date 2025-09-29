import React, { useState } from 'react';
import { Plus, Trash2, GripVertical, Sparkles, Square } from 'lucide-react';
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
  const [draggedPair, setDraggedPair] = useState<string | null>(null);

  const handleContentUpdate = (field: string, value: any) => {
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

  const addNewPair = () => {
    const newIndex = tile.content.pairs.length + 1;
    const newPair = {
      id: `pair-${Date.now()}`,
      left: `Element ${newIndex}`,
      right: `Dopasowanie ${newIndex}`
    };
    handleContentUpdate('pairs', [...tile.content.pairs, newPair]);
  };

  const removePair = (pairId: string) => {
    if (tile.content.pairs.length <= 2) return;
    const updatedPairs = tile.content.pairs.filter(pair => pair.id !== pairId);
    handleContentUpdate('pairs', updatedPairs);
  };

  const handleDragStart = (event: React.DragEvent, pairId: string) => {
    setDraggedPair(pairId);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (event: React.DragEvent, targetPairId: string) => {
    event.preventDefault();

    if (!draggedPair || draggedPair === targetPairId) {
      setDraggedPair(null);
      return;
    }

    const pairs = [...tile.content.pairs];
    const draggedIndex = pairs.findIndex(pair => pair.id === draggedPair);
    const targetIndex = pairs.findIndex(pair => pair.id === targetPairId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedPair(null);
      return;
    }

    const [draggedPairData] = pairs.splice(draggedIndex, 1);
    pairs.splice(targetIndex, 0, draggedPairData);

    handleContentUpdate('pairs', pairs);
    setDraggedPair(null);
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
            Parowanie ({tile.content.pairs.length})
          </label>
          <button
            onClick={addNewPair}
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
              onDragStart={event => handleDragStart(event, pair.id)}
              onDragOver={handleDragOver}
              onDrop={event => handleDrop(event, pair.id)}
              className={`flex flex-col gap-2 p-3 bg-white border rounded-lg transition-all ${
                draggedPair === pair.id ? 'opacity-60 scale-95' : 'hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-[0.2em]">
                  <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                  <span>Para {index + 1}</span>
                </div>
                <button
                  onClick={() => removePair(pair.id)}
                  disabled={tile.content.pairs.length <= 2}
                  className="p-1 text-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Usuń parę"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600">Lewa kolumna</label>
                  <input
                    type="text"
                    value={pair.left}
                    onChange={event => handlePairUpdate(pair.id, 'left', event.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tekst elementu"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600">Prawa kolumna</label>
                  <input
                    type="text"
                    value={pair.right}
                    onChange={event => handlePairUpdate(pair.id, 'right', event.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tekst dopasowania"
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

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Kolor tła kafelka</label>
          <input
            type="color"
            value={tile.content.backgroundColor}
            onChange={event => handleContentUpdate('backgroundColor', event.target.value)}
            className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Komunikat poprawnej odpowiedzi</label>
          <textarea
            value={tile.content.correctFeedback}
            onChange={event => handleContentUpdate('correctFeedback', event.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent resize-vertical"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Komunikat niepoprawnej odpowiedzi</label>
          <textarea
            value={tile.content.incorrectFeedback}
            onChange={event => handleContentUpdate('incorrectFeedback', event.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent resize-vertical"
            rows={3}
          />
        </div>
      </div>
    </div>
  );
};
