import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { createTeam } from '../../services/teamService';
import { Users, ArrowLeft, ShieldAlert, Key, UserCheck, Sparkles, Terminal, Cpu } from 'lucide-react';

export const CreateTeamPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [teamName, setTeamName] = useState('');
  const [player1Name, setPlayer1Name] = useState('');
  const [player2Name, setPlayer2Name] = useState('');
  const [customTeamCode, setCustomTeamCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;

    if (!teamName.trim()) {
      setError('Team name is required');
      return;
    }
    if (!player1Name.trim()) {
      setError('Player 1 display name is required');
      return;
    }
    if (!player2Name.trim()) {
      setError('Player 2 display name is required');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createTeam(Number(eventId), {
        teamName: teamName.trim(),
        player1DisplayName: player1Name.trim(),
        player2DisplayName: player2Name.trim(),
        customTeamCode: customTeamCode.trim() || undefined,
      });

      navigate(`/admin/events/${eventId}/teams`);
    } catch (err: any) {
      setError(err.message || 'Failed to create team');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 font-sans">
      <Link
        to={`/admin/events/${eventId}/teams`}
        className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-cyan-400 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        BACK TO TEAMS REGISTRY
      </Link>

      <div className="cyber-panel hud-corner p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl">
        <div className="flex items-center gap-3.5 mb-6 pb-6 border-b border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.2)]">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white font-heading uppercase tracking-wide">REGISTER TEAM IDENTITY</h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">Assign team credentials, Player 1 Operator, Player 2 Analyzer, and unique access code.</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-3 font-mono">
            <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 font-mono">
          <div>
            <label className="block text-xs text-slate-300 mb-2 font-bold uppercase tracking-wider">
              TEAM DESIGNATION / NAME <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. CyberKnights"
              className="w-full px-4 py-3 rounded-xl bg-slate-950/90 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-400 shadow-inner font-mono"
              required
            />
          </div>

          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-xs text-cyan-400 font-bold uppercase tracking-wider">
              <UserCheck className="w-4 h-4" />
              <span>CO-OP NODE ALLOCATION (EXACTLY TWO PLAYERS)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/60 p-4 rounded-xl border border-cyan-500/20">
                <label className="flex items-center gap-1.5 text-xs text-cyan-300 mb-2 font-bold">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>PLAYER 01 (OPERATOR)</span> <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={player1Name}
                  onChange={(e) => setPlayer1Name(e.target.value)}
                  placeholder="e.g. Operator Zero"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-400 shadow-inner font-mono"
                  required
                />
              </div>

              <div className="bg-slate-900/60 p-4 rounded-xl border border-purple-500/20">
                <label className="flex items-center gap-1.5 text-xs text-purple-300 mb-2 font-bold">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>PLAYER 02 (ANALYZER)</span> <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={player2Name}
                  onChange={(e) => setPlayer2Name(e.target.value)}
                  placeholder="e.g. Analyzer Prime"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-400 shadow-inner font-mono"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-300 mb-2 font-bold flex items-center justify-between uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                CUSTOM ACCESS TEAM CODE (OPTIONAL)
              </span>
              <span className="text-slate-500 text-[10px] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                Auto-generated (e.g. TEAM-001) if blank
              </span>
            </label>
            <input
              type="text"
              value={customTeamCode}
              onChange={(e) => setCustomTeamCode(e.target.value.toUpperCase())}
              placeholder="e.g. TEAM-005"
              className="w-full px-4 py-3 rounded-xl bg-slate-950/90 border border-slate-800 text-cyan-300 font-bold text-xs focus:outline-none focus:border-cyan-400 uppercase tracking-widest font-mono shadow-inner"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <Link
              to={`/admin/events/${eventId}/teams`}
              className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition"
            >
              CANCEL
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="cyber-btn-primary px-6 py-2.5 rounded-xl text-slate-950 font-bold text-xs flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <UserCheck className="w-4 h-4" />
              <span>{submitting ? 'SAVING TEAM...' : 'AUTHORIZE & CREATE TEAM'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTeamPage;

