import { useState, useRef } from "react";
import type { Document } from "@workspace/api-client-react";
import { formatFrenchDate } from "@/lib/utils";
import { X, Stamp, Download, FileText, FileSpreadsheet, File, Send, AlertCircle } from "lucide-react";
import { useAppSignDocument, useProfile } from "@/hooks/use-app-data";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

interface DocumentViewerProps {
  document: Document | null;
  onClose: () => void;
  onSend?: () => void;
}

function QRCodeSVG({ value, size = 90 }: { value: string; size?: number }) {
  const cells = 9;
  const cell = size / cells;
  const seed = value.split("").reduce((a, c, i) => a + c.charCodeAt(0) * (i + 1), 0);
  const grid = Array.from({ length: cells }, (_, r) =>
    Array.from({ length: cells }, (_, c) => {
      if (r < 3 && c < 3) return true;
      if (r < 3 && c >= cells - 3) return true;
      if (r >= cells - 3 && c < 3) return true;
      if (r === 4 && c >= 2 && c <= 6) return ((seed + c) % 3) < 2;
      return ((seed * (r + 1) + c * 7) % 4) < 2;
    })
  );
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block", borderRadius: 4 }}>
      <rect width={size} height={size} fill="white" />
      {grid.map((row, r) =>
        row.map((on, c) =>
          on ? <rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell} fill="#1e1b6b" /> : null
        )
      )}
      <rect x={0} y={0} width={3 * cell} height={3 * cell} rx={1} fill="none" stroke="#1e1b6b" strokeWidth={cell * 0.3} />
      <rect x={(cells - 3) * cell} y={0} width={3 * cell} height={3 * cell} rx={1} fill="none" stroke="#1e1b6b" strokeWidth={cell * 0.3} />
      <rect x={0} y={(cells - 3) * cell} width={3 * cell} height={3 * cell} rx={1} fill="none" stroke="#1e1b6b" strokeWidth={cell * 0.3} />
    </svg>
  );
}

function detectFileKind(fileType: string, content: string): "pdf" | "image" | "word" | "excel" | "powerpoint" | "text" | "unknown" {
  const ft = (fileType || "").toLowerCase();
  if (ft.includes("pdf") || content?.startsWith("data:application/pdf")) return "pdf";
  if (ft.startsWith("image/") || content?.startsWith("data:image/")) return "image";
  if (ft.includes("word") || ft.includes("wordprocessing") || ft.includes("msword")) return "word";
  if (ft.includes("excel") || ft.includes("spreadsheet") || ft.includes("ms-excel")) return "excel";
  if (ft.includes("powerpoint") || ft.includes("presentation")) return "powerpoint";
  if (ft.includes("text") || ft === "" || !content?.startsWith("data:")) return "text";
  return "unknown";
}

function fileKindLabel(kind: ReturnType<typeof detectFileKind>): string {
  const map: Record<string, string> = {
    pdf: "PDF", image: "Image", word: "Word", excel: "Excel", powerpoint: "PowerPoint", text: "Texte", unknown: "Fichier"
  };
  return map[kind] ?? "Fichier";
}

function OfficeDownloadCard({
  kind, title, fileSize, onDownload,
}: {
  kind: string; title: string; fileSize?: string | null; onDownload: () => void;
}) {
  const icons: Record<string, React.ReactNode> = {
    word: <FileText className="w-16 h-16" style={{ color: "#2b5eb0" }} />,
    excel: <FileSpreadsheet className="w-16 h-16" style={{ color: "#1d7044" }} />,
    powerpoint: <FileText className="w-16 h-16" style={{ color: "#c55a11" }} />,
    unknown: <File className="w-16 h-16" style={{ color: "#5b4d90" }} />,
  };
  return (
    <div className="flex flex-col items-center justify-center p-16 gap-6">
      {icons[kind] ?? icons.unknown}
      <div className="text-center">
        <p className="font-bold text-base mb-1" style={{ color: "#1e1b6b" }}>{title}</p>
        {fileSize && <p className="text-sm" style={{ color: "#9090b0" }}>{fileSize}</p>}
      </div>
      <p className="text-sm text-center max-w-xs" style={{ color: "#7b72b0" }}>
        Ce type de fichier ne peut pas être prévisualisé directement. Téléchargez-le pour l'ouvrir.
      </p>
      <button
        onClick={onDownload}
        className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white"
        style={{ background: "linear-gradient(135deg, #5b4d90, #7b65b0)", boxShadow: "0 4px 14px rgba(91,77,144,0.3)" }}
      >
        <Download className="w-4 h-4" />
        Télécharger le fichier
      </button>
    </div>
  );
}

export function DocumentViewer({ document, onClose, onSend }: DocumentViewerProps) {
  const signMutation = useAppSignDocument();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const paperRef = useRef<HTMLDivElement>(null);

  const hasExistingSig = document?.signatureX != null && document?.signatureY != null;
  const [signMode, setSignMode] = useState(false);
  const [placedSig, setPlacedSig] = useState<{ x: number; y: number } | null>(
    hasExistingSig ? { x: document!.signatureX!, y: document!.signatureY! } : null
  );
  const [sigValue, setSigValue] = useState<string | null>(document?.signatureData ?? null);

  if (!document) {
    return (
      <div
        className="h-full flex flex-col items-center justify-center rounded-2xl"
        style={{ background: "rgba(255,255,255,0.4)", border: "2px dashed #dde0f0" }}
      >
        <Stamp className="w-14 h-14 mb-3 opacity-20" style={{ color: "#5b4d90" }} />
        <p className="font-semibold" style={{ color: "#5b4d90" }}>Sélectionnez un document</p>
      </div>
    );
  }

  const fileKind = detectFileKind(document.fileType || "", document.content || "");
  const isBase64 = document.content?.startsWith("data:");
  const canDownload = isBase64;
  const isPreviewable = fileKind === "pdf" || fileKind === "image" || fileKind === "text";

  const handleDocumentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!signMode || !paperRef.current) return;
    const rect = paperRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPlacedSig({ x, y });
    setSignMode(false);
  };

  const handleValidate = async () => {
    if (!placedSig) return;
    const sigImage = profile?.signatureImage;
    if (!sigImage) {
      toast({
        title: "Aucune signature enregistrée",
        description: "Veuillez d'abord téléverser votre signature dans les Paramètres.",
        variant: "destructive",
      });
      return;
    }
    try {
      await signMutation.mutateAsync({
        id: document.id,
        data: { signatureData: sigImage, signatureX: placedSig.x, signatureY: placedSig.y },
      });
      setSigValue(sigImage);
      toast({ title: "Document signé", description: "Votre signature numérique a été apposée avec succès." });
    } catch {
      toast({ title: "Erreur", description: "Impossible de signer le document.", variant: "destructive" });
    }
  };

  const isRecipient = user?.id != null && document.recipientId === user.id;
  const isSender = user?.id != null && document.senderId === user.id;
  const canSign =
    !sigValue &&
    !document.signedAt &&
    (isRecipient || (isSender && document.status === "pending_validation"));

  const handleDownload = () => {
    if (!isBase64) return;
    const ext = fileKindLabel(fileKind).toLowerCase();
    const a = window.document.createElement("a");
    a.href = document.content;
    a.download = `${document.title || "document"}.${ext}`;
    a.click();
  };

  return (
    <div
      className="h-full flex flex-col rounded-2xl overflow-hidden"
      style={{ background: "white", boxShadow: "0 2px 20px rgba(30,27,107,0.10)" }}
    >
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-4 py-2.5 shrink-0"
        style={{ background: "#f8f7fc", borderBottom: "1.5px solid #eceef8" }}
      >
        <div className="flex items-center gap-3">
          {onSend && (
            <button
              onClick={onSend}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #5b4d90, #7b65b0)" }}
            >
              <Send className="w-3.5 h-3.5" />
              Envoyer
            </button>
          )}
          {canSign && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={signMode}
                onChange={(e) => setSignMode(e.target.checked)}
                className="w-4 h-4 accent-purple-700"
              />
              <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: "#1e1b6b" }}>
                <Stamp className="w-4 h-4" style={{ color: "#5b4d90" }} />
                Ajouter la signature
              </span>
            </label>
          )}
          {canSign && !profile?.signatureImage && (
            <span
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full"
              style={{ background: "#fef3c7", color: "#92400e" }}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Aucune signature — rendez-vous dans Paramètres
            </span>
          )}
          {signMode && (
            <span
              className="text-xs font-medium px-3 py-1 rounded-full animate-pulse"
              style={{ background: "#ebe9f6", color: "#5b4d90" }}
            >
              Cliquez sur le document pour placer votre signature
            </span>
          )}
          {sigValue && (
            <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: "#e8f5e9", color: "#2e7d32" }}>
              ✓ Signé électroniquement
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {canDownload && (
            <button
              onClick={handleDownload}
              title="Télécharger"
              className="p-2 rounded-lg transition-colors"
              style={{ color: "#7b72b0" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f0eef8")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            title="Fermer"
            className="p-2 rounded-lg transition-colors"
            style={{ color: "#7b72b0" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#fee2e2")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Meta info bar */}
      <div
        className="flex items-center gap-4 px-4 py-2 text-xs shrink-0 flex-wrap"
        style={{ background: "#fafbfe", borderBottom: "1px solid #eceef8" }}
      >
        <span>
          <span style={{ color: "#9090b0" }}>De : </span>
          <span className="font-semibold" style={{ color: "#1e1b6b" }}>{document.senderName}</span>
        </span>
        <span style={{ color: "#c5b8e8" }}>→</span>
        <span>
          <span style={{ color: "#9090b0" }}>À : </span>
          <span className="font-semibold" style={{ color: "#1e1b6b" }}>{document.recipientName}</span>
        </span>
        <span className="ml-auto" style={{ color: "#9090b0" }}>{formatFrenchDate(document.createdAt)}</span>
        <span
          className="font-medium px-1.5 py-0.5 rounded text-[10px] uppercase"
          style={{ background: "#f0eef8", color: "#5b4d90" }}
        >
          {fileKindLabel(fileKind)}{document.fileSize ? ` · ${document.fileSize}` : ""}
        </span>
      </div>

      {/* Document display */}
      <div className="flex-1 overflow-y-auto" style={{ background: "#eceef8" }}>
        <div className="py-6 px-5 flex justify-center min-h-full">
          <div
            ref={paperRef}
            onClick={handleDocumentClick}
            className="relative w-full max-w-2xl bg-white"
            style={{
              minHeight: isPreviewable ? 600 : "auto",
              boxShadow: "0 3px 20px rgba(30,27,107,0.12)",
              cursor: signMode ? "crosshair" : "default",
              borderRadius: 4,
              overflow: fileKind === "pdf" ? "hidden" : undefined,
            }}
          >
            {fileKind === "pdf" ? (
              <iframe
                src={document.content}
                title={document.title}
                className="w-full"
                style={{ minHeight: 700, border: "none", display: "block" }}
              />
            ) : fileKind === "image" ? (
              <img
                src={document.content}
                alt={document.title}
                className="w-full h-auto"
                style={{ borderRadius: 4 }}
              />
            ) : fileKind === "word" || fileKind === "excel" || fileKind === "powerpoint" || fileKind === "unknown" ? (
              <OfficeDownloadCard
                kind={fileKind}
                title={document.title}
                fileSize={document.fileSize}
                onDownload={handleDownload}
              />
            ) : (
              /* Plain text / seeded content */
              <div className="p-10">
                <h2
                  className="text-center font-black text-base mb-6 underline"
                  style={{ color: "#1e1b6b" }}
                >
                  {document.title}
                </h2>
                <div className="font-serif text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                  {document.content}
                </div>
              </div>
            )}

            {/* Sign mode click-capture overlay — sits above iframes/images so clicks always register */}
            {signMode && (
              <div
                className="absolute inset-0 rounded"
                style={{
                  zIndex: 10,
                  cursor: "crosshair",
                  border: "2px dashed #7b65b0",
                  background: "rgba(91,77,144,0.04)",
                }}
                onClick={(e) => {
                  if (!paperRef.current) return;
                  const rect = paperRef.current.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  setPlacedSig({ x, y });
                  setSignMode(false);
                }}
              />
            )}

            {/* Signature stamp — above the click overlay (z-20) */}
            {placedSig && (
              <div
                className="absolute pointer-events-none"
                style={{ left: `${placedSig.x}%`, top: `${placedSig.y}%`, transform: "translate(-50%, -50%)", zIndex: 20 }}
              >
                {sigValue ? (
                  <div
                    className="flex flex-col items-center"
                    style={{
                      border: "2px solid #1e1b6b",
                      borderRadius: 6,
                      background: "rgba(255,255,255,0.92)",
                      padding: "4px 6px",
                      boxShadow: "0 2px 8px rgba(30,27,107,0.18)",
                    }}
                  >
                    <img
                      src={sigValue.startsWith("data:") ? sigValue : undefined}
                      alt="Signature"
                      style={{ maxWidth: 120, maxHeight: 60, objectFit: "contain", display: "block" }}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                    <span className="text-[8px] font-bold mt-0.5 tracking-widest uppercase" style={{ color: "#1e1b6b" }}>
                      Signé — HYDROGES
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center opacity-70">
                    {profile?.signatureImage ? (
                      <img
                        src={profile.signatureImage}
                        alt="Aperçu signature"
                        style={{ maxWidth: 100, maxHeight: 50, objectFit: "contain", opacity: 0.5 }}
                      />
                    ) : (
                      <Stamp className="w-9 h-9" style={{ color: "#5b4d90" }} />
                    )}
                    <span className="text-[10px] font-semibold mt-0.5" style={{ color: "#5b4d90" }}>
                      {profile?.signatureImage ? "Cliquez Validation" : "Aucune signature"}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Validation button */}
      {placedSig && !sigValue && (
        <div
          className="flex justify-center py-3.5 shrink-0"
          style={{ background: "#f8f7fc", borderTop: "1.5px solid #eceef8" }}
        >
          <button
            onClick={handleValidate}
            disabled={signMutation.isPending}
            style={{
              background: signMutation.isPending
                ? "#9090b0"
                : "linear-gradient(135deg, #5b4d90, #7b65b0)",
              color: "white",
              border: "none",
              borderRadius: "2rem",
              padding: "0.65rem 3rem",
              fontSize: "1rem",
              fontWeight: 800,
              cursor: signMutation.isPending ? "not-allowed" : "pointer",
              boxShadow: "0 4px 14px rgba(91,77,144,0.3)",
              letterSpacing: "0.05em",
            }}
          >
            {signMutation.isPending ? "En cours…" : "Validation"}
          </button>
        </div>
      )}
    </div>
  );
}
