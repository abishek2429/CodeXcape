import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchTeamsForEvent, updateTeamStatus, deleteTeam } from '../../services/teamService';
import { fetchEventById } from '../../services/eventService';
import { Team, TeamStatus } from '../../types/team';
import { Event } from '../../types/event';
import { Users, Plus, ArrowLeft, ShieldAlert, RefreshCw, Trash2, User, Key } from 'lucide-react';

export const TeamListPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    try {
      const [evtData, teamData] = await Promise.all([
        fetchEventById(Number(eventId)),
        fetchTeamsForEvent(Number(eventId)),
      ]);
      setEvent(evtData);
      setTeams(teamData);
    } catch (err: any) {
      setError(err.message || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [eventId]);

  const handleStatusToggle = async (teamId: number, currentStatus: TeamStatus) => {
    const nextStatus: TeamStatus = currentStatus === 'ACTIVE' ? 'REGISTERED' : 'ACTIVE';
    try {
      const updated = await updateTeamStatus(teamId, nextStatus);
      setTeams(prev => prev.map(t => t.id === teamId ? { ...t, status: updated.status } : t));
    } catch (err: any) {
      alert(err.message || 'Failed to update team status');
    }
  };

  const handleDeleteTeam = async (teamId: number, teamCode: string) => {
    if (!window.confirm(`Are you sure you want to delete team ${teamCode}?`)) return;
    try {
      await deleteTeam(teamId);
      setTeams(prev => prev.filter(t => t.id !== teamId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete team');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <Link
        to={eventId ? `/admin/events/${eventId}` : '/admin/events'}
        className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-cyan-400 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        BACK TO EVENT DETAILS
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-mono text-cyan-400 font-semibold tracking-wider">
            EVENT: {event?.name || `#${eventId}`}
          </span>
          <h1 className="text-2xl font-bold text-white font-mono flex items-center gap-3 mt-1">
            <Users className="w-7 h-7 text-cyan-400" />
            REGISTERED TEAMS ({teams.length})
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to={`/admin/events/${eventId}/teams/new`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-sm shadow-lg shadow-cyan-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            CREATE TEAM
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-sm flex items-center gap-3 font-mono">
          <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <span className="font-mono text-sm">Loading team records...</span>
        </div>
      ) : teams.length === 0 ? (
        <div className="py-20 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-200 font-mono">No Teams Created</h3>
          <p className="text-sm text-slate-400 mt-1 mb-4">Add teams to participate in this escape room event.</p>
          <Link
            to={`/admin/events/${eventId}/teams/new`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 text-sm font-mono transition"
          >
            <Plus className="w-4 h-4" />
            Create Team
          </Link>
        </div>
      ) : (
        <div className="bg-[#0e1322] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-sm">
              <thead className="bg-slate-950 text-slate-400 text-xs uppercase border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-bold">TEAM CODE</th>
                  <th className="px-6 py-4 font-bold">TEAM NAME</th>
                  <th className="px-6 py-4 font-bold">PLAYER 1</th>
                  <th className="px-6 py-4 font-bold">PLAYER 2</th>
                  <th className="px-6 py-4 font-bold">STATUS</th>
                  <th className="px-6 py-4 font-bold text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {teams.map((tm) => (
                  <tr key={tm.id} className="hover:bg-slate-900/50 transition">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-950 border border-cyan-500/30 text-cyan-400 font-bold">
                        <Key className="w-3.5 h-3.5" />
                        {tm.teamCode}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-white">{tm.teamName}</td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-xs text-slate-300">
                        <User className="w-3.5 h-3.5 text-emerald-400" />
                        {tm.player1DisplayName || 'Player 1'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-xs text-slate-300">
                        <User className="w-3.5 h-3.5 text-cyan-400" />
                        {tm.player2DisplayName || 'Player 2'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleStatusToggle(tm.id, tm.status)}
                        className={`px-3 py-1 rounded-full text-xs font-bold border transition ${
                          tm.status === 'ACTIVE'
                            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-700/60 hover:bg-emerald-900/80'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {tm.status}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/teams/${tm.id}`}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition"
                        >
                          View Details
                        </Link>
                        <button
                          onClick={() => handleDeleteTeam(tm.id, tm.teamCode)}
                          className="p-1.5 rounded-lg bg-red-950/50 border border-red-800/40 text-red-400 hover:bg-red-900/60 transition"
                          title="Delete Team"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamListPage;
