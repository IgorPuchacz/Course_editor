import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { GeneralTile, LessonTile } from '../../../types/lessonEditor.ts';

interface GeneralEditorProps {
  tile: GeneralTile;
  onUpdateTile: (tileId: string, updates: Partial<LessonTile>) => void;
}

const createPairId = () => `pair-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export const GeneralEditor: React.FC<GeneralEditorProps> = ({ tile, onUpdateTile }) => {
  const handleContentUpdate = (updates: Partial<GeneralTile['content']>) => {
    onUpdateTile(tile.id, {
      content: {
        ...tile.content,
        ...updates
      },
      updated_at: new Date().toISOString()
    });
  };

  const handlePairChange = (pairId: string, field: 'left' | 'right', value: string) => {
    const pairs = tile.content.pairs.map(pair =>
      pair.id === pairId ? { ...pair, [field]: value } : pair
    );
    handleContentUpdate({ pairs });
  };

  const handleAddPair = () => {
    const newPair = {
      id: createPairId(),
      left: `Lewy element ${tile.content.pairs.length + 1}`,
      right: `Prawy element ${tile.content.pairs.length + 1}`
    };
    handleContentUpdate({ pairs: [...tile.content.pairs, newPair] });
  };

  const handleRemovePair = (pairId: string) => {
    const pairs = tile.content.pairs.filter(pair => pair.id !== pairId);
    handleContentUpdate({ pairs });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Kolor tła kafelka</label>
        <input
          type="color"
          value={tile.content.backgroundColor}
          onChange={(event) => handleContentUpdate({ backgroundColor: event.target.value })}
          className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Pary ({tile.content.pairs.length})
          </label>
          <button
            type="button"
            onClick={handleAddPair}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition"
          >
            <Plus className="w-4 h-4" />
            Dodaj parę
          </button>
        </div>

        {tile.content.pairs.length === 0 ? (
          <p className="text-sm text-gray-600">
            Dodaj przynajmniej jedną parę, aby wyświetlić elementy w kafelku.
          </p>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {tile.content.pairs.map((pair, index) => (
              <div
                key={pair.id}
                className="border border-gray-200 rounded-xl bg-white shadow-sm p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">Para {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePair(pair.id)}
                    className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-600"
                    title="Usuń parę"
                  >
                    <Trash2 className="w-3 h-3" />
                    Usuń
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Lewa kolumna</label>
                    <input
                      type="text"
                      value={pair.left}
                      onChange={(event) => handlePairChange(pair.id, 'left', event.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Tekst elementu po lewej"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Prawa kolumna</label>
                    <input
                      type="text"
                      value={pair.right}
                      onChange={(event) => handlePairChange(pair.id, 'right', event.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Tekst elementu po prawej"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GeneralEditor;
