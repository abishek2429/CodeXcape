import React, { useState } from 'react';
import { Send, CheckCircle2, Terminal } from 'lucide-react';
import { AnswerType } from '../../types/game';

interface AnswerInputProps {
  answerType: AnswerType;
  placeholderText?: string;
  options?: string[];
  onSubmit: (answer: string) => void;
  isSubmitting?: boolean;
}

export const AnswerInput: React.FC<AnswerInputProps> = ({
  answerType,
  placeholderText,
  options,
  onSubmit,
  isSubmitting = false,
}) => {
  const [answer, setAnswer] = useState('');
  const [submittedFeedback, setSubmittedFeedback] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || isSubmitting) return;

    onSubmit(answer.trim());
    setSubmittedFeedback(`Payload "${answer.trim()}" dispatched for verification.`);

    setTimeout(() => {
      setSubmittedFeedback(null);
    }, 4000);
  };

  return (
    <div className="cyber-panel p-6 sm:p-7 rounded-2xl border border-slate-800 shadow-2xl mb-6 font-mono">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <h2 className="text-xs font-mono tracking-widest text-slate-300 uppercase font-semibold flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span>TERMINAL SOLUTION DISPATCH</span>
        </h2>
        <span className="text-[10px] text-slate-500 uppercase tracking-widest">
          {answerType} INPUT MODE
        </span>
      </div>

      {submittedFeedback && (
        <div className="mb-4 p-3.5 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-200 text-xs font-mono flex items-center gap-2.5 animate-fade-in shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{submittedFeedback}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {answerType === 'MULTIPLE_CHOICE' && options && options.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {options.map((option, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setAnswer(option)}
                className={`p-3.5 rounded-xl border font-mono text-sm text-left transition-all duration-200 cursor-pointer flex items-center gap-3 ${
                  answer === option
                    ? 'bg-cyan-950/60 border-cyan-400 text-cyan-200 shadow-[0_0_20px_rgba(0,240,255,0.2)] ring-1 ring-cyan-400'
                    : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                <span className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold flex items-center justify-center text-xs">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="truncate">{option}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400 font-mono font-bold text-sm pointer-events-none">
              &gt;
            </div>
            <input
              type={answerType === 'NUMERIC' ? 'number' : 'text'}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={placeholderText || (answerType === 'NUMERIC' ? 'Enter numeric solution...' : 'ENTER SOLUTION_')}
              disabled={isSubmitting}
              className="w-full bg-slate-950/90 border border-slate-700/80 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 rounded-xl pl-9 pr-24 py-3.5 text-white font-mono text-sm placeholder-slate-600 outline-none transition-all shadow-inner disabled:opacity-50"
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-500 font-mono uppercase bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              {answerType}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={!answer.trim() || isSubmitting}
            className="w-full sm:w-auto cyber-btn-primary py-3 px-6 rounded-xl font-mono font-bold text-xs tracking-wider uppercase transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                <span>VERIFYING PAYLOAD...</span>
              </>
            ) : (
              <>
                <span>TRANSMIT SOLUTION</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

