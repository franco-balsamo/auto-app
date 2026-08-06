import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Linking } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ session: null, loading: true });

// El magic link (autoapp://login-callback#access_token=...&refresh_token=...
// o ...?code=...) vuelve con los datos de sesión en la query o en el
// fragment — los juntamos en un solo mapa para no depender de cuál usa
// Supabase.
async function handleAuthDeepLink(url: string | null) {
  if (!url) return;
  const params = new URLSearchParams(url.split(/[?#]/).slice(1).join('&'));
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (accessToken && refreshToken) {
    await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  } else if (params.get('code')) {
    await supabase.auth.exchangeCodeForSession(params.get('code')!);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    Linking.getInitialURL().then(handleAuthDeepLink);
    const urlSubscription = Linking.addEventListener('url', ({ url }) => handleAuthDeepLink(url));

    return () => {
      listener.subscription.unsubscribe();
      urlSubscription.remove();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
