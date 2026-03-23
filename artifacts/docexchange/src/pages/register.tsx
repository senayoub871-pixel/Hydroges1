import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useRegister, useUploadSignature } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Upload } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useQueryClient } from "@tanstack/react-query";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const registerMutation = useRegister();
  const uploadSignatureMutation = useUploadSignature();
  const { setUser } = useAuth();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    poste: "",
    service: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    companyNetwork: "",
  });
  
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSignatureFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      toast({ title: "Attention", description: "Vous devez accepter les conditions générales.", variant: "destructive" });
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Attention", description: "Les mots de passe ne correspondent pas.", variant: "destructive" });
      return;
    }

    try {
      let signatureUrl = null;
      if (signatureFile) {
        const uploadRes = await uploadSignatureMutation.mutateAsync({ data: { file: signatureFile } });
        signatureUrl = uploadRes.url;
      }

      const result = await registerMutation.mutateAsync({
        data: {
          companyNetwork: formData.companyNetwork,
          firstName: formData.prenom,
          lastName: formData.nom,
          jobTitle: formData.poste,
          department: formData.service,
          email: formData.email,
          username: formData.username,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          signatureUrl
        }
      });
      
      toast({ title: "Succès", description: "Compte créé avec succès!" });
      setUser(result.user);
      await queryClient.invalidateQueries();
      setLocation("/");
    } catch (err) {
      toast({ title: "Erreur", description: "Impossible de créer le compte.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen w-full flex relative overflow-hidden bg-background py-10 px-4">
      <div className="absolute inset-0 z-0">
        <img 
          src={`${import.meta.env.BASE_URL}images/auth-bg.png`} 
          alt="Background" 
          className="w-full h-full object-cover opacity-30"
        />
      </div>

      <div className="relative z-10 w-full max-w-3xl mx-auto flex flex-col">
        <div className="flex items-center gap-4 bg-card/80 backdrop-blur-md px-6 py-4 rounded-3xl border border-border shadow-sm mb-8 inline-flex self-start">
          <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center p-1">
             <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="w-full h-full object-contain"/>
          </div>
          <h1 className="text-xl font-display font-bold text-primary">ENREGISTRER UN COMPTE</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-secondary/40 backdrop-blur-md p-8 rounded-[2rem] border border-border/50 shadow-xl space-y-5">
          
          <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-4 items-center">
            <label className="font-bold text-primary md:text-right">Réseau Ent.</label>
            <input name="companyNetwork" required value={formData.companyNetwork} onChange={handleChange} className="h-12 px-4 rounded-xl bg-card border border-border focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Numéro de réseau" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-4 items-center">
            <label className="font-bold text-primary md:text-right">Nom</label>
            <input name="nom" required value={formData.nom} onChange={handleChange} className="h-12 px-4 rounded-xl bg-card border border-border focus:ring-2 focus:ring-primary/20 outline-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-4 items-center">
            <label className="font-bold text-primary md:text-right">Prénom</label>
            <input name="prenom" required value={formData.prenom} onChange={handleChange} className="h-12 px-4 rounded-xl bg-card border border-border focus:ring-2 focus:ring-primary/20 outline-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-4 items-center">
            <label className="font-bold text-primary md:text-right">Poste</label>
            <input name="poste" required value={formData.poste} onChange={handleChange} className="h-12 px-4 rounded-xl bg-card border border-border focus:ring-2 focus:ring-primary/20 outline-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-4 items-center">
            <label className="font-bold text-primary md:text-right">Service</label>
            <input name="service" required value={formData.service} onChange={handleChange} className="h-12 px-4 rounded-xl bg-card border border-border focus:ring-2 focus:ring-primary/20 outline-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-4 items-center">
            <label className="font-bold text-primary md:text-right">Email</label>
            <input type="email" name="email" required value={formData.email} onChange={handleChange} className="h-12 px-4 rounded-xl bg-card border border-border focus:ring-2 focus:ring-primary/20 outline-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-4 items-center pt-4">
            <label className="font-bold text-primary md:text-right">Nom d'utilisateur</label>
            <input name="username" required value={formData.username} onChange={handleChange} className="h-12 px-4 rounded-xl bg-card border border-border focus:ring-2 focus:ring-primary/20 outline-none w-full md:w-2/3" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-4 items-center">
            <label className="font-bold text-primary md:text-right">Mot de passe</label>
            <input type="password" name="password" required value={formData.password} onChange={handleChange} className="h-12 px-4 rounded-xl bg-card border border-border focus:ring-2 focus:ring-primary/20 outline-none w-full md:w-2/3" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-center">
            <label className="font-bold text-primary md:text-right">Confirmer le mot de passe</label>
            <input type="password" name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} className="h-12 px-4 rounded-xl bg-card border border-border focus:ring-2 focus:ring-primary/20 outline-none w-full md:w-2/3" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-4 items-center pt-2">
            <label className="font-bold text-primary md:text-right">Votre signature</label>
            <div className="flex items-center gap-4">
              <input type="file" id="sig-upload" className="hidden" onChange={handleSignatureChange} accept="image/*" />
              <label htmlFor="sig-upload" className="inline-flex items-center justify-center px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl cursor-pointer hover:bg-primary/90 transition-colors shadow-md">
                Joindre +
              </label>
              {signatureFile && <span className="text-sm font-medium text-muted-foreground">{signatureFile.name}</span>}
            </div>
          </div>

          <div className="pt-6">
            <label className="flex items-center gap-3 cursor-pointer group w-fit">
              <div className="relative flex items-center justify-center w-6 h-6 rounded border-2 border-primary/50 group-hover:border-primary transition-colors bg-card">
                <input 
                  type="checkbox" 
                  className="peer sr-only"
                  checked={acceptedTerms}
                  onChange={e => setAcceptedTerms(e.target.checked)}
                />
                <div className="w-3 h-3 bg-primary rounded-sm opacity-0 peer-checked:opacity-100 transition-opacity" />
              </div>
              <span className="text-sm font-medium text-foreground">
                Pour terminer votre inscription, vous devez lire et accepter nos <a href="#" className="underline font-bold text-primary">conditions générales</a>
              </span>
            </label>
          </div>

          <div className="pt-8 flex justify-center pb-4">
            <Button type="submit" size="lg" disabled={registerMutation.isPending || uploadSignatureMutation.isPending} className="px-12 rounded-full text-lg shadow-xl shadow-primary/20">
              INSCRIPTION <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
          
          <div className="text-center pt-4 border-t border-border/50">
             <span className="text-muted-foreground text-sm font-medium">Déjà un compte ? </span>
             <button type="button" onClick={() => setLocation("/login")} className="text-primary font-bold hover:underline">Connectez-vous</button>
          </div>

        </form>
      </div>
    </div>
  );
}
