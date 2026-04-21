import { Link, NavLink } from "react-router-dom";
import { BarChart3, Folder, LayoutDashboard, Link2, LogOut, Plus, QrCode, Settings } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export function Sidebar() {
  const { tenant, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="brand">
        <QrCode size={24} />
        <span>QR SaaS</span>
      </div>

      <Link to="/app/qr/new" className="button ghost full" style={{ marginBottom: 18 }}>
        <Plus size={18} />
        Create QR Code
      </Link>

      <div className="sidebar-section-title">QR Codes</div>
      <nav className="sidebar-nav">
        <NavLink to="/app/dashboard" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>
        <NavLink to="/app/qr-codes" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
          <Link2 size={18} />
          Active
        </NavLink>
        <NavLink to="/app/analytics" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
          <BarChart3 size={18} />
          Stats
        </NavLink>
      </nav>

      <div className="sidebar-section-title">Workspace</div>
      <nav className="sidebar-nav">
        <NavLink to="/app/settings" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
          <Settings size={18} />
          Settings
        </NavLink>
        <a className="nav-link" href="https://railway.app" target="_blank" rel="noreferrer">
          <Folder size={18} />
          Docs / Ops
        </a>
      </nav>

      <div className="sidebar-section-title">Account</div>
      <div className="helper" style={{ marginBottom: 14 }}>{tenant?.name ?? "Tenant"}</div>
      <button className="nav-link" onClick={logout} style={{ border: "none", width: "100%", background: "transparent", cursor: "pointer" }}>
        <LogOut size={18} />
        Logout
      </button>
    </aside>
  );
}
