import { api } from "./client";

export type AnalyticsSummary = {
  totalScans: number;
  totalQrCodes: number;
};

export type QrAnalytics = {
  qrCodeId: string;
  totalScans: number;
  recentScans: Array<{
    createdAt: string;
    browser?: string | null;
    os?: string | null;
    deviceType?: string | null;
    referer?: string | null;
    country?: string | null;
    city?: string | null;
  }>;
};

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const { data } = await api.get<AnalyticsSummary>("/analytics/summary");
  return data;
}

export async function getQrAnalytics(id: string): Promise<QrAnalytics> {
  const { data } = await api.get<QrAnalytics>(`/analytics/qr/${id}`);
  return data;
}
