import React from 'react';
import {
  Plus,
  Trash2,
  Type,
  X,
  Image as ImageIcon,
  Eye,
  HelpCircle,
  Code,
  ArrowUpDown,
  Puzzle,
  FileText,
  Link2
} from 'lucide-react';
import {
  TextTile,
  ImageTile,
  LessonTile,
  ProgrammingTile,
  SequencingTile,
  QuizTile,
  BlanksTile,
  OpenTile,
  PairingTile
} from '../../../types/lessonEditor.ts';
import { ImageUploadComponent } from './ImageUploadComponent.tsx';
import { ImagePositionControl } from './ImagePositionControl.tsx';
import { SequencingEditor } from './SequencingEditor.tsx';
import { extractPlaceholdersFromTemplate } from '../../../utils/blanks.ts';

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
      case 'image': return ImageIcon;
      case 'visualization': return Eye;
      case 'quiz': return HelpCircle;
      case 'programming': return Code;
      case 'sequencing': return ArrowUpDown;
      case 'blanks': return Puzzle;
      case 'open': return FileText;
      case 'pairing': return Link2;
      default: return Type;
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

      case 'blanks': {
        const blanksTile = tile as BlanksTile;

        const updateContent = (updates: Partial<BlanksTile['content']>) => {
          onUpdateTile(tile.id, {
            content: {
              ...blanksTile.content,
              ...updates
            },
            updated_at: new Date().toISOString()
          });
        };

        const handleTemplateChange = (value: string) => {
          const placeholders = extractPlaceholdersFromTemplate(value);
          const autoOptions = placeholders.map(({ optionId, answerText }) => ({
            id: optionId,
            text: answerText,
            isAuto: true as const
          }));

          const blanks = placeholders.map(({ blankId, optionId }) => ({
            id: blankId,
            correctOptionId: optionId
          }));

          const distractors = blanksTile.content.options.filter(option => option.isAuto !== true);

          updateContent({
            textTemplate: value,
            blanks,
            options: [...autoOptions, ...distractors]
          });
        };

        const handleDistractorTextChange = (optionId: string, value: string) => {
          const options = blanksTile.content.options.map(option => {
            if (option.id !== optionId) {
              return option;
            }

            if (option.isAuto === true) {
              return option;
            }

            return { ...option, text: value };
          });

          updateContent({ options });
        };

        const handleAddDistractor = () => {
          const autoOptions = blanksTile.content.options.filter(option => option.isAuto === true);
          const distractors = blanksTile.content.options.filter(option => option.isAuto !== true);
          const newOptionId = `distractor-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
          const options = [
            ...autoOptions,
            ...distractors,
            {
              id: newOptionId,
              text: `Nowe wyrażenie ${distractors.length + 1}`,
              isAuto: false as const
            }
          ];
          updateContent({ options });
        };

        const handleRemoveDistractor = (optionId: string) => {
          const options = blanksTile.content.options.filter(option => option.id !== optionId || option.isAuto === true);
          updateContent({ options });
        };

        const autoOptions = blanksTile.content.options.filter(option => option.isAuto === true);
        const distractorOptions = blanksTile.content.options.filter(option => option.isAuto !== true);

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Kolor akcentu</label>
                <input
                  type="color"
                  value={blanksTile.content.backgroundColor}
                  onChange={(e) => updateContent({ backgroundColor: e.target.value })}
                  className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tekst z lukami</label>
              <p className="text-xs text-gray-600 mb-2">
                Wstaw poprawne odpowiedzi w podw&oacute;jnych nawiasach klamrowych, np. <code className="bg-gray-100 px-1 py-0.5 rounded">{'{{Warszawa}}'}</code>.
              </p>
              <textarea
                value={blanksTile.content.textTemplate}
                onChange={(e) => handleTemplateChange(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Tekst zadania z lukami"
              />
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900">Słowa Zapychacze</h4>
                  <button
                    type="button"
                    onClick={handleAddDistractor}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition"
                  >
                    <Plus className="w-4 h-4" />
                    Dodaj
                  </button>
                </div>

                {distractorOptions.length === 0 ? (
                  <p className="text-sm text-gray-600">
                    Dodaj dodatkowe słowa lub wyrażenia, które utrudnią zadanie uczniowi.
                  </p>
                ) : (
                    <div className="space-y-3">
                      {distractorOptions.map(option => (
                          <div
                              key={option.id}
                              className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3"
                          >
                            <div className="flex items-center gap-2">
                              <input
                                  type="text"
                                  value={option.text}
                                  onChange={(e) =>
                                      handleDistractorTextChange(option.id, e.target.value)
                                  }
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                  placeholder="Treść zapychacza"
                              />
                              <button
                                  type="button"
                                  onClick={() => handleRemoveDistractor(option.id)}
                                  className="inline-flex items-center justify-center text-rose-600 hover:bg-rose-50 p-2 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                      ))}
                    </div>

                )}
              </div>
            </div>
          </div>
        );
      }

      case 'open': {
        const openTile = tile as OpenTile;

        const updateContent = (updates: Partial<OpenTile['content']>) => {
          onUpdateTile(tile.id, {
            content: {
              ...openTile.content,
               ...updates
            },
            updated_at: new Date().toISOString()
          });
        };
        
        const handleAttachmentChange = (
          attachmentId: string,
          field: 'name' | 'url',
          value: string
        ) => {
          const attachments = (openTile.content.attachments ?? []).map(attachment =>
            attachment.id === attachmentId
              ? {
                  ...attachment,
                  [field]: value
                }
              : attachment
          );

          updateContent({ attachments });
        };

        const handleAddAttachment = () => {
          const attachments = openTile.content.attachments ?? [];
          const newAttachmentId = `attachment-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
          updateContent({
            attachments: [
              ...attachments,
              {
                id: newAttachmentId,
                name: `Nowy plik ${attachments.length + 1}`,
                url: ''
              }
            ]
          });
        };

        const handleRemoveAttachment = (attachmentId: string) => {
          const attachments = (openTile.content.attachments ?? []).filter(
            attachment => attachment.id !== attachmentId
          );

          updateContent({ attachments });
        };

        const attachments = openTile.content.attachments ?? [];
        
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Kolor akcentu</label>
              <input
                type="color"
                value={openTile.content.backgroundColor}
                onChange={(e) => updateContent({ backgroundColor: e.target.value })}
                className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Oczekiwany format odpowiedzi</label>
              <textarea
                value={openTile.content.expectedFormat}
                onChange={(e) => updateContent({ expectedFormat: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                rows={3}
                placeholder="np. ['napis1', 'napis2', 'napis3']"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900">Pliki do pobrania</h4>
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
                  Jeżeli to potrzebne, dodaj pliki, które uczeń będzie potrzebował do rozwiązania zadania.
                </p>
              ) : (
                <div className="space-y-3">
                  {attachments.map(attachment => (
                    <div
                      key={attachment.id}
                      className="border border-gray-200 rounded-xl p-4 bg-gray-50"
                    >
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] sm:items-end">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-gray-600">Nazwa pliku</label>
                          <input
                            type="text"
                            value={attachment.name}
                            onChange={(e) => handleAttachmentChange(attachment.id, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="np. instrukcja.pdf"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-gray-600">Adres URL</label>
                          <input
                            type="url"
                            required
                            value={attachment.url ?? ''}
                            onChange={(e) => handleAttachmentChange(attachment.id, 'url', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="https://example.com/pliki/instrukcja.pdf"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(attachment.id)}
                          className="inline-flex h-10 w-10 items-center justify-center self-start rounded-lg text-rose-600 transition hover:bg-rose-50 sm:self-end"
                          aria-label="Usuń plik"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Poprawna odpowiedź</label>
              <textarea
                value={openTile.content.correctAnswer ?? ''}
                onChange={(e) => updateContent({ correctAnswer: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                rows={4}
                placeholder="np. ['napis1', 'napis2', 'napis3']"
              />

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => updateContent({ ignoreCase: !openTile.content.ignoreCase })}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition ${
                    openTile.content.ignoreCase
                      ? 'border-blue-500 bg-blue-50 text-blue-600 shadow-sm'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {(openTile.content.ignoreCase ?? false)
                    ? 'Ignoruj wielkość liter'
                    : 'Rozróżniaj wielkość liter'}
                </button>

                <button
                  type="button"
                  onClick={() => updateContent({ ignoreWhitespace: !openTile.content.ignoreWhitespace })}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition ${
                    openTile.content.ignoreWhitespace
                      ? 'border-blue-500 bg-blue-50 text-blue-600 shadow-sm'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {(openTile.content.ignoreWhitespace ?? false)
                    ? 'Ignoruj białe znaki'
                    : 'Uwzględniaj białe znaki'}
                </button>
              </div>
            </div>
            </div>
        );
      }
        
      case 'pairing': {
        const pairingTile = tile as PairingTile;

        const updateContent = (updates: Partial<PairingTile['content']>) => {
          onUpdateTile(tile.id, {
            content: {
              ...pairingTile.content,
              ...updates
            },
            updated_at: new Date().toISOString()
          });
        };

        const handlePairChange = (pairId: string, field: 'left' | 'right', value: string) => {
          const pairs = pairingTile.content.pairs.map(pair =>
            pair.id === pairId ? { ...pair, [field]: value } : pair
          );
          updateContent({ pairs });
        };

        const handleAddPair = () => {
          const newPairId = `pair-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
          const pairs = [
            ...pairingTile.content.pairs,
            {
              id: newPairId,
              left: `Lewy element ${pairingTile.content.pairs.length + 1}`,
              right: `Prawy element ${pairingTile.content.pairs.length + 1}`
            }
          ];
          updateContent({ pairs });
        };

        const handleRemovePair = (pairId: string) => {
          const pairs = pairingTile.content.pairs.filter(pair => pair.id !== pairId);
          updateContent({ pairs });
        };

        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Kolor akcentu</label>
              <input
                type="color"
                value={pairingTile.content.backgroundColor}
                onChange={(e) => updateContent({ backgroundColor: e.target.value })}
                className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
              />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900">Pary do dopasowania</h4>
                <button
                  type="button"
                  onClick={handleAddPair}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition"
                >
                  <Plus className="w-4 h-4" />
                  Dodaj parę
                </button>
              </div>

              {pairingTile.content.pairs.length === 0 ? (
                <p className="text-sm text-gray-600">
                  Dodaj co najmniej jedną parę elementów, które uczniowie będą musieli połączyć.
                </p>
              ) : (
                <div className="space-y-3">
                  {pairingTile.content.pairs.map((pair, index) => (
                    <div
                      key={pair.id}
                      className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Para {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemovePair(pair.id)}
                          className="inline-flex items-center justify-center text-rose-600 hover:bg-rose-50 p-2 rounded-lg"
                          aria-label={`Usuń parę ${index + 1}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                            Element z lewej kolumny
                          </label>
                          <input
                            type="text"
                            value={pair.left}
                            onChange={(e) => handlePairChange(pair.id, 'left', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="Treść z lewej kolumny"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                            Dopasowanie w prawej kolumnie
                          </label>
                          <input
                            type="text"
                            value={pair.right}
                            onChange={(e) => handlePairChange(pair.id, 'right', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="Treść z prawej kolumny"
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
      }

      case 'quiz': {
        const quizTile = tile as QuizTile;

        const updateAnswers = (answers: QuizTile['content']['answers']) => {
          onUpdateTile(tile.id, {
            content: {
              ...quizTile.content,
              answers
            },
            updated_at: new Date().toISOString()
          });
        };

        const handleAnswerTextChange = (index: number, value: string) => {
          const answers = quizTile.content.answers.map((answer, idx) =>
            idx === index ? { ...answer, text: value } : answer
          );
          updateAnswers(answers);
        };

        const handleAnswerCorrectToggle = (index: number, checked: boolean) => {
          let answers: QuizTile['content']['answers'];

          if (quizTile.content.multipleCorrect) {
            answers = quizTile.content.answers.map((answer, idx) =>
              idx === index ? { ...answer, isCorrect: checked } : answer
            );
          } else {
            answers = quizTile.content.answers.map((answer, idx) => ({
              ...answer,
              isCorrect: idx === index ? checked : false
            }));
          }

          updateAnswers(answers);
        };

        const handleAddAnswer = () => {
          const newAnswers = [
            ...quizTile.content.answers,
            { text: `Nowa odpowiedź ${quizTile.content.answers.length + 1}`, isCorrect: false }
          ];
          updateAnswers(newAnswers);
        };

        const handleRemoveAnswer = (index: number) => {
          if (quizTile.content.answers.length <= 2) return;

          const newAnswers = quizTile.content.answers.filter((_, idx) => idx !== index);
          updateAnswers(newAnswers);
        };

        const handleModeChange = (multiple: boolean) => {
          if (!multiple) {
            const firstCorrectIndex = quizTile.content.answers.findIndex((answer) => answer.isCorrect);
            const answers = quizTile.content.answers.map((answer, idx) => ({
              ...answer,
              isCorrect: firstCorrectIndex === -1 ? false : idx === firstCorrectIndex
            }));
            updateAnswers(answers);
          }

          handleContentUpdate('multipleCorrect', multiple);
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
              <label className="block text-sm font-medium text-gray-700 mb-3">Tryb pytania</label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium cursor-pointer transition-colors ${
                    quizTile.content.multipleCorrect
                      ? 'border-gray-200 text-gray-600 hover:border-gray-300'
                      : 'border-blue-500 text-blue-600 shadow-sm'
                  }`}
                >
                  <span>Jedna odpowiedź</span>
                  <input
                    type="radio"
                    name={`quiz-mode-${tile.id}`}
                    checked={!quizTile.content.multipleCorrect}
                    onChange={() => handleModeChange(false)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                </label>
                <label
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium cursor-pointer transition-colors ${
                    quizTile.content.multipleCorrect
                      ? 'border-blue-500 text-blue-600 shadow-sm'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span>Wiele odpowiedzi</span>
                  <input
                    type="radio"
                    name={`quiz-mode-${tile.id}`}
                    checked={quizTile.content.multipleCorrect}
                    onChange={() => handleModeChange(true)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <div>
              <button
                  type="button"
                  onClick={handleAddAnswer}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition"
              >
                <Plus className="w-4 h-4" />
                Dodaj odpowiedź
              </button>
            </div>


            <div className="space-y-3">
                {quizTile.content.answers.map((answer, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-3 text-sm text-gray-700">
                        <input
                            type={quizTile.content.multipleCorrect ? 'checkbox' : 'radio'}
                            name={quizTile.content.multipleCorrect ? `answer-${tile.id}` : `correct-answer-${tile.id}`}
                            checked={answer.isCorrect}
                            onChange={(e) => handleAnswerCorrectToggle(index, e.target.checked)}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                      </label>

                      <input
                          type="text"
                          value={answer.text}
                          onChange={(e) => handleAnswerTextChange(index, e.target.value)}
                          className="flex-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder={`Treść odpowiedzi ${index + 1}`}
                      />

                      <button
                        type="button"
                        onClick={() => handleRemoveAnswer(index)}
                        disabled={quizTile.content.answers.length <= 2}
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg transition ${
                          quizTile.content.answers.length <= 2
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-rose-600 hover:bg-rose-50'
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
              <h3 className="text-lg font-semibold text-gray-900">Edytor Zadania</h3>
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
    </div>
  );
};