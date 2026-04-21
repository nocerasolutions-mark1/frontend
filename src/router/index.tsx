import type { ReactElement } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { DashboardPage } from "../pages/DashboardPage";
import { QrListPage } from "../pages/QrListPage";
import { CreateQrPage } from "../pages/CreateQrPage";
import { AnalyticsPage } from "../pages/AnalyticsPage";
import { SettingsPage } from "../pages/SettingsPage";
import { useAuthContext } from "../context/AuthContext";
import { EditQrPage } from "../pages/EditQrPage";
import { QrAnalyticsPage } from "../pages/QrAnalyticsPage";

function ProtectedRoute({ children }: { children: ReactElement }) {
  const { isAuthenticated } = useAuthContext();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }: { children: ReactElement }) {
  const { isAuthenticated } = useAuthContext();
  return !isAuthenticated ? children : <Navigate to="/app/dashboard" replace />;
}

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/app/dashboard" replace /> },
  {
    path: "/login",
    element: (
      <GuestRoute>
        <LoginPage />
      </GuestRoute>
    ),
  },
  {
    path: "/register",
    element: (
      <GuestRoute>
        <RegisterPage />
      </GuestRoute>
    ),
  },
  {
    path: "/app",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: "dashboard", element: <DashboardPage /> },
      { path: "qr-codes", element: <QrListPage /> },
      { path: "qr/new", element: <CreateQrPage /> },
      { path: "qr-codes/:id/edit", element: <EditQrPage /> },
      { path: "qr-codes/:id/analytics", element: <QrAnalyticsPage /> },
      { path: "analytics", element: <AnalyticsPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
]);
