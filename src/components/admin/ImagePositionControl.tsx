import React, { useState, useRef, useEffect } from 'react';
import { Move, RotateCcw, ZoomIn, ZoomOut, Maximize, Minimize } from 'lucide-react';

interface ImagePositionControlProps {
  imageUrl: string;
  position: { x: number; y: number };
  scale: number;
  onPositionChange: (position: { x: number; y: number }) => void;
  onScaleChange: (scale: number) => void;
  containerWidth: number;
  containerHeight: number;
  className?: string;
}

export const ImagePositionControl: React.FC<ImagePositionControlProps> = ({
  imageUrl,
  position,
  scale,
  onPositionChange,
  onScaleChange,
  containerWidth,
  containerHeight,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const previewRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Load image to get natural dimensions
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    // Calculate bounds to prevent image from moving too far
    const scaledWidth = imageSize.width * scale;
    const scaledHeight = imageSize.height * scale;
    
    // Allow some movement outside bounds but limit it
    const buffer = Math.min(scaledWidth * 0.1, scaledHeight * 0.1, 50); // 10% buffer or 50px max
    const minX = Math.min(-buffer, containerWidth - scaledWidth + buffer);
    const maxX = Math.max(buffer, containerWidth - scaledWidth - buffer);
    const minY = Math.min(-buffer, containerHeight - scaledHeight + buffer);
    const maxY = Math.max(buffer, containerHeight - scaledHeight - buffer);

    const boundedX = Math.max(minX, Math.min(maxX, newX));
    const boundedY = Math.max(minY, Math.min(maxY, newY));

    onPositionChange({ x: boundedX, y: boundedY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, position, scale, imageSize, containerWidth, containerHeight]);

  const handleScaleChange = (newScale: number) => {
    const clampedScale = Math.max(0.1, Math.min(3, newScale));
    
    // Calculate new position to keep image centered during scaling
    if (imageSize.width && imageSize.height) {
      const scaleDiff = clampedScale - scale;
      const imageCenterX = position.x + (imageSize.width * scale) / 2;
      const imageCenterY = position.y + (imageSize.height * scale) / 2;
      
      const newX = imageCenterX - (imageSize.width * clampedScale) / 2;
      const newY = imageCenterY - (imageSize.height * clampedScale) / 2;
      
      onPositionChange({ x: newX, y: newY });
    }
    
    onScaleChange(clampedScale);
  };

  const handleFitToContainer = () => {
    if (!imageSize.width || !imageSize.height) return;

    const scaleX = containerWidth / imageSize.width;
    const scaleY = containerHeight / imageSize.height;
    const fitScale = Math.min(scaleX, scaleY);
    
    onScaleChange(fitScale);
    
    // Center the image
    const scaledWidth = imageSize.width * fitScale;
    const scaledHeight = imageSize.height * fitScale;
    const centerX = (containerWidth - scaledWidth) / 2;
    const centerY = (containerHeight - scaledHeight) / 2;
    
    onPositionChange({ x: centerX, y: centerY });
  };

  const handleFillContainer = () => {
    if (!imageSize.width || !imageSize.height) return;

    const scaleX = containerWidth / imageSize.width;
    const scaleY = containerHeight / imageSize.height;
    const fillScale = Math.max(scaleX, scaleY);
    
    onScaleChange(fillScale);
    
    // Center the image
    const scaledWidth = imageSize.width * fillScale;
    const scaledHeight = imageSize.height * fillScale;
    const centerX = (containerWidth - scaledWidth) / 2;
    const centerY = (containerHeight - scaledHeight) / 2;
    
    onPositionChange({ x: centerX, y: centerY });
  };

  const handleReset = () => {
    onScaleChange(1);
    onPositionChange({ x: 0, y: 0 });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Preview Container */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700">Pozycjonowanie obrazu</h4>
          <div className="text-xs text-gray-500">
            {Math.round(scale * 100)}% | {containerWidth}×{containerHeight}px
          </div>
        </div>
        
        <div
          ref={previewRef}
          className="relative bg-white border-2 border-gray-200 rounded-lg overflow-hidden cursor-move"
          style={{ 
            width: Math.min(300, containerWidth), 
            height: Math.min(200, containerHeight),
            aspectRatio: `${containerWidth}/${containerHeight}`
          }}
        >
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Podgląd pozycjonowania"
            className="absolute select-none"
            style={{
              left: position.x * (Math.min(300, containerWidth) / containerWidth),
              top: position.y * (Math.min(200, containerHeight) / containerHeight),
              width: imageSize.width * scale * (Math.min(300, containerWidth) / containerWidth),
              height: imageSize.height * scale * (Math.min(200, containerHeight) / containerHeight),
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
            onMouseDown={handleMouseDown}
            draggable={false}
          />
          
          {/* Grid overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="w-full h-full grid grid-cols-3 grid-rows-3 border border-gray-400">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="border border-gray-400"></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        {/* Scale Controls */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Powiększenie
          </label>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleScaleChange(scale - 0.1)}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Pomniejsz"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={scale}
              onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
              className="flex-1"
            />
            
            <button
              onClick={() => handleScaleChange(scale + 0.1)}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Powiększ"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            
            <span className="text-sm text-gray-600 w-12 text-center">
              {Math.round(scale * 100)}%
            </span>
          </div>
        </div>

        {/* Position Controls */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pozycja
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">X (poziomo)</label>
              <input
                type="number"
                value={Math.round(position.x)}
                onChange={(e) => onPositionChange({ ...position, x: parseInt(e.target.value) || 0 })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Y (pionowo)</label>
              <input
                type="number"
                value={Math.round(position.y)}
                onChange={(e) => onPositionChange({ ...position, y: parseInt(e.target.value) || 0 })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Szybkie akcje
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleFitToContainer}
              className="flex items-center justify-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Minimize className="w-4 h-4" />
              <span>Dopasuj</span>
            </button>
            
            <button
              onClick={handleFillContainer}
              className="flex items-center justify-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Maximize className="w-4 h-4" />
              <span>Wypełnij</span>
            </button>
            
            <button
              onClick={handleReset}
              className="flex items-center justify-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors col-span-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Resetuj pozycję</span>
            </button>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 rounded-lg p-3">
        <div className="flex items-start space-x-2">
          <Move className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Jak używać:</p>
            <ul className="text-xs space-y-1">
              <li>• Przeciągnij obraz w podglądzie, aby zmienić pozycję</li>
              <li>• Użyj suwaka lub przycisków do zmiany powiększenia</li>
              <li>• "Dopasuj" - cały obraz będzie widoczny</li>
              <li>• "Wypełnij" - obraz wypełni cały kafelek</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};