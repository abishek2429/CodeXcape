import React, { useState } from 'react';
import { Send, CheckCircle } from 'lucide-react';
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
    setSubmittedFeedback(`Answer "${answer.trim()}" recorded (Phase 5 Demo Mode)`);

    setTimeout(() => {
      setSubmittedFeedback(null);
    }, 4000);
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-6 shadow-xl mb-6">
      <h2 className="text-xs font-mono tracking-widest text-slate-400 uppercase font-semibold mb-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
        Submit Solution
      </h2>

      {submittedFeedback && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 shrink-0" />
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
                className={`p-3 rounded-lg border font-mono text-sm text-left transition cursor-pointer ${
                  answer === option
                    ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200 shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="text-cyan-400 font-bold mr-2">[{String.fromCharCode(65 + idx)}]</span>
                {option}
              </button>
            ))}
          </div>
        ) : (
          <div className="relative">
            <input
              type={answerType === 'NUMERIC' ? 'number' : 'text'}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={placeholderText || (answerType === 'NUMERIC' ? 'Enter numeric answer...' : 'Enter your solution...')}
              disabled={isSubmitting}
              className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-lg px-4 py-3.5 text-white font-mono text-base placeholder-slate-600 outline-none transition disabled:opacity-50"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs uppercase">
              {answerType}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!answer.trim() || isSubmitting}
            className="w-full sm:w-auto bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-mono font-bold tracking-wider py-3 px-6 rounded-lg shadow-lg shadow-cyan-950/50 transition transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 uppercase cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <span>SUBMIT ANSWER</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
