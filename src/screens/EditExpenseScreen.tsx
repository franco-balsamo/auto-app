import { View, Text, TextInput, Pressable, Alert, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { useExpenses } from '@/hooks/useExpenses';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@/navigation/RootNavigator';
import type { ExpenseCategory } from '@/types/database';

type Props = NativeStackScreenProps<HomeStackParamList, 'EditExpense'>;

const CATEGORIES: ExpenseCategory[] = ['service', 'nafta', 'seguro', 'patente', 'lavado', 'gomas', 'otro'];

export default function EditExpenseScreen({ route, navigation }: Props) {
  const { vehicleId, expenseId } = route.params;
  const { expenses, updateExpense, deleteExpense } = useExpenses(vehicleId);
  const expense = expenses.find((e) => e.id === expenseId);

  const [category, setCategory] = useState<ExpenseCategory>('service');
  const [amount, setAmount] = useState('');
  const [odometerKm, setOdometerKm] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!expense) return;
    setCategory(expense.category);
    setAmount(String(expense.amount));
    setOdometerKm(expense.odometer_km ? String(expense.odometer_km) : '');
    setNote(expense.note ?? '');
  }, [expense]);

  async function handleSave() {
    setSaving(true);
    const { error } = await updateExpense(expenseId, {
      category,
      amount: Number(amount),
      odometer_km: odometerKm ? Number(odometerKm) : null,
      note: note.trim() || null,
    });
    setSaving(false);
    if (error) {
      setError(error);
      return;
    }
    navigation.goBack();
  }

  function handleDelete() {
    Alert.alert('Borrar gasto', 'No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          const { error } = await deleteExpense(expenseId);
          setDeleting(false);
          if (error) {
            setError(error);
            return;
          }
          navigation.goBack();
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Text style={styles.label}>Categoría</Text>
      <View style={styles.chipRow}>
        {CATEGORIES.map((c) => (
          <Pressable key={c} onPress={() => setCategory(c)} style={[styles.chip, category === c && styles.chipActive]}>
            <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Monto</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={amount} onChangeText={setAmount} placeholder="0" />

      <Text style={styles.label}>Kilometraje (opcional)</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={odometerKm} onChangeText={setOdometerKm} placeholder="84000" />

      <Text style={styles.label}>Nota (opcional)</Text>
      <TextInput style={styles.input} value={note} onChangeText={setNote} placeholder="Cambio de aceite" />

      <Pressable style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveBtnText}>{saving ? 'Guardando...' : 'Guardar cambios'}</Text>
      </Pressable>

      <Pressable style={[styles.deleteBtn, deleting && styles.saveBtnDisabled]} onPress={handleDelete} disabled={deleting}>
        <Text style={styles.deleteBtnText}>{deleting ? 'Borrando...' : 'Borrar gasto'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#EDE7DA' },
  label: { fontSize: 12, color: '#5B6B73', marginTop: 14, marginBottom: 6, textTransform: 'uppercase' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: '#E3DCCB' },
  chipActive: { backgroundColor: '#23262B' },
  chipText: { fontSize: 11, color: '#23262B' },
  chipTextActive: { color: '#EDE7DA' },
  input: { backgroundColor: '#FBF9F4', borderWidth: 1, borderColor: '#DCD5C4', borderRadius: 8, padding: 12, fontSize: 14 },
  saveBtn: { backgroundColor: '#23262B', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 28 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#EDE7DA', fontWeight: '700', textTransform: 'uppercase', fontSize: 13 },
  deleteBtn: { backgroundColor: '#F4D9D3', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 12 },
  deleteBtnText: { color: '#B44B3E', fontWeight: '700', textTransform: 'uppercase', fontSize: 13 },
  errorBox: { backgroundColor: '#F4D9D3', borderRadius: 8, padding: 10, marginBottom: 8 },
  errorText: { color: '#B44B3E', fontSize: 12, fontWeight: '600' },
});
