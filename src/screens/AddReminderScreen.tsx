import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useReminders } from '@/hooks/useReminders';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<HomeStackParamList, 'AddReminder'>;

export default function AddReminderScreen({ route, navigation }: Props) {
  const { vehicleId } = route.params;
  const { createReminder } = useReminders(vehicleId);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueKm, setDueKm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!title.trim()) {
      setError('La descripción es obligatoria');
      return;
    }
    if (!dueDate && !dueKm) {
      setError('Indicá una fecha o un kilometraje objetivo');
      return;
    }
    setSaving(true);
    const { error } = await createReminder({
      title: title.trim(),
      due_date: dueDate || null,
      due_km: dueKm ? Number(dueKm) : null,
    });
    setSaving(false);
    if (error) {
      setError(error);
      return;
    }
    navigation.goBack();
  }

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Text style={styles.label}>Descripción</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Cambio de aceite" />

      <Text style={styles.label}>Fecha objetivo (AAAA-MM-DD, opcional)</Text>
      <TextInput style={styles.input} value={dueDate} onChangeText={setDueDate} placeholder="2026-12-01" />

      <Text style={styles.label}>Kilometraje objetivo (opcional)</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={dueKm} onChangeText={setDueKm} placeholder="95000" />

      <Pressable style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveBtnText}>{saving ? 'Guardando...' : 'Guardar recordatorio'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#EDE7DA' },
  label: { fontSize: 12, color: '#5B6B73', marginTop: 14, marginBottom: 6, textTransform: 'uppercase' },
  input: { backgroundColor: '#FBF9F4', borderWidth: 1, borderColor: '#DCD5C4', borderRadius: 8, padding: 12, fontSize: 14 },
  saveBtn: { backgroundColor: '#23262B', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 28 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#EDE7DA', fontWeight: '700', textTransform: 'uppercase', fontSize: 13 },
  errorBox: { backgroundColor: '#F4D9D3', borderRadius: 8, padding: 10, marginBottom: 8 },
  errorText: { color: '#B44B3E', fontSize: 12, fontWeight: '600' },
});
