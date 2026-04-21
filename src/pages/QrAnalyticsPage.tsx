import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { getQrAnalytics } from "../api/analytics";
import { Card } from "../components/ui/Card";

export function QrAnalyticsPage() {
  const { id = "" } = useParams();

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
      <div className="grid summary-grid">
        <Card className="summary-card">
          <div className="summary-label">Total scans</div>
          <div className="summary-value">{data?.totalScans ?? 0}</div>
        </Card>
      </div>

      <Card className="section-card">
        <h2 style={{ marginTop: 0 }}>Recent scans</h2>
        <div className="table-like">
          {data?.recentScans?.map((scan, index) => (
            <div
              key={index}
              className="spread"
              style={{
                padding: "12px 0",
                borderTop: "1px solid var(--border)",
              }}
            >
              <div>
                <div style={{ fontWeight: 700 }}>
                  {scan.deviceType || "device"} · {scan.browser || "browser"}
                </div>
                <div className="muted" style={{ fontSize: 14 }}>
                  {scan.os || "OS"} {scan.country ? `· ${scan.country}` : ""}
                </div>
              </div>
              <div className="muted">
                {new Date(scan.createdAt).toLocaleString()}
              </div>
            </div>
          ))}

          {!data?.recentScans?.length ? (
            <div className="muted">No scans yet.</div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
