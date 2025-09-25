import React from 'react';
import { Plus, Trash2, Sparkles, Info } from 'lucide-react';
import { QuizTile } from '../../../types/lessonEditor.ts';

interface QuizEditorProps {
  tile: QuizTile;
  onUpdateTile: (tileId: string, updates: Partial<QuizTile>) => void;
}

export const QuizEditor: React.FC<QuizEditorProps> = ({ tile, onUpdateTile }) => {
  const handleContentUpdate = <K extends keyof QuizTile['content']>(
    field: K,
    value: QuizTile['content'][K]
  ) => {
    onUpdateTile(tile.id, {
      content: {
        ...tile.content,
        [field]: value
      },
      updated_at: new Date().toISOString()
    });
  };

  const handleAnswerTextChange = (index: number, text: string) => {
    const answers = tile.content.answers.map((answer, idx) =>
      idx === index ? { ...answer, text } : answer
    );
    handleContentUpdate('answers', answers);
  };

  const handleAnswerCorrectToggle = (index: number) => {
    if (tile.content.multipleCorrect) {
      const answers = tile.content.answers.map((answer, idx) =>
        idx === index ? { ...answer, isCorrect: !answer.isCorrect } : answer
      );
      handleContentUpdate('answers', answers);
      return;
    }

    const answers = tile.content.answers.map((answer, idx) => ({
      ...answer,
      isCorrect: idx === index ? !answer.isCorrect : false
    }));
    handleContentUpdate('answers', answers);
  };

  const addAnswer = () => {
    const newAnswer = {
      text: `Nowa odpowiedź ${tile.content.answers.length + 1}`,
      isCorrect: false
    };

    handleContentUpdate('answers', [...tile.content.answers, newAnswer]);
  };

  const removeAnswer = (index: number) => {
    const answers = tile.content.answers.filter((_, idx) => idx !== index);
    handleContentUpdate('answers', answers);
  };

  const handleModeChange = (multiple: boolean) => {
    if (tile.content.answers.length === 0) {
      handleContentUpdate('multipleCorrect', multiple);
      return;
    }

    const firstCorrectIndex = tile.content.answers.findIndex(
      (ans) => ans.isCorrect && ans.text.trim() !== ''
    );

    const fallbackIndex = firstCorrectIndex !== -1 ? firstCorrectIndex : 0;

    const answers = multiple
      ? tile.content.answers
      : tile.content.answers.map((answer, index) => ({
          ...answer,
          isCorrect: index === fallbackIndex
        }));

    onUpdateTile(tile.id, {
      content: {
        ...tile.content,
        multipleCorrect: multiple,
        answers
      },
      updated_at: new Date().toISOString()
    });
  };

  const correctAnswersCount = tile.content.answers.filter(answer => answer.isCorrect).length;

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900">Tryb pytania</h3>
            <p className="text-xs text-gray-600 mt-1">
              Wybierz, czy uczeń może zaznaczyć jedną czy wiele poprawnych odpowiedzi.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3">
              <label className={`flex items-start gap-3 px-3 py-3 rounded-lg border cursor-pointer transition-colors ${
                tile.content.multipleCorrect
                  ? 'border-gray-200 hover:border-gray-300'
                  : 'border-blue-500 bg-blue-50'
              }`}>
                <input
                  type="radio"
                  name="quiz-mode"
                  checked={!tile.content.multipleCorrect}
                  onChange={() => handleModeChange(false)}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">Jedna poprawna odpowiedź</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Uczeń wybiera dokładnie jedną odpowiedź. Idealne do pytań testowych.
                  </p>
                </div>
              </label>

              <label className={`flex items-start gap-3 px-3 py-3 rounded-lg border cursor-pointer transition-colors ${
                tile.content.multipleCorrect
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="quiz-mode"
                  checked={tile.content.multipleCorrect}
                  onChange={() => handleModeChange(true)}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">Wiele poprawnych odpowiedzi</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Uczeń może zaznaczyć kilka odpowiedzi. Świetne do pytań wielokrotnego wyboru.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Odpowiedzi ({tile.content.answers.length})
            </label>
            <p className="text-xs text-gray-500">Zaznacz, które odpowiedzi są poprawne.</p>
          </div>
          <button
            type="button"
            onClick={addAnswer}
            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Dodaj odpowiedź
          </button>
        </div>

        <div className="space-y-2">
          {tile.content.answers.map((answer, index) => (
            <div
              key={`${tile.id}-answer-${index}`}
              className="flex flex-col gap-2 p-4 bg-white border border-gray-200 rounded-xl shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs uppercase tracking-[0.2em] text-gray-400">
                  {index + 1 < 10 ? `0${index + 1}` : index + 1}
                </span>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
                    <input
                      type={tile.content.multipleCorrect ? 'checkbox' : 'radio'}
                      name={`answer-correct-${tile.id}`}
                      checked={answer.isCorrect}
                      onChange={() => handleAnswerCorrectToggle(index)}
                      className="w-4 h-4"
                    />
                    Poprawna odpowiedź
                  </label>
                  <button
                    type="button"
                    onClick={() => removeAnswer(index)}
                    disabled={tile.content.answers.length <= 2}
                    className="p-2 text-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Usuń odpowiedź"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <input
                type="text"
                value={answer.text}
                onChange={e => handleAnswerTextChange(index, e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={`Treść odpowiedzi ${index + 1}`}
              />
            </div>
          ))}
        </div>

        {tile.content.answers.length < 2 && (
          <div className="mt-3 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
            <Info className="w-4 h-4 mt-0.5" />
            <p>Dodaj co najmniej dwie odpowiedzi, aby quiz był funkcjonalny.</p>
          </div>
        )}

        {!tile.content.multipleCorrect && correctAnswersCount === 0 && (
          <div className="mt-3 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
            <Info className="w-4 h-4 mt-0.5" />
            <p>Wybierz jedną poprawną odpowiedź, aby uczniowie mogli otrzymać informację zwrotną.</p>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Kolor tła kafelka
        </label>
        <input
          type="color"
          value={tile.content.backgroundColor}
          onChange={e => handleContentUpdate('backgroundColor', e.target.value)}
          className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
        />
      </div>
    </div>
  );
};

