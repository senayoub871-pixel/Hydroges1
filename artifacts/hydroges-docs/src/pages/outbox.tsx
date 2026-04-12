import { AppLayout } from "@/components/layout/AppLayout";
import { DocumentPageTemplate } from "@/components/documents/DocumentPageTemplate";

export default function OutboxPage() {
  return (
    <AppLayout>
      <DocumentPageTemplate
        title="Boîte d'Envois"
        description="Aperçu global de l'état de tous vos messages sortants."
        params={{ role: "sender" }}
      />
    </AppLayout>
  );
}
