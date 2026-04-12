import { AppLayout } from "@/components/layout/AppLayout";
import { DocumentPageTemplate } from "@/components/documents/DocumentPageTemplate";

export default function ScheduledPage() {
  return (
    <AppLayout>
      <DocumentPageTemplate
        title="Envois Programmées"
        description="Gérez les documents planifiés pour un envoi ultérieur."
        params={{ status: "scheduled", role: "sender" }}
      />
    </AppLayout>
  );
}
