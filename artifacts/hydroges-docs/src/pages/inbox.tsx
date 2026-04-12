import { AppLayout } from "@/components/layout/AppLayout";
import { DocumentPageTemplate } from "@/components/documents/DocumentPageTemplate";

export default function InboxPage() {
  return (
    <AppLayout>
      <DocumentPageTemplate
        title="Liste de documents"
        description="Tous les documents que vous avez créés — envoyés, en attente, brouillons."
        params={{ role: "sender" }}
      />
    </AppLayout>
  );
}
