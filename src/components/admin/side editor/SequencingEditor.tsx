import React, { useState } from 'react';
import { Plus, Trash2, GripVertical, RotateCcw, Info } from 'lucide-react';
import { SequencingTile } from '../../../types/lessonEditor.ts';

interface SequencingEditorProps {
  tile: SequencingTile;
  onUpdateTile: (tileId: string, updates: Partial<SequencingTile>) => void;
}

export const SequencingEditor: React.FC<SequencingEditorProps> = ({
  tile,
  onUpdateTile
}) => {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const handleContentUpdate = <K extends keyof SequencingTile['content']>(
    field: K,
    value: SequencingTile['content'][K]
  ) => {
    onUpdateTile(tile.id, {
      content: {
        ...tile.content,
        [field]: value
      },
      updated_at: new Date().toISOString()
    });
  };

  const handleItemUpdate = <K extends keyof SequencingTile['content']['items'][number]>(
    itemId: string,
    field: K,
    value: SequencingTile['content']['items'][number][K]
  ) => {
    const updatedItems = tile.content.items.map(item =>
      item.id === itemId ? { ...item, [field]: value } : item
    );
    handleContentUpdate('items', updatedItems);
  };

  const addNewItem = () => {
    const newItem = {
      id: `item-${Date.now()}`,
      text: `Nowy element ${tile.content.items.length + 1}`,
      correctPosition: tile.content.items.length
    };
    handleContentUpdate('items', [...tile.content.items, newItem]);
  };

  const removeItem = (itemId: string) => {
    const updatedItems = tile.content.items
      .filter(item => item.id !== itemId)
      .map((item, index) => ({ ...item, correctPosition: index }));
    handleContentUpdate('items', updatedItems);
  };

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetItemId: string) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === targetItemId) {
      setDraggedItem(null);
      return;
    }

    const items = [...tile.content.items];
    const draggedIndex = items.findIndex(item => item.id === draggedItem);
    const targetIndex = items.findIndex(item => item.id === targetItemId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedItem(null);
      return;
    }

    // Remove dragged item and insert at target position
    const [draggedItemData] = items.splice(draggedIndex, 1);
    items.splice(targetIndex, 0, draggedItemData);

    // Update correct positions
    const updatedItems = items.map((item, index) => ({
      ...item,
      correctPosition: index
    }));

    handleContentUpdate('items', updatedItems);
    setDraggedItem(null);
  };

  const resetToDefaultOrder = () => {
    const resetItems = tile.content.items.map((item, index) => ({
      ...item,
      correctPosition: index
    }));
    handleContentUpdate('items', resetItems);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/80 px-4 py-3 text-sm text-blue-700">
        <div className="mt-0.5 rounded-full bg-blue-100 p-2 text-blue-600">
          <Info className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-blue-800">Edytuj polecenie bezpośrednio na kafelku</p>
          <p className="text-xs leading-relaxed text-blue-600">
            Podwójne kliknięcie kafelka otworzy menu, w którym możesz przełączyć się w tryb edycji RichText lub przetestować zadanie oczami ucznia.
          </p>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Kolor tła kafelka</label>
          <input
            type="color"
            value={tile.content.backgroundColor}
            onChange={(e) => handleContentUpdate('backgroundColor', e.target.value)}
            className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
          />
        </div>

        <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <input
            type="checkbox"
            checked={tile.content.showBorder !== false}
            onChange={(e) => handleContentUpdate('showBorder', e.target.checked)}
            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-800">Pokaż delikatne obramowanie</span>
            <p className="text-xs text-gray-500">Wyłącz, jeśli kafelek ma płynnie łączyć się z tłem.</p>
          </div>
        </label>
      </div>

      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Poprawna kolejność ({tile.content.items.length})
          </label>
          <div className="flex items-center space-x-2">
            <button
              onClick={resetToDefaultOrder}
              className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
              title="Resetuj kolejność"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
            <button
              onClick={addNewItem}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Dodaj</span>
            </button>
          </div>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {tile.content.items.map((item) => (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, item.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, item.id)}
              className={`flex items-center space-x-2 p-3 bg-white border rounded-lg transition-all ${
                draggedItem === item.id ? 'opacity-50 scale-95' : 'hover:shadow-sm'
              }`}
            >
              <div className="flex items-center space-x-2">
                <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
              </div>

              <input
                type="text"
                value={item.text}
                onChange={(e) => handleItemUpdate(item.id, 'text', e.target.value)}
                className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tekst elementu"
              />

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => removeItem(item.id)}
                  disabled={tile.content.items.length <= 2}
                  className="p-1 text-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Usuń element"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {tile.content.items.length < 2 && (
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
            ⚠️ Dodaj co najmniej 2 elementy, aby ćwiczenie było funkcjonalne
          </div>
        )}
      </div>
    </div>
  );
};