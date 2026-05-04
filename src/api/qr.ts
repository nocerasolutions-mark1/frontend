import { api } from "./client";
import { getToken } from "../lib/storage";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export type QrDesign = {
  style: "square" | "dots" | "rounded";
  colorDark: string;
  colorLight: string;
  logo: string;
};

export type QrDesignJson = {
  contentType?: string;
  design?: Partial<QrDesign>;
};

export type QrCode = {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  type: "static" | "dynamic";
  targetUrl: string;
  shortPath: string;
  status: "active" | "archived" | "disabled";
  imageUrl?: string | null;
  designJson?: QrDesignJson | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    scanEvents: number;
  };
};

export type CreateQrPayload = {
  name: string;
  targetUrl: string;
  type?: "static" | "dynamic";
  designJson?: QrDesignJson;
};

export async function getQrCodes(): Promise<QrCode[]> {
  const { data } = await api.get<QrCode[]>("/qr-codes");
  return data;
}

export async function createQrCode(payload: CreateQrPayload): Promise<QrCode> {
  const { data } = await api.post<QrCode>("/qr-codes", payload);
  return data;
}

export async function updateQrCode(
  id: string,
  payload: Partial<Pick<QrCode, "name" | "targetUrl" | "status" | "type">> & {
    designJson?: QrDesignJson;
  },
): Promise<QrCode> {
  const { data } = await api.patch<QrCode>(`/qr-codes/${id}`, payload);
  return data;
}

export function getQrImageUrl(id: string): string {
  const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
  return `${base}/qr-codes/${id}/image`;
}

export function getRedirectUrl(shortPath: string): string {
  const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
  return `${base}/r/${shortPath}`;
}

export async function fetchQrImageObjectUrl(qrCodeId: string): Promise<string> {
  const token = getToken();

  if (!token) {
    throw new Error("Missing auth token");
  }

  const response = await fetch(`${API_BASE_URL}/qr-codes/${qrCodeId}/image`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load QR image: ${response.status}`);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

export async function getQrCodeById(id: string): Promise<QrCode> {
  const { data } = await api.get<QrCode>(`/qr-codes/${id}`);
  return data;
}

export async function deleteQrCode(id: string): Promise<{ success: true }> {
  const { data } = await api.delete<{ success: true }>(`/qr-codes/${id}`);
  return data;
}
