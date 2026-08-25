import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchEventById, updateEventStatus } from '../../services/eventService';
import { Event, EventStatus } from '../../types/event';
import { ArrowLeft, Users, ShieldAlert, Clock, RefreshCw, Plus, Key } from 'lucide-react';

export const EventDetailsPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadEventDetails = async () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEventById(Number(eventId));
      setEvent(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEventDetails();
  }, [eventId]);

  const handleStatusUpdate = async (newStatus: EventStatus) => {
    if (!event) return;
    try {
      const updated = await updateEventStatus(event.id, newStatus);
      setEvent(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
        <span className="font-mono text-sm">Loading event details...</span>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 text-center">
        <ShieldAlert className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h2 className="text-xl font-mono text-white mb-2">Event Not Found</h2>
        <p className="text-sm text-slate-400 mb-6">{error || 'The requested event could not be found.'}</p>
        <Link
          to="/admin/events"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-200 hover:text-white font-mono text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Events
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <Link
        to="/admin/events"
        className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-cyan-400 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        BACK TO EVENTS
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Card */}
        <div className="lg:col-span-2 rounded-2xl bg-[#0e1322] border border-slate-800 p-8 shadow-xl">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <span className="text-xs font-mono text-cyan-400 font-semibold tracking-wider">EVENT #{event.id}</span>
              <h1 className="text-2xl font-bold text-white font-mono mt-1">{event.name}</h1>
            </div>
            <select
              value={event.status}
              onChange={(e) => handleStatusUpdate(e.target.value as EventStatus)}
              className="bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-400 font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
            >
              <option value="DRAFT">STATUS: DRAFT</option>
              <option value="READY">STATUS: READY</option>
              <option value="RUNNING">STATUS: RUNNING</option>
              <option value="PAUSED">STATUS: PAUSED</option>
              <option value="COMPLETED">STATUS: COMPLETED</option>
            </select>
          </div>

          <p className="text-sm text-slate-300 mb-6 bg-slate-950/60 p-4 rounded-xl border border-slate-900 leading-relaxed">
            {event.description || 'No description available for this event.'}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-mono mb-1">
                <Users className="w-4 h-4 text-cyan-400" />
                TOTAL TEAMS
              </div>
              <span className="text-2xl font-extrabold text-white font-mono">{event.teamCount}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-mono mb-1">
                <Clock className="w-4 h-4 text-emerald-400" />
                STATUS
              </div>
              <span className="text-sm font-bold text-emerald-400 font-mono">{event.status}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-mono mb-1">
                <Key className="w-4 h-4 text-amber-400" />
                SECURITY
              </div>
              <span className="text-xs font-mono text-slate-300">PASSKEY PROTECTED</span>
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs text-slate-400 border-t border-slate-800/80 pt-4">
            <div className="flex justify-between">
              <span>Start Time:</span>
              <span className="text-slate-200">{event.startTime ? new Date(event.startTime).toLocaleString() : 'Not configured'}</span>
            </div>
            <div className="flex justify-between">
              <span>End Time:</span>
              <span className="text-slate-200">{event.endTime ? new Date(event.endTime).toLocaleString() : 'Not configured'}</span>
            </div>
            <div className="flex justify-between">
              <span>Created At:</span>
              <span className="text-slate-200">{new Date(event.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Quick Action Panel */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-[#0e1322] border border-slate-800 p-6">
            <h3 className="text-sm font-bold text-white font-mono mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              TEAM MANAGEMENT
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Register teams, assign two players per team, and inspect team codes.
            </p>
            <div className="space-y-3">
              <Link
                to={`/admin/events/${event.id}/teams`}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 text-xs font-mono font-bold flex items-center justify-between transition"
              >
                <span>VIEW ALL TEAMS ({event.teamCount})</span>
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </Link>
              <Link
                to={`/admin/events/${event.id}/teams/new`}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 text-xs font-mono flex items-center justify-center gap-2 transition shadow-lg shadow-cyan-500/20"
              >
                <Plus className="w-4 h-4" />
                CREATE TEAM FOR EVENT
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsPage;
