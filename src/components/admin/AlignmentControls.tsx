import React from 'react';
import { AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';

interface AlignmentControlsProps {
  selectedHorizontal?: 'left' | 'center' | 'right' | 'justify';
  selectedVertical?: 'top' | 'middle' | 'bottom';
  onHorizontalChange?: (alignment: 'left' | 'center' | 'right' | 'justify') => void;
  onVerticalChange?: (alignment: 'top' | 'middle' | 'bottom') => void;
  className?: string;
}

export const AlignmentControls: React.FC<AlignmentControlsProps> = ({
  selectedHorizontal = 'left',
  selectedVertical = 'top',
  onHorizontalChange,
  onVerticalChange,
  className = ''
}) => {
  const horizontalAlignments = [
    { id: 'left' as const, icon: AlignLeft, label: 'Wyrównaj do lewej' },
    { id: 'center' as const, icon: AlignCenter, label: 'Wyśrodkuj' },
    { id: 'right' as const, icon: AlignRight, label: 'Wyrównaj do prawej' },
    { id: 'justify' as const, icon: AlignJustify, label: 'Wyjustuj' }
  ];

  const verticalAlignments = [
    { id: 'top' as const, label: 'Góra', symbol: '⤴' },
    { id: 'middle' as const, label: 'Środek', symbol: '↔' },
    { id: 'bottom' as const, label: 'Dół', symbol: '⤵' }
  ];

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      {/* Horizontal Alignment Section */}
      <div className="flex items-center space-x-1">
        <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200">
          {horizontalAlignments.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onHorizontalChange?.(id)}
              className={`p-1.5 rounded transition-all duration-200 min-w-[32px] h-8 flex items-center justify-center ${
                selectedHorizontal === id
                  ? 'bg-blue-500 text-white shadow-sm border border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm border border-transparent'
              }`}
              title={label}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      <div className="w-px h-6 bg-gray-300"></div>

      {/* Vertical Alignment Section */}
      <div className="flex items-center space-x-1">
        <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200">
          {verticalAlignments.map(({ id, label, symbol }) => (
            <button
              key={id}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onVerticalChange?.(id)}
              className={`p-1.5 rounded transition-all duration-200 min-w-[32px] h-8 flex items-center justify-center ${
                selectedVertical === id
                  ? 'bg-blue-500 text-white shadow-sm border border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm border border-transparent'
              }`}
              title={label}
            >
              <span className="text-sm font-medium">{symbol}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};