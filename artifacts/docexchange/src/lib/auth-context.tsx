import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { useGetCurrentUser, UserProfile } from "@workspace/api-client-react";
import { useLocation } from "wouter";

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: UserProfile | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  setUser: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [localUser, setLocalUser] = useState<UserProfile | null>(null);

  const { data: fetchedUser, isLoading } = useGetCurrentUser({
    query: {
      queryKey: ["currentUser"],
      retry: false,
      refetchOnWindowFocus: false,
    },
  });

  const user = localUser ?? fetchedUser ?? null;
  const isAuthenticated = !!user;

  useEffect(() => {
    if (!isLoading && !isAuthenticated && location !== "/login" && location !== "/register") {
      setLocation("/login");
    }
  }, [isLoading, isAuthenticated, location, setLocation]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        setUser: setLocalUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
