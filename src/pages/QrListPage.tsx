import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2, Pencil, Search, Trash2 } from "lucide-react";
import { getQrCodes, getRedirectUrl, deleteQrCode } from "../api/qr";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { QrImage } from "../components/ui/QrImage";
import { Link } from "react-router-dom";

export function QrListPage() {
  const queryClient = useQueryClient();

  const { data: qrCodes, isLoading } = useQuery({
    queryKey: ["qr-codes"],
    queryFn: getQrCodes,
  });

  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: deleteQrCode,
    onSuccess: async () => {
      setDeletingId(null);
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

        <a className="button primary" href="/app/qr/new">
          Create QR Code
        </a>
      </div>

      {isLoading ? <div className="muted">Loading QR codes...</div> : null}

      <div className="grid qr-grid">
        {filtered.map((item) => (
          <Card className="qr-card" key={item.id}>
            <div className="qr-preview">
              <QrImage qrCodeId={item.id} alt={item.name} />
              <div className="row">
                <div
                  className="badge"
                  style={{ background: "#eef4ff", color: "#1463d8" }}
                >
                  {item._count?.scanEvents ?? 0} scans
                </div>
              </div>

              <button
                className="button primary full"
                onClick={async () => {
                  const { fetchQrImageObjectUrl } =
                    await import("../api/qrImage");
                  const objectUrl = await fetchQrImageObjectUrl(item.id);

                  const link = document.createElement("a");
                  link.href = objectUrl;
                  link.download = `${item.name}.png`;
                  document.body.appendChild(link);
                  link.click();
                  link.remove();

                  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
                }}
              >
                Download
              </button>
            </div>

            <div className="qr-body">
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

              <div className="qr-actions">
                <Link
                  className="button ghost"
                  to={`/app/qr-codes/${item.id}/edit`}
                >
                  Edit
                </Link>

                <button
                  className="button ghost"
                  onClick={async () => {
                    const { fetchQrImageObjectUrl } =
                      await import("../api/qrImage");
                    const objectUrl = await fetchQrImageObjectUrl(item.id);
                    window.open(objectUrl, "_blank", "noopener,noreferrer");
                  }}
                >
                  View QR
                </button>

                <Link
                  className="button secondary"
                  to={`/app/qr-codes/${item.id}/analytics`}
                >
                  Analytics
                </Link>

                <a
                  className="button secondary"
                  href={getRedirectUrl(item.shortPath)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Redirect
                </a>

                <button
                  className="button ghost"
                  onClick={() => {
                    const confirmed = window.confirm(
                      `Delete "${item.name}"? This cannot be undone.`,
                    );
                    if (!confirmed) return;

                    setDeletingId(item.id);
                    deleteMutation.mutate(item.id);
                  }}
                  disabled={deleteMutation.isPending && deletingId === item.id}
                  style={{ color: "#d92d20" }}
                >
                  <Trash2 size={16} />
                  {deleteMutation.isPending && deletingId === item.id
                    ? "Deleting..."
                    : "Delete"}
                </button>
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
