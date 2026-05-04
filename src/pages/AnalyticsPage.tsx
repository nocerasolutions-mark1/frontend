import { useQuery, useQueries } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { BarChart3, QrCode } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { getAnalyticsSummary, getQrAnalytics } from "../api/analytics";
import { getQrCodes } from "../api/qr";

const COLORS = [
  "#12b76a", "#1463d8", "#f97316", "#8b5cf6",
  "#ec4899", "#06b6d4", "#eab308", "#ef4444",
];

type Slice = { label: string; value: number; color: string };

function px(cx: number, cy: number, r: number, a: number) {
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function arc(cx: number, cy: number, ro: number, ri: number, a0: number, a1: number) {
  const s = px(cx, cy, ro, a0), e = px(cx, cy, ro, a1);
  const si = px(cx, cy, ri, a1), ei = px(cx, cy, ri, a0);
  const lg = a1 - a0 > Math.PI ? 1 : 0;
  return `M${s.x},${s.y}A${ro},${ro} 0 ${lg} 1 ${e.x},${e.y}L${si.x},${si.y}A${ri},${ri} 0 ${lg} 0 ${ei.x},${ei.y}Z`;
}

function DonutChart({ slices }: { slices: Slice[] }) {
  const total = slices.reduce((s, d) => s + d.value, 0);
  if (!total) {
    return (
      <div className="pie-empty">
        <span>No data yet</span>
      </div>
    );
  }

  const cx = 70, cy = 70, ro = 62, ri = 38;
  let angle = -Math.PI / 2;
  const paths: (Slice & { d: string })[] = [];

  slices.forEach((s) => {
    const span = (s.value / total) * 2 * Math.PI;
    if (slices.length === 1) {
      // full circle — SVG arc can't handle 360°, use two 180° arcs
      paths.push({ ...s, d: arc(cx, cy, ro, ri, -Math.PI / 2, Math.PI * 3 / 2 - 0.001) });
    } else {
      paths.push({ ...s, d: arc(cx, cy, ro, ri, angle, angle + span) });
    }
    angle += span;
  });

  return (
    <div className="donut-wrap">
      <svg width={140} height={140} viewBox="0 0 140 140">
        {paths.map((p, i) => (
          <path key={i} d={p.d} fill={p.color} />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--text)">
          {total}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize={10} fill="var(--muted)">
          total
        </text>
      </svg>

      <div className="donut-legend">
        {slices.map((s, i) => (
          <div key={i} className="donut-legend-row">
            <span className="donut-dot" style={{ background: s.color }} />
            <span className="donut-label">{s.label}</span>
            <span className="donut-pct">{Math.round((s.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function toCounts(scans: { os?: string | null; country?: string | null; city?: string | null }[], field: "os" | "country" | "city") {
  const counts: Record<string, number> = {};
  scans.forEach((s) => {
    const key = s[field]?.trim() || "Unknown";
    counts[key] = (counts[key] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([label, value], i) => ({ label, value, color: COLORS[i % COLORS.length] }));
}

export function AnalyticsPage() {
  const navigate = useNavigate();

  const { data: summary } = useQuery({ queryKey: ["analytics-summary"], queryFn: getAnalyticsSummary });
  const { data: qrCodes } = useQuery({ queryKey: ["qr-codes"], queryFn: getQrCodes });

  const analyticsQueries = useQueries({
    queries: (qrCodes ?? []).map((qr) => ({
      queryKey: ["qr-analytics", qr.id],
      queryFn: () => getQrAnalytics(qr.id),
      enabled: Boolean(qrCodes?.length),
    })),
  });

  const allScans = analyticsQueries.flatMap((q) => q.data?.recentScans ?? []);

  const sorted = [...(qrCodes ?? [])].sort(
    (a, b) => (b._count?.scanEvents ?? 0) - (a._count?.scanEvents ?? 0),
  );
  const totalScans = summary?.totalScans ?? 0;

  return (
    <div className="grid">
      <div>
        <Button variant="ghost" onClick={() => navigate(-1)}>← Back</Button>
      </div>

      {/* Summary strip */}
      <div className="grid summary-grid">
        <Card className="summary-card">
          <div className="summary-label">
            <QrCode size={15} style={{ verticalAlign: "middle", marginRight: 6 }} />
            Total QR Codes
          </div>
          <div className="summary-value">{summary?.totalQrCodes ?? 0}</div>
        </Card>
        <Card className="summary-card">
          <div className="summary-label">
            <BarChart3 size={15} style={{ verticalAlign: "middle", marginRight: 6 }} />
            Total Scans
          </div>
          <div className="summary-value">{totalScans}</div>
        </Card>
      </div>

      {/* Breakdown pie charts */}
      <div className="analytics-pie-grid">
        <Card className="section-card pie-section-card">
          <div className="analytics-table-header">
            <span>🖥️</span>
            <span>Operating Systems</span>
          </div>
          <DonutChart slices={toCounts(allScans, "os")} />
        </Card>

        <Card className="section-card pie-section-card">
          <div className="analytics-table-header">
            <span>🌍</span>
            <span>Countries</span>
          </div>
          <DonutChart slices={toCounts(allScans, "country")} />
        </Card>

        <Card className="section-card pie-section-card">
          <div className="analytics-table-header">
            <span>📍</span>
            <span>Cities</span>
          </div>
          <DonutChart slices={toCounts(allScans, "city")} />
        </Card>
      </div>

      {/* Scans by QR Code — scrollable table */}
      <Card className="section-card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="analytics-table-header">
          <BarChart3 size={16} color="var(--primary)" />
          <span>Scans by QR Code</span>
        </div>

        <div className="analytics-scroll">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>URL</th>
                <th>Type</th>
                <th>Scans</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((item) => {
                const scans = item._count?.scanEvents ?? 0;
                const pct = totalScans ? Math.round((scans / totalScans) * 100) : 0;
                return (
                  <tr
                    key={item.id}
                    className="analytics-row-clickable"
                    onClick={() => navigate(`/app/qr-codes/${item.id}/analytics`)}
                  >
                    <td className="analytics-name">{item.name}</td>
                    <td>
                      <span className="analytics-url-text">{item.targetUrl}</span>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: item.type === "dynamic" ? "#eef4ff" : "#f0fdf4",
                          color: item.type === "dynamic" ? "#1463d8" : "#12b76a",
                        }}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td className="analytics-num">{scans}</td>
                    <td className="analytics-num">{pct}%</td>
                  </tr>
                );
              })}
              {!sorted.length && (
                <tr>
                  <td colSpan={5} className="analytics-empty-row">No QR codes yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
