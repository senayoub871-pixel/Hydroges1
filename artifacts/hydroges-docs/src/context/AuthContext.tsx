import { createContext, useContext, useState, ReactNode } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

export interface AuthUser {
  id: number;
  companyNumber: string;
  userId: string;
  name: string;
  role: string;
  department: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (
    companyNumber: string,
    userId: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string }>;
  register: (data: {
    nom: string;
    prenom: string;
    poste: string;
    service: string;
    email: string;
    userId: string;
    password: string;
    signatureImage?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function getStoredUser(): AuthUser | null {
  try {
    const stored = localStorage.getItem("hydroges_user");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

const storedToken = localStorage.getItem("hydroges_token");
if (storedToken) {
  setAuthTokenGetter(() => storedToken);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser);

  const login = async (
    companyNumber: string,
    loginId: string,
    password: string
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId, password, companyNumber }),
      });
      const body = await res.json();
      if (!res.ok) {
        return { ok: false, error: body.error || "Connexion échouée" };
      }
      const { token, user: apiUser } = body;
      const u: AuthUser = {
        id: apiUser.id,
        companyNumber: apiUser.companyNumber || companyNumber,
        userId: apiUser.loginId || loginId,
        name: apiUser.name,
        role: apiUser.role || "Employé",
        department: apiUser.department,
      };
      setUser(u);
      localStorage.setItem("hydroges_user", JSON.stringify(u));
      localStorage.setItem("hydroges_token", token);
      setAuthTokenGetter(() => token);
      return { ok: true };
    } catch {
      return { ok: false, error: "Erreur réseau. Vérifiez votre connexion." };
    }
  };

  const register = async (data: {
    nom: string;
    prenom: string;
    poste: string;
    service: string;
    email: string;
    userId: string;
    password: string;
    signatureImage?: string;
  }): Promise<{ ok: boolean; error?: string }> => {
    try {
      const name = `${data.prenom} ${data.nom}`.trim();
      const initials =
        `${data.prenom[0] ?? ""}${data.nom[0] ?? ""}`.toUpperCase();
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loginId: data.userId,
          password: data.password,
          name,
          email: data.email,
          department: data.service,
          role: data.poste || "Employé",
          companyNumber: "0125.6910.0681",
          avatarInitials: initials,
          signatureImage: data.signatureImage || null,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        return { ok: false, error: body.error || "Inscription échouée" };
      }
      const { token, user: apiUser } = body;
      const u: AuthUser = {
        id: apiUser.id,
        companyNumber: apiUser.companyNumber || "0125.6910.0681",
        userId: apiUser.loginId || data.userId,
        name: apiUser.name,
        role: apiUser.role || data.poste || "Employé",
        department: apiUser.department,
      };
      setUser(u);
      localStorage.setItem("hydroges_user", JSON.stringify(u));
      localStorage.setItem("hydroges_token", token);
      setAuthTokenGetter(() => token);
      return { ok: true };
    } catch {
      return { ok: false, error: "Erreur réseau. Vérifiez votre connexion." };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("hydroges_user");
    localStorage.removeItem("hydroges_token");
    setAuthTokenGetter(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
