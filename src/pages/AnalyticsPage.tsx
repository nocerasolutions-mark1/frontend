import { useQuery } from "@tanstack/react-query";
import { Card } from "../components/ui/Card";
import { getAnalyticsSummary } from "../api/analytics";

export function AnalyticsPage() {
  const { data } = useQuery({ queryKey: ["analytics-summary"], queryFn: getAnalyticsSummary });

  return (
    <div className="grid">
      <div className="grid summary-grid">
        <Card className="summary-card">
          <div className="summary-label">Total scans</div>
          <div className="summary-value">{data?.totalScans ?? 0}</div>
        </Card>

        <Card className="summary-card">
          <div className="summary-label">Total QR codes</div>
          <div className="summary-value">{data?.totalQrCodes ?? 0}</div>
        </Card>
      </div>

      <Card className="section-card">
        <h2 style={{ marginTop: 0 }}>API Notes</h2>
        <p className="muted">
          This starter currently uses the backend summary endpoint. Add per-QR analytics routes later for charts,
          country breakdowns and recent scan activity.
        </p>
        <div className="code-block">GET /analytics/summary</div>
      </Card>
    </div>
  );
}
