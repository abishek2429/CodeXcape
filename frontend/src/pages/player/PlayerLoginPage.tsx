import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerAuth } from '../../context/PlayerAuthContext';

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
      setErrorMsg('Please enter a valid Team Code.');
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);

    try {
      await login({
        teamCode: teamCode.trim().toUpperCase(),
        playerNumber,
      });
      navigate('/player', { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to connect to the game server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-[#0a0d14] relative overflow-hidden">
      {/* Background Tech Accent Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-cyan-400 font-mono text-xs tracking-widest uppercase mb-2 bg-cyan-950/40 px-3 py-1 rounded-full border border-cyan-800/40">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            Player Portal Access
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white font-mono uppercase bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
            TECHNICAL ESCAPE ROOM
          </h1>
          <p className="text-sm text-slate-400 mt-1">Enter your team code and player role to join session</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-lg bg-red-950/60 border border-red-800/50 text-red-300 text-sm flex items-start gap-3 animate-fade-in">
            <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold text-red-200">Connection Error</p>
              <p className="text-xs text-red-300/90 mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="teamCode" className="block text-xs font-mono tracking-wider text-slate-300 uppercase mb-2">
              Team Code
            </label>
            <div className="relative">
              <input
                id="teamCode"
                type="text"
                value={teamCode}
                onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                placeholder="e.g. TEAM-017"
                disabled={isLoading}
                maxLength={30}
                className="w-full bg-slate-950/80 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-lg px-4 py-3 text-white font-mono text-lg tracking-wider placeholder-slate-600 outline-none transition disabled:opacity-50"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">
                HEX / ID
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono tracking-wider text-slate-300 uppercase mb-3">
              Select Player Role
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPlayerNumber(1)}
                disabled={isLoading}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border text-sm font-medium transition cursor-pointer ${
                  playerNumber === 1
                    ? 'bg-cyan-950/50 border-cyan-500 text-cyan-200 shadow-md shadow-cyan-950/50'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 font-mono text-base font-semibold">
                  <span className={`w-3 h-3 rounded-full border ${playerNumber === 1 ? 'bg-cyan-400 border-cyan-300' : 'border-slate-600'}`}></span>
                  Player 1
                </div>
                <span className="text-xs text-slate-500 mt-1 font-sans">Primary Operator</span>
              </button>

              <button
                type="button"
                onClick={() => setPlayerNumber(2)}
                disabled={isLoading}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border text-sm font-medium transition cursor-pointer ${
                  playerNumber === 2
                    ? 'bg-cyan-950/50 border-cyan-500 text-cyan-200 shadow-md shadow-cyan-950/50'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 font-mono text-base font-semibold">
                  <span className={`w-3 h-3 rounded-full border ${playerNumber === 2 ? 'bg-cyan-400 border-cyan-300' : 'border-slate-600'}`}></span>
                  Player 2
                </div>
                <span className="text-xs text-slate-500 mt-1 font-sans">Secondary Analyzer</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !teamCode.trim()}
            className="w-full bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-mono font-bold tracking-wider py-3.5 px-4 rounded-lg shadow-lg shadow-cyan-950/50 transition transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 uppercase"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Joining game...</span>
              </>
            ) : (
              <>
                <span>JOIN GAME</span>
                <svg className="w-4 h-4 text-cyan-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
