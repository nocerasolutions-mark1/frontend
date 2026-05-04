import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { PhonePreview } from "../components/ui/PhonePreview";
import QRCodeStyling from "qr-code-styling";
import { createQrCode } from "../api/qr";
import type { QrDesign } from "../api/qr";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useNavigate } from "react-router-dom";

type QrContentType = "website" | "video" | "instagram" | "profile";

export function CreateQrPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const qrRef = useRef<HTMLDivElement | null>(null);
  const qrInstanceRef = useRef<QRCodeStyling | null>(null);

  const [previewTab, setPreviewTab] = useState<"qr" | "page">("qr");
  const [previewUrl, setPreviewUrl] = useState("");

  const [openSection, setOpenSection] = useState<"content" | "design">(
    "content",
  );

  const [contentType, setContentType] = useState<QrContentType>("website");

  const [form, setForm] = useState({
    name: "",
    targetUrl: "",
    type: "dynamic" as "static" | "dynamic",
  });

  const [design, setDesign] = useState<QrDesign>({
    style: "square",
    colorDark: "#000000",
    colorLight: "#ffffff",
    logo: "",
  });

  const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

  // For dynamic QR the encoded URL is the redirect path, not the destination —
  // so the QR itself never changes when targetUrl changes.
  const qrData =
    form.type === "dynamic"
      ? `${BASE}/r/preview`
      : form.targetUrl || "https://example.com";

  useEffect(() => {
    const dotsType =
      design.style === "dots"
        ? "dots"
        : design.style === "rounded"
          ? "rounded"
          : "square";

    const qr = new QRCodeStyling({
      width: 280,
      height: 280,
      type: "svg",
      data: qrData,
      image: design.logo || undefined,
      margin: 8,
      qrOptions: {
        errorCorrectionLevel: "H",
      },
      dotsOptions: {
        color: design.colorDark,
        type: dotsType as any,
      },
      backgroundOptions: {
        color: design.colorLight,
      },
      cornersSquareOptions: {
        type: design.style === "rounded" ? "extra-rounded" : "square",
        color: design.colorDark,
      },
      cornersDotOptions: {
        type: design.style === "dots" ? "dot" : "square",
        color: design.colorDark,
      },
      imageOptions: {
        crossOrigin: "anonymous",
        margin: 8,
        imageSize: 0.32,
        hideBackgroundDots: true,
      },
    });

    qrInstanceRef.current = qr;

    if (qrRef.current) {
      qrRef.current.innerHTML = "";
      qr.append(qrRef.current);
    }
  }, [qrData, design]);

  const mutation = useMutation({
    mutationFn: createQrCode,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["qr-codes"] });
      navigate("/app/qr-codes");
    },
  });

  // Debounce the preview URL so the iframe doesn't reload on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setPreviewUrl(form.targetUrl), 800);
    return () => clearTimeout(t);
  }, [form.targetUrl]);

  const urlLabel = useMemo(() => {
    if (contentType === "video") return "Video URL";
    if (contentType === "instagram") return "Instagram Username";
    if (contentType === "profile") return "Profile URL";
    return "Website URL";
  }, [contentType]);

  // Derive the bare username from the stored URL for the @ input
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

    mutation.mutate({
      ...form,
      designJson: {
        contentType,
        design,
      },
    });
  }

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
              onClick={() =>
                setOpenSection(openSection === "content" ? "design" : "content")
              }
            >
              <div className="accordion-title-wrap">
                <span className="accordion-icon">🔗</span>
                <div>
                  <div className="accordion-title">QR Content</div>
                  <div className="accordion-subtitle">
                    Choose QR type and destination
                  </div>
                </div>
              </div>

              <ChevronRight
                className={openSection === "content" ? "open" : ""}
              />
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
                      : "QR encodes the destination URL directly — cannot be changed after creation."}
                  </span>
                </label>

                <div className="qr-type-grid">
                  <button
                    type="button"
                    className={contentType === "website" ? "selected" : ""}
                    onClick={() => setContentType("website")}
                  >
                    <div className="qr-icon">🔗</div>
                    <div className="qr-title">Website</div>
                    <div className="qr-sub">Link to any site</div>
                  </button>

                  <button
                    type="button"
                    className={contentType === "video" ? "selected" : ""}
                    onClick={() => setContentType("video")}
                  >
                    <div className="qr-icon">▶️</div>
                    <div className="qr-title">Video</div>
                  </button>

                  <button
                    type="button"
                    className={contentType === "instagram" ? "selected" : ""}
                    onClick={() => setContentType("instagram")}
                  >
                    <div className="qr-icon">📸</div>
                    <div className="qr-title">Instagram</div>
                  </button>

                  <button
                    type="button"
                    className={contentType === "profile" ? "selected" : ""}
                    onClick={() => setContentType("profile")}
                  >
                    <div className="qr-icon">👤</div>
                    <div className="qr-title">Profile</div>
                  </button>
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
                      onChange={(e) =>
                        setForm({ ...form, targetUrl: e.target.value })
                      }
                    />
                  )}
                  <span className="helper">
                    {contentType === "instagram"
                      ? "Enter your Instagram username without @"
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
              </div>
            )}
          </Card>

          {/* DESIGN */}
          <Card className="create-accordion-card">
            <button
              type="button"
              className="accordion-header"
              onClick={() =>
                setOpenSection(openSection === "design" ? "content" : "design")
              }
            >
              <div className="accordion-title-wrap">
                <span className="accordion-icon">🎨</span>
                <div>
                  <div className="accordion-title">Design</div>
                  <div className="accordion-subtitle">Customize QR look</div>
                </div>
              </div>

              <ChevronRight
                className={openSection === "design" ? "open" : ""}
              />
            </button>

            {openSection === "design" && (
              <div className="accordion-body">
                <label>
                  QR Style
                  <select
                    value={design.style}
                    onChange={(e) =>
                      setDesign({ ...design, style: e.target.value as "square" | "dots" | "rounded" })
                    }
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
                    onChange={(e) =>
                      setDesign({ ...design, colorDark: e.target.value })
                    }
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
                        if (file.size > 300 * 1024) {
                          alert("Logo must be under 300KB");
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () =>
                          setDesign({ ...design, logo: String(reader.result) });
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                  <span className="helper">PNG, JPG, or SVG · max 300KB</span>
                  {design.logo && (
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => setDesign({ ...design, logo: "" })}
                    >
                      Remove logo
                    </Button>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT */}
        <div className="create-qr-preview">
          <Card className="preview-card">
            <div className="preview-toolbar">
              <button
                type="button"
                className={previewTab === "qr" ? "active" : ""}
                onClick={() => setPreviewTab("qr")}
              >
                QR Code
              </button>
              <button
                type="button"
                className={previewTab === "page" ? "active" : ""}
                onClick={() => setPreviewTab("page")}
              >
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

            <div className="row" style={{ justifyContent: "center", paddingTop: 20 }}>
              <Button type="submit">
                {mutation.isPending ? "Saving..." : "Save QR"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate("/app/qr-codes")}
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      </form>
    </div>
  );
}
