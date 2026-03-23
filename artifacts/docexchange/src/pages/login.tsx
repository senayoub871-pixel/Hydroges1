import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useLogin } from "@workspace/api-client-react";
import { Building2, IdCard, Lock, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { useQueryClient } from "@tanstack/react-query";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useLogin();
  const { setUser } = useAuth();
  const queryClient = useQueryClient();

  const [companyNetwork] = useState("DEFAULT");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await loginMutation.mutateAsync({
        data: { companyNetwork, username, password }
      });
      setUser(result.user);
      await queryClient.invalidateQueries();
      setLocation("/");
    } catch (err) {
      toast({
        title: "Erreur de connexion",
        description: "Veuillez vérifier vos identifiants.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen w-full flex relative overflow-hidden bg-background">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={`${import.meta.env.BASE_URL}images/auth-bg.png`} 
          alt="Background" 
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px]"></div>
      </div>

      <div className="relative z-10 w-full flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          
          <div className="flex flex-col items-center mb-10">
            <div className="w-32 h-32 mb-6 drop-shadow-xl">
              <img 
                src={`${import.meta.env.BASE_URL}images/logo.png`} 
                alt="HYDROGES Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-4xl font-display font-extrabold text-primary tracking-wider">
              HYDROGES
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative flex items-center group">
              <div className="absolute left-0 top-0 bottom-0 w-16 bg-primary text-primary-foreground flex items-center justify-center rounded-l-2xl z-10 shadow-md">
                <Building2 className="w-6 h-6" />
              </div>
              <input 
                type="text" 
                readOnly
                value={companyNetwork}
                className="w-full h-14 pl-20 pr-4 rounded-2xl bg-muted border-2 border-border text-muted-foreground font-medium cursor-not-allowed shadow-sm"
              />
            </div>

            <div className="relative flex items-center group">
              <div className="absolute left-0 top-0 bottom-0 w-16 bg-primary text-primary-foreground flex items-center justify-center rounded-l-2xl z-10 shadow-md">
                <IdCard className="w-6 h-6" />
              </div>
              <input 
                type="text" 
                placeholder="ID d'utilisateur" 
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full h-14 pl-20 pr-4 rounded-2xl bg-card border-2 border-border text-foreground font-medium placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm group-hover:shadow-md"
              />
            </div>

            <div className="relative flex items-center group">
              <div className="absolute left-0 top-0 bottom-0 w-16 bg-primary text-primary-foreground flex items-center justify-center rounded-l-2xl z-10 shadow-md">
                <Lock className="w-6 h-6" />
              </div>
              <input 
                type="password" 
                placeholder="Saisissez votre mot de passe" 
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full h-14 pl-20 pr-4 rounded-2xl bg-card border-2 border-border text-foreground font-medium placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm group-hover:shadow-md"
              />
            </div>

            <div className="text-center pt-2">
              <span className="text-muted-foreground text-sm font-medium">
                vous n'avez pas un compte ?{" "}
              </span>
              <button 
                type="button"
                onClick={() => setLocation("/register")}
                className="text-primary font-bold hover:underline decoration-2 underline-offset-4"
              >
                CRÉEZ UN COMPTE
              </button>
            </div>

            <div className="pt-4 flex justify-center">
              <Button 
                type="submit" 
                size="lg" 
                disabled={loginMutation.isPending}
                className="px-10 rounded-full text-lg shadow-xl shadow-primary/20"
              >
                CONNEXION <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
