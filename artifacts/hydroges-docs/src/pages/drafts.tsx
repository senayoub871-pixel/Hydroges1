import { AppLayout } from "@/components/layout/AppLayout";
import { DocumentPageTemplate } from "@/components/documents/DocumentPageTemplate";
import { useAppSendDocument } from "@/hooks/use-app-data";
import { useToast } from "@/hooks/use-toast";
import type { Document } from "@workspace/api-client-react";
import { Send } from "lucide-react";

export default function DraftsPage() {
  const sendMutation = useAppSendDocument();
  const { toast } = useToast();

  const handleSend = async (doc: Document) => {
    try {
      await sendMutation.mutateAsync({ id: doc.id, data: { scheduledAt: null } });
      toast({
        title: "Document envoyé",
        description: `« ${doc.title} » a été transmis à ${doc.recipientName}.`,
      });
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le document.",
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout>
      <DocumentPageTemplate
        title="Brouillons"
        description="Documents en cours de rédaction, non validés."
        params={{ status: "draft", role: "sender" }}
        cardActions={(doc) => (
          <button
            onClick={() => handleSend(doc)}
            disabled={sendMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #5b4d90, #7b65b0)" }}
          >
            <Send className="w-3 h-3" />
            Envoyer
          </button>
        )}
        onDocumentSend={handleSend}
      />
    </AppLayout>
  );
}
