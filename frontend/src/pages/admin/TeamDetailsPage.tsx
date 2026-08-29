import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchTeamById, updateTeam } from '../../services/teamService';
import { TeamDetail, TeamStatus } from '../../types/team';
import { ArrowLeft, Key, Users, ShieldAlert, Save, Activity, Terminal, Cpu } from 'lucide-react';

export const TeamDetailsPage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form states for editing team & player names
  const [teamName, setTeamName] = useState('');
  const [p1Name, setP1Name] = useState('');
  const [p2Name, setP2Name] = useState('');
  const [status, setStatus] = useState<TeamStatus>('REGISTERED');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadTeam = async () => {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTeamById(Number(teamId));
      setTeam(data);
      setTeamName(data.teamName);
      setStatus(data.status);
      const p1 = data.players.find(p => p.playerNumber === 1);
      const p2 = data.players.find(p => p.playerNumber === 2);
      setP1Name(p1?.displayName || '');
      setP2Name(p2?.displayName || '');
    } catch (err: any) {
      setError(err.message || 'Failed to load team details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, [teamId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team) return;

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const updated = await updateTeam(team.id, {
        teamName: teamName.trim(),
        status,
        player1DisplayName: p1Name.trim(),
        player2DisplayName: p2Name.trim(),
      });
      setTeam(updated);
      setSuccessMsg('Team credentials and player slots successfully updated.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update team');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="font-mono text-xs">Loading team profile...</span>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 text-center cyber-panel rounded-3xl border border-rose-500/40 p-8 my-8 font-mono">
        <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto mb-3 animate-pulse" />
        <h2 className="text-xl font-bold font-heading text-white uppercase mb-2">TEAM NOT FOUND</h2>
        <p className="text-xs text-rose-200/80 mb-6">{error || 'The requested team could not be located on the server.'}</p>
        <Link
          to="/admin/events"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white font-mono text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>RETURN TO EVENTS</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 font-sans">
      <Link
        to={`/admin/events/${team.eventId}/teams`}
        className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-cyan-400 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        BACK TO TEAMS REGISTRY
      </Link>

      <div className="cyber-panel hud-corner p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.2)]">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 uppercase tracking-widest">
                EVENT: {team.eventName}
              </span>
              <h1 className="text-2xl font-bold text-white font-heading flex items-center gap-3 mt-1.5">
                {team.teamName}
                <span className="px-3 py-0.5 rounded-xl bg-slate-950 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold shadow-inner">
                  {team.teamCode}
                </span>
              </h1>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-3 font-mono">
            <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-3 font-mono animate-fade-in">
            <Activity className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6 font-mono">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-300 mb-2 font-bold uppercase tracking-wider">
                TEAM NAME
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950/90 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-400 shadow-inner font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-2 font-bold uppercase tracking-wider">
                CLEARANCE STATUS
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TeamStatus)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950/90 border border-slate-800 text-cyan-300 text-xs font-bold focus:outline-none focus:border-cyan-400 shadow-inner font-mono cursor-pointer"
              >
                <option value="REGISTERED">REGISTERED</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="DISQUALIFIED">DISQUALIFIED</option>
              </select>
            </div>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
            <h3 className="text-xs text-slate-200 font-bold uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              ASSIGNED PLAYERS (2 CO-OP SLOTS)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-cyan-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-cyan-300 font-bold flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5" />
                    PLAYER 01 (OPERATOR)
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">SLOT #1</span>
                </div>
                <input
                  type="text"
                  value={p1Name}
                  onChange={(e) => setP1Name(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-cyan-400 shadow-inner"
                  required
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-purple-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-purple-300 font-bold flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5" />
                    PLAYER 02 (ANALYZER)
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">SLOT #2</span>
                </div>
                <input
                  type="text"
                  value={p2Name}
                  onChange={(e) => setP2Name(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-purple-400 shadow-inner"
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="submit"
              disabled={saving}
              className="cyber-btn-primary px-6 py-2.5 rounded-xl text-slate-950 font-bold text-xs flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'SAVING...' : 'SAVE CHANGES'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeamDetailsPage;

