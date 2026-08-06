import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
  const { session } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil</Text>
      <Text style={styles.hint}>{session?.user.email}</Text>
      <Text style={styles.hint}>Suscripción y ajustes van acá (fase 3).</Text>

      <Pressable style={styles.btn} onPress={() => supabase.auth.signOut()}>
        <Text style={styles.btnText}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#EDE7DA' },
  title: { fontSize: 18, fontWeight: '700', color: '#23262B' },
  hint: { fontSize: 13, color: '#5B6B73', marginTop: 8 },
  btn: { marginTop: 24, backgroundColor: '#B44B3E', borderRadius: 8, padding: 14, alignItems: 'center' },
  btnText: { color: '#FBF9F4', fontWeight: '700', textTransform: 'uppercase', fontSize: 13 },
});
