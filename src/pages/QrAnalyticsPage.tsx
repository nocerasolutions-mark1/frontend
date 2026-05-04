import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { getQrAnalytics } from "../api/analytics";
import { getQrCodeById } from "../api/qr";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

function val(v: string | null | undefined): string {
  if (v == null || v === "null" || v.trim() === "") return "—";
  return v;
}

function deviceIcon(type: string | null | undefined) {
  if (type === "mobile") return "📱";
  if (type === "tablet") return "📟";
  if (type === "desktop") return "🖥️";
  return "❓";
}

export function QrAnalyticsPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();

  const { data: qr } = useQuery({
    queryKey: ["qr-code", id],
    queryFn: () => getQrCodeById(id),
    enabled: Boolean(id),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["qr-analytics", id],
    queryFn: () => getQrAnalytics(id),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return <div className="muted">Loading analytics...</div>;
  }

  return (
    <div className="grid">
      <div className="spread">
        <Button variant="ghost" onClick={() => navigate(-1)}>← Back</Button>
        {qr && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 800, fontSize: 20 }}>{qr.name}</div>
            <div className="muted" style={{ fontSize: 13 }}>{qr.targetUrl}</div>
          </div>
        )}
      </div>

      <div className="grid summary-grid">
        <Card className="summary-card">
          <div className="summary-label">Total Scans</div>
          <div className="summary-value">{data?.totalScans ?? 0}</div>
        </Card>
      </div>

      <Card className="section-card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="analytics-table-header">
          <span>Recent Scans</span>
          <span className="muted" style={{ fontSize: 13 }}>Last 20 events</span>
        </div>

        <div className="analytics-scroll">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Device</th>
                <th>Browser</th>
                <th>OS</th>
                <th>Country</th>
                <th>City</th>
                <th>Referer</th>
              </tr>
            </thead>
            <tbody>
              {data?.recentScans?.map((scan, i) => (
                <tr key={i}>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {new Date(scan.createdAt).toLocaleString("en-GB", {
                      day: "2-digit", month: "2-digit", year: "numeric",
                      hour: "2-digit", minute: "2-digit", second: "2-digit",
                      timeZoneName: "short",
                    })}
                  </td>
                  <td>
                    <span title={scan.deviceType ?? undefined}>
                      {deviceIcon(scan.deviceType)}{" "}
                      <span className="muted" style={{ fontSize: 13 }}>
                        {val(scan.deviceType)}
                      </span>
                    </span>
                  </td>
                  <td>{val(scan.browser)}</td>
                  <td>{val(scan.os)}</td>
                  <td>{val(scan.country)}</td>
                  <td>{val(scan.city)}</td>
                  <td>
                    <span className="analytics-url-text" style={{ maxWidth: 180 }}>
                      {val(scan.referer)}
                    </span>
                  </td>
                </tr>
              ))}
              {!data?.recentScans?.length && (
                <tr>
                  <td colSpan={7} className="analytics-empty-row">No scans yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
