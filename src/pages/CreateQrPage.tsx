import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createQrCode } from "../api/qr";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useNavigate } from "react-router-dom";

export function CreateQrPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    targetUrl: "",
    type: "dynamic" as "static" | "dynamic"
  });

  const mutation = useMutation({
    mutationFn: createQrCode,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["qr-codes"] });
      await queryClient.invalidateQueries({ queryKey: ["analytics-summary"] });
      navigate("/app/qr-codes");
    }
  });

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    mutation.mutate(form);
  }

  return (
    <Card className="section-card" style={{ maxWidth: 720 }}>
      <form className="form-grid" onSubmit={onSubmit}>
        <label className="label">
          QR Name
          <Input placeholder="Homepage QR" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
        </label>

        <label className="label">
          Target URL
          <Input placeholder="https://www.noceragifts.com" value={form.targetUrl} onChange={(e) => setForm((s) => ({ ...s, targetUrl: e.target.value }))} />
        </label>

        <label className="label">
          QR Type
          <select className="select" value={form.type} onChange={(e) => setForm((s) => ({ ...s, type: e.target.value as "static" | "dynamic" }))}>
            <option value="dynamic">Dynamic</option>
            <option value="static">Static</option>
          </select>
        </label>

        {mutation.isError ? (
          <div className="error">{(mutation.error as any)?.response?.data?.error || "Failed to create QR code"}</div>
        ) : null}

        <div className="row">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Creating..." : "Create QR Code"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate("/app/qr-codes")}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
