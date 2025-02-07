'use client';

import React from 'react';
import Controls from './Controls';

export default function ControlsPage() {
  const [activeMode, setActiveMode] = React.useState<'connect' | 'adjust' | 'delete' | null>(null);

  const handleToggleMode = (mode: 'connect' | 'adjust' | 'delete') => {
    setActiveMode(currentMode => currentMode === mode ? null : mode);
  };

  return (
    <div className="p-4">
      <Controls
        connectMode={activeMode === 'connect'}
        adjustMode={activeMode === 'adjust'}
        deleteMode={activeMode === 'delete'}
        onToggleMode={handleToggleMode}
      />
    </div>
  );
}