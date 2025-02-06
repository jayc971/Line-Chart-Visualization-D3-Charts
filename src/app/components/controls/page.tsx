'use client'

import React, { JSX } from 'react';
import { Activity, Move, Trash2, X } from 'lucide-react';

interface ModeControlsProps {
  connectMode: boolean;
  adjustMode: boolean;
  deleteMode: boolean;
  onToggleMode: (mode: 'connect' | 'adjust' | 'delete') => void;
  onClearSelection: () => void;
}

const Controls = ({
  connectMode,
  adjustMode,
  deleteMode,
  onToggleMode,
  onClearSelection,
}: ModeControlsProps): JSX.Element => {
  return (
    <div className="flex gap-4 mb-4">
      <button
        className={`p-2 hover:bg-gray-500 rounded ${
          connectMode ? 'bg-blue-500 text-white' : 'bg-gray-800 text-white'
        }`}
        onClick={() => onToggleMode('connect')}
      >
        <Activity size={24} />
      </button>
      <button
        className={`p-2 hover:bg-gray-500 rounded ${
          adjustMode ? 'bg-green-500 text-white' : 'bg-gray-800 text-white'
        }`}
        onClick={() => onToggleMode('adjust')}
      >
        <Move size={24} />
      </button>
      <button
        className={`p-2 hover:bg-gray-500 rounded ${
          deleteMode ? 'bg-red-500 text-white' : 'bg-gray-800 text-white'
        }`}
        onClick={() => onToggleMode('delete')}
      >
        <Trash2 size={24} />
      </button>
      {connectMode && (
        <button 
          className="p-2 hover:bg-red-500 rounded bg-red-600 text-white" 
          onClick={onClearSelection}
        >
          <X size={24} />
        </button>
      )}
    </div>
  );
};

export default Controls;