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
import { AdminAuthProvider } from './context/AdminAuthContext';
import { AdminProtectedRoute } from './components/AdminProtectedRoute';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <PlayerAuthProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="h-full">
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

                {/* Organizer / Admin Routes */}
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route path="/admin/dashboard" element={<AdminProtectedRoute><AdminDashboardPage /></AdminProtectedRoute>} />
                <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="/admin/events" element={<AdminProtectedRoute><EventListPage /></AdminProtectedRoute>} />
                <Route path="/admin/events/new" element={<AdminProtectedRoute><CreateEventPage /></AdminProtectedRoute>} />
                <Route path="/admin/events/:eventId" element={<AdminProtectedRoute><EventDetailsPage /></AdminProtectedRoute>} />
                <Route path="/admin/events/:eventId/teams" element={<AdminProtectedRoute><TeamListPage /></AdminProtectedRoute>} />
                <Route path="/admin/events/:eventId/teams/new" element={<AdminProtectedRoute><CreateTeamPage /></AdminProtectedRoute>} />
                <Route path="/admin/teams/:teamId" element={<AdminProtectedRoute><TeamDetailsPage /></AdminProtectedRoute>} />

              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </PlayerAuthProvider>
      </AdminAuthProvider>
    </BrowserRouter>
  );
};

export default App;
