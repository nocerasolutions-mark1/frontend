import { useQuery } from "@tanstack/react-query";
import { BarChart3, Link2, QrCode, Radio } from "lucide-react";
import { Card } from "../components/ui/Card";
import { getAnalyticsSummary } from "../api/analytics";
import { getQrCodes } from "../api/qr";

export function DashboardPage() {
  const { data: summary } = useQuery({ queryKey: ["analytics-summary"], queryFn: getAnalyticsSummary });
  const { data: qrCodes } = useQuery({ queryKey: ["qr-codes"], queryFn: getQrCodes });

  const activeCount = qrCodes?.filter((item) => item.status === "active").length ?? 0;

  return (
    <div className="grid">
      <div className="grid summary-grid">
        <Card className="summary-card">
          <div className="summary-label"><QrCode size={16} style={{ verticalAlign: "middle", marginRight: 8 }} />Total QR Codes</div>
          <div className="summary-value">{summary?.totalQrCodes ?? 0}</div>
        </Card>

        <Card className="summary-card">
          <div className="summary-label"><BarChart3 size={16} style={{ verticalAlign: "middle", marginRight: 8 }} />Total Scans</div>
          <div className="summary-value">{summary?.totalScans ?? 0}</div>
        </Card>

        <Card className="summary-card">
          <div className="summary-label"><Radio size={16} style={{ verticalAlign: "middle", marginRight: 8 }} />Active Codes</div>
          <div className="summary-value">{activeCount}</div>
        </Card>

        <Card className="summary-card">
          <div className="summary-label"><Link2 size={16} style={{ verticalAlign: "middle", marginRight: 8 }} />Avg. Scans / QR</div>
          <div className="summary-value">
            {summary?.totalQrCodes ? Math.round((summary.totalScans / summary.totalQrCodes) * 10) / 10 : 0}
          </div>
        </Card>
      </div>

      <Card className="section-card">
        <div className="spread" style={{ marginBottom: 14 }}>
          <h2 style={{ margin: 0 }}>Recent QR Codes</h2>
          <span className="muted">{qrCodes?.length ?? 0} items</span>
        </div>

        <div className="table-like">
          {qrCodes?.slice(0, 5).map((item) => (
            <div key={item.id} className="spread" style={{ padding: "12px 0", borderTop: "1px solid var(--border)" }}>
              <div>
                <div style={{ fontWeight: 700 }}>{item.name}</div>
                <div className="muted" style={{ fontSize: 14 }}>{item.targetUrl}</div>
              </div>
              <div className="badge">{item.type}</div>
            </div>
          ))}

          {!qrCodes?.length ? <div className="muted">No QR codes yet.</div> : null}
        </div>
      </Card>
    </div>
  );
}
