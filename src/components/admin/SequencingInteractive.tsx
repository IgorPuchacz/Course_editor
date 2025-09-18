import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, RotateCcw, GripVertical } from 'lucide-react';
import { SequencingTile } from '../../types/lessonEditor';

interface SequencingInteractiveProps {
  tile: SequencingTile;
  isPreview?: boolean;
}

interface DraggedItem {
  id: string;
  text: string;
  originalIndex: number;
}

export const SequencingInteractive: React.FC<SequencingInteractiveProps> = ({
  tile,
  isPreview = false
}) => {
  const [currentOrder, setCurrentOrder] = useState<DraggedItem[]>([]);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Initialize with randomized order
  useEffect(() => {
    const shuffledItems = [...tile.content.items]
      .map((item, index) => ({
        id: item.id,
        text: item.text,
        originalIndex: index
      }))
      .sort(() => Math.random() - 0.5);
    
    setCurrentOrder(shuffledItems);
    setIsChecked(false);
    setIsCorrect(null);
    setAttempts(0);
  }, [tile.content.items]);

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (!draggedItem) return;

    const draggedIndex = currentOrder.findIndex(item => item.id === draggedItem);
    if (draggedIndex === -1 || draggedIndex === targetIndex) {
      setDraggedItem(null);
      return;
    }

    const newOrder = [...currentOrder];
    const [draggedItemData] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedItemData);

    setCurrentOrder(newOrder);
    setDraggedItem(null);
    
    // Reset check state when items are moved
    if (isChecked) {
      setIsChecked(false);
      setIsCorrect(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const checkSequence = () => {
    const isSequenceCorrect = currentOrder.every((item, index) => {
      const originalItem = tile.content.items.find(original => original.id === item.id);
      return originalItem && originalItem.correctPosition === index;
    });

    setIsCorrect(isSequenceCorrect);
    setIsChecked(true);
    setAttempts(prev => prev + 1);
  };

  const resetSequence = () => {
    const shuffledItems = [...tile.content.items]
      .map((item, index) => ({
        id: item.id,
        text: item.text,
        originalIndex: index
      }))
      .sort(() => Math.random() - 0.5);
    
    setCurrentOrder(shuffledItems);
    setIsChecked(false);
    setIsCorrect(null);
  };

  const getItemStyle = (index: number, itemId: string) => {
    let baseClasses = "flex items-center space-x-3 p-4 bg-white border-2 rounded-lg transition-all duration-200 cursor-grab active:cursor-grabbing select-none";
    
    if (draggedItem === itemId) {
      baseClasses += " opacity-50 scale-95 rotate-2";
    } else if (dragOverIndex === index && draggedItem && draggedItem !== itemId) {
      baseClasses += " border-blue-400 bg-blue-50 transform scale-105";
    } else if (isChecked && isCorrect !== null) {
      const originalItem = tile.content.items.find(item => item.id === itemId);
      const isInCorrectPosition = originalItem && originalItem.correctPosition === index;
      
      if (isInCorrectPosition) {
        baseClasses += " border-green-400 bg-green-50";
      } else {
        baseClasses += " border-red-400 bg-red-50";
      }
    } else {
      baseClasses += " border-gray-200 hover:border-gray-300 hover:shadow-sm";
    }

    return baseClasses;
  };

  return (
    <div className="w-full h-full p-4 space-y-4 overflow-auto">
      {/* Question */}
      <div className="text-center">
        <div
          className="text-lg font-medium text-gray-800 mb-2"
          style={{
            fontFamily: tile.content.fontFamily,
            fontSize: `${tile.content.fontSize}px`
          }}
          dangerouslySetInnerHTML={{
            __html: tile.content.richQuestion || tile.content.question
          }}
        />
        {attempts > 0 && (
          <div className="text-sm text-gray-600">
            Próba: {attempts}
          </div>
        )}
      </div>

      {/* Draggable Items */}
      <div className="space-y-3 flex-1">
        {currentOrder.map((item, index) => (
          <div
            key={item.id}
            draggable={!isPreview && (!isChecked || !isCorrect || tile.content.allowMultipleAttempts)}
            onDragStart={(e) => handleDragStart(e, item.id)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={getItemStyle(index, item.id)}
          >
            {!isPreview && (
              <GripVertical className="w-5 h-5 text-gray-400 flex-shrink-0" />
            )}
            
            {tile.content.showPositionNumbers && (
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                {index + 1}
              </div>
            )}
            
            <div className="flex-1 text-gray-800 font-medium">
              {item.text}
            </div>

            {isChecked && isCorrect !== null && (
              <div className="flex-shrink-0">
                {(() => {
                  const originalItem = tile.content.items.find(original => original.id === item.id);
                  const isInCorrectPosition = originalItem && originalItem.correctPosition === index;
                  
                  return isInCorrectPosition ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  );
                })()}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Feedback */}
      {isChecked && isCorrect !== null && (
        <div className={`p-4 rounded-lg text-center ${
          isCorrect 
            ? 'bg-green-100 border border-green-300 text-green-800' 
            : 'bg-red-100 border border-red-300 text-red-800'
        }`}>
          <div className="flex items-center justify-center space-x-2 mb-2">
            {isCorrect ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <span className="font-medium">
              {isCorrect ? tile.content.correctFeedback : tile.content.incorrectFeedback}
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!isPreview && (
        <div className="flex justify-center space-x-3 pt-2">
          {(!isChecked || (isChecked && !isCorrect && tile.content.allowMultipleAttempts)) && (
            <button
              onClick={checkSequence}
              disabled={currentOrder.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Sprawdź kolejność
            </button>
          )}
          
          {(isChecked && !isCorrect && tile.content.allowMultipleAttempts) && (
            <button
              onClick={resetSequence}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium flex items-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Wymieszaj ponownie</span>
            </button>
          )}
        </div>
      )}

      {/* Instructions */}
      {!isPreview && !isChecked && (
        <div className="text-center text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
          💡 Przeciągnij elementy, aby ułożyć je w prawidłowej kolejności, a następnie kliknij "Sprawdź kolejność"
        </div>
      )}
    </div>
  );
};