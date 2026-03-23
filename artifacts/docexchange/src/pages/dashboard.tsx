import { useState, useMemo, useEffect } from "react";
import { useSearch } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { CreateDocumentModal } from "@/components/document/create-document-modal";
import { DocumentViewer } from "@/components/document/document-viewer";
import { 
  useListDocuments, 
  ListDocumentsType, 
  useValidateDocument,
  useUpdateDocument,
  customFetch,
} from "@workspace/api-client-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  FileText, QrCode, Search, Filter, PenLine,
  Send, Save, CheckCircle2, Clock, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";

type DocStatus = "draft" | "pending_validation" | "validated" | "sent" | "scheduled";

const STATUS_CONFIG: Record<DocStatus, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  draft:              { label: "Brouillon",          color: "bg-gray-100 text-gray-600",      icon: Save },
  pending_validation: { label: "En validation",      color: "bg-amber-100 text-amber-700",    icon: Clock },
  validated:          { label: "Validé",             color: "bg-blue-100 text-blue-700",      icon: CheckCircle2 },
  sent:               { label: "Envoyé",             color: "bg-green-100 text-green-700",    icon: Send },
  scheduled:          { label: "Programmé",          color: "bg-violet-100 text-violet-700",  icon: Clock },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as DocStatus];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function SignaturePlacer({ 
  signatureUrl, 
  onPositionSelect 
}: { 
  signatureUrl?: string | null; 
  onPositionSelect: (pos: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const positions = [
    { id: "top-left",     label: "Haut gauche" },
    { id: "top-right",    label: "Haut droite" },
    { id: "bottom-left",  label: "Bas gauche" },
    { id: "bottom-right", label: "Bas droite" },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground">Choisissez l'emplacement de la signature :</p>
      <div className="grid grid-cols-2 gap-2">
        {positions.map(pos => (
          <button
            key={pos.id}
            onClick={() => { setSelected(pos.id); onPositionSelect(pos.id); }}
            className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
              selected === pos.id 
                ? "border-primary bg-primary/10 text-primary" 
                : "border-border bg-card text-muted-foreground hover:border-primary/50"
            }`}
          >
            {pos.label}
          </button>
        ))}
      </div>
      {selected && signatureUrl && (
        <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl p-3">
          <img src={signatureUrl} alt="Signature" className="h-10 object-contain" />
          <span className="text-xs text-muted-foreground">Signature positionnée</span>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [signaturePosition, setSignaturePosition] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const urlSearch = useSearch();
  const typeParam = new URLSearchParams(urlSearch).get("type") as ListDocumentsType | null;

  const { data: documents, isLoading } = useListDocuments(typeParam ? { type: typeParam } : undefined);

  // Deselect document when switching tabs
  useEffect(() => {
    setSelectedDocId(null);
  }, [typeParam]);

  const validateMutation = useValidateDocument();
  const updateMutation = useUpdateDocument();

  const selectedDoc = useMemo(() => {
    return documents?.find(d => d.id === selectedDocId) || null;
  }, [documents, selectedDocId]);

  const filteredDocs = useMemo(() => {
    if (!search.trim()) return documents;
    const q = search.toLowerCase();
    return documents?.filter(d => 
      d.title?.toLowerCase().includes(q) ||
      d.fromUser?.lastName?.toLowerCase().includes(q) ||
      d.toUser?.lastName?.toLowerCase().includes(q)
    );
  }, [documents, search]);

  const getPageTitle = () => {
    switch(typeParam) {
      case "inbox":              return "Boîte de réception";
      case "pending_validation": return "En cours de validation";
      case "sent":               return "Documents envoyés";
      case "scheduled":          return "Envois programmés";
      case "outbox":             return "Boîte d'envoi";
      case "drafts":             return "Brouillons";
      default:                   return "Tous les documents";
    }
  };

  const handleValidate = async () => {
    if (!selectedDocId) return;
    try {
      await validateMutation.mutateAsync({ id: selectedDocId });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({ title: "Document validé", description: "Le document a été validé avec succès." });
    } catch {
      toast({ title: "Erreur", description: "Échec de la validation", variant: "destructive" });
    }
  };

  const handleSend = async () => {
    if (!selectedDocId) return;
    try {
      await customFetch(`/api/documents/${selectedDocId}/send`, { method: "POST" });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setSelectedDocId(null);
      toast({ title: "Document envoyé", description: "Le document a été envoyé avec succès." });
    } catch {
      toast({ title: "Erreur", description: "Échec de l'envoi", variant: "destructive" });
    }
  };

  const handleValidateAndSend = async () => {
    if (!selectedDocId) return;
    try {
      await validateMutation.mutateAsync({ id: selectedDocId });
      await customFetch(`/api/documents/${selectedDocId}/send`, { method: "POST" });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setSelectedDocId(null);
      toast({ title: "Document envoyé", description: "Le document a été validé et envoyé." });
    } catch {
      toast({ title: "Erreur", description: "Échec de l'opération", variant: "destructive" });
    }
  };

  const isActionPending = validateMutation.isPending || updateMutation.isPending;

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        
        <main className="flex-1 flex overflow-hidden">
          {/* Document List Panel */}
          <div className="w-80 shrink-0 border-r border-border/50 bg-background/50 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
              <h2 className="text-base font-display font-bold text-foreground mb-3">{getPageTitle()}</h2>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input 
                    type="text" 
                    placeholder="Rechercher..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-xl bg-card border border-border focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm"
                  />
                </div>
                <Button variant="outline" size="icon" className="rounded-xl h-9 w-9 shrink-0">
                  <Filter className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {isLoading ? (
                <div className="space-y-2">
                  {[1,2,3].map(i => <div key={i} className="h-20 bg-muted/50 animate-pulse rounded-xl" />)}
                </div>
              ) : filteredDocs?.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Aucun document trouvé</p>
                </div>
              ) : (
                filteredDocs?.map(doc => (
                  <div 
                    key={doc.id}
                    onClick={() => { setSelectedDocId(doc.id); setSignaturePosition(null); }}
                    className={`p-3 rounded-xl cursor-pointer transition-all border ${
                      selectedDocId === doc.id 
                        ? "bg-primary/5 border-primary/30 shadow-sm" 
                        : "bg-card border-border/50 hover:border-primary/30 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <h4 className="font-semibold text-foreground text-sm truncate pr-2 flex-1">{doc.title}</h4>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <StatusBadge status={doc.status} />
                      <span className="text-xs text-muted-foreground shrink-0">
                        {format(new Date(doc.createdAt), "dd MMM", { locale: fr })}
                      </span>
                    </div>
                    {doc.fromUser && (
                      <div className="text-xs text-muted-foreground mt-1.5 truncate">
                        De : {doc.fromUser.lastName} {doc.fromUser.firstName}
                      </div>
                    )}
                    {doc.toUser && (
                      <div className="text-xs text-muted-foreground truncate">
                        À : {doc.toUser.lastName} {doc.toUser.firstName}
                      </div>
                    )}
                    {doc.status === "scheduled" && doc.scheduledAt && (
                      <div className="text-xs text-violet-600 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(doc.scheduledAt), "dd MMM yyyy à HH:mm", { locale: fr })}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Document Detail Panel */}
          <div className="flex-1 bg-secondary/10 flex flex-col overflow-hidden relative">
            {selectedDoc ? (
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-3xl mx-auto space-y-5">

                  {/* Header info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-card p-3 rounded-2xl border border-border shadow-sm flex items-center gap-2">
                      <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg text-sm">De</span>
                      <span className="font-medium text-sm truncate">
                        {selectedDoc.fromUser ? `${selectedDoc.fromUser.lastName} — ${selectedDoc.fromUser.jobTitle}` : "Inconnu"}
                      </span>
                    </div>
                    {selectedDoc.toUser && (
                      <div className="bg-card p-3 rounded-2xl border border-border shadow-sm flex items-center gap-2">
                        <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg text-sm">À</span>
                        <span className="font-medium text-sm truncate">
                          {selectedDoc.toUser.lastName} — {selectedDoc.toUser.jobTitle}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <StatusBadge status={selectedDoc.status} />
                    <span className="text-xs text-muted-foreground">
                      Créé le {format(new Date(selectedDoc.createdAt), "dd MMMM yyyy", { locale: fr })}
                    </span>
                  </div>

                  {/* Inline file viewer */}
                  {selectedDoc.fileUrl ? (
                    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                      <div className="px-4 py-2 border-b border-border/50 flex items-center justify-between bg-muted/20">
                        <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          {selectedDoc.fileName || "Document"}
                        </span>
                        <a href={selectedDoc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                          Ouvrir dans un nouvel onglet
                        </a>
                      </div>
                      <DocumentViewer
                        fileUrl={selectedDoc.fileUrl}
                        fileName={selectedDoc.fileName}
                        height="h-[480px]"
                      />
                    </div>
                  ) : (
                    <div className="bg-card rounded-2xl border border-border p-8 text-center text-muted-foreground">
                      <FileText className="w-10 h-10 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">Aucun fichier joint</p>
                    </div>
                  )}

                  {/* QR Code if validated */}
                  {selectedDoc.qrCodeUrl && (
                    <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4">
                      <img src={selectedDoc.qrCodeUrl} alt="QR Code validation" className="w-20 h-20 object-contain rounded-lg" />
                      <div>
                        <p className="font-semibold text-sm text-foreground flex items-center gap-1">
                          <QrCode className="w-4 h-4 text-primary" /> Code QR de validation
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Ce document a été validé officiellement</p>
                      </div>
                    </div>
                  )}

                  {/* Scheduled info */}
                  {selectedDoc.status === "scheduled" && selectedDoc.scheduledAt && (
                    <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 flex items-center gap-3">
                      <Clock className="w-5 h-5 text-violet-600 shrink-0" />
                      <div>
                        <p className="font-semibold text-sm text-violet-800">Envoi programmé</p>
                        <p className="text-sm text-violet-600">
                          {format(new Date(selectedDoc.scheduledAt), "dd MMMM yyyy à HH:mm", { locale: fr })}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Action panel: pending_validation */}
                  {selectedDoc.status === "pending_validation" && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-4">
                      <p className="font-semibold text-amber-800 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> Ce document attend votre validation
                      </p>
                      <SignaturePlacer
                        signatureUrl={user?.signatureUrl}
                        onPositionSelect={setSignaturePosition}
                      />
                      <div className="flex gap-3 pt-1">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={handleValidate}
                          disabled={isActionPending}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          {isActionPending ? "Validation..." : "Valider uniquement"}
                        </Button>
                        <Button
                          className="flex-1"
                          onClick={handleValidateAndSend}
                          disabled={isActionPending}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          {isActionPending ? "Envoi..." : "Valider et envoyer"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Action panel: validated (ready to send) */}
                  {selectedDoc.status === "validated" && (
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                      <p className="font-semibold text-blue-800 flex items-center gap-2 mb-4">
                        <CheckCircle2 className="w-4 h-4" /> Document validé — prêt à l'envoi
                      </p>
                      <Button className="w-full" onClick={handleSend} disabled={isActionPending}>
                        <Send className="w-4 h-4 mr-2" />
                        {isActionPending ? "Envoi..." : "Envoyer maintenant"}
                      </Button>
                    </div>
                  )}

                  {/* Action panel: draft */}
                  {selectedDoc.status === "draft" && (
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
                      <p className="font-semibold text-gray-700 flex items-center gap-2 mb-4">
                        <Save className="w-4 h-4" /> Brouillon — non encore envoyé
                      </p>
                      <Button className="w-full" onClick={handleValidateAndSend} disabled={isActionPending}>
                        <Send className="w-4 h-4 mr-2" />
                        {isActionPending ? "Envoi..." : "Valider et envoyer"}
                      </Button>
                    </div>
                  )}

                  {/* Outbox status for sent */}
                  {selectedDoc.status === "sent" && (
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                      <div>
                        <p className="font-semibold text-sm text-green-800">Document envoyé</p>
                        <p className="text-xs text-green-600">Le destinataire a reçu ce document</p>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
                <div className="w-20 h-20 bg-card rounded-full shadow-sm border border-border flex items-center justify-center mb-5">
                  <FileText className="w-9 h-9 text-primary/40" />
                </div>
                <h3 className="text-lg font-display font-semibold text-foreground mb-2">Sélectionnez un document</h3>
                <p className="text-center max-w-xs text-sm">Choisissez un document dans la liste pour afficher ses détails, ou créez-en un nouveau.</p>
              </div>
            )}
            
            <div className="absolute bottom-6 right-6 z-20">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 pl-4 pr-5 rounded-full shadow-xl shadow-primary/30 flex items-center gap-2.5 transition-transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <PenLine className="w-4 h-4" />
                <span className="font-semibold text-sm tracking-wide">Nouveau document</span>
              </button>
            </div>
          </div>
        </main>
      </div>

      <CreateDocumentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
