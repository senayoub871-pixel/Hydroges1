import { AppLayout } from "@/components/layout/AppLayout";
import { DocumentPageTemplate } from "@/components/documents/DocumentPageTemplate";

export default function SentPage() {
  return (
    <AppLayout>
      <DocumentPageTemplate
        title="Documents Envoyées"
        description="Historique des documents que vous avez transmis."
        params={{ status: "sent", role: "sender" }}
      />
    </AppLayout>
  );
}
