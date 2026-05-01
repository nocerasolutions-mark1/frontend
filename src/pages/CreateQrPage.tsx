import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Link2 } from "lucide-react";
import QRCodeStyling from "qr-code-styling";
import { createQrCode } from "../api/qr";
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

  const [openSection, setOpenSection] = useState<"content" | "design">(
    "content",
  );

  const [contentType, setContentType] = useState<QrContentType>("website");

  const [form, setForm] = useState({
    name: "",
    targetUrl: "",
    type: "dynamic" as "static" | "dynamic",
  });

  const [design, setDesign] = useState({
    style: "square",
    colorDark: "#000000",
    colorLight: "#ffffff",
    logo: "",
  });

  // ✅ REAL QR ENGINE (STYLE + LOGO SUPPORT)
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
      data: form.targetUrl || "https://example.com",
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
  }, [form.targetUrl, design]);

  const mutation = useMutation({
    mutationFn: createQrCode,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["qr-codes"] });
      navigate("/app/qr-codes");
    },
  });

  const urlLabel = useMemo(() => {
    if (contentType === "video") return "Video URL";
    if (contentType === "instagram") return "Instagram URL";
    if (contentType === "profile") return "Profile URL";
    return "Website URL";
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
                  <Input
                    value={form.targetUrl}
                    onChange={(e) =>
                      setForm({ ...form, targetUrl: e.target.value })
                    }
                  />
                  <span className="helper">Enter the destination URL</span>
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
                      setDesign({ ...design, style: e.target.value })
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

                <label>
                  Logo Upload
                  <Input
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
                      reader.onload = () => {
                        setDesign({
                          ...design,
                          logo: String(reader.result),
                        });
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                  <span className="helper">
                    Upload a PNG, JPG, or SVG logo to place in the QR center.
                  </span>
                </label>
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

            {previewTab === "qr" && (
              <div className="qr-preview">
                <div ref={qrRef} />
              </div>
            )}

            {previewTab === "page" && (
              <div className="phone-preview">
                <div>{form.name || "Preview Page"}</div>
                <div>{form.targetUrl}</div>
              </div>
            )}

            <Button type="submit">
              {mutation.isPending ? "Saving..." : "Save QR"}
            </Button>
          </Card>
        </div>
      </form>
    </div>
  );
}
