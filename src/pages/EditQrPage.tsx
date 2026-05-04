import { useEffect, useRef, useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { PhonePreview } from "../components/ui/PhonePreview";
import QRCodeStyling from "qr-code-styling";
import { getQrCodeById, updateQrCode } from "../api/qr";
import type { QrDesign } from "../api/qr";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

type QrContentType = "website" | "video" | "instagram" | "profile";

const DEFAULT_DESIGN: QrDesign = {
  style: "square",
  colorDark: "#000000",
  colorLight: "#ffffff",
  logo: "",
};

export function EditQrPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const qrRef = useRef<HTMLDivElement | null>(null);
  const qrInstanceRef = useRef<QRCodeStyling | null>(null);

  const [previewTab, setPreviewTab] = useState<"qr" | "page">("qr");
  const [previewUrl, setPreviewUrl] = useState("");
  const [openSection, setOpenSection] = useState<"content" | "design">("content");
  const [contentType, setContentType] = useState<QrContentType>("website");

  const [form, setForm] = useState<{
    name: string;
    targetUrl: string;
    status: "active" | "archived" | "disabled";
    type: "static" | "dynamic";
  }>({ name: "", targetUrl: "", status: "active", type: "dynamic" });
  const [design, setDesign] = useState<QrDesign>(DEFAULT_DESIGN);

  const { data, isLoading } = useQuery({
    queryKey: ["qr-code", id],
    queryFn: () => getQrCodeById(id),
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (!data) return;
    setForm({ name: data.name, targetUrl: data.targetUrl, status: data.status, type: data.type });
    if (data.designJson) {
      const ct = data.designJson.contentType;
      if (ct === "website" || ct === "video" || ct === "instagram" || ct === "profile") {
        setContentType(ct);
      }
      setDesign({ ...DEFAULT_DESIGN, ...(data.designJson.design ?? {}) });
    }
  }, [data]);

  const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

  // Dynamic QR encodes the redirect URL (fixed per shortPath), not the destination.
  const qrData =
    form.type === "dynamic" && data?.shortPath
      ? `${BASE}/r/${data.shortPath}`
      : form.targetUrl || "https://example.com";

  useEffect(() => {
    const dotsType =
      design.style === "dots" ? "dots" : design.style === "rounded" ? "rounded" : "square";

    const qr = new QRCodeStyling({
      width: 280, height: 280, type: "svg",
      data: qrData,
      image: design.logo || undefined,
      margin: 8,
      qrOptions: { errorCorrectionLevel: "H" },
      dotsOptions: { color: design.colorDark, type: dotsType as any },
      backgroundOptions: { color: design.colorLight },
      cornersSquareOptions: {
        type: design.style === "rounded" ? "extra-rounded" : "square",
        color: design.colorDark,
      },
      cornersDotOptions: {
        type: design.style === "dots" ? "dot" : "square",
        color: design.colorDark,
      },
      imageOptions: { crossOrigin: "anonymous", margin: 8, imageSize: 0.32, hideBackgroundDots: true },
    });

    qrInstanceRef.current = qr;
    if (qrRef.current) {
      qrRef.current.innerHTML = "";
      qr.append(qrRef.current);
    }
  }, [qrData, design]);

  // Debounce preview URL so iframe doesn't reload on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setPreviewUrl(form.targetUrl), 800);
    return () => clearTimeout(t);
  }, [form.targetUrl]);

  const mutation = useMutation({
    mutationFn: () => updateQrCode(id, { ...form, designJson: { contentType, design } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["qr-codes"] });
      await queryClient.invalidateQueries({ queryKey: ["qr-code", id] });
      navigate("/app/qr-codes");
    },
  });

  const urlLabel = useMemo(() => {
    if (contentType === "video") return "Video URL";
    if (contentType === "instagram") return "Instagram Username";
    if (contentType === "profile") return "Profile URL";
    return "Website URL";
  }, [contentType]);

  const igHandle = useMemo(() => {
    if (contentType !== "instagram") return "";
    try {
      return new URL(form.targetUrl).pathname.split("/").filter(Boolean)[0] ?? "";
    } catch {
      return form.targetUrl.replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, "");
    }
  }, [contentType, form.targetUrl]);

  const contentTypeIcon = useMemo(() => {
    if (contentType === "video") return "▶️";
    if (contentType === "instagram") return "📸";
    if (contentType === "profile") return "👤";
    return "🌐";
  }, [contentType]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  if (isLoading) return <div className="muted">Loading QR code...</div>;

  return (
    <div className="create-qr-shell">
      <form className="create-qr-layout" onSubmit={onSubmit}>
        {/* LEFT */}
        <div className="create-qr-left">
          {/* CONTENT */}
          <Card className="create-accordion-card">
            <button
              type="button"
              className="accordion-header"
              onClick={() => setOpenSection(openSection === "content" ? "design" : "content")}
            >
              <div className="accordion-title-wrap">
                <span className="accordion-icon">🔗</span>
                <div>
                  <div className="accordion-title">QR Content</div>
                  <div className="accordion-subtitle">Choose QR type and destination</div>
                </div>
              </div>
              <ChevronRight className={openSection === "content" ? "open" : ""} />
            </button>

            {openSection === "content" && (
              <div className="accordion-body">
                <label>
                  QR Mode
                  <div className="qr-mode-toggle">
                    <button
                      type="button"
                      className={form.type === "dynamic" ? "active" : ""}
                      onClick={() => setForm({ ...form, type: "dynamic" })}
                    >
                      Dynamic
                    </button>
                    <button
                      type="button"
                      className={form.type === "static" ? "active" : ""}
                      onClick={() => setForm({ ...form, type: "static" })}
                    >
                      Static
                    </button>
                  </div>
                  <span className="helper">
                    {form.type === "dynamic"
                      ? "QR encodes a short redirect link — you can change the destination URL anytime without reprinting."
                      : "QR encodes the destination URL directly — changing the URL regenerates the QR code."}
                  </span>
                </label>

                <div className="qr-type-grid">
                  {(["website", "video", "instagram", "profile"] as QrContentType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={contentType === t ? "selected" : ""}
                      onClick={() => setContentType(t)}
                    >
                      <div className="qr-icon">
                        {t === "website" ? "🔗" : t === "video" ? "▶️" : t === "instagram" ? "📸" : "👤"}
                      </div>
                      <div className="qr-title">{t.charAt(0).toUpperCase() + t.slice(1)}</div>
                      {t === "website" && <div className="qr-sub">Link to any site</div>}
                    </button>
                  ))}
                </div>

                <label>
                  {urlLabel}
                  {contentType === "instagram" ? (
                    <div className="input-prefix-wrap">
                      <span className="input-prefix">@</span>
                      <input
                        className="input-no-border"
                        placeholder="username"
                        value={igHandle}
                        onChange={(e) => {
                          const handle = e.target.value.replace(/^@/, "");
                          setForm({
                            ...form,
                            targetUrl: handle
                              ? `https://www.instagram.com/${handle}`
                              : "",
                          });
                        }}
                      />
                    </div>
                  ) : (
                    <Input
                      value={form.targetUrl}
                      onChange={(e) => setForm({ ...form, targetUrl: e.target.value })}
                    />
                  )}
                  <span className="helper">
                    {contentType === "instagram"
                      ? "Enter your Instagram username without @"
                      : form.type === "static"
                      ? "Changing this URL will regenerate the QR code."
                      : "Enter the destination URL"}
                  </span>
                </label>

                <label>
                  Name
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                  <span className="helper">Internal reference name</span>
                </label>

                <label>
                  Status
                  <select
                    className="select"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "archived" | "disabled" })}
                  >
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </label>
              </div>
            )}
          </Card>

          {/* DESIGN */}
          <Card className="create-accordion-card">
            <button
              type="button"
              className="accordion-header"
              onClick={() => setOpenSection(openSection === "design" ? "content" : "design")}
            >
              <div className="accordion-title-wrap">
                <span className="accordion-icon">🎨</span>
                <div>
                  <div className="accordion-title">Design</div>
                  <div className="accordion-subtitle">Customize QR look</div>
                </div>
              </div>
              <ChevronRight className={openSection === "design" ? "open" : ""} />
            </button>

            {openSection === "design" && (
              <div className="accordion-body">
                <label>
                  QR Style
                  <select
                    value={design.style}
                    onChange={(e) => setDesign({ ...design, style: e.target.value as "square" | "dots" | "rounded" })}
                  >
                    <option value="square">Square</option>
                    <option value="dots">Dots</option>
                    <option value="rounded">Rounded</option>
                  </select>
                </label>

                <label>
                  Color
                  <input
                    type="color"
                    value={design.colorDark}
                    onChange={(e) => setDesign({ ...design, colorDark: e.target.value })}
                  />
                </label>

                <div style={{ display: "grid", gap: 9 }}>
                  <span style={{ fontWeight: 800, fontSize: 15, color: "var(--text)" }}>Logo Upload</span>
                  <label className="file-upload-label">
                    📎 {design.logo ? "Change logo" : "Choose file"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 300 * 1024) { alert("Logo must be under 300KB"); return; }
                        const reader = new FileReader();
                        reader.onload = () => setDesign({ ...design, logo: String(reader.result) });
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                  <span className="helper">PNG, JPG, or SVG · max 300KB</span>
                  {design.logo && (
                    <Button type="button" variant="danger" onClick={() => setDesign({ ...design, logo: "" })}>
                      Remove logo
                    </Button>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT — PREVIEW */}
        <div className="create-qr-preview">
          <Card className="preview-card">
            <div className="preview-toolbar">
              <button type="button" className={previewTab === "qr" ? "active" : ""} onClick={() => setPreviewTab("qr")}>
                QR Code
              </button>
              <button type="button" className={previewTab === "page" ? "active" : ""} onClick={() => setPreviewTab("page")}>
                Preview Page
              </button>
            </div>

            <div style={{ display: previewTab === "qr" ? "block" : "none" }}>
              <div className="qr-preview">
                <div ref={qrRef} />
              </div>
            </div>

            <div style={{ display: previewTab === "page" ? "block" : "none" }}>
              <PhonePreview previewUrl={previewUrl} contentTypeIcon={contentTypeIcon} />
            </div>

            {mutation.isError && (
              <div className="error">
                {(mutation.error as any)?.response?.data?.error || "Failed to update QR"}
              </div>
            )}

            <div className="row" style={{ justifyContent: "center", paddingTop: 20 }}>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => navigate("/app/qr-codes")}>
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      </form>
    </div>
  );
}
