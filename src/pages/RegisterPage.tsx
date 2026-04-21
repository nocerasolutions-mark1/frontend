import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    tenantName: "Nocera Gifts",
    tenantSlug: "nocera-gifts",
    email: "owner@nocera.com",
    password: "StrongPass123"
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await register(form);
      navigate("/app/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1 className="auth-title">Create your tenant</h1>
        <p className="auth-subtitle">Set up your QR SaaS workspace and owner account.</p>

        <form className="form-grid" onSubmit={onSubmit}>
          <label className="label">
            Tenant name
            <Input value={form.tenantName} onChange={(e) => setForm((s) => ({ ...s, tenantName: e.target.value }))} />
          </label>

          <label className="label">
            Tenant slug
            <Input value={form.tenantSlug} onChange={(e) => setForm((s) => ({ ...s, tenantSlug: e.target.value }))} />
          </label>

          <label className="label">
            Email
            <Input type="email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
          </label>

          <label className="label">
            Password
            <Input type="password" value={form.password} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} />
          </label>

          {error ? <div className="error">{error}</div> : null}

          <Button type="submit" full disabled={submitting}>
            {submitting ? "Creating..." : "Create account"}
          </Button>
        </form>

        <p className="helper" style={{ marginTop: 18 }}>
          Already have an account? <Link to="/login" style={{ color: "var(--secondary)", fontWeight: 700 }}>Login</Link>
        </p>
      </div>
    </div>
  );
}
