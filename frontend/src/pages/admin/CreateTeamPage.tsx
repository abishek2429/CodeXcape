import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { createTeam } from '../../services/teamService';
import { Users, ArrowLeft, ShieldAlert, Key, UserCheck, Sparkles } from 'lucide-react';

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
    <div className="max-w-3xl mx-auto px-6 py-8">
      <Link
        to={`/admin/events/${eventId}/teams`}
        className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-cyan-400 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        BACK TO TEAMS
      </Link>

      <div className="rounded-2xl bg-[#0e1322] border border-slate-800 p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-800">
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white font-mono">CREATE TEAM</h1>
            <p className="text-xs text-slate-400">Assign team name, Player 1, Player 2, and unique team code.</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-sm flex items-center gap-3 font-mono">
            <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-2 font-semibold">
              TEAM NAME <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. CyberKnights"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-cyan-500 transition"
              required
            />
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold">
              <UserCheck className="w-4 h-4" />
              PLAYER ASSIGNMENT (EXACTLY TWO PLAYERS)
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5 font-semibold">
                  PLAYER 1 (SLOT 1) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={player1Name}
                  onChange={(e) => setPlayer1Name(e.target.value)}
                  placeholder="e.g. Player One (Operator)"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-cyan-500 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5 font-semibold">
                  PLAYER 2 (SLOT 2) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={player2Name}
                  onChange={(e) => setPlayer2Name(e.target.value)}
                  placeholder="e.g. Player Two (Analyzer)"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-cyan-500 transition"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-2 font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                CUSTOM TEAM CODE (OPTIONAL)
              </span>
              <span className="text-slate-500 text-[11px] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                Auto-generated (e.g. TEAM-001) if empty
              </span>
            </label>
            <input
              type="text"
              value={customTeamCode}
              onChange={(e) => setCustomTeamCode(e.target.value.toUpperCase())}
              placeholder="e.g. TEAM-005"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-cyan-500 uppercase transition"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <Link
              to={`/admin/events/${eventId}/teams`}
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-slate-300 hover:text-white font-mono text-sm transition"
            >
              CANCEL
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-sm flex items-center gap-2 transition shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              <UserCheck className="w-4 h-4" />
              {submitting ? 'SAVING TEAM...' : 'CREATE TEAM'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTeamPage;
