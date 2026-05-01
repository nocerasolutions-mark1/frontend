import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(form);
      navigate("/app/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">
          Sign in to manage your tenant QR dashboard.
        </p>

        <form className="form-grid" onSubmit={onSubmit}>
          <label className="label">
            Email
            <Input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((s) => ({ ...s, email: e.target.value }))
              }
              placeholder="Please enter your email"
            />
          </label>

          <label className="label">
            Password
            <Input
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm((s) => ({ ...s, password: e.target.value }))
              }
              placeholder="••••••••"
            />
          </label>

          {error ? <div className="error">{error}</div> : null}

          <Button type="submit" full disabled={submitting}>
            {submitting ? "Signing in..." : "Login"}
          </Button>
        </form>

        <p className="helper" style={{ marginTop: 18 }}>
          No account yet?{" "}
          <Link
            to="/register"
            style={{ color: "var(--secondary)", fontWeight: 700 }}
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
