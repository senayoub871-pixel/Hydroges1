import { useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useProfile, useUpdateSignature } from "@/hooks/use-app-data";
import { useToast } from "@/hooks/use-toast";
import { Upload, Trash2, PenLine } from "lucide-react";

export default function SettingsPage() {
  const { data: profile, isLoading } = useProfile();
  const updateSig = useUpdateSignature();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
    try {
      await updateSig.mutateAsync(b64);
      toast({ title: "Signature enregistrée", description: "Votre signature numérique a été mise à jour." });
    } catch {
      toast({ title: "Erreur", description: "Impossible d'enregistrer la signature.", variant: "destructive" });
    }
    e.target.value = "";
  };

  const handleDelete = async () => {
    try {
      await updateSig.mutateAsync(null);
      toast({ title: "Signature supprimée", description: "Votre signature numérique a été retirée." });
    } catch {
      toast({ title: "Erreur", description: "Impossible de supprimer la signature.", variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        <div
          className="px-6 py-5 shrink-0"
          style={{ borderBottom: "1.5px solid #dde0f0", background: "rgba(255,255,255,0.55)" }}
        >
          <h2 className="text-xl font-black mb-0.5" style={{ color: "#1e1b6b" }}>
            Paramètres
          </h2>
          <p className="text-sm" style={{ color: "#7b72b0" }}>
            Gérez votre signature numérique personnelle.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div
            className="max-w-lg rounded-2xl p-6"
            style={{ background: "white", border: "1.5px solid #eceef8", boxShadow: "0 2px 12px rgba(30,27,107,0.07)" }}
          >
            <div className="flex items-center gap-2 mb-1">
              <PenLine className="w-5 h-5" style={{ color: "#5b4d90" }} />
              <h3 className="font-black text-base" style={{ color: "#1e1b6b" }}>
                Signature numérique
              </h3>
            </div>
            <p className="text-sm mb-5" style={{ color: "#7b72b0" }}>
              Cette image sera apposée sur les documents que vous validez. Elle peut être une photo de votre signature manuscrite, un tampon, ou tout autre visuel personnel.
            </p>

            {isLoading ? (
              <div className="h-32 rounded-xl animate-pulse" style={{ background: "#f0eef8" }} />
            ) : profile?.signatureImage ? (
              <div className="mb-5">
                <p className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: "#9090b0" }}>
                  Signature actuelle
                </p>
                <div
                  className="rounded-xl p-4 flex items-center justify-center"
                  style={{ background: "#f8f7fc", border: "1.5px solid #dde0f0", minHeight: 100 }}
                >
                  <img
                    src={profile.signatureImage}
                    alt="Votre signature"
                    style={{ maxWidth: "100%", maxHeight: 120, objectFit: "contain" }}
                  />
                </div>
              </div>
            ) : (
              <div
                className="rounded-xl flex flex-col items-center justify-center mb-5 py-8"
                style={{ background: "#f8f7fc", border: "2px dashed #dde0f0" }}
              >
                <PenLine className="w-10 h-10 mb-2 opacity-20" style={{ color: "#5b4d90" }} />
                <p className="text-sm font-semibold" style={{ color: "#5b4d90" }}>
                  Aucune signature enregistrée
                </p>
                <p className="text-xs mt-1" style={{ color: "#9090b0" }}>
                  Téléversez une image pour activer la signature sur les documents.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={updateSig.isPending}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #5b4d90, #7b65b0)" }}
              >
                <Upload className="w-4 h-4" />
                {profile?.signatureImage ? "Remplacer" : "Téléverser"}
              </button>

              {profile?.signatureImage && (
                <button
                  onClick={handleDelete}
                  disabled={updateSig.isPending}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
                  style={{ background: "#fee2e2", color: "#b91c1c", border: "1.5px solid #fca5a5" }}
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </button>
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <p className="text-xs mt-4" style={{ color: "#9090b0" }}>
              Formats acceptés : PNG, JPG, GIF, WEBP — La transparence (PNG) est recommandée pour un rendu optimal sur les documents.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
