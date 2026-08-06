import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useVehicles } from '@/hooks/useVehicles';
import { trackEvent } from '@/lib/sentry';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<HomeStackParamList, 'AddVehicle'>;

export default function AddVehicleScreen({ navigation }: Props) {
  const { createVehicle } = useVehicles();
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [plate, setPlate] = useState('');
  const [currentKm, setCurrentKm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!brand.trim() || !model.trim() || !plate.trim()) {
      setError('Marca, modelo y patente son obligatorios');
      return;
    }
    setSaving(true);
    const { error } = await createVehicle({
      brand: brand.trim(),
      model: model.trim(),
      year: year ? Number(year) : null,
      plate: plate.trim().toUpperCase(),
      current_km: currentKm ? Number(currentKm) : 0,
    });
    setSaving(false);
    if (error) {
      setError(error);
      return;
    }
    trackEvent('vehicle_added');
    navigation.goBack();
  }

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Text style={styles.label}>Marca</Text>
      <TextInput style={styles.input} value={brand} onChangeText={setBrand} placeholder="Volkswagen" />

      <Text style={styles.label}>Modelo</Text>
      <TextInput style={styles.input} value={model} onChangeText={setModel} placeholder="Gol Trend" />

      <Text style={styles.label}>Año (opcional)</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={year} onChangeText={setYear} placeholder="2018" />

      <Text style={styles.label}>Patente</Text>
      <TextInput style={styles.input} autoCapitalize="characters" value={plate} onChangeText={setPlate} placeholder="AB123CD" />

      <Text style={styles.label}>Kilometraje actual (opcional)</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={currentKm} onChangeText={setCurrentKm} placeholder="84000" />

      <Pressable style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveBtnText}>{saving ? 'Guardando...' : 'Guardar vehículo'}</Text>
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
