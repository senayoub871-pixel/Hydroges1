import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAppCreateDocument, useAppUsers } from "@/hooks/use-app-data";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Paperclip, X, Calendar, Stamp } from "lucide-react";

interface ComposeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ComposeModal({ open, onOpenChange }: ComposeModalProps) {
  const { user: authUser } = useAuth();
  const { data: users } = useAppUsers();
  const createMutation = useAppCreateDocument();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const submittedRef = useRef(false);

  const [recipientId, setRecipientId] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>("");
  const [scheduleSend, setScheduleSend] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [requiresSignature, setRequiresSignature] = useState(false);
  const [recipientError, setRecipientError] = useState(false);

  const senderLabel = authUser?.role || "Expéditeur";

  const displayFilename = (name: string, max = 45) => {
    if (name.length <= max) return name;
    const dotIdx = name.lastIndexOf(".");
    const ext = dotIdx > 0 ? name.slice(dotIdx) : "";
    return `${name.slice(0, max - ext.length - 3)}...${ext}`;
  };

  const recipientUsers = users?.filter((u) => u.id !== authUser?.id);

  const resetForm = () => {
    setRecipientId("");
    setAttachedFile(null);
    setFileBase64("");
    setScheduleSend(false);
    setScheduleDate("");
    setRequiresSignature(false);
    setRecipientError(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setFileBase64(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setAttachedFile(null);
    setFileBase64("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const saveDraft = async () => {
    if (!attachedFile || !recipientId || createMutation.isPending) return;
    const chosenUser = users?.find((u) => u.id.toString() === recipientId);
    if (!chosenUser) return;
    const title = attachedFile.name.replace(/\.[^/.]+$/, "");
    try {
      await createMutation.mutateAsync({
        title,
        content: fileBase64,
        recipientId: chosenUser.id,
        recipientName: chosenUser.name,
        category: "Général",
        fileType: attachedFile.type || "application/octet-stream",
        scheduledAt: null,
        status: "draft",
      });
      toast({
        title: "Brouillon sauvegardé",
        description: "Le document a été enregistré dans vos brouillons.",
      });
    } catch {}
  };

  const handleOpenChange = async (open: boolean) => {
    if (!open && !submittedRef.current) {
      // File attached but no recipient — keep dialog open and flag the field
      if (attachedFile && !recipientId) {
        setRecipientError(true);
        return;
      }
      await saveDraft();
      resetForm();
    }
    submittedRef.current = false;
    setRecipientError(false);
    onOpenChange(open);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientId) {
      toast({ title: "Erreur", description: "Veuillez choisir un destinataire.", variant: "destructive" });
      return;
    }
    if (!attachedFile) {
      toast({ title: "Erreur", description: "Veuillez joindre un document.", variant: "destructive" });
      return;
    }

    const chosenUser = users?.find((u) => u.id.toString() === recipientId);
    const title = attachedFile.name.replace(/\.[^/.]+$/, "");
    const status = scheduleSend ? "scheduled" : requiresSignature ? "pending_validation" : "sent";

    try {
      await createMutation.mutateAsync({
        title,
        content: fileBase64,
        recipientId: chosenUser!.id,
        recipientName: chosenUser!.name,
        category: "Général",
        fileType: attachedFile.type || "application/octet-stream",
        scheduledAt: scheduleSend && scheduleDate ? new Date(scheduleDate).toISOString() : null,
        status,
      });

      const toastMsg =
        status === "scheduled"
          ? { title: "Envoi programmé", description: `Le document sera envoyé le ${new Date(scheduleDate).toLocaleString("fr-FR")}.` }
          : status === "pending_validation"
          ? { title: "Document envoyé pour validation", description: "Le destinataire devra apposer sa signature pour valider le document." }
          : { title: "Document envoyé", description: "Le document a été transmis avec succès." };

      toast(toastMsg);
      submittedRef.current = true;
      resetForm();
      onOpenChange(false);
    } catch {
      toast({ title: "Erreur", description: "Impossible d'envoyer le document.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle style={{ color: "#1e1b6b", fontSize: "1.3rem", fontWeight: 800 }}>
            Nouveau document
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* De (sender - read-only) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#7b72b0" }}>
              De
            </label>
            <div
              className="w-full px-4 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: "#f0eef8", color: "#1e1b6b", border: "1.5px solid #dde0f0" }}
            >
              {senderLabel}
            </div>
          </div>

          {/* À (recipient — registered users only) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: recipientError ? "#c0392b" : "#7b72b0" }}>
              À {recipientError && <span className="normal-case font-normal">— choisissez un destinataire pour continuer</span>}
            </label>
            <select
              value={recipientId}
              onChange={(e) => { setRecipientId(e.target.value); setRecipientError(false); }}
              required
              className="w-full px-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all"
              style={{
                background: recipientError ? "#fff5f5" : "white",
                color: "#1e1b6b",
                border: `1.5px solid ${recipientError ? "#e57373" : "#dde0f0"}`,
                cursor: "pointer",
                boxShadow: recipientError ? "0 0 0 3px rgba(229,115,115,0.15)" : "none",
              }}
            >
              <option value="">— Choisir un employé —</option>
              {recipientUsers?.map((u) => (
                <option key={u.id} value={u.id.toString()}>
                  {u.name} — {u.department}
                </option>
              ))}
            </select>
          </div>

          {/* File attachment */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#7b72b0" }}>
              Document joint
            </label>
            {attachedFile ? (
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-xl w-full overflow-hidden"
                style={{ background: "#f0eef8", border: "1.5px solid #c5b8e8" }}
              >
                <Paperclip className="w-4 h-4 shrink-0" style={{ color: "#5b4d90" }} />
                <span className="flex-1 text-sm font-medium" style={{ color: "#1e1b6b", wordBreak: "break-all", overflowWrap: "anywhere" }}>
                  {displayFilename(attachedFile.name)}
                </span>
                <span className="shrink-0 text-xs whitespace-nowrap" style={{ color: "#9090b0" }}>
                  ({(attachedFile.size / 1024).toFixed(0)} KB)
                </span>
                <button type="button" onClick={removeFile} className="shrink-0 p-1 rounded-full hover:bg-purple-100">
                  <X className="w-4 h-4" style={{ color: "#5b4d90" }} />
                </button>
              </div>
            ) : (
              <label
                className="flex items-center justify-center gap-2 w-full py-4 rounded-xl cursor-pointer transition-colors"
                style={{ background: "white", border: "2px dashed #c5b8e8", color: "#5b4d90" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f3fc")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
              >
                <Paperclip className="w-4 h-4" />
                <span className="text-sm font-semibold">Joindre un document +</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xls,.xlsx,.txt"
                  onChange={handleFileChange}
                />
              </label>
            )}
            <p className="text-xs mt-1" style={{ color: "#9090b0" }}>PDF, Word, Excel, Images acceptés</p>
          </div>

          {/* Options row: signature + schedule */}
          <div className="flex flex-col gap-2">
            {/* Requires signature toggle */}
            <div
              className="rounded-xl p-3"
              style={{
                background: requiresSignature ? "#ebe9f8" : "#f5f4fb",
                border: `1.5px solid ${requiresSignature ? "#7b65b0" : "#dde0f0"}`,
                transition: "all 0.15s",
              }}
            >
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={requiresSignature}
                  onChange={(e) => {
                    setRequiresSignature(e.target.checked);
                    if (e.target.checked) setScheduleSend(false);
                  }}
                  className="w-4 h-4 accent-purple-700"
                />
                <Stamp className="w-4 h-4" style={{ color: requiresSignature ? "#5b4d90" : "#9090b0" }} />
                <span className="text-sm font-semibold" style={{ color: requiresSignature ? "#1e1b6b" : "#7b72b0" }}>
                  Requiert une signature du destinataire
                </span>
              </label>
              {requiresSignature && (
                <p className="text-xs mt-1.5 ml-6" style={{ color: "#7b72b0" }}>
                  Le document sera envoyé en attente de validation — le destinataire devra apposer sa signature.
                </p>
              )}
            </div>

            {/* Schedule */}
            <div
              className="rounded-xl p-3"
              style={{ background: "#f5f4fb", border: "1.5px solid #dde0f0" }}
            >
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={scheduleSend}
                  onChange={(e) => {
                    setScheduleSend(e.target.checked);
                    if (e.target.checked) setRequiresSignature(false);
                  }}
                  className="w-4 h-4 accent-purple-700"
                />
                <Calendar className="w-4 h-4" style={{ color: "#5b4d90" }} />
                <span className="text-sm font-semibold" style={{ color: "#1e1b6b" }}>Programmer l'envoi</span>
              </label>
              {scheduleSend && (
                <input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  required={scheduleSend}
                  className="mt-3 w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: "white", color: "#1e1b6b", border: "1.5px solid #dde0f0" }}
                />
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="px-5 py-2 rounded-xl text-sm font-semibold transition-colors"
              style={{ background: "#f0eef8", color: "#5b4d90", border: "1.5px solid #dde0f0" }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-5 py-2 rounded-xl text-sm font-bold text-white transition-colors"
              style={{ background: createMutation.isPending ? "#9090b0" : "#5b4d90", border: "none" }}
            >
              {createMutation.isPending
                ? "Envoi..."
                : scheduleSend
                ? "Programmer"
                : requiresSignature
                ? "Envoyer pour validation"
                : "Envoyer"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
