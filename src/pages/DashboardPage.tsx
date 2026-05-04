import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  Camera,
  Download,
  ExternalLink,
  Eye,
  Globe,
  Link2,
  MoreVertical,
  Pencil,
  Play,
  Printer,
  QrCode,
  Radio,
  Trash2,
  User,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { QrImage } from "../components/ui/QrImage";
import { getAnalyticsSummary } from "../api/analytics";
import { getQrCodes, deleteQrCode } from "../api/qr";
import type { QrCode as QrCodeType } from "../api/qr";
import { generateQrObjectUrl, printQrCode } from "../lib/qrExport";

function getContentLabel(item: QrCodeType): string {
  const ct = item.designJson?.contentType;
  if (ct === "video") return "Video";
  if (ct === "instagram") return "Instagram";
  if (ct === "profile") return "Profile";
  return "Website URL";
}

function getContentIcon(item: QrCodeType) {
  const ct = item.designJson?.contentType;
  if (ct === "video") return <Play size={13} fill="#ef4444" color="#ef4444" />;
  if (ct === "instagram") return <Camera size={13} color="#e1306c" />;
  if (ct === "profile") return <User size={13} color="#8b5cf6" />;
  return <Globe size={13} color="#1463d8" />;
}

export function DashboardPage() {
  const queryClient = useQueryClient();

  const { data: summary } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: getAnalyticsSummary,
  });
  const { data: qrCodes } = useQuery({
    queryKey: ["qr-codes"],
    queryFn: getQrCodes,
  });

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const activeCount =
    qrCodes?.filter((item) => item.status === "active").length ?? 0;

  const deleteMutation = useMutation({
    mutationFn: deleteQrCode,
    onSuccess: async () => {
      setDeletingId(null);
      setOpenMenuId(null);
      await queryClient.invalidateQueries({ queryKey: ["qr-codes"] });
      await queryClient.invalidateQueries({ queryKey: ["analytics-summary"] });
    },
    onError: () => setDeletingId(null),
  });

  async function downloadQr(item: QrCodeType) {
    const objectUrl = await generateQrObjectUrl(item);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = `${item.name}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  async function viewQr(item: QrCodeType) {
    const objectUrl = await generateQrObjectUrl(item);
    window.open(objectUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="grid">
      {/* SUMMARY STATS */}
      <div className="grid summary-grid">
        <Card className="summary-card">
          <div className="summary-label">
            <QrCode size={16} style={{ verticalAlign: "middle", marginRight: 8 }} />
            Total QR Codes
          </div>
          <div className="summary-value">{summary?.totalQrCodes ?? 0}</div>
        </Card>

        <Card className="summary-card">
          <div className="summary-label">
            <BarChart3 size={16} style={{ verticalAlign: "middle", marginRight: 8 }} />
            Total Scans
          </div>
          <div className="summary-value">{summary?.totalScans ?? 0}</div>
        </Card>

        <Card className="summary-card">
          <div className="summary-label">
            <Radio size={16} style={{ verticalAlign: "middle", marginRight: 8 }} />
            Active Codes
          </div>
          <div className="summary-value">{activeCount}</div>
        </Card>

        <Card className="summary-card">
          <div className="summary-label">
            <Link2 size={16} style={{ verticalAlign: "middle", marginRight: 8 }} />
            Avg. Scans / QR
          </div>
          <div className="summary-value">
            {summary?.totalQrCodes
              ? Math.round((summary.totalScans / summary.totalQrCodes) * 10) / 10
              : 0}
          </div>
        </Card>
      </div>

      {/* RECENT QR CODES */}
      <div>
        <div className="spread" style={{ marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>Recent QR Codes</h2>
          <span className="muted">{qrCodes?.length ?? 0} items</span>
        </div>

        {!qrCodes?.length ? (
          <Card className="section-card">
            <div className="muted">No QR codes yet.</div>
          </Card>
        ) : (
          <div className="dash-qr-grid">
            {qrCodes.slice(0, 6).map((item) => (
              <div className="dash-qr-card card" key={item.id}>
                {/* Colored banner — name + menu */}
                <div className="dash-qr-banner">
                  <span className="dash-qr-name">{item.name}</span>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <button
                      className="icon-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === item.id ? null : item.id);
                      }}
                      aria-label="Open actions"
                    >
                      <MoreVertical size={18} />
                    </button>

                    {openMenuId === item.id && (
                      <div className="dropdown-menu">
                        <button onClick={() => { viewQr(item); setOpenMenuId(null); }}>
                          <Eye size={16} /> View QR
                        </button>
                        <Link to={`/app/qr-codes/${item.id}/edit`} onClick={() => setOpenMenuId(null)}>
                          <Pencil size={16} /> Edit
                        </Link>
                        <Link to={`/app/qr-codes/${item.id}/analytics`} onClick={() => setOpenMenuId(null)}>
                          <BarChart3 size={16} /> Analytics
                        </Link>
                        <button onClick={() => { printQrCode(item); setOpenMenuId(null); }}>
                          <Printer size={16} /> Print QR
                        </button>
                        <div className="dropdown-divider" />
                        <button
                          className="dropdown-danger"
                          disabled={deleteMutation.isPending && deletingId === item.id}
                          onClick={() => {
                            if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
                            setDeletingId(item.id);
                            deleteMutation.mutate(item.id);
                          }}
                        >
                          <Trash2 size={16} />
                          {deleteMutation.isPending && deletingId === item.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="dash-qr-body">
                  <div className="badge content-type-badge" style={{ alignSelf: "center" }}>
                    {getContentIcon(item)}
                    {getContentLabel(item)}
                  </div>

                  <a
                    className="dash-qr-url"
                    href={item.targetUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink size={13} />
                    <span>{item.targetUrl}</span>
                  </a>

                  <hr className="dash-qr-divider" />

                  <div className="dash-qr-image-wrap">
                    <QrImage qrCode={item} alt={item.name} className="dash-qr-img" />
                  </div>

                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <Link to={`/app/qr-codes/${item.id}/analytics`} className="scan-btn">
                      <BarChart3 size={15} />
                      {item._count?.scanEvents ?? 0} Scans
                    </Link>
                  </div>

                  <div className="qr-meta" style={{ textAlign: "center" }}>
                    Updated {new Date(item.updatedAt).toLocaleString()}
                  </div>

                  <button className="button primary full" onClick={() => downloadQr(item)}>
                    <Download size={16} />
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
