import React, { useState } from 'react';
import { Plus, Trash2, GripVertical, Sparkles, Square, Link2 } from 'lucide-react';
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

  const handlePairsUpdate = (pairs: MatchingTile['content']['pairs']) => {
    handleContentUpdate('pairs', pairs);
  };

  const handlePairUpdate = (pairId: string, field: 'left' | 'right', value: string) => {
    const updatedPairs = tile.content.pairs.map(pair =>
      pair.id === pairId ? { ...pair, [field]: value } : pair
    );
    handlePairsUpdate(updatedPairs);
  };

  const addNewPair = () => {
    const nextIndex = tile.content.pairs.length + 1;
    const newPair = {
      id: `pair-${Date.now()}`,
      left: `Element ${nextIndex}`,
      right: `Dopasowanie ${nextIndex}`
    };
    handlePairsUpdate([...tile.content.pairs, newPair]);
  };

  const removePair = (pairId: string) => {
    if (tile.content.pairs.length <= 2) return;
    const updatedPairs = tile.content.pairs.filter(pair => pair.id !== pairId);
    handlePairsUpdate(updatedPairs);
  };

  const handleDragStart = (e: React.DragEvent, pairId: string) => {
    setDraggedPair(pairId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetPairId: string) => {
    e.preventDefault();

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

    const [dragged] = pairs.splice(draggedIndex, 1);
    pairs.splice(targetIndex, 0, dragged);

    handlePairsUpdate(pairs);
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
            Pary do dopasowania ({tile.content.pairs.length})
          </label>
          <button
            onClick={addNewPair}
            className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Dodaj</span>
          </button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {tile.content.pairs.map(pair => (
            <div
              key={pair.id}
              draggable
              onDragStart={e => handleDragStart(e, pair.id)}
              onDragOver={handleDragOver}
              onDrop={e => handleDrop(e, pair.id)}
              className={`flex items-center gap-3 p-3 bg-white border rounded-lg transition-all ${
                draggedPair === pair.id ? 'opacity-50 scale-95' : 'hover:shadow-sm'
              }`}
            >
              <div className="flex items-center">
                <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={pair.left}
                  onChange={e => handlePairUpdate(pair.id, 'left', e.target.value)}
                  className="px-2 py-1 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Lewy element"
                />
                <input
                  type="text"
                  value={pair.right}
                  onChange={e => handlePairUpdate(pair.id, 'right', e.target.value)}
                  className="px-2 py-1 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Prawy element"
                />
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
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Link2 className="w-4 h-4 text-gray-500" />
            Informacja zwrotna
          </label>
          <div className="space-y-3">
            <div>
              <span className="text-xs uppercase text-gray-500">Sukces</span>
              <textarea
                value={tile.content.correctFeedback}
                onChange={e => handleContentUpdate('correctFeedback', e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-vertical"
                rows={2}
                placeholder="Komunikat po poprawnym rozwiązaniu"
              />
            </div>
            <div>
              <span className="text-xs uppercase text-gray-500">Błąd</span>
              <textarea
                value={tile.content.incorrectFeedback}
                onChange={e => handleContentUpdate('incorrectFeedback', e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-vertical"
                rows={2}
                placeholder="Komunikat po błędnym rozwiązaniu"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Kolor tła kafelka</label>
          <input
            type="color"
            value={tile.content.backgroundColor}
            onChange={e => handleContentUpdate('backgroundColor', e.target.value)}
            className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
          />
        </div>

        <label className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
          <input
            type="checkbox"
            checked={tile.content.showBorder}
            onChange={e => handleContentUpdate('showBorder', e.target.checked)}
            className="w-5 h-5 text-blue-600"
          />
          <div>
            <span className="text-sm font-medium text-gray-900">Pokaż obramowanie kafelka</span>
            <p className="text-xs text-gray-600 mt-1">
              Gdy wyłączone, treść kafelka będzie bez dodatkowej ramki
            </p>
          </div>
        </label>
      </div>
    </div>
  );
};
