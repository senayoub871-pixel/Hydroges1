import { useState } from "react";
import { useAppDocuments, type AppDocumentParams } from "@/hooks/use-app-data";
import { formatFrenchDate, cn, getStatusColor, getStatusLabel } from "@/lib/utils";
import { DocumentViewer } from "./DocumentViewer";
import { FileText, Search, Clock, ArrowRight } from "lucide-react";
import type { Document } from "@workspace/api-client-react";

interface DocumentPageTemplateProps {
  title: string;
  description?: string;
  params?: AppDocumentParams;
  cardActions?: (doc: Document) => React.ReactNode;
  onDocumentSend?: (doc: Document) => void;
}

function StatusBadge({ status, inverted }: { status: string; inverted?: boolean }) {
  const label = getStatusLabel(status);
  const colorClass = getStatusColor(status);
  if (inverted) {
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/30 bg-white/20 text-white">
        {label}
      </span>
    );
  }
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border", colorClass)}>
      {label}
    </span>
  );
}

export function DocumentPageTemplate({ title, description, params, cardActions, onDocumentSend }: DocumentPageTemplateProps) {
  const { data: documents, isLoading } = useAppDocuments(params);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  let displayDocs = documents || [];
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    displayDocs = displayDocs.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.senderName.toLowerCase().includes(q) ||
        d.recipientName.toLowerCase().includes(q)
    );
  }

  const selectedDoc = displayDocs.find((d) => d.id === selectedDocId) ?? null;

  return (
    <div className="flex h-full w-full">
      <div
        className="flex flex-col h-full shrink-0 transition-all duration-300"
        style={{
          width: selectedDoc ? "34%" : "100%",
          borderRight: selectedDoc ? "2px solid #dde0f0" : "none",
        }}
      >
        <div
          className="px-6 py-5 shrink-0"
          style={{ borderBottom: "1.5px solid #dde0f0", background: "rgba(255,255,255,0.55)" }}
        >
          <h2 className="text-xl font-black mb-0.5" style={{ color: "#1e1b6b" }}>
            {title}
          </h2>
          {description && (
            <p className="text-sm" style={{ color: "#7b72b0" }}>
              {description}
            </p>
          )}
        </div>

        <div className="px-5 py-3 shrink-0" style={{ background: "rgba(255,255,255,0.35)" }}>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: "#9090b0" }}
            />
            <input
              type="text"
              placeholder="Rechercher…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none"
              style={{ background: "white", color: "#1e1b6b", border: "1.5px solid #dde0f0" }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-2xl animate-pulse"
                style={{ background: "rgba(255,255,255,0.6)" }}
              />
            ))
          ) : displayDocs.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-20 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.45)", border: "2px dashed #dde0f0" }}
            >
              <FileText className="w-12 h-12 mb-3 opacity-25" style={{ color: "#5b4d90" }} />
              <p className="font-semibold" style={{ color: "#5b4d90" }}>
                Aucun document
              </p>
              <p className="text-sm mt-1" style={{ color: "#9090b0" }}>
                La liste est vide pour le moment.
              </p>
            </div>
          ) : (
            displayDocs.map((doc) => {
              const isActive = selectedDocId === doc.id;
              return (
                <div
                  key={doc.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedDocId(isActive ? null : doc.id)}
                  onKeyDown={(e) => e.key === "Enter" && setSelectedDocId(isActive ? null : doc.id)}
                  className="w-full text-left rounded-2xl transition-all duration-200 cursor-pointer"
                  style={{
                    background: isActive
                      ? "linear-gradient(135deg, #5b4d90, #7b65b0)"
                      : "white",
                    boxShadow: isActive
                      ? "0 4px 14px rgba(91,77,144,0.25)"
                      : "0 1px 4px rgba(30,27,107,0.07)",
                    padding: "0.9rem 1rem",
                    border: isActive ? "none" : "1.5px solid #eceef8",
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span
                      className="font-bold text-sm leading-snug truncate"
                      style={{ color: isActive ? "white" : "#1e1b6b" }}
                    >
                      {doc.title}
                    </span>
                    <StatusBadge status={doc.status} inverted={isActive} />
                  </div>

                  <div className="flex items-center gap-1.5 text-xs mb-2">
                    <span style={{ color: isActive ? "rgba(255,255,255,0.75)" : "#7b72b0" }}>
                      {doc.senderName}
                    </span>
                    <ArrowRight
                      className="w-3 h-3 shrink-0"
                      style={{ color: isActive ? "rgba(255,255,255,0.5)" : "#c5b8e8" }}
                    />
                    <span style={{ color: isActive ? "rgba(255,255,255,0.75)" : "#7b72b0" }}>
                      {doc.recipientName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: isActive ? "rgba(255,255,255,0.55)" : "#9090b0" }}>
                      {formatFrenchDate(doc.createdAt)}
                    </span>
                    {doc.scheduledAt && (
                      <span
                        className="flex items-center gap-1"
                        style={{ color: isActive ? "rgba(255,255,255,0.65)" : "#7b72b0" }}
                      >
                        <Clock className="w-3 h-3" />
                        {new Date(doc.scheduledAt).toLocaleString("fr-FR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                    <span
                      className="uppercase text-[9px] font-bold px-1.5 py-0.5 rounded"
                      style={{
                        background: isActive ? "rgba(255,255,255,0.2)" : "#f0eef8",
                        color: isActive ? "white" : "#5b4d90",
                      }}
                    >
                      {doc.fileType?.split("/").pop()?.split("+").shift() || "doc"}
                    </span>
                  </div>

                  {cardActions && (
                    <div
                      className="mt-2 pt-2 flex justify-end"
                      style={{ borderTop: isActive ? "1px solid rgba(255,255,255,0.2)" : "1px solid #eceef8" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {cardActions(doc)}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {selectedDoc && (
        <div className="flex-1 h-full p-4">
          <DocumentViewer
            document={selectedDoc}
            onClose={() => setSelectedDocId(null)}
            onSend={onDocumentSend ? () => { onDocumentSend(selectedDoc); setSelectedDocId(null); } : undefined}
          />
        </div>
      )}
    </div>
  );
}
