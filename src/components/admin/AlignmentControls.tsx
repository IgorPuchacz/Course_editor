import React from 'react';
import { AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';

interface AlignmentControlsProps {
  className?: string;
}

export const AlignmentControls: React.FC<AlignmentControlsProps> = ({
  className = ''
}) => {
  const horizontalAlignments = [
    { id: 'left', icon: AlignLeft, label: 'Wyrównaj do lewej' },
    { id: 'center', icon: AlignCenter, label: 'Wyśrodkuj' },
    { id: 'right', icon: AlignRight, label: 'Wyrównaj do prawej' },
    { id: 'justify', icon: AlignJustify, label: 'Wyjustuj' }
  ];

  const verticalAlignments = [
    { id: 'top', label: 'Góra', symbol: '⤴' },
    { id: 'middle', label: 'Środek', symbol: '↔' },
    { id: 'bottom', label: 'Dół', symbol: '⤵' }
  ];

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      {/* Horizontal Alignment Section */}
      <div className="flex items-center space-x-1">
        <span className="text-xs text-gray-500 mr-2 hidden sm:inline">Poziomo:</span>
        <div className="flex items-center bg-gray-50 rounded-lg p-1">
          {horizontalAlignments.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onMouseDown={(e) => e.preventDefault()}
              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-white rounded transition-all duration-150 group"
              title={label}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      {/* Vertical Alignment Section */}
      <div className="flex items-center space-x-1">
        <span className="text-xs text-gray-500 mr-2 hidden sm:inline">Pionowo:</span>
        <div className="flex items-center bg-gray-50 rounded-lg p-1">
          {verticalAlignments.map(({ id, label, symbol }) => (
            <button
              key={id}
              onMouseDown={(e) => e.preventDefault()}
              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-white rounded transition-all duration-150 group min-w-[28px] flex items-center justify-center"
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