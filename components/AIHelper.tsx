import React, { useState } from 'react';
import { Sparkles, X, Loader2, Beaker } from 'lucide-react';
import { getDoublingTimeEstimate } from '../services/geminiService';

interface AIHelperProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDoublingTime: (minutes: number) => void;
}

export const AIHelper: React.FC<AIHelperProps> = ({ isOpen, onClose, onSelectDoublingTime }) => {
  const [strain, setStrain] = useState('');
  const [temperature, setTemperature] = useState('37°C');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEstimate = async () => {
    if (!strain) {
      setError("Please enter a strain name.");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await getDoublingTimeEstimate(strain, temperature);
      if (result.doublingTime > 0) {
        onSelectDoublingTime(result.doublingTime);
        onClose();
      } else {
        setError(result.explanation || "Could not estimate doubling time.");
      }
    } catch (e) {
      setError("Failed to connect to AI service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <h2 className="text-lg font-semibold">AI Assistant</h2>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-slate-600 text-sm">
            Enter your bacterial strain and growth temperature. Gemini AI will estimate the doubling time for you.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Strain Name</label>
              <input
                type="text"
                value={strain}
                onChange={(e) => setStrain(e.target.value)}
                placeholder="e.g. E. coli BL21, B. subtilis 168"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Temperature</label>
              <input
                type="text"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                placeholder="e.g. 37°C, 30°C"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          <button
            onClick={handleEstimate}
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Thinking...
              </>
            ) : (
              <>
                <Beaker className="w-5 h-5" />
                Get Estimate
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
