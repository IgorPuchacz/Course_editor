import React, { useState } from 'react';
import { Plus, Trash2, GripVertical, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react';
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

  const handleContentUpdate = (field: string, value: any) => {
    onUpdateTile(tile.id, {
      content: {
        ...tile.content,
        [field]: value
      },
      updated_at: new Date().toISOString()
    });
  };

  const handleItemUpdate = (itemId: string, field: string, value: any) => {
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

  const moveItem = (itemId: string, direction: 'up' | 'down') => {
    const items = [...tile.content.items];
    const currentIndex = items.findIndex(item => item.id === itemId);
    
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= items.length) return;
    
    // Swap items
    [items[currentIndex], items[newIndex]] = [items[newIndex], items[currentIndex]];
    
    // Update correct positions
    const updatedItems = items.map((item, index) => ({
      ...item,
      correctPosition: index
    }));
    
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
      {/* Question Settings */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pytanie/Polecenie
        </label>
        <textarea
          value={tile.content.question}
          onChange={(e) => handleContentUpdate('question', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-vertical"
          rows={2}
          placeholder="Wprowadź pytanie lub polecenie dla uczniów"
        />
      </div>

      {/* Items Management */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Elementy do uporządkowania ({tile.content.items.length})
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
          {tile.content.items.map((item, index) => (
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
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </div>
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
                  onClick={() => moveItem(item.id, 'up')}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Przesuń w górę"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  onClick={() => moveItem(item.id, 'down')}
                  disabled={index === tile.content.items.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Przesuń w dół"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
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
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded mt-2">
            ⚠️ Dodaj co najmniej 2 elementy, aby ćwiczenie było funkcjonalne
          </div>
        )}
      </div>

      {/* Feedback Settings */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Komunikat przy prawidłowej odpowiedzi
          </label>
          <input
            type="text"
            value={tile.content.correctFeedback}
            onChange={(e) => handleContentUpdate('correctFeedback', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            placeholder="np. Świetnie! Prawidłowa kolejność."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Komunikat przy błędnej odpowiedzi
          </label>
          <input
            type="text"
            value={tile.content.incorrectFeedback}
            onChange={(e) => handleContentUpdate('incorrectFeedback', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            placeholder="np. Spróbuj ponownie. Sprawdź kolejność elementów."
          />
        </div>
      </div>

      {/* Exercise Options */}
      <div className="space-y-4">
        <label className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
          <input
            type="checkbox"
            checked={tile.content.allowMultipleAttempts}
            onChange={(e) => handleContentUpdate('allowMultipleAttempts', e.target.checked)}
            className="w-5 h-5 text-blue-600"
          />
          <div>
            <span className="text-sm font-medium text-gray-900">Pozwól na wielokrotne próby</span>
            <p className="text-xs text-gray-600 mt-1">
              Uczniowie mogą próbować układać elementy do momentu uzyskania prawidłowej odpowiedzi
            </p>
          </div>
        </label>

        <label className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
          <input
            type="checkbox"
            checked={tile.content.showPositionNumbers}
            onChange={(e) => handleContentUpdate('showPositionNumbers', e.target.checked)}
            className="w-5 h-5 text-blue-600"
          />
          <div>
            <span className="text-sm font-medium text-gray-900">Pokaż numery pozycji</span>
            <p className="text-xs text-gray-600 mt-1">
              Wyświetl numery pozycji przy elementach, aby ułatwić układanie
            </p>
          </div>
        </label>
      </div>

      {/* Background Color */}
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