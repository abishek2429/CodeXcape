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
      <span className="admin-dynamic-element">
        {status}
      </span>
    );
  };

  return (
    <div className="">
      {/* Header section */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-primary flex items-center">
              <Activity className="text-accent" />
              EVENT OPERATIONS REGISTRY
            </h1>
          </div>
          <p className="text-secondary">Configure, orchestrate, and monitor CodeXcape arena events.</p>
        </div>
        <div className="flex items-center">
          <button
            onClick={loadEvents}
            className="admin-panel text-primary"
            title="Refresh list"
          >
            <RefreshCw className="admin-dynamic-element" />
          </button>
          <Link
            to="/admin/events/new"
            className="flex items-center gap-2"
          >
            <Plus className="" />
            <span>CREATE ARENA EVENT</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="flex items-center">
          <ShieldAlert className="text-danger flex" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="text-secondary flex items-center justify-center">
          <div className="animate-spin"></div>
          <span className="">Accessing event telemetry registry...</span>
        </div>
      ) : events.length === 0 ? (
        <div className="admin-panel">
          <Calendar className="" />
          <h3 className="">No Events Registered</h3>
          <p className="text-secondary">Initialize your first CodeXcape competition environment.</p>
          <Link
            to="/admin/events/new"
            className="flex items-center gap-2"
          >
            <Plus className="" />
            <span>Create First Event</span>
          </Link>
        </div>
      ) : (
        <div className="grid">
          {events.map((evt) => (
            <div
              key={evt.id}
              className="admin-panel flex justify-between"
            >
              <div>
                <div className="flex justify-between">
                  <h3 className="text-primary">
                    {evt.name}
                  </h3>
                  {getStatusBadge(evt.status)}
                </div>
                <p className="text-secondary">
                  {evt.description || 'No operational description provided.'}
                </p>

                <div className="">
                  <div className="flex items-center justify-between">
                    <span className="text-secondary">Registered Teams</span>
                    <span className="text-accent flex items-center">
                      <Users className="" />
                      {evt.teamCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-secondary">Start Timestamp</span>
                    <span className="">{evt.startTime ? new Date(evt.startTime).toLocaleString() : 'Pending'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-secondary">End Timestamp</span>
                    <span className="">{evt.endTime ? new Date(evt.endTime).toLocaleString() : 'Pending'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <select
                  value={evt.status}
                  onChange={(e) => handleStatusChange(evt.id, e.target.value as EventStatus)}
                  className=""
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
                    className="flex items-center"
                  >
                    Teams ({evt.teamCount})
                  </Link>
                  <Link
                    to={`/admin/events/${evt.id}`}
                    className="admin-panel text-primary"
                    title="View Details"
                  >
                    <ArrowRight className="" />
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

