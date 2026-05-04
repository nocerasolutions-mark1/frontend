import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  Camera,
  Download,
  ExternalLink,
  Eye,
  Globe,
  MoreVertical,
  Pencil,
  Play,
  Printer,
  Search,
  Trash2,
  User,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getQrCodes, deleteQrCode } from "../api/qr";
import type { QrCode } from "../api/qr";

function getContentLabel(item: QrCode): string {
  const ct = item.designJson?.contentType;
  if (ct === "video") return "Video";
  if (ct === "instagram") return "Instagram";
  if (ct === "profile") return "Profile";
  return "Website URL";
}

function getContentIcon(item: QrCode) {
  const ct = item.designJson?.contentType;
  if (ct === "video") return <Play size={13} fill="#ef4444" color="#ef4444" />;
  if (ct === "instagram") return <Camera size={13} color="#e1306c" />;
  if (ct === "profile") return <User size={13} color="#8b5cf6" />;
  return <Globe size={13} color="#1463d8" />;
}
import { generateQrObjectUrl, printQrCode } from "../lib/qrExport";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { QrImage } from "../components/ui/QrImage";

export function QrListPage() {
  const queryClient = useQueryClient();

  const { data: qrCodes, isLoading } = useQuery({
    queryKey: ["qr-codes"],
    queryFn: getQrCodes,
  });

  const [search, setSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: deleteQrCode,
    onSuccess: async () => {
      setDeletingId(null);
      setOpenMenuId(null);
      await queryClient.invalidateQueries({ queryKey: ["qr-codes"] });
      await queryClient.invalidateQueries({ queryKey: ["analytics-summary"] });
    },
    onError: () => {
      setDeletingId(null);
    },
  });

  const filtered = useMemo(() => {
    const list = qrCodes ?? [];
    if (!search.trim()) return list;
    const value = search.toLowerCase();
    return list.filter((item) =>
      [item.name, item.targetUrl, item.shortPath].some((field) =>
        field.toLowerCase().includes(value),
      ),
    );
  }, [qrCodes, search]);

  async function downloadQr(item: QrCode) {
    const objectUrl = await generateQrObjectUrl(item);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = `${item.name}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  async function viewQr(item: QrCode) {
    const objectUrl = await generateQrObjectUrl(item);
    window.open(objectUrl, "_blank", "noopener,noreferrer");
  }

  async function printQr(item: QrCode) {
    await printQrCode(item);
  }

  return (
    <div>
      {/* TOOLBAR */}
      <div className="toolbar">
        <div className="search-row">
          <div style={{ position: "relative", minWidth: 300 }}>
            <Search
              size={18}
              style={{ position: "absolute", left: 14, top: 14, color: "var(--muted)" }}
            />
            <Input
              style={{ paddingLeft: 40 }}
              placeholder="Search QR code"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <Link className="button primary" to="/app/qr/new">
          Create QR Code
        </Link>
      </div>

      {isLoading && <div className="muted">Loading QR codes...</div>}

      {/* GRID */}
      <div className="dash-qr-grid">
        {filtered.map((item) => (
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
                  aria-label="Open QR actions"
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
                    <button onClick={() => { printQr(item); setOpenMenuId(null); }}>
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

        {!filtered.length && !isLoading && (
          <Card className="section-card">
            <div className="muted">No QR codes found.</div>
          </Card>
        )}
      </div>
    </div>
  );
}
