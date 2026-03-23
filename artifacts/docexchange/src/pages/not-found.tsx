import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="text-center max-w-md p-8 bg-card rounded-3xl border border-border shadow-xl">
        <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-display font-bold text-foreground mb-4">404</h1>
        <p className="text-lg text-muted-foreground mb-8">La page que vous recherchez n'existe pas.</p>
        <Button asChild size="lg" className="w-full">
          <Link href="/">
            Retour à l'accueil
          </Link>
        </Button>
      </div>
    </div>
  );
}
