import { useState } from 'react';
import { View, Text, Pressable, Linking, StyleSheet } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

// TODO: reemplazar por las URLs reales una vez publicados
// docs/legal/privacy.md y terms.md fuera del repo (ver docs/legal/).
const PRIVACY_URL = 'https://autoapp.com.ar/privacidad';
const TERMS_URL = 'https://autoapp.com.ar/terminos';

export default function ProfileScreen() {
  const { session } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    setError(null);
    const { error } = await supabase.auth.signOut();
    setSigningOut(false);
    if (error) setError(error.message);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil</Text>
      <Text style={styles.hint}>{session?.user.email}</Text>

      <Pressable onPress={() => Linking.openURL(PRIVACY_URL)}>
        <Text style={styles.link}>Política de privacidad</Text>
      </Pressable>
      <Pressable onPress={() => Linking.openURL(TERMS_URL)}>
        <Text style={styles.link}>Términos de servicio</Text>
      </Pressable>

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={[styles.btn, signingOut && styles.btnDisabled]} onPress={handleSignOut} disabled={signingOut}>
        <Text style={styles.btnText}>{signingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#EDE7DA' },
  title: { fontSize: 18, fontWeight: '700', color: '#23262B' },
  hint: { fontSize: 13, color: '#5B6B73', marginTop: 8 },
  link: { fontSize: 13, color: '#23262B', textDecorationLine: 'underline', marginTop: 12 },
  btn: { marginTop: 24, backgroundColor: '#B44B3E', borderRadius: 8, padding: 14, alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#FBF9F4', fontWeight: '700', textTransform: 'uppercase', fontSize: 13 },
  error: { color: '#B44B3E', fontSize: 12, marginTop: 12 },
});
