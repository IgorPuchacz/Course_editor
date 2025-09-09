import React, { useState, useRef, useCallback } from 'react';
import { Upload, Link, Image as ImageIcon, X, Check, AlertCircle } from 'lucide-react';

interface ImageUploadComponentProps {
  currentUrl: string;
  onImageSelect: (url: string, file?: File) => void;
  className?: string;
}

export const ImageUploadComponent: React.FC<ImageUploadComponentProps> = ({
  currentUrl,
  onImageSelect,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'url' | 'upload' | 'stock'>('url');
  const [urlInput, setUrlInput] = useState(currentUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stock images from Pexels (free to use)
  const stockImages = [
    {
      url: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400',
      title: 'Matematyka - tablica'
    },
    {
      url: 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=400',
      title: 'Książki'
    },
    {
      url: 'https://images.pexels.com/photos/256490/pexels-photo-256490.jpeg?auto=compress&cs=tinysrgb&w=400',
      title: 'Nauka - laboratorium'
    },
    {
      url: 'https://images.pexels.com/photos/301920/pexels-photo-301920.jpeg?auto=compress&cs=tinysrgb&w=400',
      title: 'Komputer - programowanie'
    },
    {
      url: 'https://images.pexels.com/photos/167699/pexels-photo-167699.jpeg?auto=compress&cs=tinysrgb&w=400',
      title: 'Wykres - analiza'
    },
    {
      url: 'https://images.pexels.com/photos/590016/pexels-photo-590016.jpg?auto=compress&cs=tinysrgb&w=400',
      title: 'Edukacja - szkoła'
    }
  ];

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Proszę wybrać plik obrazu');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Plik jest za duży. Maksymalny rozmiar to 5MB');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Create object URL for preview
      const objectUrl = URL.createObjectURL(file);
      onImageSelect(objectUrl, file);
    } catch (error) {
      setUploadError('Błąd podczas wczytywania pliku');
    } finally {
      setIsUploading(false);
    }
  }, [onImageSelect]);

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onImageSelect(urlInput.trim());
    }
  };

  const handleStockImageSelect = (url: string) => {
    onImageSelect(url);
  };

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const fakeEvent = {
        target: { files: [file] }
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(fakeEvent);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'url', label: 'URL', icon: Link },
          { id: 'upload', label: 'Plik', icon: Upload },
          { id: 'stock', label: 'Galeria', icon: ImageIcon }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center space-x-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === id
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm font-medium">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[200px]">
        {activeTab === 'url' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL obrazu
              </label>
              <div className="flex space-x-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="https://example.com/image.jpg"
                />
                <button
                  onClick={handleUrlSubmit}
                  disabled={!urlInput.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {currentUrl && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Podgląd
                </label>
                <img
                  src={currentUrl}
                  alt="Podgląd obrazu"
                  className="w-full h-32 object-cover rounded-lg border border-gray-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04NyA0OEw5MyA1NEw5OSA0OEwxMDUgNTRMMTEzIDQ2VjY2SDg3VjQ4WiIgZmlsbD0iI0Q1RDlERCIvPgo8Y2lyY2xlIGN4PSI5NCIgY3k9IjU0IiByPSIzIiBmaWxsPSIjRDVEOUREIi8+CjwvZz4KPC9zdmc+';
                  }}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="space-y-4">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Przeciągnij plik lub kliknij, aby wybrać
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Obsługiwane formaty: JPG, PNG, GIF, WebP (max 5MB)
              </p>
              
              {isUploading && (
                <div className="flex items-center justify-center space-x-2 text-blue-600">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">Wczytywanie...</span>
                </div>
              )}

              {uploadError && (
                <div className="flex items-center justify-center space-x-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{uploadError}</span>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {activeTab === 'stock' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Wybierz obraz z naszej galerii darmowych zdjęć
            </p>
            <div className="grid grid-cols-2 gap-3">
              {stockImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => handleStockImageSelect(image.url)}
                  className="group relative aspect-video rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all"
                >
                  <img
                    src={image.url}
                    alt={image.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all"></div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-white text-xs font-medium">{image.title}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};