import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import DateField from '@/components/DateField';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@/navigation/RootNavigator';
import type { ExpenseCategory } from '@/types/database';

type Props = NativeStackScreenProps<HomeStackParamList, 'AddExpense'>;

const CATEGORIES: ExpenseCategory[] = ['service', 'nafta', 'seguro', 'patente', 'lavado', 'gomas', 'otro'];

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function AddExpenseScreen({ route, navigation }: Props) {
  const { vehicleId } = route.params;
  const [category, setCategory] = useState<ExpenseCategory>('service');
  const [amount, setAmount] = useState('');
  const [odometerKm, setOdometerKm] = useState('');
  const [expenseDate, setExpenseDate] = useState(today());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase.from('expenses').insert({
      vehicle_id: vehicleId,
      category,
      amount: Number(amount),
      odometer_km: odometerKm ? Number(odometerKm) : null,
      expense_date: expenseDate,
    });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    navigation.goBack();
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
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

      <Text style={styles.label}>Fecha</Text>
      <DateField value={expenseDate} onChange={setExpenseDate} required />

      {/* TODO: foto de factura con expo-image-picker + OCR (fase 2) */}

      <Pressable style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveBtnText}>{saving ? 'Guardando...' : 'Guardar gasto'}</Text>
      </Pressable>
    </ScrollView>
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
  errorBox: { backgroundColor: '#F4D9D3', borderRadius: 8, padding: 10, marginBottom: 8 },
  errorText: { color: '#B44B3E', fontSize: 12, fontWeight: '600' },
});
