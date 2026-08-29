import React, { useState } from 'react';
import { Terminal, Lock, KeyRound, CheckCircle2, AlertCircle, Loader2, PartyPopper } from 'lucide-react';
import { submitFinalPasskey, FinalPasskeyResponse } from '../../services/passkeyService';

interface FinalTerminalProps {
  isUnlocked: boolean;
  isCompleted: boolean;
  onSuccess?: () => void;
}

export const FinalTerminal: React.FC<FinalTerminalProps> = ({ isUnlocked, isCompleted, onSuccess }) => {
  const [passkey, setPasskey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUnlocked || isCompleted || isSubmitting) return;

    const trimmed = passkey.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      setErrorMsg('Passkey must be exactly 6 numeric digits.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res: FinalPasskeyResponse = await submitFinalPasskey(trimmed);
      if (res.status === 'COMPLETED' || res.status === 'ALREADY_COMPLETED') {
        if (onSuccess) onSuccess();
      } else if (res.status === 'INCORRECT') {
        setErrorMsg('Incorrect passkey. Please try again.');
      } else if (res.status === 'FINAL_NOT_AVAILABLE') {
        setErrorMsg('Final terminal is not available yet. Complete all 6 levels first.');
      } else {
        setErrorMsg(res.message || 'Submission failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting final passkey.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCompleted) {
    return (
      <div className="bg-gradient-to-b from-emerald-950/90 to-slate-900/90 backdrop-blur-md border border-emerald-500/40 rounded-xl p-8 shadow-2xl mb-6 font-mono text-center">
        <div className="inline-flex p-3 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mb-4 animate-bounce">
          <PartyPopper className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-extrabold text-white tracking-wider mb-2">
          🎉 CODEXCAPE COMPLETED 🎉
        </h2>

        <p className="text-emerald-300 font-bold text-lg mb-2">
          Your team successfully escaped!
        </p>

        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          All six challenges solved, all hints assembled, and the final override passkey correctly authorized. Outstanding teamwork!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-6 shadow-xl mb-6 font-mono">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2 text-cyan-400">
          <Terminal className="w-4 h-4" />
          <h2 className="text-xs tracking-widest uppercase font-bold text-cyan-300">
            FINAL TERMINAL ACCESS
          </h2>
        </div>

        <span
          className={`text-xs px-2.5 py-0.5 rounded font-bold uppercase ${
            isUnlocked
              ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
              : 'bg-slate-950 border border-slate-800 text-slate-500'
          }`}
        >
          {isUnlocked ? 'READY FOR FINAL PASSKEY' : 'LOCKED'}
        </span>
      </div>

      {!isUnlocked ? (
        <div className="p-6 rounded-lg bg-slate-950 border border-slate-800 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
            <Lock className="w-6 h-6" />
          </div>

          <div>
            <p className="text-sm font-bold text-slate-300 uppercase tracking-wide">
              Final Escape Lock
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-md">
              Complete all six levels to assemble your passkey clues and activate the final terminal override.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 rounded-lg bg-slate-950 border border-cyan-500/30 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <KeyRound className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-base font-bold text-white tracking-wide uppercase">
              Enter 6-Digit Final Passkey
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Combine your 6 unlocked clues to determine the final passkey and trigger escape.
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 w-full max-w-xs">
            <input
              type="text"
              maxLength={6}
              value={passkey}
              onChange={(e) => setPasskey(e.target.value.replace(/\D/g, ''))}
              placeholder="_ _ _ _ _ _"
              disabled={isSubmitting}
              className="w-full text-center text-2xl font-mono tracking-[0.5em] px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-cyan-300 focus:outline-none focus:border-cyan-400 placeholder:text-slate-600 shadow-inner"
            />

            {errorMsg && (
              <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-950/40 border border-red-900/50 px-3 py-1.5 rounded-md w-full">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || passkey.length !== 6}
              className="w-full py-2.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold uppercase tracking-wider text-xs transition shadow-lg flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authorizing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Final Passkey</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
