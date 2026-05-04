import { useEffect, useState } from "react";
import { generateQrThumbnailUrl } from "../../lib/qrExport";
import type { QrCode } from "../../api/qr";

type Props = {
  qrCode: QrCode;
  alt: string;
  className?: string;
};

export function QrImage({ qrCode, alt, className }: Props) {
  const [src, setSrc] = useState<string>("");
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    async function load() {
      try {
        setError(false);
        const url = await generateQrThumbnailUrl(qrCode);

        if (!active) {
          URL.revokeObjectURL(url);
          return;
        }

        objectUrl = url;
        setSrc(url);
      } catch {
        if (active) setError(true);
      }
    }

    load();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  // Re-generate only when design or QR type changes, not when targetUrl changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrCode.id, qrCode.designJson, qrCode.type]);

  const placeholder = (text: string) => (
    <div
      className={className}
      style={{
        display: "grid",
        placeItems: "center",
        background: "#fff",
        borderRadius: 12,
        border: "1px solid var(--border)",
        color: "var(--muted)",
        fontSize: 14,
      }}
    >
      {text}
    </div>
  );

  if (error) return placeholder("QR unavailable");
  if (!src) return placeholder("Loading...");

  return <img src={src} alt={alt} className={className} />;
}
