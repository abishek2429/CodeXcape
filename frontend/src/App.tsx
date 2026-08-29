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
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { PlayerLoginPage } from './pages/player/PlayerLoginPage';
import { PlayerGamePage } from './pages/player/PlayerGamePage';
import { PlayerWaitingPage } from './pages/player/PlayerWaitingPage';
import { PlayerProtectedRoute } from './components/PlayerProtectedRoute';
import { PlayerAuthProvider } from './context/PlayerAuthContext';

import { PublicLeaderboardPage } from './pages/public/PublicLeaderboardPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <PlayerAuthProvider>
        <div className="min-h-screen bg-cyber-bg text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/public-leaderboard" element={<PublicLeaderboardPage />} />

              {/* Player Phase 4 & 5 Routes */}
              <Route path="/player/login" element={<PlayerLoginPage />} />
              <Route
                path="/player/game"
                element={
                  <PlayerProtectedRoute>
                    <PlayerGamePage />
                  </PlayerProtectedRoute>
                }
              />
              <Route
                path="/player/waiting"
                element={
                  <PlayerProtectedRoute>
                    <PlayerWaitingPage />
                  </PlayerProtectedRoute>
                }
              />
              <Route path="/player" element={<Navigate to="/player/game" replace />} />

              {/* Organizer / Admin Phase 3 & 12 Control Panel Routes */}
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
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
      </PlayerAuthProvider>
    </BrowserRouter>
  );
};

export default App;
