import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchEvents, updateEventStatus } from '../../services/eventService';
import { Event, EventStatus } from '../../types/event';
import { Calendar, Plus, Users, ShieldAlert, ArrowRight, RefreshCw, Activity } from 'lucide-react';

export const EventListPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEvents();
      setEvents(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleStatusChange = async (eventId: number, newStatus: EventStatus) => {
    try {
      const updated = await updateEventStatus(eventId, newStatus);
      setEvents(prev => prev.map(e => e.id === eventId ? updated : e));
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const getStatusBadge = (status: EventStatus) => {
    const styles: Record<EventStatus, string> = {
      DRAFT: 'bg-slate-900 text-slate-400 border-slate-800',
      READY: 'bg-cyan-950/80 text-cyan-400 border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.15)]',
      RUNNING: 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)] animate-pulse',
      PAUSED: 'bg-amber-950/80 text-amber-400 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.15)]',
      COMPLETED: 'bg-purple-950/80 text-purple-300 border-purple-500/40',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider border ${styles[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 font-sans">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white font-heading tracking-wide flex items-center gap-3">
              <Activity className="w-8 h-8 text-cyan-400" />
              EVENT OPERATIONS REGISTRY
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">Configure, orchestrate, and monitor CodeXcape arena events.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadEvents}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition cursor-pointer shadow-lg"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
          <Link
            to="/admin/events/new"
            className="cyber-btn-primary px-5 py-2.5 rounded-xl text-slate-950 font-bold font-mono text-xs tracking-wider flex items-center gap-2 shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>CREATE ARENA EVENT</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-3 font-mono">
          <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="font-mono text-xs">Accessing event telemetry registry...</span>
        </div>
      ) : events.length === 0 ? (
        <div className="py-20 text-center rounded-3xl cyber-panel border border-slate-800 p-8">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200 font-heading">No Events Registered</h3>
          <p className="text-xs text-slate-400 font-mono mt-1 mb-6">Initialize your first CodeXcape competition environment.</p>
          <Link
            to="/admin/events/new"
            className="cyber-btn-primary px-5 py-2 rounded-xl text-slate-950 text-xs font-mono font-bold inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Event</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((evt) => (
            <div
              key={evt.id}
              className="cyber-panel cyber-panel-hover p-6 rounded-2xl border border-slate-800 flex flex-col justify-between transition-all group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-base font-bold text-white font-heading group-hover:text-cyan-300 transition line-clamp-1">
                    {evt.name}
                  </h3>
                  {getStatusBadge(evt.status)}
                </div>
                <p className="text-xs text-slate-400 mb-4 line-clamp-2 min-h-[32px] font-sans leading-relaxed">
                  {evt.description || 'No operational description provided.'}
                </p>

                <div className="space-y-2.5 border-t border-b border-slate-800/80 py-3.5 mb-4 text-xs font-mono text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Registered Teams</span>
                    <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                      <Users className="w-3.5 h-3.5" />
                      {evt.teamCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Start Timestamp</span>
                    <span className="text-slate-200">{evt.startTime ? new Date(evt.startTime).toLocaleString() : 'Pending'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">End Timestamp</span>
                    <span className="text-slate-200">{evt.endTime ? new Date(evt.endTime).toLocaleString() : 'Pending'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2">
                <select
                  value={evt.status}
                  onChange={(e) => handleStatusChange(evt.id, e.target.value as EventStatus)}
                  className="bg-slate-950 border border-slate-700 text-xs font-mono text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="READY">READY</option>
                  <option value="RUNNING">RUNNING</option>
                  <option value="PAUSED">PAUSED</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/admin/events/${evt.id}/teams`}
                    className="px-3 py-1.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60 text-xs font-mono font-bold transition flex items-center gap-1"
                  >
                    Teams ({evt.teamCount})
                  </Link>
                  <Link
                    to={`/admin/events/${evt.id}`}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition"
                    title="View Details"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventListPage;

