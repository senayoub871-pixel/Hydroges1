import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DocumentViewerProps {
  fileUrl: string;
  fileName?: string | null;
  className?: string;
  height?: string;
}

function getFileExtension(url: string, fileName?: string | null): string {
  const name = fileName || url;
  return name.split(".").pop()?.toLowerCase() || "";
}

export function DocumentViewer({ fileUrl, fileName, className = "", height = "h-96" }: DocumentViewerProps) {
  const ext = getFileExtension(fileUrl, fileName);
  const isImage = ["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(ext);
  const isPdf = ext === "pdf";

  if (isImage) {
    return (
      <div className={`w-full ${height} flex items-center justify-center bg-muted/10 overflow-hidden ${className}`}>
        <img
          src={fileUrl}
          alt={fileName || "Document"}
          className="max-w-full max-h-full object-contain"
        />
      </div>
    );
  }

  if (isPdf) {
    return (
      <div className={`w-full ${height} ${className}`}>
        <iframe
          src={fileUrl}
          title={fileName || "Document PDF"}
          className="w-full h-full border-0"
        />
      </div>
    );
  }

  return (
    <div className={`w-full ${height} flex flex-col items-center justify-center gap-4 bg-muted/10 ${className}`}>
      <FileText className="w-14 h-14 text-primary/30" />
      <p className="text-sm font-medium text-muted-foreground">{fileName || "Document joint"}</p>
      <Button variant="outline" size="sm" asChild>
        <a href={fileUrl} target="_blank" rel="noopener noreferrer">
          <Download className="w-4 h-4 mr-2" /> Télécharger
        </a>
      </Button>
    </div>
  );
}
