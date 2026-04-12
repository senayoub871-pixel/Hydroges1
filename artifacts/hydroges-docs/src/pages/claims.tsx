import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { Search, FileText, MapPin, ChevronDown, Paperclip } from "lucide-react";

function getToken() {
  return localStorage.getItem("hydroges_token") || "";
}

interface Claim {
  id: number;
  first_name: string;
  last_name: string;
  wilaya: string;
  commune: string;
  complaint: string;
  attachment_url: string | null;
  attachment_name: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending:  "En attente",
  reviewed: "Examinée",
  closed:   "Clôturée",
};

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  pending:  { bg: "#fff8e1", color: "#b35c00", border: "#ffd580" },
  reviewed: { bg: "#e8f0fe", color: "#1a56b0", border: "#a0c0f0" },
  closed:   { bg: "#e6f4ea", color: "#1a7340", border: "#82c99a" },
};

const STATUS_OPTIONS = ["pending", "reviewed", "closed"];

function refNum(id: number) {
  return `REC-${id.toString().padStart(6, "0")}`;
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

export default function ClaimsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Claim | null>(null);

  const { data: claims = [], isLoading } = useQuery<Claim[]>({
    queryKey: ["external-complaints"],
    queryFn: async () => {
      const res = await fetch("/api/external/complaints", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Erreur lors du chargement des réclamations");
      return res.json();
    },
    enabled: !!user,
    refetchInterval: 60_000,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/external/complaints/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Erreur lors de la mise à jour du statut");
      return res.json() as Promise<Claim>;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<Claim[]>(["external-complaints"], (old = []) =>
        old.map((c) => (c.id === updated.id ? updated : c))
      );
      setSelected(updated);
      toast({ title: "Statut mis à jour", description: `Réclamation ${refNum(updated.id)} mise à jour.` });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de mettre à jour le statut.", variant: "destructive" });
    },
  });

  const filtered = claims.filter((c) => {
    const q = search.toLowerCase();
    return (
      `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
      c.wilaya.toLowerCase().includes(q) ||
      c.commune.toLowerCase().includes(q) ||
      c.complaint.toLowerCase().includes(q) ||
      refNum(c.id).toLowerCase().includes(q)
    );
  });

  return (
    <AppLayout>
      <div className="flex h-full w-full">
        {/* Left panel */}
        <div
          className="flex flex-col h-full shrink-0 transition-all duration-300"
          style={{ width: selected ? "38%" : "100%", borderRight: selected ? "2px solid #dde0f0" : "none" }}
        >
          {/* Header */}
          <div className="px-6 py-5 shrink-0" style={{ borderBottom: "1.5px solid #dde0f0", background: "rgba(255,255,255,0.55)" }}>
            <h2 className="text-xl font-black mb-0.5" style={{ color: "#1e1b6b" }}>Réclamations</h2>
            <p className="text-sm" style={{ color: "#7b72b0" }}>
              Réclamations soumises par les citoyens — {claims.length} au total
            </p>
          </div>

          {/* Search */}
          <div className="px-5 py-3 shrink-0" style={{ background: "rgba(255,255,255,0.35)" }}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9090b0" }} />
              <input
                type="text"
                placeholder="Rechercher par nom, wilaya, référence…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none"
                style={{ background: "white", color: "#1e1b6b", border: "1.5px solid #dde0f0" }}
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.6)" }} />
              ))
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 rounded-2xl" style={{ background: "rgba(255,255,255,0.45)", border: "2px dashed #dde0f0" }}>
                <FileText className="w-12 h-12 mb-3 opacity-25" style={{ color: "#5b4d90" }} />
                <p className="font-semibold" style={{ color: "#5b4d90" }}>Aucune réclamation</p>
                <p className="text-sm mt-1" style={{ color: "#9090b0" }}>La liste est vide pour le moment.</p>
              </div>
            ) : (
              filtered.map((c) => {
                const isActive = selected?.id === c.id;
                const sc = STATUS_COLORS[c.status] ?? STATUS_COLORS.pending;
                return (
                  <div
                    key={c.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelected(isActive ? null : c)}
                    onKeyDown={(e) => e.key === "Enter" && setSelected(isActive ? null : c)}
                    className="w-full text-left rounded-2xl cursor-pointer transition-all duration-200"
                    style={{
                      background: isActive ? "linear-gradient(135deg, #5b4d90, #7b65b0)" : "white",
                      boxShadow: isActive ? "0 4px 14px rgba(91,77,144,0.25)" : "0 1px 4px rgba(30,27,107,0.07)",
                      padding: "0.9rem 1rem",
                      border: isActive ? "none" : "1.5px solid #eceef8",
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-bold text-sm" style={{ color: isActive ? "white" : "#1e1b6b" }}>
                        {c.first_name} {c.last_name}
                      </span>
                      <span
                        className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                        style={isActive
                          ? { background: "rgba(255,255,255,0.2)", color: "white", border: "1px solid rgba(255,255,255,0.3)" }
                          : { background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}
                      >
                        {STATUS_LABELS[c.status] ?? c.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs mb-1.5">
                      <span className="flex items-center gap-1" style={{ color: isActive ? "rgba(255,255,255,0.75)" : "#7b72b0" }}>
                        <MapPin className="w-3 h-3" /> {c.wilaya} — {c.commune}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span style={{ color: isActive ? "rgba(255,255,255,0.6)" : "#9090b0" }}>
                        {refNum(c.id)}
                      </span>
                      <span style={{ color: isActive ? "rgba(255,255,255,0.55)" : "#9090b0" }}>
                        {fmt(c.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="flex-1 h-full overflow-y-auto p-6">
            <div className="max-w-xl mx-auto space-y-5">
              {/* Header card */}
              <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg, #5b4d90, #7b65b0)", color: "white" }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="text-lg font-black">{selected.first_name} {selected.last_name}</h3>
                    <p className="text-sm opacity-80">{selected.wilaya} — {selected.commune}</p>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="text-white opacity-70 hover:opacity-100 text-xl leading-none"
                  >×</button>
                </div>
                <div className="flex items-center gap-2 text-xs opacity-70">
                  <span>{refNum(selected.id)}</span>
                  <span className="mx-2">·</span>
                  {fmt(selected.created_at)}
                </div>
              </div>

              {/* Complaint text */}
              <div className="rounded-2xl p-5" style={{ background: "white", border: "1.5px solid #eceef8", boxShadow: "0 1px 4px rgba(30,27,107,0.07)" }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#7b72b0" }}>Texte de la réclamation</p>
                <p className="text-sm leading-relaxed" style={{ color: "#1e1b6b", whiteSpace: "pre-wrap" }}>
                  {selected.complaint}
                </p>
              </div>

              {/* Attachment */}
              {selected.attachment_url && (
                <div className="rounded-2xl p-5" style={{ background: "white", border: "1.5px solid #eceef8", boxShadow: "0 1px 4px rgba(30,27,107,0.07)" }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#7b72b0" }}>Pièce jointe</p>
                  <a
                    href={selected.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-semibold hover:underline"
                    style={{ color: "#5b4d90" }}
                  >
                    <Paperclip className="w-4 h-4" />
                    {selected.attachment_name ?? "Voir le fichier"}
                  </a>
                </div>
              )}

              {/* Notes */}
              {selected.notes && (
                <div className="rounded-2xl p-5" style={{ background: "#faf9ff", border: "1.5px solid #eceef8", boxShadow: "0 1px 4px rgba(30,27,107,0.07)" }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#7b72b0" }}>Notes internes</p>
                  <p className="text-sm leading-relaxed" style={{ color: "#1e1b6b", whiteSpace: "pre-wrap" }}>{selected.notes}</p>
                </div>
              )}

              {/* Status update */}
              <div className="rounded-2xl p-5" style={{ background: "white", border: "1.5px solid #eceef8", boxShadow: "0 1px 4px rgba(30,27,107,0.07)" }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#7b72b0" }}>Mettre à jour le statut</p>
                <div className="relative">
                  <select
                    value={selected.status}
                    onChange={(e) => updateStatus.mutate({ id: selected.id, status: e.target.value })}
                    disabled={updateStatus.isPending}
                    className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold outline-none appearance-none pr-9"
                    style={{ background: "#f5f4fb", color: "#1e1b6b", border: "1.5px solid #dde0f0", cursor: "pointer" }}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "#7b72b0" }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
