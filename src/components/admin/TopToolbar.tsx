import React from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Undo, Redo, Type, Palette, Code, FileCode, X } from 'lucide-react';


interface TopToolbarProps {
  tilesCount: number;
  gridColumns: number;
  gridRows: number;
  currentMode: string;
  isTextEditing: boolean;
  onFinishTextEditing?: () => void;
  className?: string;
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
  tilesCount,
  gridColumns,
  gridRows,
  currentMode,
  isTextEditing,
  onFinishTextEditing,
  className = ''
}) => {
  if (isTextEditing) {
    return (
      <div className={`top-toolbar flex items-center justify-between bg-white border-b border-gray-200 px-4 lg:px-6 py-3 ${className}`}>
        <div className="flex items-center space-x-1 text-gray-400">
          <button className="p-2" disabled><Bold className="w-4 h-4" /></button>
          <button className="p-2" disabled><Italic className="w-4 h-4" /></button>
          <button className="p-2" disabled><Underline className="w-4 h-4" /></button>
          <button className="p-2" disabled><List className="w-4 h-4" /></button>
          <button className="p-2" disabled><ListOrdered className="w-4 h-4" /></button>
          <button className="p-2" disabled><Type className="w-4 h-4" /></button>
          <button className="p-2" disabled><Palette className="w-4 h-4" /></button>
          <button className="p-2" disabled><Code className="w-4 h-4" /></button>
          <button className="p-2" disabled><FileCode className="w-4 h-4" /></button>
          <button className="p-2" disabled><Undo className="w-4 h-4" /></button>
          <button className="p-2" disabled><Redo className="w-4 h-4" /></button>
        </div>
        <button
          onClick={onFinishTextEditing}
          className="p-2 text-gray-600 hover:text-gray-900"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between bg-white border-b border-gray-200 px-4 lg:px-6 py-3 ${className}`}>
      <div className="text-sm text-gray-500">
        Kafelki: {tilesCount} • Siatka: {gridColumns}×{gridRows}
      </div>
      <div className="font-medium text-gray-700">
        {currentMode}
      </div>
    </div>
  );
};
