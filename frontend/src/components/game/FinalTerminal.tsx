import React, { useState } from 'react';
import { Terminal, Lock, KeyRound, AlertCircle, Loader2, Trophy, Zap } from 'lucide-react';
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
        setErrorMsg('ACCESS DENIED: Invalid override sequence. Re-verify your 6 clues.');
      } else if (res.status === 'FINAL_NOT_AVAILABLE') {
        setErrorMsg('Final terminal is not available yet. Complete all 6 levels first.');
      } else {
        setErrorMsg(res.message || 'Passkey submission rejected.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'System error validating passkey.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // State 1: Game Completed / Escape Victorious
  if (isCompleted) {
    return (
      <div className="cyber-panel hud-corner p-8 sm:p-10 rounded-3xl border-2 border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.25)] mb-6 font-mono text-center relative overflow-hidden bg-gradient-to-b from-emerald-950/40 via-cyber-surface to-cyber-bg">
        {/* Glow ambient background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_20px_rgba(16,185,129,1)]"></div>

        <div className="w-20 h-20 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-pulse-glow">
          <Trophy className="w-10 h-10 text-emerald-300" />
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-mono font-bold tracking-widest uppercase mb-4">
          <span className="w-2 h-2 rounded-full bg-emerald-400 radar-ping text-emerald-400"></span>
          SECURITY SYSTEM BREACHED // MISSION ACCOMPLISHED
        </div>

        <h2 className="text-3xl sm:text-4xl font-black font-heading tracking-wider text-white mb-3">
          CODEXCAPE COMPLETED
        </h2>

        <p className="text-emerald-300 font-mono font-bold text-base max-w-lg mx-auto mb-6">
          ALL SIX FIREWALLS NEUTRALIZED. MASTER OVERRIDE GRANTED.
        </p>

        <div className="max-w-md mx-auto bg-slate-950/90 border border-emerald-500/30 rounded-2xl p-5 text-xs text-slate-300 leading-relaxed font-mono text-left space-y-2.5 shadow-inner">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-slate-400">MISSION STATUS:</span>
            <span className="text-emerald-400 font-bold">100% ESCAPED</span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-slate-400">TELEMETRY:</span>
            <span className="text-cyan-300 font-bold">ALL 6 NODES VERIFIED</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">LEADERBOARD:</span>
            <span className="text-amber-300 font-bold">TIME AUTHORIZED ON SERVER</span>
          </div>
        </div>
      </div>
    );
  }

  // State 2: Final Terminal (Locked or Unlocked)
  return (
    <div className={`cyber-panel hud-corner p-6 sm:p-8 rounded-2xl border transition-all duration-300 mb-6 font-mono ${
      isUnlocked
        ? 'border-cyan-500/60 shadow-[0_0_35px_rgba(0,240,255,0.2)] bg-gradient-to-b from-cyan-950/20 via-cyber-surface to-cyber-bg'
        : 'border-slate-800 opacity-90'
    }`}>
      <div className="flex items-center justify-between border-b border-slate-800 pb-3.5 mb-5">
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-lg border ${
            isUnlocked ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400' : 'bg-slate-900 border-slate-800 text-slate-500'
          }`}>
            <Terminal className="w-4 h-4" />
          </div>
          <h2 className="text-xs tracking-widest uppercase font-bold text-cyan-300">
            FINAL OVERRIDE TERMINAL
          </h2>
        </div>

        <span
          className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider border ${
            isUnlocked
              ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 animate-pulse shadow-[0_0_15px_rgba(0,240,255,0.2)]'
              : 'bg-slate-950 border-slate-800 text-slate-500'
          }`}
        >
          {isUnlocked ? 'OVERRIDE READY // ENTER PASSKEY' : 'CONTAINMENT LOCK ACTIVE'}
        </span>
      </div>

      {!isUnlocked ? (
        <div className="p-8 rounded-2xl bg-slate-950/80 border border-slate-800/90 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 shadow-inner">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <p className="text-sm font-bold text-slate-300 uppercase tracking-wider font-heading">
              FINAL SECURITY LOCK ENGAGED
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              Complete all six levels to decrypt all clue shards and activate the master emergency override console.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-2xl bg-slate-950/90 border border-cyan-500/40 text-center flex flex-col items-center justify-center gap-5 relative overflow-hidden">
          
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.3)]">
            <KeyRound className="w-8 h-8 animate-pulse" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-white tracking-wide uppercase font-heading">
              ENTER 6-DIGIT MASTER OVERRIDE PASSKEY
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto font-mono">
              Synthesize your 6 unlocked clue shards to calculate the final numeric sequence.
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 w-full max-w-sm">
            <div className="relative w-full">
              <input
                type="text"
                maxLength={6}
                value={passkey}
                onChange={(e) => setPasskey(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • • • •"
                disabled={isSubmitting}
                className="w-full text-center text-3xl font-mono font-black tracking-[0.5em] px-6 py-4 rounded-xl bg-slate-900 border-2 border-cyan-500/50 text-cyan-300 focus:outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 placeholder:text-slate-700 shadow-inner"
              />
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 text-xs text-rose-300 bg-rose-950/60 border border-rose-800 px-4 py-2.5 rounded-xl w-full text-left animate-fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || passkey.length !== 6}
              className="w-full py-4 px-6 rounded-xl cyber-btn-primary font-mono font-bold uppercase tracking-wider text-sm transition-all shadow-[0_0_25px_rgba(0,240,255,0.3)] flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>TRANSMITTING OVERRIDE...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-slate-950" />
                  <span>AUTHORIZE FINAL ESCAPE</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

