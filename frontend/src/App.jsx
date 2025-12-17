import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import GamePage from "./pages/GamePage";
import LeaderboardPage from "./pages/LeaderboardPage";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />

        <Route
          path="/game"
          element={
            <ProtectedRoute>
              <GamePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <LeaderboardPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/game" replace />} />
      </Routes>
    </AuthProvider>
  );
}
