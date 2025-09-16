import React from 'react';
import { Type, X } from 'lucide-react';
import { TextTile, ImageTile, LessonTile } from '../../types/lessonEditor.ts';
import { ImageUploadComponent } from './ImageUploadComponent.tsx';
import { ImagePositionControl } from './ImagePositionControl.tsx';

interface TileSideEditorProps {
  tile: LessonTile | undefined;
  onUpdateTile: (tileId: string, updates: Partial<LessonTile>) => void;
  onSelectTile?: (tileId: string | null) => void;
}

export const TileSideEditor: React.FC<TileSideEditorProps> = ({
  tile,
  onUpdateTile,
  onSelectTile
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
              <label className="block text-sm font-medium text-gray-700 mb-3">Kolor tła opisu</label>
              <input
                type="color"
                value={programmingTile.content.backgroundColor}
                onChange={(e) => handleContentUpdate('backgroundColor', e.target.value)}
                className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
              />
            </div>

            {/* Programming Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Język programowania
              </label>
              <select
                value={programmingTile.content.language}
                onChange={(e) => handleContentUpdate('language', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="csharp">C#</option>
              </select>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 text-blue-600 mt-0.5">
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-1">Zadanie programistyczne</h4>
                  <p className="text-xs text-blue-700">
                    Górna sekcja zawiera opis zadania z formatowaniem tekstu. 
                    Dolna sekcja to edytor kodu - w przyszłości będzie obsługiwać wykonywanie kodu Python.
                  </p>
                </div>
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
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
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