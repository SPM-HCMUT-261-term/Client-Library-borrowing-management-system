import React, { useState } from 'react';
import { RotateCcw, Database, Check } from 'lucide-react';
import { resetMockDb } from '../mocks/db';
import { useAuth } from '../context/AuthContext';

export const MockDevToolbar: React.FC = () => {
  const isMockEnabled = import.meta.env.VITE_USE_MOCK !== 'false';
  const { refreshUser } = useAuth();
  const [justReset, setJustReset] = useState(false);

  if (!isMockEnabled) {
    return null;
  }

  const handleReset = async () => {
    resetMockDb();
    await refreshUser();
    setJustReset(true);
    window.dispatchEvent(new CustomEvent('mock-db-reset'));
    setTimeout(() => setJustReset(false), 1800);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-brand-ink/95 text-white px-3.5 py-2 rounded-full shadow-lg border border-white/15 text-[11px] backdrop-blur-sm">
      <span className="inline-flex items-center gap-1.5 font-medium text-brand-mint">
        <Database className="w-3.5 h-3.5 text-emerald-400" />
        <span>MSW Mock Active</span>
      </span>
      <span className="text-white/30">|</span>
      <button
        type="button"
        onClick={handleReset}
        className="inline-flex items-center gap-1 font-semibold text-white hover:text-brand-amberBorder transition-colors"
        title="Reset localStorage mock DB back to initial Figma demo seed"
      >
        {justReset ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-300">Demo Data Reset!</span>
          </>
        ) : (
          <>
            <RotateCcw className="w-3 h-3" />
            <span>Reset Demo Data</span>
          </>
        )}
      </button>
    </div>
  );
};
