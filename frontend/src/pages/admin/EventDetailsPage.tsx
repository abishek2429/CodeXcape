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
      <div className="text-secondary flex items-center justify-center">
        <div className="animate-spin"></div>
        <span className="">Accessing event telemetry profile...</span>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="admin-panel">
        <ShieldAlert className="text-danger animate-pulse" />
        <h2 className="text-primary">EVENT NOT FOUND</h2>
        <p className="">{error || 'The requested event record could not be located on the server.'}</p>
        <Link
          to="/admin/events"
          className="admin-panel text-primary flex items-center gap-2"
        >
          <ArrowLeft className="" />
          <span>RETURN TO EVENTS REGISTRY</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="">
      <Link
        to="/admin/events"
        className="text-accent text-secondary flex items-center gap-2"
      >
        <ArrowLeft className="" />
        BACK TO EVENTS REGISTRY
      </Link>

      <div className="grid">
        {/* Main Info Card */}
        <div className="admin-panel">
          <div className="flex justify-between gap-4">
            <div>
              <span className="text-accent">
                ARENA EVENT #{event.id}
              </span>
              <h1 className="text-primary">{event.name}</h1>
            </div>
            <select
              value={event.status}
              onChange={(e) => handleStatusUpdate(e.target.value as EventStatus)}
              className=""
            >
              <option value="DRAFT">STATUS: DRAFT</option>
              <option value="READY">STATUS: READY</option>
              <option value="RUNNING">STATUS: RUNNING</option>
              <option value="PAUSED">STATUS: PAUSED</option>
              <option value="COMPLETED">STATUS: COMPLETED</option>
            </select>
          </div>

          <p className="">
            {event.description || 'No operational description provided for this arena event.'}
          </p>

          <div className="grid gap-4">
            <div className="">
              <div className="text-secondary flex items-center">
                <Users className="text-accent" />
                <span>TOTAL TEAMS</span>
              </div>
              <span className="text-primary">{event.teamCount}</span>
            </div>

            <div className="">
              <div className="text-secondary flex items-center">
                <Activity className="text-success" />
                <span>STATUS</span>
              </div>
              <span className="text-success">{event.status}</span>
            </div>

            <div className="">
              <div className="text-secondary flex items-center">
                <Key className="text-warning" />
                <span>SECURITY</span>
              </div>
              <span className="">PASSKEY HASHED</span>
            </div>
          </div>

          <div className="text-secondary">
            <div className="flex justify-between">
              <span>Start Timestamp:</span>
              <span className="">{event.startTime ? new Date(event.startTime).toLocaleString() : 'Not configured'}</span>
            </div>
            <div className="flex justify-between">
              <span>End Timestamp:</span>
              <span className="">{event.endTime ? new Date(event.endTime).toLocaleString() : 'Not configured'}</span>
            </div>
            <div className="flex justify-between">
              <span>Initialized At:</span>
              <span className="">{new Date(event.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Quick Action Panel */}
        <div className="">
          <div className="admin-panel">
            <h3 className="text-primary flex items-center gap-2">
              <Users className="text-accent" />
              TEAM REGISTRY & IMPORT
            </h3>
            <p className="text-secondary">
              Register teams individually or use the 5-step Excel bulk import pipeline.
            </p>
            <div className="">
              <Link
                to={`/admin/events/${event.id}/teams`}
                className="flex items-center justify-between"
              >
                <span>VIEW ALL TEAMS ({event.teamCount})</span>
                <ArrowLeft className="" />
              </Link>
              <Link
                to={`/admin/events/${event.id}/teams/new`}
                className="flex items-center justify-center gap-2"
              >
                <Plus className="" />
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

