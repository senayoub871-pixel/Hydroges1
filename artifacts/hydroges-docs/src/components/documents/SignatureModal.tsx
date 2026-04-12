import { useState, useRef } from "react";
import { useAppSignDocument } from "@/hooks/use-app-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import SignatureCanvas from "react-signature-canvas";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface SignatureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: number;
  coordinates: { x: number, y: number } | null;
}

export function SignatureModal({ open, onOpenChange, documentId, coordinates }: SignatureModalProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const signMutation = useAppSignDocument();
  const { toast } = useToast();
  
  const handleClear = () => {
    sigCanvas.current?.clear();
  };

  const handleSave = async () => {
    if (sigCanvas.current?.isEmpty()) {
      toast({
        title: "Signature vide",
        description: "Veuillez dessiner votre signature avant de valider.",
        variant: "destructive"
      });
      return;
    }

    if (!coordinates) return;

    const signatureData = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
    
    if (signatureData) {
      try {
        await signMutation.mutateAsync({
          id: documentId,
          data: {
            signatureData,
            signatureX: coordinates.x,
            signatureY: coordinates.y
          }
        });
        
        toast({
          title: "Document signé avec succès",
          description: "La signature a été apposée sur le document.",
        });
        onOpenChange(false);
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de signer le document.",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Signer le document</DialogTitle>
          <DialogDescription>
            Dessinez votre signature dans le cadre ci-dessous. Elle sera placée à l'endroit sélectionné.
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-4 p-2 bg-gray-50 border-2 border-dashed border-border rounded-xl">
          <SignatureCanvas 
            ref={sigCanvas}
            penColor="#1a3a6b"
            canvasProps={{
              className: "w-full h-48 bg-transparent cursor-crosshair rounded-lg"
            }}
          />
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="outline" onClick={handleClear} type="button">
            Effacer
          </Button>
          <div className="flex space-x-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={signMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {signMutation.isPending ? "Signature..." : "Valider la signature"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
