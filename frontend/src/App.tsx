import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { LandingPage } from './pages/LandingPage';
import { PlayerLoginPage } from './pages/player/PlayerLoginPage';
import { PlayerLobbyPage } from './pages/player/PlayerLobbyPage';
import { PlayerGamePage } from './pages/player/PlayerGamePage';
import { PlayerWaitingPage } from './pages/player/PlayerWaitingPage';
import { PlayerProtectedRoute } from './components/PlayerProtectedRoute';
import { PlayerAuthProvider } from './context/PlayerAuthContext';
import { PublicLeaderboardPage } from './pages/public/PublicLeaderboardPage';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { AdminProtectedRoute } from './components/AdminProtectedRoute';
import { TargetCursor } from './components/cinematic/TargetCursor';

// Lazy-loaded administrative pages (isolated from player bundle)
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage').then(m => ({ default: m.AdminLoginPage })));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const EventListPage = lazy(() => import('./pages/admin/EventListPage').then(m => ({ default: m.EventListPage })));
const CreateEventPage = lazy(() => import('./pages/admin/CreateEventPage').then(m => ({ default: m.CreateEventPage })));
const EventDetailsPage = lazy(() => import('./pages/admin/EventDetailsPage').then(m => ({ default: m.EventDetailsPage })));
const TeamListPage = lazy(() => import('./pages/admin/TeamListPage').then(m => ({ default: m.TeamListPage })));
const CreateTeamPage = lazy(() => import('./pages/admin/CreateTeamPage').then(m => ({ default: m.CreateTeamPage })));
const TeamDetailsPage = lazy(() => import('./pages/admin/TeamDetailsPage').then(m => ({ default: m.TeamDetailsPage })));

const AdminSuspenseFallback = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="terminal-text text-accent font-mono text-sm animate-pulse">
      &gt; INITIALIZING SECURITY CONSOLE...
    </div>
  </div>
);

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <PlayerAuthProvider>
          <div className="min-h-screen flex flex-col relative">
            {/* Global Cinematic Target Crosshair Cursor */}
            <TargetCursor enabled={true} />

            {/* Global Scanline Overlay */}
            <div className="scanline-overlay" aria-hidden="true" />

            <Header />

            <main className="h-full relative z-10">
              <Suspense fallback={<AdminSuspenseFallback />}>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<Navigate to="/player/login" replace />} />
                  <Route path="/public-leaderboard" element={<PublicLeaderboardPage />} />

                  {/* Player Phase 4 & 5 Routes */}
                  <Route path="/player/login" element={<PlayerLoginPage />} />
                  <Route
                    path="/player/lobby"
                    element={
                      <PlayerProtectedRoute>
                        <PlayerLobbyPage />
                      </PlayerProtectedRoute>
                    }
                  />
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
              </Suspense>
            </main>
          </div>
        </PlayerAuthProvider>
      </AdminAuthProvider>
    </BrowserRouter>
  );
};

export default App;
