import { useEffect, useState } from "react";
import { fetchQrImageObjectUrl } from "../../api/qr";

type Props = {
  qrCodeId: string;
  alt: string;
  className?: string;
};

export function QrImage({ qrCodeId, alt, className }: Props) {
  const [src, setSrc] = useState<string>("");
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    async function load() {
      try {
        setError(false);
        const url = await fetchQrImageObjectUrl(qrCodeId);

        if (!active) {
          URL.revokeObjectURL(url);
          return;
        }

        objectUrl = url;
        setSrc(url);
      } catch {
        if (active) {
          setError(true);
        }
      }
    }

    load();

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [qrCodeId]);

  if (error) {
    return (
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
        QR unavailable
      </div>
    );
  }

  if (!src) {
    return (
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
        Loading...
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} />;
}
