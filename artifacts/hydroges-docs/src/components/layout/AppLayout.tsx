import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { User, LogOut } from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden" style={{ background: "#c5c8e8" }}>
      {/* Top Header */}
      <header
        className="flex items-center justify-between px-6 py-2.5 shrink-0 z-20"
        style={{ background: "white", borderBottom: "2px solid #dde0f0" }}
      >
        {/* Left: Logo + Brand */}
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="HYDROGES" className="w-11 h-11 object-contain" />
          <span
            className="text-2xl font-black tracking-widest"
            style={{ color: "#1e1b6b", letterSpacing: "0.12em" }}
          >
            HYDROGES
          </span>
        </div>

        {/* Right: User info + Logout */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="text-right leading-tight">
              <p className="font-bold text-base" style={{ color: "#1e1b6b" }}>{user?.name}</p>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#7b72b0" }}>
                {user?.role}
              </p>
            </div>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "#e8eaf6" }}
            >
              <User className="w-6 h-6" style={{ color: "#5b4d90" }} />
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title="Se déconnecter"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
            style={{ color: "#7b72b0", border: "1.5px solid #dde0f0" }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "#f0eef8";
              (e.currentTarget as HTMLButtonElement).style.color = "#1e1b6b";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "#7b72b0";
            }}
          >
            <LogOut className="w-4 h-4" />
            <span>Déconnexion</span>
          </button>
        </div>
      </header>

      {/* Body: sidebar + content */}
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
