import QRCode from "qrcode";

export async function generateQrDataUrl(text: string, options?: any) {
  try {
    return await QRCode.toDataURL(text || "https://example.com", {
      width: 300,
      margin: 2,
      color: {
        dark: options?.dark || "#000000",
        light: options?.light || "#ffffff",
      },
    });
  } catch (err) {
    console.error(err);
    return "";
  }
}
