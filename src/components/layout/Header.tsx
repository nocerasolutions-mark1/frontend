import { useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const titles: Record<string, { title: string; subtitle: string }> = {
  "/app/dashboard": {
    title: "Tenant Dashboard",
    subtitle: "Overview of QR codes, scans and recent activity."
  },
  "/app/qr-codes": {
    title: "Active QR Codes",
    subtitle: "Search, filter and manage your current QR inventory."
  },
  "/app/qr/new": {
    title: "Create QR Code",
    subtitle: "Generate a new static or dynamic QR code in seconds."
  },
  "/app/analytics": {
    title: "Analytics",
    subtitle: "Track scans and growth across your workspace."
  },
  "/app/settings": {
    title: "Settings",
    subtitle: "View tenant details and environment configuration."
  }
};

export function Header() {
  const { pathname } = useLocation();
  const { tenant } = useAuth();

  const current = titles[pathname] ?? {
    title: "QR SaaS",
    subtitle: tenant?.name ?? ""
  };

  return (
    <div className="topbar">
      <div>
        <h1 className="page-title">{current.title}</h1>
        <p className="page-subtitle">{current.subtitle}</p>
      </div>
      <div className="badge">{tenant?.plan ?? "free"} plan</div>
    </div>
  );
}
