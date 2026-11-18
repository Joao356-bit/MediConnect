import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";

import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";

import { supabase } from "../lib/supabase";

type AuthContextData = {
  session: Session | null;
  user: User | null;
  loading: boolean;

  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;

  signUp: (
    fullName: string,
    email: string,
    password: string,
  ) => Promise<{
    error: string | null;
    needsEmailConfirmation: boolean;
  }>;

  signOut: () => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextData | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, newSession: Session | null) => {
        setSession(newSession);
        setLoading(false);
      },
    );

    async function loadSession() {
      try {
        const {
          data: { session: currentSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        setSession(currentSession);
      } catch (error) {
        console.error("Erro ao recuperar sessão:", error);
        setSession(null);
      } finally {
        setLoading(false);
      }
    }

    loadSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    return {
      error: error?.message ?? null,
    };
  }, []);

  const signUp = useCallback(
    async (fullName: string, email: string, password: string) => {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      return {
        error: error?.message ?? null,
        needsEmailConfirmation: !error && !data.session,
      };
    },
    [],
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    return {
      error: error?.message ?? null,
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth precisa ser utilizado dentro de AuthProvider.");
  }

  return context;
}
