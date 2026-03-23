import { useAuth } from "@/lib/auth-context";
import { UserCircle, LogOut } from "lucide-react";
import { useLogout } from "@workspace/api-client-react";
import { useLocation } from "wouter";

export function Header() {
  const { user } = useAuth();
  const logout = useLogout();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => setLocation("/login")
    });
  };

  return (
    <header className="h-20 bg-card border-b border-border/50 shadow-sm flex items-center justify-between px-6 lg:px-10 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12">
          <img 
            src={`${import.meta.env.BASE_URL}images/logo.png`} 
            alt="HYDROGES Logo" 
            className="w-full h-full object-contain drop-shadow-sm"
          />
        </div>
        <h1 className="text-2xl font-display font-bold text-primary tracking-wide">
          HYDROGES
        </h1>
      </div>

      {user && (
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="font-semibold text-primary">
              {user.lastName} {user.firstName}
            </span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {user.jobTitle}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
              <UserCircle className="w-7 h-7" />
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
              title="Déconnexion"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
