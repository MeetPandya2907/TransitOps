import { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export type Role = 'Fleet Manager' | 'Driver' | 'Safety Officer' | 'Financial Analyst';

interface User {
  email: string;
  role: Role;
}

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  isLoading: boolean;
  login: (email: string, role: Role) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const supabase = createClient();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseUser(session?.user ?? null);
      if (session?.user) {
        // Hydrate role from metadata, fallback to local storage, fallback to default
        const metadataRole = session.user.user_metadata?.role as Role;
        const storedRole = localStorage.getItem('transitops_role') as Role;
        const finalRole = metadataRole || storedRole || 'Fleet Manager';
        
        // Ensure local storage is synced with real metadata
        if (metadataRole) localStorage.setItem('transitops_role', metadataRole);
        
        setUser({ email: session.user.email!, role: finalRole });
      }
      setIsLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseUser(session?.user ?? null);
      if (session?.user) {
        const metadataRole = session.user.user_metadata?.role as Role;
        const storedRole = localStorage.getItem('transitops_role') as Role;
        const finalRole = metadataRole || storedRole || 'Fleet Manager';
        
        if (metadataRole) localStorage.setItem('transitops_role', metadataRole);
        
        setUser({ email: session.user.email!, role: finalRole });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = (email: string, role: Role) => {
    localStorage.setItem('transitops_role', role);
    setUser({ email, role });
  };

  const logout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    localStorage.removeItem('transitops_role');
    setUser(null);
    setSupabaseUser(null);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, supabaseUser, isLoading, login, logout }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
