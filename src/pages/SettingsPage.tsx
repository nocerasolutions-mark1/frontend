import { Card } from "../components/ui/Card";
import { useAuth } from "../hooks/useAuth";

export function SettingsPage() {
  const { user, tenant } = useAuth();

  return (
    <div className="grid" style={{ maxWidth: 900 }}>
      <Card className="section-card">
        <h2 style={{ marginTop: 0 }}>Tenant</h2>
        <div className="table-like">
          <div><strong>Name:</strong> {tenant?.name}</div>
          <div><strong>Slug:</strong> {tenant?.slug}</div>
          <div><strong>Plan:</strong> {tenant?.plan}</div>
          <div><strong>Status:</strong> {tenant?.status}</div>
        </div>
      </Card>

      <Card className="section-card">
        <h2 style={{ marginTop: 0 }}>Owner</h2>
        <div className="table-like">
          <div><strong>Email:</strong> {user?.email}</div>
          <div><strong>Role:</strong> {user?.role}</div>
          <div><strong>Tenant ID:</strong> {tenant?.id}</div>
        </div>
      </Card>

      <Card className="section-card">
        <h2 style={{ marginTop: 0 }}>Environment</h2>
        <div className="code-block">VITE_API_BASE_URL={String(import.meta.env.VITE_API_BASE_URL || "http://localhost:4000")}</div>
      </Card>
    </div>
  );
}
