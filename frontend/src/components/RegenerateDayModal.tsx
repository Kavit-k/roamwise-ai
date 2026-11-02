import React, { useState } from 'react';
import { X, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

interface RegenerateDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (instructions: string) => Promise<void>;
  dayNumber: number;
  dayTheme: string;
  isRegenerating: boolean;
}

export const RegenerateDayModal: React.FC<RegenerateDayModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  dayNumber,
  dayTheme,
  isRegenerating,
}) => {
  const [instructions, setInstructions] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm(instructions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-floating border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-brand-100 text-brand-800">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Regenerate Day {dayNumber}
              </h3>
              <p className="text-xs text-slate-500 line-clamp-1">{dayTheme}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isRegenerating}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              Only Day {dayNumber}'s activities and meals will be regenerated. Neighboring days and overall trip constraints are preserved.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Adjustment Guidance (Optional)
            </label>
            <textarea
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Focus more on culinary experiences and cafes, swap museum for outdoor scenery, or keep it low walking..."
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 resize-none placeholder:text-slate-400"
            />
          </div>

          {/* Quick presets */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Quick Suggestions</span>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {[
                'More street food & dining',
                'Rainy day / indoor options',
                'Relaxed pace with coffee stops',
                'Historic architecture & hidden alleys',
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setInstructions((prev) => (prev ? `${prev}; ${preset}` : preset))}
                  className="text-xs px-2.5 py-1 rounded-full bg-slate-100 hover:bg-brand-50 hover:text-brand-800 text-slate-600 transition-colors"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isRegenerating}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isRegenerating}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg bg-brand-700 text-white hover:bg-brand-800 shadow-sm transition-all disabled:opacity-50"
            >
              {isRegenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Regenerating Day...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-brand-300" />
                  Regenerate Plan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
