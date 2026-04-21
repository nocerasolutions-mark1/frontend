import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { getQrCodeById, updateQrCode } from "../api/qr";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export function EditQrPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["qr-code", id],
    queryFn: () => getQrCodeById(id),
    enabled: Boolean(id),
  });

  const [form, setForm] = useState({
    name: "",
    targetUrl: "",
    status: "active",
  });

  useEffect(() => {
    if (data) {
      setForm({
        name: data.name,
        targetUrl: data.targetUrl,
        status: data.status,
      });
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: () => updateQrCode(id, form),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["qr-codes"] });
      await queryClient.invalidateQueries({ queryKey: ["qr-code", id] });
      navigate("/app/qr-codes");
    },
  });

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }

  if (isLoading) {
    return <div className="muted">Loading QR code...</div>;
  }

  return (
    <Card className="section-card" style={{ maxWidth: 720 }}>
      <form className="form-grid" onSubmit={onSubmit}>
        <label className="label">
          QR Name
          <Input
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
          />
        </label>

        <label className="label">
          Target URL
          <Input
            value={form.targetUrl}
            onChange={(e) =>
              setForm((s) => ({ ...s, targetUrl: e.target.value }))
            }
            disabled={data?.type === "static"}
          />
        </label>

        {data?.type === "static" ? (
          <div className="helper">Static QR target URL cannot be edited.</div>
        ) : null}

        <label className="label">
          Status
          <select
            className="select"
            value={form.status}
            onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}
          >
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="disabled">Disabled</option>
          </select>
        </label>

        {mutation.isError ? (
          <div className="error">
            {(mutation.error as any)?.response?.data?.error ||
              "Failed to update QR"}
          </div>
        ) : null}

        <div className="row">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate("/app/qr-codes")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
