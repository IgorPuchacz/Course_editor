import React from 'react';
import { Plus, Trash2, Paperclip, Shuffle } from 'lucide-react';
import { LessonTile, OpenTile } from '../../../types/lessonEditor.ts';

interface OpenEditorProps {
  tile: OpenTile;
  onUpdateTile: (tileId: string, updates: Partial<LessonTile>) => void;
}

export const OpenEditor: React.FC<OpenEditorProps> = ({ tile, onUpdateTile }) => {
  const attachments = tile.content.attachments ?? [];
  const pairs = tile.content.pairs ?? [];

  const handleContentUpdate = (field: keyof OpenTile['content'], value: OpenTile['content'][typeof field]) => {
    onUpdateTile(tile.id, {
      content: {
        ...tile.content,
        [field]: value
      },
      updated_at: new Date().toISOString()
    });
  };

  const handleAttachmentChange = (attachmentId: string, field: 'name' | 'url', value: string) => {
    const updated = attachments.map(attachment =>
      attachment.id === attachmentId ? { ...attachment, [field]: value } : attachment
    );
    handleContentUpdate('attachments', updated);
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    const updated = attachments.filter(attachment => attachment.id !== attachmentId);
    handleContentUpdate('attachments', updated);
  };

  const handleAddAttachment = () => {
    const newAttachment = {
      id: `attachment-${Date.now()}`,
      name: `Załącznik ${attachments.length + 1}`,
      url: ''
    };
    handleContentUpdate('attachments', [...attachments, newAttachment]);
  };

  const handlePairChange = (pairId: string, field: 'prompt' | 'answer', value: string) => {
    const updatedPairs = pairs.map(pair =>
      pair.id === pairId ? { ...pair, [field]: value } : pair
    );
    handleContentUpdate('pairs', updatedPairs);
  };

  const handleRemovePair = (pairId: string) => {
    const updatedPairs = pairs.filter(pair => pair.id !== pairId);
    handleContentUpdate('pairs', updatedPairs);
  };

  const handleAddPair = () => {
    const newPair = {
      id: `pair-${Date.now()}`,
      prompt: `Przykładowe wejście ${pairs.length + 1}`,
      answer: `Przykładowa odpowiedź ${pairs.length + 1}`
    };
    handleContentUpdate('pairs', [...pairs, newPair]);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Kolor tła kafelka</label>
        <input
          type="color"
          value={tile.content.backgroundColor}
          onChange={(event) => handleContentUpdate('backgroundColor', event.target.value)}
          className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
        />
      </div>

      <div>
        <label className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
          <input
            type="checkbox"
            checked={tile.content.showBorder}
            onChange={(event) => handleContentUpdate('showBorder', event.target.checked)}
            className="w-5 h-5 text-blue-600"
          />
          <div>
            <span className="text-sm font-medium text-gray-900">Pokaż obramowanie kafelka</span>
            <p className="text-xs text-gray-600 mt-1">
              Gdy wyłączone, kafelek wtopi się w tło bez dodatkowej ramki.
            </p>
          </div>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Opis oczekiwanego formatu odpowiedzi
        </label>
        <textarea
          value={tile.content.expectedFormat}
          onChange={(event) => handleContentUpdate('expectedFormat', event.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          placeholder="np. oczekiwany format: ['napis1', 'napis2', 'napis3']"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Paperclip className="w-4 h-4" />
            <span>Materiały do pobrania</span>
          </div>
          <button
            type="button"
            onClick={handleAddAttachment}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition"
          >
            <Plus className="w-4 h-4" />
            Dodaj
          </button>
        </div>

        {attachments.length === 0 ? (
          <p className="text-sm text-gray-600">
            Dodaj pliki, które uczniowie będą mogli pobrać przed rozpoczęciem zadania.
          </p>
        ) : (
          <div className="space-y-3">
            {attachments.map(attachment => (
              <div key={attachment.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={attachment.name}
                      onChange={(event) => handleAttachmentChange(attachment.id, 'name', event.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Nazwa pliku"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(attachment.id)}
                      className="inline-flex items-center justify-center text-rose-600 hover:bg-rose-50 p-2 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={attachment.url}
                    onChange={(event) => handleAttachmentChange(attachment.id, 'url', event.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Adres URL lub ścieżka do pliku"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Shuffle className="w-4 h-4" />
            <span>Przykładowe pary do walidacji</span>
          </div>
          <button
            type="button"
            onClick={handleAddPair}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition"
          >
            <Plus className="w-4 h-4" />
            Dodaj parę
          </button>
        </div>

        {pairs.length === 0 ? (
          <p className="text-sm text-gray-600">
            Dodaj przykładowe pary wejść i oczekiwanych odpowiedzi. W podglądzie kafelka zostaną one automatycznie przemieszane.
          </p>
        ) : (
          <div className="space-y-3">
            {pairs.map(pair => (
              <div key={pair.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3">
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    value={pair.prompt}
                    onChange={(event) => handlePairChange(pair.id, 'prompt', event.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Opis wejścia"
                  />
                  <input
                    type="text"
                    value={pair.answer}
                    onChange={(event) => handlePairChange(pair.id, 'answer', event.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Oczekiwana odpowiedź"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemovePair(pair.id)}
                      className="inline-flex items-center justify-center text-rose-600 hover:bg-rose-50 px-3 py-1 rounded-lg text-sm"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Usuń
                    </button>
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

export default OpenEditor;
