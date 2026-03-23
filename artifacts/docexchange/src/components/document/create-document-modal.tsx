import { useState } from "react";
import { motion } from "framer-motion";
import { 
  X, ChevronRight, CheckCircle2, Calendar, Save, Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { 
  useListUsers, 
  useUploadDocument, 
  useCreateDocument,
  useValidateDocument,
} from "@workspace/api-client-react";
import { customFetch } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { DocumentViewer } from "@/components/document/document-viewer";

interface CreateDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateDocumentModal({ isOpen, onClose }: CreateDocumentModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [recipientId, setRecipientId] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [addSignature, setAddSignature] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("09:00");

  const { data: users } = useListUsers();
  const uploadMutation = useUploadDocument();
  const createMutation = useCreateDocument();
  const validateMutation = useValidateDocument();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleNextStep1 = async () => {
    if (!recipientId || !file) return;
    try {
      const uploadRes = await uploadMutation.mutateAsync({ data: { file } });
      setFileUrl(uploadRes.url);
      setStep(2);
    } catch {
      toast({ title: "Erreur", description: "Échec du téléchargement du fichier", variant: "destructive" });
    }
  };

  const handleSaveDraft = async () => {
    try {
      await createMutation.mutateAsync({
        data: {
          title: file?.name || "Nouveau document",
          fileUrl,
          fileName: file?.name,
          toUserId: recipientId,
          hasSignature: false,
          status: "draft",
        }
      });
      setSuccessMessage("Le document a été sauvegardé en brouillon.");
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setStep(3);
    } catch {
      toast({ title: "Erreur", description: "Échec de la sauvegarde", variant: "destructive" });
    }
  };

  const handleSchedule = async () => {
    if (!scheduledDate) {
      toast({ title: "Erreur", description: "Veuillez choisir une date d'envoi", variant: "destructive" });
      return;
    }
    try {
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      await createMutation.mutateAsync({
        data: {
          title: file?.name || "Nouveau document",
          fileUrl,
          fileName: file?.name,
          toUserId: recipientId,
          hasSignature: addSignature,
          status: "scheduled",
          scheduledAt,
        }
      });
      setSuccessMessage(`Envoi programmé pour le ${format(new Date(`${scheduledDate}T${scheduledTime}`), "dd MMMM yyyy à HH:mm", { locale: fr })}.`);
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setStep(3);
    } catch {
      toast({ title: "Erreur", description: "Échec de la programmation", variant: "destructive" });
    }
  };

  const handleValidateAndSend = async () => {
    try {
      const doc = await createMutation.mutateAsync({
        data: {
          title: file?.name || "Nouveau document",
          fileUrl,
          fileName: file?.name,
          toUserId: recipientId,
          hasSignature: addSignature,
          status: "pending_validation",
        }
      });
      await validateMutation.mutateAsync({ id: doc.id });
      await customFetch(`/api/documents/${doc.id}/send`, { method: "POST" });
      setSuccessMessage("Le document a été validé et envoyé avec succès.");
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setStep(3);
    } catch {
      toast({ title: "Erreur", description: "Échec de l'envoi", variant: "destructive" });
    }
  };

  const resetAndClose = () => {
    setStep(1);
    setRecipientId(null);
    setFile(null);
    setFileUrl(null);
    setAddSignature(false);
    setShowScheduler(false);
    setScheduledDate("");
    setScheduledTime("09:00");
    setSuccessMessage("");
    onClose();
  };

  if (!isOpen) return null;

  const isPending = uploadMutation.isPending || createMutation.isPending || validateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-card w-full max-w-2xl rounded-3xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between p-6 border-b border-border/50 bg-secondary/30 shrink-0">
          <h2 className="text-2xl font-display font-bold text-primary flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center p-1">
              <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="w-full h-full object-contain"/>
            </div>
            Nouveau document
          </h2>
          <button onClick={resetAndClose} className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 bg-background/50">

          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-4 bg-card p-4 rounded-2xl border border-border shadow-sm">
                <span className="font-bold text-primary w-12 shrink-0">De</span>
                <div className="flex-1 bg-secondary/50 px-4 py-2.5 rounded-xl text-foreground font-medium truncate">
                  {user?.jobTitle} — {user?.lastName} {user?.firstName}
                </div>
              </div>

              <div className="flex items-center gap-4 bg-card p-4 rounded-2xl border border-border shadow-sm">
                <span className="font-bold text-primary w-12 shrink-0">À</span>
                <select 
                  className="flex-1 bg-secondary/50 px-4 py-2.5 rounded-xl text-foreground font-medium outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  value={recipientId || ""}
                  onChange={(e) => setRecipientId(Number(e.target.value))}
                >
                  <option value="" disabled>Sélectionner le destinataire</option>
                  {users?.filter(u => u.id !== user?.id).map(u => (
                    <option key={u.id} value={u.id}>
                      {u.jobTitle} — {u.lastName} {u.firstName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-4 bg-card p-4 rounded-2xl border border-border shadow-sm">
                <span className="font-bold text-primary w-40 whitespace-nowrap shrink-0">Ajouter le document</span>
                <div className="flex-1 flex items-center gap-3">
                  <input type="file" id="doc-upload" className="hidden" onChange={handleFileChange} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                  <label htmlFor="doc-upload" className="inline-flex items-center px-5 py-2 bg-primary text-primary-foreground font-semibold rounded-xl cursor-pointer hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 shrink-0">
                    Joindre +
                  </label>
                  {file && <span className="text-sm text-muted-foreground truncate">{file.name}</span>}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleNextStep1} disabled={!recipientId || !file || uploadMutation.isPending}>
                  {uploadMutation.isPending ? "Téléchargement..." : "Suivant"} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <label className="flex items-center gap-3 cursor-pointer group p-2 select-none">
                <div className="relative flex items-center justify-center w-6 h-6 rounded border-2 border-primary/50 group-hover:border-primary transition-colors bg-card shrink-0">
                  <input type="checkbox" className="peer sr-only" checked={addSignature} onChange={(e) => setAddSignature(e.target.checked)} />
                  <CheckCircle2 className="w-5 h-5 text-primary opacity-0 peer-checked:opacity-100 absolute transition-opacity" />
                </div>
                <span className="text-base font-medium text-foreground">Ajouter ma signature</span>
              </label>

              {fileUrl && file && (
                <div className="rounded-2xl overflow-hidden border border-border shadow-sm bg-white max-h-72">
                  <DocumentViewer fileUrl={fileUrl} fileName={file.name} />
                </div>
              )}

              {addSignature && user?.signatureUrl && (
                <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl p-3">
                  <img src={user.signatureUrl} alt="Signature" className="h-12 object-contain rounded" />
                  <span className="text-sm text-muted-foreground">Votre signature sera apposée sur le document</span>
                </div>
              )}

              {showScheduler && (
                <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                  <p className="font-semibold text-foreground flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> Programmer l'envoi</p>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground mb-1 block">Date</label>
                      <input
                        type="date"
                        value={scheduledDate}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl bg-secondary/50 border border-border focus:border-primary outline-none text-sm"
                      />
                    </div>
                    <div className="w-32">
                      <label className="text-xs text-muted-foreground mb-1 block">Heure</label>
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl bg-secondary/50 border border-border focus:border-primary outline-none text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" onClick={() => setShowScheduler(false)} className="flex-1">Annuler</Button>
                    <Button size="sm" onClick={handleSchedule} disabled={isPending} className="flex-1">
                      <Calendar className="w-4 h-4 mr-2" /> Confirmer
                    </Button>
                  </div>
                </div>
              )}

              {!showScheduler && (
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={handleSaveDraft} disabled={isPending}>
                    <Save className="w-4 h-4 mr-2" /> Brouillon
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => setShowScheduler(true)}>
                    <Calendar className="w-4 h-4 mr-2" /> Programmer
                  </Button>
                  <Button className="flex-1" onClick={handleValidateAndSend} disabled={isPending}>
                    <Send className="w-4 h-4 mr-2" /> {isPending ? "Envoi..." : "Valider et envoyer"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center justify-center py-10 space-y-5 text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </motion.div>
              <h3 className="text-xl font-display font-bold text-foreground">Opération réussie</h3>
              <p className="text-muted-foreground max-w-xs">{successMessage}</p>
              <Button onClick={resetAndClose} variant="outline" className="mt-4">Fermer</Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
