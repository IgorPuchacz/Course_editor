import React from 'react';
import { Type, X } from 'lucide-react';
import { TextTile, ImageTile, LessonTile, ProgrammingTile, SequencingTile, QuizTile } from '../../../types/lessonEditor.ts';
import { ImageUploadComponent } from './ImageUploadComponent.tsx';
import { ImagePositionControl } from './ImagePositionControl.tsx';
import { SequencingEditor } from './SequencingEditor.tsx';

interface TileSideEditorProps {
  tile: LessonTile | undefined;
  onUpdateTile: (tileId: string, updates: Partial<LessonTile>) => void;
  onSelectTile?: (tileId: string | null) => void;
  isTesting?: boolean;
  onToggleTesting?: (tileId: string) => void;
}

export const TileSideEditor: React.FC<TileSideEditorProps> = ({
  tile,
  onUpdateTile,
  onSelectTile,
  isTesting = false,
  onToggleTesting
}) => {

  if (!tile) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Type className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Brak wybranego kafelka
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Ten panel powinien wyświetlać paletę kafelków
        </p>
      </div>
    );
  }

  // Auto-scale image to fit container when new image is selected
  const handleImageSelectWithAutoScale = (url: string, file?: File, shouldAutoScale?: boolean) => {
    console.log('Image selected:', url, 'shouldAutoScale:', shouldAutoScale);
    
    // Update the image URL first
    handleContentUpdate('url', url);
    
    // If this is a new upload/selection, auto-scale to fit
    if (shouldAutoScale && tile.type === 'image') {
      // Load the image to get its natural dimensions
      const img = new Image();
      img.onload = () => {
        const containerWidth = tile.size.width;
        const containerHeight = tile.size.height;
        
        // Calculate scale to fit (use the more restrictive dimension)
        const scaleX = containerWidth / img.naturalWidth;
        const scaleY = containerHeight / img.naturalHeight;
        const fitScale = Math.min(scaleX, scaleY);
        
        console.log('Auto-scaling image:', {
          naturalSize: { width: img.naturalWidth, height: img.naturalHeight },
          containerSize: { width: containerWidth, height: containerHeight },
          calculatedScale: fitScale
        });
        
        // Center the image and apply fit scale
        const scaledWidth = img.naturalWidth * fitScale;
        const scaledHeight = img.naturalHeight * fitScale;
        const centerX = (containerWidth - scaledWidth) / 2;
        const centerY = (containerHeight - scaledHeight) / 2;

        // Update position and scale (clamp position to non-positive values)
        handleContentUpdate('position', { x: Math.min(0, centerX), y: Math.min(0, centerY) });
        handleContentUpdate('scale', fitScale);
      };
      img.onerror = (error) => {
        console.error('Error loading image for auto-scaling:', error);
        // Fallback to default positioning if image fails to load
        handleContentUpdate('position', { x: 0, y: 0 });
        handleContentUpdate('scale', 1);
      };
      img.src = url;
    }
  };

  const getTileIcon = () => {
    switch (tile.type) {
      case 'text': return Type;
      case 'image': return Type; // You can import Image icon
      case 'quiz': return Type;
      default: return Type;
    }
  };

  const getTileTitle = () => {
    switch (tile.type) {
      case 'text': return 'Edytor Tekstu';
      case 'image': return 'Edytor Obrazu';
      case 'visualization': return 'Edytor Wizualizacji';
      case 'quiz': return 'Edytor Quiz';
      default: return 'Edytor Kafelka';
    }
  };

  const handleContentUpdate = (field: string, value: any) => {
    const updates = {
      content: {
        ...tile.content,
        [field]: value
      },
      updated_at: new Date().toISOString()
    };
    
    console.log('Updating image tile content:', field, value, updates);
    onUpdateTile(tile.id, updates);
  };

  const renderContentEditor = () => {
    switch (tile.type) {

      case 'text':
        { const textTile = tile as TextTile;
        return (
            <div className="space-y-6">

              {/* Background Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Kolor tła kafelka</label>
                <input
                    type="color"
                    value={textTile.content.backgroundColor}
                    onChange={(e) => handleContentUpdate('backgroundColor', e.target.value)}
                    className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
                />
              </div>

              {/* Border Toggle */}
              <div>
                <label className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <input
                      type="checkbox"
                      checked={textTile.content.showBorder}
                      onChange={(e) => handleContentUpdate('showBorder', e.target.checked)}
                      className="w-5 h-5 text-blue-600"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Pokaż obramowanie kafelka</span>
                    <p className="text-xs text-gray-600 mt-1">
                      Gdy wyłączone, tekst wtopi się w tło bez wizualnej ramki
                    </p>
                  </div>
                </label>
              </div>
            </div>
        ); }

      case 'image': {
        const imageTile = tile as ImageTile;
        return (
            <div className="space-y-4">
              {/* Image Selection */}
              <ImageUploadComponent
                  currentUrl={imageTile.content.url}
                  onImageSelect={handleImageSelectWithAutoScale}
              />

              {/* Image Positioning - only show if image is loaded */}
              {imageTile.content.url && (
                  <ImagePositionControl
                      imageUrl={imageTile.content.url}
                      position={imageTile.content.position || {x: 0, y: 0}}
                      scale={imageTile.content.scale || 1}
                      onPositionChange={(position) => handleContentUpdate('position', position)}
                      onScaleChange={(scale) => handleContentUpdate('scale', scale)}
                      containerWidth={tile.size.width}
                      containerHeight={tile.size.height}
                  />
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tekst alternatywny
                </label>
                <input
                    type="text"
                    value={imageTile.content.alt}
                    onChange={(e) => handleContentUpdate('alt', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Opis obrazu"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Podpis (opcjonalny)
                </label>
                <input
                    type="text"
                    value={imageTile.content.caption || ''}
                    onChange={(e) => handleContentUpdate('caption', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Podpis pod obrazem"
                />
              </div>
            </div>
        );
      }

      case 'programming': {
        const programmingTile = tile as ProgrammingTile;
        return (
          <div className="space-y-6">
            {/* Background Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Kolor tła</label>
              <input
                type="color"
                value={programmingTile.content.backgroundColor}
                onChange={(e) => handleContentUpdate('backgroundColor', e.target.value)}
                className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
              />
            </div>

            {/* Starting Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kod początkowy
              </label>
              <p className="text-xs text-gray-600 mb-2">
                Kod niemodyfikowalny dla ucznia
              </p>
              <textarea
                value={programmingTile.content.startingCode || ''}
                onChange={(e) => handleContentUpdate('startingCode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono resize-vertical"
                rows={4}
                placeholder="np. value1 = 23&#10;value2 = ['abc', 'def', 'ghi']"
                style={{ fontFamily: "'JetBrains Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace" }}
              />
            </div>

            {/* Ending Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kod końcowy
              </label>
              <p className="text-xs text-gray-600 mb-2">
                Kod niemodyfikowalny dla ucznia
              </p>
              <textarea
                value={programmingTile.content.endingCode || ''}
                onChange={(e) => handleContentUpdate('endingCode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono resize-vertical"
                rows={4}
                placeholder="np. print(value1, value2)"
                style={{ fontFamily: "'JetBrains Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace" }}
              />
            </div>
          </div>
        );
      }

      case 'sequencing': {
        const sequencingTile = tile as SequencingTile;
        return (
          <SequencingEditor
            tile={sequencingTile}
            onUpdateTile={onUpdateTile}
            isTesting={isTesting}
            onToggleTesting={onToggleTesting}
          />
        );
      }

      case 'quiz': {
        const quizTile = tile as QuizTile;

        const updateQuizContent = (updates: Partial<QuizTile['content']>) => {
          onUpdateTile(tile.id, {
            content: {
              ...quizTile.content,
              ...updates
            }
          });
        };

        const handleMultipleModeChange = (checked: boolean) => {
          let updatedAnswers = [...quizTile.content.answers];

          if (!checked) {
            const firstCorrectIndex = updatedAnswers.findIndex(answer => answer.isCorrect);
            const enforcedIndex = firstCorrectIndex >= 0 ? firstCorrectIndex : 0;
            updatedAnswers = updatedAnswers.map((answer, index) => ({
              ...answer,
              isCorrect: index === enforcedIndex
            }));
          }

          updateQuizContent({
            multipleCorrect: checked,
            answers: updatedAnswers
          });
        };

        const handleAnswerTextChange = (answerId: string, value: string) => {
          const updatedAnswers = quizTile.content.answers.map(answer =>
            answer.id === answerId ? { ...answer, text: value } : answer
          );
          updateQuizContent({ answers: updatedAnswers });
        };

        const handleAnswerCorrectToggle = (answerId: string) => {
          const updatedAnswers = quizTile.content.answers.map(answer => {
            if (answer.id !== answerId) {
              return quizTile.content.multipleCorrect ? answer : { ...answer, isCorrect: false };
            }

            if (quizTile.content.multipleCorrect) {
              return { ...answer, isCorrect: !answer.isCorrect };
            }

            return { ...answer, isCorrect: true };
          });

          updateQuizContent({ answers: updatedAnswers });
        };

        const handleAddAnswer = () => {
          const newAnswer = {
            id: `answer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            text: `Nowa odpowiedź ${quizTile.content.answers.length + 1}`,
            isCorrect: false
          };

          updateQuizContent({ answers: [...quizTile.content.answers, newAnswer] });
        };

        const handleRemoveAnswer = (answerId: string) => {
          if (quizTile.content.answers.length <= 1) {
            return;
          }

          let updatedAnswers = quizTile.content.answers.filter(answer => answer.id !== answerId);

          if (updatedAnswers.length === 0) {
            return;
          }

          if (!updatedAnswers.some(answer => answer.isCorrect)) {
            updatedAnswers = updatedAnswers.map((answer, index) => ({
              ...answer,
              isCorrect: index === 0
            }));
          }

          updateQuizContent({ answers: updatedAnswers });
        };

        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Kolor tła</label>
              <input
                type="color"
                value={quizTile.content.backgroundColor}
                onChange={(e) => handleContentUpdate('backgroundColor', e.target.value)}
                className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <label className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  checked={quizTile.content.multipleCorrect}
                  onChange={(e) => handleMultipleModeChange(e.target.checked)}
                  className="mt-1 h-5 w-5 text-blue-600"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Zezwalaj na wiele poprawnych odpowiedzi</span>
                  <p className="text-xs text-gray-600 mt-1">
                    Gdy wyłączone, tylko jedna odpowiedź będzie oznaczona jako poprawna.
                  </p>
                </div>
              </label>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Odpowiedzi</h4>
                  <p className="text-xs text-gray-500">Zarządzaj listą możliwych odpowiedzi quizu.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddAnswer}
                  className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700"
                >
                  Dodaj odpowiedź
                </button>
              </div>

              <div className="space-y-4">
                {quizTile.content.answers.map((answer, index) => (
                  <div key={answer.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        Odpowiedź {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAnswer(answer.id)}
                        disabled={quizTile.content.answers.length <= 1}
                        className="text-xs font-medium text-red-600 hover:text-red-700 disabled:text-gray-300 disabled:cursor-not-allowed"
                      >
                        Usuń
                      </button>
                    </div>

                    <input
                      type="text"
                      value={answer.text}
                      onChange={(e) => handleAnswerTextChange(answer.id, e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder={`Treść odpowiedzi ${index + 1}`}
                    />

                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type={quizTile.content.multipleCorrect ? 'checkbox' : 'radio'}
                        name={`quiz-correct-${tile.id}`}
                        checked={answer.isCorrect}
                        onChange={() => handleAnswerCorrectToggle(answer.id)}
                        className="h-4 w-4 text-blue-600"
                      />
                      <span>Oznacz jako poprawną odpowiedź</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      default:
        return (
          <div className="text-center text-gray-500 py-8">
            <p>Edytor dla tego typu kafelka nie jest jeszcze dostępny</p>
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              {React.createElement(getTileIcon(), { className: "w-5 h-5 text-blue-600" })}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{getTileTitle()}</h3>
              <p className="text-sm text-gray-600">Dostosuj właściwości kafelka</p>
            </div>
          </div>
          <button
            onClick={() => onSelectTile?.(null)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Zamknij edytor (powrót do dodawania)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Properties Panel */}
      <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-6">
        {renderContentEditor()}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-200">
        <div className="text-xs text-gray-500 space-y-1">
          <p>ID: {tile.id.slice(0, 8)}...</p>
          <p>Typ: {tile.type}</p>
          <p>Utworzony: {new Date(tile.created_at).toLocaleDateString('pl-PL')}</p>
          <p>Edytowany: {new Date(tile.updated_at).toLocaleDateString('pl-PL')}</p>
        </div>
      </div>
    </div>
  );
};