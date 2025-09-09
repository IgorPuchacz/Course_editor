import React, { useState } from 'react';
import { Type, AlignLeft, AlignCenter, AlignRight, AlignLeft as AlignTop, AlignCenterVertical, PanelBottom as AlignBottom, Plus, Trash2, Edit3 } from 'lucide-react';
import { TextTile, ImageTile, InteractiveTile, VisualizationTile, QuizTile, LessonTile } from '../types/lessonEditor';
import { FontSelector } from './components/admin/FontSelector';
import { RichTextEditor } from './components/admin/RichTextEditor';
import { ImageUploadComponent } from './components/admin/ImageUploadComponent';
import { ImagePositionControl } from './components/admin/ImagePositionControl';

interface TextTileEditorProps {
  tile: LessonTile | undefined;
  onUpdateTile: (tileId: string, updates: Partial<LessonTile>) => void;
  onStopEditing: () => void;
  isEditing: boolean;
}

export const TextTileEditor: React.FC<TextTileEditorProps> = ({
  tile,
  onUpdateTile,
  onStopEditing,
  isEditing
}) => {
  const [activeTab, setActiveTab] = useState<'content' | 'style'>('content');

  if (!tile) {
    return (
      <div className="p-6 text-center text-gray-500">
        <Type className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>Wybierz kafelek, aby edytować jego właściwości</p>
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
        
        // Update position and scale
        handleContentUpdate('position', { x: centerX, y: centerY });
        handleContentUpdate('scale', fitScale);
      };
      img.src = url;
    }
  };

  const getTileIcon = () => {
    switch (tile.type) {
      case 'text': return Type;
      case 'image': return Type; // You can import Image icon
      case 'interactive': return Type; // You can import Puzzle icon
      case 'visualization': return Type; // You can import BarChart3 icon
      default: return Type;
    }
  };

  const getTileTitle = () => {
    switch (tile.type) {
      case 'text': return 'Edytor Tekstu';
      case 'image': return 'Edytor Obrazu';
      case 'interactive': return 'Edytor Zadania';
      case 'visualization': return 'Edytor Wykresu';
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

  const handlePositionUpdate = (field: 'x' | 'y', value: number) => {
    onUpdateTile(tile.id, {
      position: {
        ...tile.position,
        [field]: Math.max(0, value)
      }
    });
  };

  const handleSizeUpdate = (field: 'width' | 'height', value: number) => {
    onUpdateTile(tile.id, {
      size: {
        ...tile.size,
        [field]: Math.max(50, value) // Minimum size
      }
    });
  };

  const renderContentEditor = () => {
    switch (tile.type) {
      case 'text':
        const textTile = tile as TextTile;
        return (
          <div className="space-y-4">
            {/* Content Input Section */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Edit3 className="w-4 h-4 text-gray-600" />
                <h4 className="font-medium text-gray-900">Zawartość tekstowa</h4>
              </div>

              <RichTextEditor
                content={textTile.content.richText || textTile.content.text}
                onChange={(richText) => {
                  console.log('Updating richText:', richText);
                  
                  // Update both richText and plain text
                  const tempDiv = document.createElement('div');
                  tempDiv.innerHTML = richText;
                  const plainText = tempDiv.textContent || tempDiv.innerText || '';
                  
                  // Update tile with both formats and force re-render
                  onUpdateTile(tile.id, {
                    content: {
                      ...textTile.content,
                      richText: richText,
                      text: plainText
                    },
                    updated_at: new Date().toISOString()
                  });
                }}
              />
            </div>

            {/* Simple formatting hint */}
            <div className="text-xs text-gray-500 text-center">
              Zaznacz tekst, aby sformatować
            </div>
          </div>
        );

      case 'image':
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
                position={imageTile.content.position || { x: 0, y: 0 }}
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

      case 'interactive':
        const interactiveTile = tile as InteractiveTile;
        
        // Quiz functionality for interactive tiles
        if (interactiveTile.content.interactionType === 'quiz') {
          return (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tytuł quiz
                </label>
                <input
                  type="text"
                  value={interactiveTile.content.title}
                  onChange={(e) => handleContentUpdate('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Tytuł quiz"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pytanie
                </label>
                <textarea
                  value={interactiveTile.content.data?.question || ''}
                  onChange={(e) => {
                    const newData = { ...interactiveTile.content.data, question: e.target.value };
                    handleContentUpdate('data', newData);
                  }}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                  placeholder="Wprowadź pytanie quiz..."
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Odpowiedzi
                  </label>
                  <button
                    onClick={() => {
                      const currentAnswers = interactiveTile.content.data?.answers || [];
                      const newAnswers = [...currentAnswers, ''];
                      const newData = { ...interactiveTile.content.data, answers: newAnswers };
                      handleContentUpdate('data', newData);
                    }}
                    className="text-blue-600 hover:text-blue-700 p-1"
                    title="Dodaj odpowiedź"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-2">
                  {(interactiveTile.content.data?.answers || []).map((answer: string, index: number) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name={`quiz-${tile.id}`}
                        checked={interactiveTile.content.data?.correct === index}
                        onChange={() => {
                          const newData = { ...interactiveTile.content.data, correct: index };
                          handleContentUpdate('data', newData);
                        }}
                        className="w-4 h-4 text-blue-600"
                      />
                      <input
                        type="text"
                        value={answer}
                        onChange={(e) => {
                          const newAnswers = [...(interactiveTile.content.data?.answers || [])];
                          newAnswers[index] = e.target.value;
                          const newData = { ...interactiveTile.content.data, answers: newAnswers };
                          handleContentUpdate('data', newData);
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder={`Odpowiedź ${index + 1}`}
                      />
                      {(interactiveTile.content.data?.answers || []).length > 1 && (
                        <button
                          onClick={() => {
                            const newAnswers = (interactiveTile.content.data?.answers || []).filter((_: any, i: number) => i !== index);
                            const newData = { ...interactiveTile.content.data, answers: newAnswers };
                            handleContentUpdate('data', newData);
                          }}
                          className="text-red-600 hover:text-red-700 p-1"
                          title="Usuń odpowiedź"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        }
        return (
          <div className="text-center text-gray-500 py-8">
            <p>Edytor dla tego typu interakcji nie jest jeszcze dostępny</p>
          </div>
        );

      default:
        return (
          <div className="text-center text-gray-500 py-8">
            <p>Edytor dla tego typu kafelka nie jest jeszcze dostępny</p>
          </div>
        );
    }
  };

  const renderStyleEditor = () => {
    if (tile.type !== 'text') {
      return (
        <div className="text-center text-gray-500 py-8">
          <p>Opcje stylu dostępne tylko dla kafelków tekstowych</p>
        </div>
      );
    }

    const textTile = tile as TextTile;
    
    return (
      <div className="space-y-6">
        {/* Global Styling Header */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Type className="w-4 h-4 text-gray-600" />
            <h4 className="font-medium text-gray-900">Styl całego kafelka</h4>
          </div>
          <p className="text-sm text-gray-600">
            Te ustawienia wpływają na cały tekst w kafelku. Formatowanie fragmentów tekstu znajdziesz w zakładce "Zawartość".
          </p>
        </div>

        {/* Font Selection */}
        <FontSelector
          selectedFont={textTile.content.fontFamily}
          onChange={(font) => handleContentUpdate('fontFamily', font)}
        />

        {/* Font Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Rozmiar czcionki</label>
          <input
            type="range"
            min="12"
            max="48"
            value={textTile.content.fontSize}
            onChange={(e) => handleContentUpdate('fontSize', parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>12px</span>
            <span className="font-medium">{textTile.content.fontSize}px</span>
            <span>48px</span>
          </div>
        </div>

        {/* Text Alignment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Wyrównanie poziome</label>
          <div className="flex space-x-1">
            {[
              { value: 'left', icon: AlignLeft, label: 'Do lewej' },
              { value: 'center', icon: AlignCenter, label: 'Do środka' },
              { value: 'right', icon: AlignRight, label: 'Do prawej' }
            ].map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => handleContentUpdate('textAlign', value)}
                className={`flex-1 p-2 border rounded-lg transition-colors ${
                  textTile.content.textAlign === value
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
                title={label}
              >
                <Icon className="w-4 h-4 mx-auto" />
              </button>
            ))}
          </div>
        </div>

        {/* Vertical Text Alignment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Wyrównanie pionowe</label>
          <div className="flex space-x-1">
            {[
              { value: 'top', icon: AlignTop, label: 'Do góry' },
              { value: 'center', icon: AlignCenterVertical, label: 'Do środka' },
              { value: 'bottom', icon: AlignBottom, label: 'Do dołu' }
            ].map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => handleContentUpdate('verticalAlign', value)}
                className={`flex-1 p-2 border rounded-lg transition-colors ${
                  textTile.content.verticalAlign === value
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
                title={label}
              >
                <Icon className="w-4 h-4 mx-auto" />
              </button>
            ))}
          </div>
        </div>

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
              <span className="text-sm font-medium text-gray-900">Pokaż ramkę kafelka</span>
              <p className="text-xs text-gray-600 mt-1">
                Gdy wyłączone, tekst wtopi się w tło bez wizualnej ramki
              </p>
            </div>
          </label>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            {React.createElement(getTileIcon(), { className: "w-5 h-5 text-blue-600" })}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{getTileTitle()}</h3>
            <p className="text-sm text-gray-600">Dostosuj właściwości kafelka</p>
          </div>
        </div>
      </div>

      {/* Tabs - Only show for text tiles */}
      {tile.type === 'text' && (
        <div className="border-b border-gray-200">
          <div className="flex">
            {[
              { id: 'content', label: 'Zawartość', description: 'Tekst i formatowanie fragmentów' },
              { id: 'style', label: 'Styl', description: 'Wygląd całego kafelka' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 px-6 py-4 text-left border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-sm">{tab.label}</div>
                <div className="text-xs text-gray-500 mt-1">{tab.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Properties Panel */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {tile.type === 'text' ? (
          <>
            {activeTab === 'content' && renderContentEditor()}
            {activeTab === 'style' && renderStyleEditor()}
          </>
        ) : (
          renderContentEditor()
        )}
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