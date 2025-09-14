import React, { useState, useRef, useEffect, useMemo } from 'react';
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

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
  const [dragStart, setDragStart] = useState({x: 0, y: 0});
  const [imageSize, setImageSize] = useState({width: 0, height: 0});
  const [previewDimensions, setPreviewDimensions] = useState({width: 0, height: 0});
  const previewRef = useRef<HTMLDivElement>(null);

  // Update preview dimensions when container is rendered
  useEffect(() => {
    const updatePreviewDimensions = () => {
      if (previewRef.current) {
        const rect = previewRef.current.getBoundingClientRect();
        setPreviewDimensions({
          width: rect.width,
          height: rect.height
        });
        console.log('Preview dimensions updated:', {width: rect.width, height: rect.height});
      }
    };

    // Update dimensions on mount and when container size might change
    updatePreviewDimensions();

    // Add resize observer to handle dynamic size changes
    const resizeObserver = new ResizeObserver(updatePreviewDimensions);
    if (previewRef.current) {
      resizeObserver.observe(previewRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);
  // Load image to get natural dimensions
  useEffect(() => {
    if (!imageUrl) return;

    const img = new Image();
    img.onload = () => {
      console.log('Image loaded in position control:', img.naturalWidth, 'x', img.naturalHeight);
      setImageSize({width: img.naturalWidth, height: img.naturalHeight});
    };
    img.onerror = (error) => {
      console.error('Error loading image in position control:', error);
      setImageSize({width: 400, height: 300}); // Fallback dimensions
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Calculate accurate preview scale factor
  const previewScaleFactor = useMemo(() => {
    if (previewDimensions.width === 0 || previewDimensions.height === 0) {
      return 1; // Fallback when dimensions aren't available yet
    }

    const scaleX = previewDimensions.width / containerWidth;
    const scaleY = previewDimensions.height / containerHeight;

    // Use the same scale for both dimensions to maintain aspect ratio of the container
    const uniformScale = Math.min(scaleX, scaleY);

    console.log('Preview scale calculation:', {
      previewDimensions,
      containerSize: {width: containerWidth, height: containerHeight},
      scaleX,
      scaleY,
      uniformScale
    });

    return uniformScale;
  }, [previewDimensions, containerWidth, containerHeight]);


  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    // Calculate new position in preview coordinates
    const previewX = e.clientX - dragStart.x;
    const previewY = e.clientY - dragStart.y;
    
    // Convert back to actual container coordinates
    const newX = previewX / previewScaleFactor;
    const newY = previewY / previewScaleFactor;

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
  }, [isDragging, dragStart, position, scale, imageSize, containerWidth, containerHeight, previewScaleFactor]);

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

  const handleReset = () => {
    onScaleChange(1);
    onPositionChange({ x: 0, y: 0 });
  };
  
  return (
    <div className={`space-y-4 ${className}`}>

      {/* Controls */}
      <div className="space-y-4">
        {/* Scale Controls */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Powiększenie
          </label>
          <div className="mb-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
            💡 Wskazówka: kliknij dwukrotnie kafelek aby wygodnie go edytować
          </div>
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
              step="0.01"
              value={scale}
              onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
              className="flex-1"
            />
            
            <button
              onClick={() => handleScaleChange(scale + 0.01)}
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
          <div>
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
    </div>
  );
};