import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  ExternalLink,
  Eye,
  Link2,
  MoreVertical,
  Pencil,
  Printer,
  Search,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getQrCodes, getRedirectUrl, deleteQrCode } from "../api/qr";
import { fetchQrImageObjectUrl } from "../api/qr";
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

  async function downloadQr(id: string, name: string) {
    const objectUrl = await fetchQrImageObjectUrl(id);

    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = `${name}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  async function viewQr(id: string) {
    const objectUrl = await fetchQrImageObjectUrl(id);
    window.open(objectUrl, "_blank", "noopener,noreferrer");
  }

  async function printQr(id: string) {
    const objectUrl = await fetchQrImageObjectUrl(id);
    const printWindow = window.open("", "_blank", "noopener,noreferrer");

    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code</title>
          <style>
            body {
              margin: 0;
              min-height: 100vh;
              display: grid;
              place-items: center;
              background: white;
            }
            img {
              width: 420px;
              height: 420px;
              object-fit: contain;
            }
          </style>
        </head>
        <body>
          <img src="${objectUrl}" onload="window.print();" />
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 3000);
  }

  return (
    <div>
      <div className="toolbar">
        <div className="search-row">
          <div style={{ position: "relative", minWidth: 300 }}>
            <Search
              size={18}
              style={{
                position: "absolute",
                left: 14,
                top: 14,
                color: "var(--muted)",
              }}
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

      {isLoading ? <div className="muted">Loading QR codes...</div> : null}

      <div className="grid qr-grid">
        {filtered.map((item) => (
          <Card className="qr-card" key={item.id}>
            <div className="qr-preview">
              <QrImage qrCodeId={item.id} alt={item.name} />

              <div
                className="badge"
                style={{ background: "#eef4ff", color: "#1463d8" }}
              >
                {item._count?.scanEvents ?? 0} scans
              </div>

              <button
                className="button primary full"
                onClick={() => downloadQr(item.id, item.name)}
              >
                Download
              </button>
            </div>

            <div className="qr-body qr-body-menu-wrap">
              <div className="qr-card-menu">
                <button
                  className="icon-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(openMenuId === item.id ? null : item.id);
                  }}
                  aria-label="Open QR actions"
                >
                  <MoreVertical size={20} />
                </button>

                {openMenuId === item.id ? (
                  <div className="dropdown-menu">
                    <button
                      onClick={() => {
                        viewQr(item.id);
                        setOpenMenuId(null);
                      }}
                    >
                      <Eye size={18} />
                      View QR
                    </button>

                    <Link
                      to={`/app/qr-codes/${item.id}/edit`}
                      onClick={() => setOpenMenuId(null)}
                    >
                      <Pencil size={18} />
                      Edit
                    </Link>

                    <Link
                      to={`/app/qr-codes/${item.id}/analytics`}
                      onClick={() => setOpenMenuId(null)}
                    >
                      <BarChart3 size={18} />
                      Analytics
                    </Link>

                    <a
                      href={getRedirectUrl(item.shortPath)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setOpenMenuId(null)}
                    >
                      <ExternalLink size={18} />
                      Open Redirect
                    </a>

                    <button
                      onClick={() => {
                        printQr(item.id);
                        setOpenMenuId(null);
                      }}
                    >
                      <Printer size={18} />
                      Print QR
                    </button>

                    <div className="dropdown-divider" />

                    <button
                      className="dropdown-danger"
                      onClick={() => {
                        const confirmed = window.confirm(
                          `Delete "${item.name}"? This cannot be undone.`,
                        );
                        if (!confirmed) return;

                        setDeletingId(item.id);
                        deleteMutation.mutate(item.id);
                      }}
                      disabled={
                        deleteMutation.isPending && deletingId === item.id
                      }
                    >
                      <Trash2 size={18} />
                      {deleteMutation.isPending && deletingId === item.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="qr-header">
                <div>
                  <div className="badge">
                    {item.type === "dynamic" ? "Website URL" : "Static QR"}
                  </div>
                  <div className="qr-name">{item.name}</div>
                  <div className="qr-meta">
                    Updated {new Date(item.updatedAt).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="qr-links">
                <div className="row">
                  <Link2 size={16} />
                  <a
                    href={getRedirectUrl(item.shortPath)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {item.shortPath}
                  </a>
                </div>

                <div className="row">
                  <Pencil size={16} />
                  <a href={item.targetUrl} target="_blank" rel="noreferrer">
                    {item.targetUrl}
                  </a>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {!filtered.length && !isLoading ? (
          <Card className="section-card">
            <div className="muted">No QR codes found.</div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
