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
      DRAFT: 'bg-slate-800 text-slate-300 border-slate-700',
      READY: 'bg-cyan-950/80 text-cyan-400 border-cyan-700/60',
      RUNNING: 'bg-emerald-950/80 text-emerald-400 border-emerald-700/60 animate-pulse',
      PAUSED: 'bg-amber-950/80 text-amber-400 border-amber-700/60',
      COMPLETED: 'bg-indigo-950/80 text-indigo-400 border-indigo-700/60',
    };
    return (
      <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold border ${styles[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white font-mono flex items-center gap-3">
            <Activity className="w-7 h-7 text-cyan-400" />
            EVENT MANAGEMENT
          </h1>
          <p className="text-sm text-slate-400 mt-1">Configure and manage CodeXcape competitions.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadEvents}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/admin/events/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-sm shadow-lg shadow-cyan-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            CREATE EVENT
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
          <span className="font-mono text-sm">Loading event registry...</span>
        </div>
      ) : events.length === 0 ? (
        <div className="py-20 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-200 font-mono">No Events Registered</h3>
          <p className="text-sm text-slate-400 mt-1 mb-4">Create your first CodeXcape competition.</p>
          <Link
            to="/admin/events/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 text-sm font-mono transition"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((evt) => (
            <div
              key={evt.id}
              className="rounded-2xl bg-[#0e1322] border border-slate-800 hover:border-slate-700/80 p-6 flex flex-col justify-between transition group hover:shadow-xl hover:shadow-cyan-950/20"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-lg font-bold text-white font-mono group-hover:text-cyan-400 transition line-clamp-1">
                    {evt.name}
                  </h3>
                  {getStatusBadge(evt.status)}
                </div>
                <p className="text-xs text-slate-400 mb-4 line-clamp-2 min-h-[32px]">
                  {evt.description || 'No description provided.'}
                </p>

                <div className="space-y-2 border-t border-b border-slate-800/80 py-3 mb-4 text-xs font-mono text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Registered Teams</span>
                    <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                      <Users className="w-3.5 h-3.5" />
                      {evt.teamCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Start Time</span>
                    <span>{evt.startTime ? new Date(evt.startTime).toLocaleString() : 'Not Set'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">End Time</span>
                    <span>{evt.endTime ? new Date(evt.endTime).toLocaleString() : 'Not Set'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2">
                <select
                  value={evt.status}
                  onChange={(e) => handleStatusChange(evt.id, e.target.value as EventStatus)}
                  className="bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
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
                    className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 text-xs font-mono transition flex items-center gap-1"
                  >
                    Teams ({evt.teamCount})
                  </Link>
                  <Link
                    to={`/admin/events/${evt.id}`}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition"
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
