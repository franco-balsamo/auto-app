import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSendLink() {
    if (!email.includes('@')) {
      setError('Ingresá un email válido');
      return;
    }
    setSending(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Linking.createURL resuelve solo según el entorno: exp://ip:puerto/--/login-callback
        // en Expo Go / dev client, autoapp://login-callback en build nativo standalone.
        emailRedirectTo: Linking.createURL('login-callback'),
      },
    });

    setSending(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  async function handleVerifyCode() {
    if (code.trim().length < 6) {
      setError('Ingresá el código del mail');
      return;
    }
    setVerifying(true);
    setError(null);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: 'email',
    });

    setVerifying(false);
    if (error) setError(error.message);
  }

  if (sent) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Revisá tu email</Text>
        <Text style={styles.hint}>
          Te mandamos un link y un código a {email}. Abrí el link desde el celular, o si no anda,
          ingresá el código acá abajo.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="código del mail"
          keyboardType="number-pad"
          value={code}
          onChangeText={setCode}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable style={styles.btn} onPress={handleVerifyCode} disabled={verifying}>
          {verifying ? <ActivityIndicator color="#EDE7DA" /> : <Text style={styles.btnText}>Confirmar código</Text>}
        </Pressable>

        <Pressable onPress={() => setSent(false)}>
          <Text style={styles.link}>Usar otro email</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Mi auto</Text>
      <Text style={styles.title}>Iniciá sesión</Text>
      <Text style={styles.hint}>Te mandamos un link mágico, sin contraseña.</Text>

      <TextInput
        style={styles.input}
        placeholder="tu@email.com"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.btn} onPress={handleSendLink} disabled={sending}>
        {sending ? <ActivityIndicator color="#EDE7DA" /> : <Text style={styles.btnText}>Enviar link</Text>}
      </Pressable>

      <Pressable onPress={() => setSent(true)}>
        <Text style={styles.link}>Ya tengo un código</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#EDE7DA' },
  eyebrow: { fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: '#5B6B73' },
  title: { fontSize: 24, fontWeight: '700', color: '#23262B', marginTop: 4, marginBottom: 8 },
  hint: { fontSize: 13, color: '#5B6B73', marginBottom: 20 },
  input: { backgroundColor: '#FBF9F4', borderWidth: 1, borderColor: '#DCD5C4', borderRadius: 8, padding: 14, fontSize: 14, marginBottom: 12 },
  error: { color: '#B44B3E', fontSize: 12, marginBottom: 12 },
  btn: { backgroundColor: '#23262B', borderRadius: 8, padding: 14, alignItems: 'center' },
  btnText: { color: '#EDE7DA', fontWeight: '700', textTransform: 'uppercase', fontSize: 13 },
  link: { color: '#23262B', textDecorationLine: 'underline', marginTop: 16, textAlign: 'center' },
});
