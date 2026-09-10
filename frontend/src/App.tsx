import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { LandingPage } from './pages/LandingPage';
import { PlayerLoginPage } from './pages/player/PlayerLoginPage';
import { PlayerProtectedRoute } from './components/PlayerProtectedRoute';
import { PlayerAuthProvider } from './context/PlayerAuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { AdminProtectedRoute } from './components/AdminProtectedRoute';
import { TargetCursor } from './components/cinematic/TargetCursor';

// Lazy-loaded player gameplay suite (isolated from initial entry bundle)
const PlayerLobbyPage = lazy(() => import('./pages/player/PlayerLobbyPage').then(m => ({ default: m.PlayerLobbyPage })));
const PlayerGamePage = lazy(() => import('./pages/player/PlayerGamePage').then(m => ({ default: m.PlayerGamePage })));
const PlayerWaitingPage = lazy(() => import('./pages/player/PlayerWaitingPage').then(m => ({ default: m.PlayerWaitingPage })));
const PublicLeaderboardPage = lazy(() => import('./pages/public/PublicLeaderboardPage').then(m => ({ default: m.PublicLeaderboardPage })));

// Lazy-loaded administrative pages (isolated from player bundle)
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage').then(m => ({ default: m.AdminLoginPage })));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const EventListPage = lazy(() => import('./pages/admin/EventListPage').then(m => ({ default: m.EventListPage })));
const CreateEventPage = lazy(() => import('./pages/admin/CreateEventPage').then(m => ({ default: m.CreateEventPage })));
const EventDetailsPage = lazy(() => import('./pages/admin/EventDetailsPage').then(m => ({ default: m.EventDetailsPage })));
const TeamListPage = lazy(() => import('./pages/admin/TeamListPage').then(m => ({ default: m.TeamListPage })));
const CreateTeamPage = lazy(() => import('./pages/admin/CreateTeamPage').then(m => ({ default: m.CreateTeamPage })));
const TeamDetailsPage = lazy(() => import('./pages/admin/TeamDetailsPage').then(m => ({ default: m.TeamDetailsPage })));

const SystemSuspenseFallback = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="terminal-text font-mono text-sm animate-pulse" style={{ color: 'var(--accent-cyan)' }}>
      &gt; SYNCHRONIZING NODE CONSOLE...
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
              <Suspense fallback={<SystemSuspenseFallback />}>
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
