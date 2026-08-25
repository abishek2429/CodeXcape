import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { LandingPage } from './pages/LandingPage';
import { EventListPage } from './pages/admin/EventListPage';
import { CreateEventPage } from './pages/admin/CreateEventPage';
import { EventDetailsPage } from './pages/admin/EventDetailsPage';
import { TeamListPage } from './pages/admin/TeamListPage';
import { CreateTeamPage } from './pages/admin/CreateTeamPage';
import { TeamDetailsPage } from './pages/admin/TeamDetailsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0a0d14] text-slate-100 flex flex-col font-sans">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />

            {/* Organizer / Admin Phase 3 Routes */}
            <Route path="/admin" element={<Navigate to="/admin/events" replace />} />
            <Route path="/admin/events" element={<EventListPage />} />
            <Route path="/admin/events/new" element={<CreateEventPage />} />
            <Route path="/admin/events/:eventId" element={<EventDetailsPage />} />
            <Route path="/admin/events/:eventId/teams" element={<TeamListPage />} />
            <Route path="/admin/events/:eventId/teams/new" element={<CreateTeamPage />} />
            <Route path="/admin/teams/:teamId" element={<TeamDetailsPage />} />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
