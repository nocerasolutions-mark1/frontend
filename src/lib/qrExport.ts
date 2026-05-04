import QRCodeStyling from "qr-code-styling";
import type { QrCode } from "../api/qr";

const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

function getQrData(qrCode: QrCode): string {
  return qrCode.type === "dynamic"
    ? `${BASE}/r/${qrCode.shortPath}`
    : qrCode.targetUrl || "https://example.com";
}

function buildQrInstance(qrCode: QrCode, size: number): QRCodeStyling {
  const d = qrCode.designJson?.design ?? {};
  const style = d.style ?? "square";
  const colorDark = d.colorDark ?? "#000000";
  const colorLight = d.colorLight ?? "#ffffff";
  const logo = d.logo ?? "";

  const dotsType =
    style === "dots" ? "dots" : style === "rounded" ? "rounded" : "square";

  return new QRCodeStyling({
    width: size,
    height: size,
    type: "canvas",
    data: getQrData(qrCode),
    image: logo || undefined,
    margin: Math.round(size * 0.03),
    qrOptions: { errorCorrectionLevel: "H" },
    dotsOptions: { color: colorDark, type: dotsType as any },
    backgroundOptions: { color: colorLight },
    cornersSquareOptions: {
      type: style === "rounded" ? "extra-rounded" : "square",
      color: colorDark,
    },
    cornersDotOptions: {
      type: style === "dots" ? "dot" : "square",
      color: colorDark,
    },
    imageOptions: {
      crossOrigin: "anonymous",
      margin: 8,
      imageSize: 0.32,
      hideBackgroundDots: true,
    },
  });
}

export async function generateQrObjectUrl(qrCode: QrCode): Promise<string> {
  const qr = buildQrInstance(qrCode, 1024);
  const blob = await qr.getRawData("png") as Blob;
  if (!blob) throw new Error("Failed to generate QR PNG");
  return URL.createObjectURL(blob);
}

export async function generateQrThumbnailUrl(qrCode: QrCode): Promise<string> {
  const qr = buildQrInstance(qrCode, 300);
  const blob = await qr.getRawData("png") as Blob;
  if (!blob) throw new Error("Failed to generate QR thumbnail");
  return URL.createObjectURL(blob);
}

export async function printQrCode(qrCode: QrCode): Promise<void> {
  const qr = buildQrInstance(qrCode, 1024);
  const blob = await qr.getRawData("png") as Blob;
  if (!blob) throw new Error("Failed to generate QR PNG");

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const html = `<!DOCTYPE html>
<html>
  <head>
    <title>${qrCode.name} — QR Code</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        width: 100vw;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #ffffff;
      }
      img {
        width: 420px;
        height: 420px;
        object-fit: contain;
      }
    </style>
  </head>
  <body>
    <img src="${dataUrl}" onload="window.print();" />
  </body>
</html>`;

  const htmlBlob = new Blob([html], { type: "text/html" });
  const htmlUrl = URL.createObjectURL(htmlBlob);
  window.open(htmlUrl, "_blank", "noopener,noreferrer");
  setTimeout(() => URL.revokeObjectURL(htmlUrl), 15000);
}
