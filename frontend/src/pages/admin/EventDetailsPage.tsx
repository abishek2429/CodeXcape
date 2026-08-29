import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchEventById, updateEventStatus } from '../../services/eventService';
import { Event, EventStatus } from '../../types/event';
import { ArrowLeft, Users, ShieldAlert, Plus, Key, Activity } from 'lucide-react';

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
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="font-mono text-xs">Accessing event telemetry profile...</span>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 text-center cyber-panel rounded-3xl border border-rose-500/40 p-8 my-8 font-mono">
        <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto mb-3 animate-pulse" />
        <h2 className="text-xl font-bold font-heading text-white uppercase mb-2">EVENT NOT FOUND</h2>
        <p className="text-xs text-rose-200/80 mb-6">{error || 'The requested event record could not be located on the server.'}</p>
        <Link
          to="/admin/events"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white font-mono text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>RETURN TO EVENTS REGISTRY</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 font-sans">
      <Link
        to="/admin/events"
        className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-cyan-400 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        BACK TO EVENTS REGISTRY
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Card */}
        <div className="lg:col-span-2 cyber-panel hud-corner p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 uppercase tracking-widest">
                ARENA EVENT #{event.id}
              </span>
              <h1 className="text-2xl font-bold text-white font-heading mt-2">{event.name}</h1>
            </div>
            <select
              value={event.status}
              onChange={(e) => handleStatusUpdate(e.target.value as EventStatus)}
              className="bg-slate-950 border border-slate-700 text-xs font-mono text-cyan-300 font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value="DRAFT">STATUS: DRAFT</option>
              <option value="READY">STATUS: READY</option>
              <option value="RUNNING">STATUS: RUNNING</option>
              <option value="PAUSED">STATUS: PAUSED</option>
              <option value="COMPLETED">STATUS: COMPLETED</option>
            </select>
          </div>

          <p className="text-xs text-slate-300 mb-6 bg-slate-950/80 p-4 rounded-xl border border-slate-800 font-sans leading-relaxed shadow-inner">
            {event.description || 'No operational description provided for this arena event.'}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono mb-1">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>TOTAL TEAMS</span>
              </div>
              <span className="text-2xl font-black font-heading text-white">{event.teamCount}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono mb-1">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>STATUS</span>
              </div>
              <span className="text-xs font-bold text-emerald-400 font-mono uppercase">{event.status}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono mb-1">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>SECURITY</span>
              </div>
              <span className="text-xs font-mono text-slate-300">PASSKEY HASHED</span>
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs text-slate-400 border-t border-slate-800/80 pt-4">
            <div className="flex justify-between">
              <span>Start Timestamp:</span>
              <span className="text-slate-200">{event.startTime ? new Date(event.startTime).toLocaleString() : 'Not configured'}</span>
            </div>
            <div className="flex justify-between">
              <span>End Timestamp:</span>
              <span className="text-slate-200">{event.endTime ? new Date(event.endTime).toLocaleString() : 'Not configured'}</span>
            </div>
            <div className="flex justify-between">
              <span>Initialized At:</span>
              <span className="text-slate-200">{new Date(event.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Quick Action Panel */}
        <div className="space-y-6">
          <div className="cyber-panel p-6 rounded-3xl border border-slate-800 font-mono">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              TEAM REGISTRY & IMPORT
            </h3>
            <p className="text-xs text-slate-400 font-sans mb-5 leading-relaxed">
              Register teams individually or use the 5-step Excel bulk import pipeline.
            </p>
            <div className="space-y-3">
              <Link
                to={`/admin/events/${event.id}/teams`}
                className="w-full py-3 px-4 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60 text-xs font-mono font-bold flex items-center justify-between transition"
              >
                <span>VIEW ALL TEAMS ({event.teamCount})</span>
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </Link>
              <Link
                to={`/admin/events/${event.id}/teams/new`}
                className="w-full py-3 px-4 rounded-xl cyber-btn-primary text-slate-950 font-bold text-xs font-mono flex items-center justify-center gap-2 transition"
              >
                <Plus className="w-4 h-4" />
                <span>CREATE SINGLE TEAM</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsPage;

