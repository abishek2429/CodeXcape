import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerAuth } from '../../context/PlayerAuthContext';
import { Terminal, Cpu, ArrowRight, AlertCircle, KeyRound } from 'lucide-react';

export const PlayerLoginPage: React.FC = () => {
  const [teamCode, setTeamCode] = useState('');
  const [playerNumber, setPlayerNumber] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = usePlayerAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamCode.trim()) {
      setErrorMsg('Please enter a valid Team Code (e.g. TEAM-001).');
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);

    try {
      await login({
        teamCode: teamCode.trim().toUpperCase(),
        playerNumber,
      });
      navigate('/player/game', { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'Access Denied: Unable to connect to game session. Verify team code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-76px)] flex items-center justify-center px-4 py-12 relative overflow-hidden bg-cyber-bg">
      {/* Ambient background glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[300px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-lg cyber-panel hud-corner p-8 sm:p-10 rounded-3xl relative z-10 shadow-2xl border border-cyan-500/20">
        
        {/* Terminal Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-cyan-300 font-mono text-xs tracking-widest uppercase mb-3 bg-cyan-950/60 px-3.5 py-1.5 rounded-full border border-cyan-500/40 shadow-[0_0_15px_rgba(0,240,255,0.15)]">
            <span className="w-2 h-2 rounded-full bg-cyan-400 radar-ping text-cyan-400"></span>
            CLEARANCE TERMINAL // ACCESS GATE
          </div>
          
          <h1 className="text-3xl font-black font-heading tracking-tight text-white uppercase">
            PLAYER AUTHENTICATION
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-2">
            Enter assigned team identifier and select your console node.
          </p>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs font-mono flex items-start gap-3 animate-fade-in shadow-lg shadow-rose-950/20">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold uppercase tracking-wider text-rose-300">AUTHENTICATION FAILED</p>
              <p className="text-rose-200/90 mt-0.5 leading-relaxed">{errorMsg}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Team Code Input */}
          <div>
            <label htmlFor="teamCode" className="block text-xs font-mono tracking-wider text-slate-300 uppercase mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                TEAM SECURITY CODE
              </span>
              <span className="text-[11px] text-slate-500">CASE INSENSITIVE</span>
            </label>
            <div className="relative">
              <input
                id="teamCode"
                type="text"
                value={teamCode}
                onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                placeholder="e.g. TEAM-001"
                disabled={isLoading}
                maxLength={30}
                className="w-full bg-slate-950/90 border border-slate-700/80 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 rounded-xl px-4 py-3.5 text-white font-mono text-base tracking-wider placeholder-slate-600 outline-none transition-all shadow-inner disabled:opacity-50"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">
                HEX/ID
              </div>
            </div>
          </div>

          {/* Player Role Selection */}
          <div>
            <label className="block text-xs font-mono tracking-wider text-slate-300 uppercase mb-2.5">
              SELECT CONSOLE PERSPECTIVE
            </label>
            <div className="grid grid-cols-2 gap-4">
              
              {/* Player 1 Option */}
              <button
                type="button"
                onClick={() => setPlayerNumber(1)}
                disabled={isLoading}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-sm font-mono transition-all duration-200 cursor-pointer text-left ${
                  playerNumber === 1
                    ? 'bg-cyan-950/50 border-cyan-400 text-cyan-200 shadow-[0_0_20px_rgba(0,240,255,0.25)] ring-1 ring-cyan-400'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-2">
                  <Terminal className="w-4 h-4" />
                </div>
                <div className="font-bold text-sm text-white">PLAYER 01</div>
                <span className="text-[10px] text-cyan-300/80 mt-0.5 uppercase tracking-wider">PRIMARY OPERATOR</span>
              </button>

              {/* Player 2 Option */}
              <button
                type="button"
                onClick={() => setPlayerNumber(2)}
                disabled={isLoading}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-sm font-mono transition-all duration-200 cursor-pointer text-left ${
                  playerNumber === 2
                    ? 'bg-purple-950/50 border-purple-400 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.25)] ring-1 ring-purple-400'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center mb-2">
                  <Cpu className="w-4 h-4" />
                </div>
                <div className="font-bold text-sm text-white">PLAYER 02</div>
                <span className="text-[10px] text-purple-300/80 mt-0.5 uppercase tracking-wider">CRYPTIC ANALYZER</span>
              </button>

            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !teamCode.trim()}
            className="w-full py-4 px-6 rounded-xl cyber-btn-primary font-mono font-bold tracking-wider text-sm shadow-lg shadow-cyan-950/50 transition-all transform active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2.5 uppercase cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                <span>AUTHENTICATING NODE...</span>
              </>
            ) : (
              <>
                <span>CONNECT TO ESCAPE CONSOLE</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

        </form>

        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center font-mono text-[11px] text-slate-500">
          SECURE 256-BIT ENCRYPTED SESSION // CODEXCAPE PROTOCOL
        </div>

      </div>
    </div>
  );
};

