
import React, { useState, useEffect } from 'react';
import { Sparkles, X, ChevronRight, Check, Clock, FlaskConical, ScrollText } from 'lucide-react';
import { Experiment, Protocol, ProtocolStep } from '../types';

interface AIProtocolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateExperiment: (experiment: Partial<Experiment>) => void;
  onCreateTimer: (label: string, duration: number, autoStart: boolean) => void;
  onCreateProtocol?: (protocol: Protocol) => void;
}

type AIResult = 
  | { type: 'experiment'; data: Partial<Experiment> }
  | { type: 'timer'; data: { label: string; duration: number } }
  | { type: 'protocol'; data: Protocol };

export const AIProtocolModal: React.FC<AIProtocolModalProps> = ({ 
  isOpen, 
  onClose, 
  onCreateExperiment, 
  onCreateTimer,
  onCreateProtocol 
}) => {
  const [step, setStep] = useState<'input' | 'processing' | 'review'>('input');
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<AIResult | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('input');
      setPrompt('');
      setResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProcess = () => {
    if (!prompt.trim()) return;
    setStep('processing');
    
    // Simulate AI Latency
    setTimeout(() => {
      const lower = prompt.toLowerCase();
      
      // --- LOGIC BRANCHING ---
      
      // 1. Full Protocol Request? (Keywords: "steps", "protocol", "how to")
      if (onCreateProtocol && (lower.includes('protocol') || lower.includes('steps') || lower.includes('procedure') || lower.includes('how to'))) {
          
          const steps: ProtocolStep[] = [];
          let title = "Generated Protocol";
          let desc = "AI Generated Procedure";

          if (lower.includes('miniprep')) {
            title = "Plasmid Miniprep";
            desc = "Standard alkaline lysis purification.";
            steps.push({ id: crypto.randomUUID(), text: "Pellet 1-5 mL bacterial culture by centrifugation.", isCompleted: false });
            steps.push({ id: crypto.randomUUID(), text: "Resuspend pellet in 250 µL Buffer P1.", isCompleted: false });
            steps.push({ id: crypto.randomUUID(), text: "Add 250 µL Buffer P2 and invert gently 4-6 times.", isCompleted: false, action: { type: 'timer', durationMinutes: 5, timerLabel: 'Lysis (Max 5m)' } });
            steps.push({ id: crypto.randomUUID(), text: "Add 350 µL Buffer N3 and invert immediately.", isCompleted: false });
            steps.push({ id: crypto.randomUUID(), text: "Centrifuge 10 min at 13,000 rpm.", isCompleted: false, action: { type: 'timer', durationMinutes: 10, timerLabel: 'Centrifuge' } });
          } else if (lower.includes('comp') || lower.includes('competent')) {
            title = "Competent Cell Prep";
            steps.push({ id: crypto.randomUUID(), text: "Inoculate 5mL LB from single colony.", isCompleted: false });
            steps.push({ id: crypto.randomUUID(), text: "Grow overnight at 37°C.", isCompleted: false, action: { type: 'timer', durationMinutes: 960, timerLabel: 'Overnight' } });
            steps.push({ id: crypto.randomUUID(), text: "Dilute 1:100 into fresh LB. Grow to OD 0.4.", isCompleted: false, action: { type: 'experiment', experimentConfig: { name: 'Comp Cell Growth', targetHarvestOD: '0.4' } } });
          } else {
             // Generic Fallback
             title = "Custom Protocol";
             steps.push({ id: crypto.randomUUID(), text: "Prepare reagents and workspace.", isCompleted: false });
             steps.push({ id: crypto.randomUUID(), text: "Execute main reaction steps.", isCompleted: false });
             if (lower.includes('incubate')) {
                steps.push({ id: crypto.randomUUID(), text: "Incubate sample.", isCompleted: false, action: { type: 'timer', durationMinutes: 30, timerLabel: 'Incubation' } });
             }
          }

          setResult({
            type: 'protocol',
            data: {
              id: crypto.randomUUID(),
              title,
              description: desc,
              steps,
              createdAt: Date.now()
            }
          });

      } else if ((lower.includes('timer') || lower.includes('alarm') || lower.includes('wait')) && !lower.includes('od')) {
          // 2. Simple Timer
          let duration = 15;
          const timeMatch = lower.match(/(\d+)\s*(m|min|minute|h|hour)/);
          if (timeMatch) {
             const val = parseInt(timeMatch[1]);
             duration = timeMatch[2].startsWith('h') ? val * 60 : val;
          }
          let label = prompt.replace(/timer|set|minutes|min/gi, '').replace(/\d+/g, '').trim() || "Incubation";
          
          setResult({ type: 'timer', data: { label, duration } });

      } else {
          // 3. Growth Experiment (Default)
          const mockExp: Partial<Experiment> = { name: "AI Protocol", calculationMode: 'total_volume', lagTime: '20' };
          if (lower.includes('ecoli')) { mockExp.name = "E. coli Growth"; mockExp.doublingTime = '20'; }
          if (lower.includes('500ml')) mockExp.targetVolume = '500';
          
          const numbers = prompt.match(/od\s*(\d*\.?\d+)/gi);
          if (numbers) {
             const vals = numbers.map(s => parseFloat(s.toLowerCase().replace('od', '').trim())).sort((a,b) => a-b);
             if (vals.length >= 2) { mockExp.targetStartOD = '0.05'; mockExp.targetHarvestOD = String(vals[0]); mockExp.inoculumOD = String(vals[1]); }
          }
          setResult({ type: 'experiment', data: mockExp });
      }

      setStep('review');
    }, 1200);
  };

  const handleCreate = () => {
    if (!result) return;
    if (result.type === 'experiment') {
      onCreateExperiment(result.data);
    } else if (result.type === 'timer') {
      onCreateTimer(result.data.label, result.data.duration, true);
    } else if (result.type === 'protocol' && onCreateProtocol) {
      onCreateProtocol(result.data);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl shadow-2xl border border-zinc-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center bg-zinc-50/50 dark:bg-white/5">
           <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
             <Sparkles className="w-5 h-5" />
             <h2 className="font-semibold tracking-tight">AI Assistant</h2>
           </div>
           <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors">
             <X className="w-5 h-5" />
           </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {step === 'input' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
               <p className="text-sm text-zinc-500 dark:text-zinc-400">
                 Describe a protocol, a specific calculation, or a timer.
               </p>
               <textarea 
                 autoFocus
                 value={prompt}
                 onChange={(e) => setPrompt(e.target.value)}
                 className="w-full h-32 p-4 rounded-xl bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                 placeholder="e.g. 'Miniprep protocol steps', 'Grow E. coli to OD 0.6', '10 min timer'"
               />
               <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  <button onClick={() => setPrompt("Write a standard Miniprep protocol")} className="whitespace-nowrap px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 text-xs font-medium border border-purple-100 dark:border-purple-500/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors">
                    Protocol: Miniprep
                  </button>
                  <button onClick={() => setPrompt("Set a timer for 45 minutes for Gel")} className="whitespace-nowrap px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 text-xs font-medium border border-blue-100 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                    Timer: Gel Run
                  </button>
               </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-in fade-in duration-300">
               <div className="relative">
                 <div className="w-12 h-12 rounded-full border-4 border-zinc-100 dark:border-zinc-800"></div>
                 <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
                 <Sparkles className="absolute inset-0 m-auto w-5 h-5 text-indigo-500 animate-pulse" />
               </div>
               <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 animate-pulse">Designing workflow...</p>
            </div>
          )}

          {step === 'review' && result && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
               <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-4 flex items-start gap-3">
                  <Check className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
                      {result.type === 'protocol' ? 'Protocol Generated' : result.type === 'timer' ? 'Timer Configured' : 'Experiment Drafted'}
                    </h3>
                    <p className="text-xs text-indigo-700 dark:text-indigo-300/80 mt-1">
                      {result.type === 'protocol' ? `I've created a ${result.data.steps.length}-step procedure.` : "Ready to start."}
                    </p>
                  </div>
               </div>

               {/* PROTOCOL PREVIEW */}
               {result.type === 'protocol' && (
                  <div className="bg-zinc-50 dark:bg-white/5 rounded-xl border border-zinc-200 dark:border-white/5 p-4 max-h-48 overflow-y-auto custom-scrollbar">
                     <h4 className="font-bold text-sm mb-2 text-zinc-900 dark:text-white">{result.data.title}</h4>
                     <ul className="space-y-2">
                        {result.data.steps.map((s, i) => (
                           <li key={i} className="text-xs text-zinc-600 dark:text-zinc-400 flex gap-2">
                              <span className="text-zinc-400 font-mono">{i+1}.</span>
                              <span>{s.text}</span>
                              {s.action && <span className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-[9px] uppercase font-bold tracking-wider">{s.action.type}</span>}
                           </li>
                        ))}
                     </ul>
                  </div>
               )}

               {/* Existing Review Views for Timer/Exp would go here (simplified for brevity) */}
               {result.type === 'experiment' && (
                  <div className="p-3 bg-zinc-50 dark:bg-white/5 rounded-lg border border-zinc-100 dark:border-white/5">
                      <span className="text-[10px] uppercase text-zinc-400 font-bold tracking-wider">Target Volume</span>
                      <p className="text-sm font-mono font-medium text-zinc-900 dark:text-white mt-1">{result.data.targetVolume || '?'} mL</p>
                  </div>
               )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/5 flex justify-end gap-3">
           {step === 'review' ? (
             <>
               <button onClick={() => setStep('input')} className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">Refine</button>
               <button onClick={handleCreate} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all active:scale-95">
                 Create <ChevronRight className="w-4 h-4" />
               </button>
             </>
           ) : (
             step === 'input' && (
               <button onClick={handleProcess} disabled={!prompt.trim()} className="w-full sm:w-auto px-6 py-2 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black rounded-xl text-sm font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                 <Sparkles className="w-4 h-4" /> Generate
               </button>
             )
           )}
        </div>
      </div>
    </div>
  );
};
