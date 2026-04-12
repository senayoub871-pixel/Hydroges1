import { AppLayout } from "@/components/layout/AppLayout";
import { DocumentPageTemplate } from "@/components/documents/DocumentPageTemplate";

export default function PendingPage() {
  return (
    <AppLayout>
      <DocumentPageTemplate
        title="En cours de validation"
        description="Cliquez sur un document pour l'ouvrir, puis apposez votre signature numérique."
        params={{ status: "pending_validation", role: "sender" }}
      />
    </AppLayout>
  );
}
