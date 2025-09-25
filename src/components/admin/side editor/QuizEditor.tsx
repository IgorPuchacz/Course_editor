import React from 'react';
import { Plus, Trash2, CheckCircle2, Circle, AlertTriangle } from 'lucide-react';
import { QuizTile } from '../../../types/lessonEditor.ts';

interface QuizEditorProps {
  tile: QuizTile;
  onUpdateTile: (tileId: string, updates: Partial<QuizTile>) => void;
}

export const QuizEditor: React.FC<QuizEditorProps> = ({ tile, onUpdateTile }) => {
  const updateContent = (updates: Partial<QuizTile['content']>) => {
    onUpdateTile(tile.id, {
      content: {
        ...tile.content,
        ...updates
      },
      updated_at: new Date().toISOString()
    });
  };

  const handleAnswerChange = (answerId: string, field: 'text' | 'isCorrect', value: string | boolean) => {
    const updatedAnswers = tile.content.answers.map(answer =>
      answer.id === answerId ? { ...answer, [field]: value } : answer
    );

    updateContent({ answers: updatedAnswers });
  };

  const toggleCorrect = (answerId: string) => {
    const answer = tile.content.answers.find(item => item.id === answerId);
    if (!answer) return;

    if (tile.content.multipleCorrect) {
      handleAnswerChange(answerId, 'isCorrect', !answer.isCorrect);
      return;
    }

    const updatedAnswers = tile.content.answers.map(item => ({
      ...item,
      isCorrect: item.id === answerId ? !item.isCorrect : false
    }));

    updateContent({ answers: updatedAnswers });
  };

  const addAnswer = () => {
    const newAnswer = {
      id: `${tile.id}-answer-${Date.now()}`,
      text: `Odpowiedź ${tile.content.answers.length + 1}`,
      isCorrect: false
    };

    updateContent({ answers: [...tile.content.answers, newAnswer] });
  };

  const removeAnswer = (answerId: string) => {
    updateContent({
      answers: tile.content.answers.filter(answer => answer.id !== answerId)
    });
  };

  const handleModeChange = (isMultiple: boolean) => {
    let updatedAnswers = tile.content.answers;

    if (!isMultiple) {
      const firstCorrect = tile.content.answers.find(answer => answer.isCorrect);
      if (firstCorrect) {
        updatedAnswers = tile.content.answers.map(answer => ({
          ...answer,
          isCorrect: answer.id === firstCorrect.id
        }));
      }
    }

    updateContent({
      multipleCorrect: isMultiple,
      answers: updatedAnswers
    });
  };

  const hasNoCorrectAnswer = tile.content.answers.every(answer => !answer.isCorrect);
  const hasTooFewAnswers = tile.content.answers.length < 2;

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Kolor tła kafelka</label>
        <input
          type="color"
          value={tile.content.backgroundColor}
          onChange={(event) => updateContent({ backgroundColor: event.target.value })}
          className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Tryb pytania</label>
        <div className="grid grid-cols-2 gap-3">
          {[{ value: false, label: 'Jedna odpowiedź' }, { value: true, label: 'Wiele odpowiedzi' }].map(option => {
            const isActive = tile.content.multipleCorrect === option.value;
            return (
              <button
                key={String(option.value)}
                type="button"
                onClick={() => handleModeChange(option.value)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'border-gray-200 text-gray-700 hover:border-blue-400 hover:text-blue-600'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Zdecyduj, czy uczeń może zaznaczyć więcej niż jedną odpowiedź.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Odpowiedzi ({tile.content.answers.length})
          </label>
          <button
            type="button"
            onClick={addAnswer}
            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-500 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Dodaj
          </button>
        </div>

        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {tile.content.answers.map((answer, index) => {
            const label = String.fromCharCode(65 + index);
            const isCorrect = answer.isCorrect;

            return (
              <div key={answer.id} className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-600">
                    {label}
                  </div>
                  <input
                    type="text"
                    value={answer.text}
                    onChange={(event) => handleAnswerChange(answer.id, 'text', event.target.value)}
                    placeholder={`Treść odpowiedzi ${label}`}
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => toggleCorrect(answer.id)}
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${
                      isCorrect
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 text-gray-600 hover:border-emerald-400 hover:text-emerald-600'
                    }`}
                  >
                    {isCorrect ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <Circle className="w-3 h-3" />
                    )}
                    {isCorrect ? 'Poprawna odpowiedź' : 'Oznacz jako poprawną'}
                  </button>

                  <button
                    type="button"
                    onClick={() => removeAnswer(answer.id)}
                    disabled={tile.content.answers.length <= 2}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-red-500 transition-colors hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 className="w-3 h-3" />
                    Usuń
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {hasTooFewAnswers && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            <AlertTriangle className="w-4 h-4" />
            Dodaj co najmniej dwie odpowiedzi, aby quiz był wiarygodny.
          </div>
        )}

        {hasNoCorrectAnswer && (
          <div className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">
            <AlertTriangle className="w-4 h-4" />
            Zaznacz przynajmniej jedną odpowiedź jako poprawną.
          </div>
        )}
      </div>
    </div>
  );
};
