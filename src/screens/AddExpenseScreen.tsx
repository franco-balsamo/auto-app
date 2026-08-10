import { View, Text, TextInput, Pressable, Image, ScrollView, StyleSheet } from 'react-native';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import DateField from '@/components/DateField';
import { useExpenses } from '@/hooks/useExpenses';
import { isOcrEnabled, scanReceipt } from '@/lib/ocr';
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
  const { createExpense } = useExpenses(vehicleId);
  const [category, setCategory] = useState<ExpenseCategory>('service');
  const [amount, setAmount] = useState('');
  const [odometerKm, setOdometerKm] = useState('');
  const [expenseDate, setExpenseDate] = useState(today());
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function pickReceipt() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Se necesita permiso para usar la cámara');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.5, base64: isOcrEnabled() });
    if (result.canceled) return;

    const asset = result.assets[0];
    setPhotoUri(asset.uri);
    setError(null);

    if (isOcrEnabled() && asset.base64) {
      setScanning(true);
      try {
        const scan = await scanReceipt(asset.base64);
        if (scan.amount != null) setAmount(String(scan.amount));
        if (scan.date != null) setExpenseDate(scan.date);
      } catch {
        setError('No se pudo leer la factura, completá los datos a mano');
      } finally {
        setScanning(false);
      }
    }
  }

  async function handleSave() {
    setSaving(true);
    const { error } = await createExpense(
      {
        category,
        amount: Number(amount),
        odometer_km: odometerKm ? Number(odometerKm) : null,
        note: null,
        expense_date: expenseDate,
      },
      photoUri
    );
    setSaving(false);
    if (error) {
      setError(error);
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

      <Text style={styles.label}>Foto de factura (opcional)</Text>
      {photoUri && <Image source={{ uri: photoUri }} style={styles.preview} />}
      <Pressable style={styles.photoBtn} onPress={pickReceipt} disabled={scanning}>
        <Text style={styles.photoBtnText}>
          {scanning
            ? 'Leyendo factura...'
            : photoUri
              ? 'Sacar otra foto'
              : isOcrEnabled()
                ? 'Sacar foto y autocompletar'
                : 'Sacar foto'}
        </Text>
      </Pressable>

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
  preview: { width: '100%', height: 160, borderRadius: 8, marginBottom: 8 },
  photoBtn: { backgroundColor: '#E3DCCB', borderRadius: 8, padding: 12, alignItems: 'center' },
  photoBtnText: { color: '#23262B', fontWeight: '700', fontSize: 12, textTransform: 'uppercase' },
  saveBtn: { backgroundColor: '#23262B', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 28 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#EDE7DA', fontWeight: '700', textTransform: 'uppercase', fontSize: 13 },
  errorBox: { backgroundColor: '#F4D9D3', borderRadius: 8, padding: 10, marginBottom: 8 },
  errorText: { color: '#B44B3E', fontSize: 12, fontWeight: '600' },
});
