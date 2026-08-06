import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@/navigation/RootNavigator';
import type { ExpenseCategory } from '@/types/database';

type Props = NativeStackScreenProps<HomeStackParamList, 'AddExpense'>;

const CATEGORIES: ExpenseCategory[] = ['service', 'nafta', 'seguro', 'patente', 'lavado', 'gomas', 'otro'];

export default function AddExpenseScreen({ route, navigation }: Props) {
  const { vehicleId } = route.params;
  const [category, setCategory] = useState<ExpenseCategory>('service');
  const [amount, setAmount] = useState('');
  const [odometerKm, setOdometerKm] = useState('');

  async function handleSave() {
    const { error } = await supabase.from('expenses').insert({
      vehicle_id: vehicleId,
      category,
      amount: Number(amount),
      odometer_km: odometerKm ? Number(odometerKm) : null,
    });
    if (!error) navigation.goBack();
  }

  return (
    <View style={styles.container}>
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

      {/* TODO: foto de factura con expo-image-picker + OCR (fase 2) */}

      <Pressable style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>Guardar gasto</Text>
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
  saveBtnText: { color: '#EDE7DA', fontWeight: '700', textTransform: 'uppercase', fontSize: 13 },
});
