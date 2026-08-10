import { View, Text, Pressable, Image, ScrollView, StyleSheet } from 'react-native';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useDocuments } from '@/hooks/useDocuments';
import DateField from '@/components/DateField';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@/navigation/RootNavigator';
import type { DocumentType } from '@/types/database';

type Props = NativeStackScreenProps<HomeStackParamList, 'UploadDocument'>;

const TYPES: DocumentType[] = ['cedula', 'seguro', 'vtv', 'licencia', 'otro'];
const TYPE_LABELS: Record<DocumentType, string> = {
  cedula: 'Cédula', seguro: 'Seguro', vtv: 'VTV', licencia: 'Licencia', otro: 'Otro',
};

export default function UploadDocumentScreen({ route, navigation }: Props) {
  const { vehicleId } = route.params;
  const { uploadDocument } = useDocuments(vehicleId);
  const [type, setType] = useState<DocumentType>('cedula');
  const [expirationDate, setExpirationDate] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Se necesita permiso para acceder a tus fotos');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  }

  async function handleSave() {
    if (!imageUri) {
      setError('Elegí una foto del documento');
      return;
    }
    setSaving(true);
    const { error } = await uploadDocument(type, imageUri, expirationDate || null);
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

      <Text style={styles.label}>Tipo de documento</Text>
      <View style={styles.chipRow}>
        {TYPES.map((t) => (
          <Pressable key={t} onPress={() => setType(t)} style={[styles.chip, type === t && styles.chipActive]}>
            <Text style={[styles.chipText, type === t && styles.chipTextActive]}>{TYPE_LABELS[t]}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Vencimiento (opcional)</Text>
      <DateField value={expirationDate} onChange={setExpirationDate} />

      <Text style={styles.label}>Foto</Text>
      <Pressable style={styles.pickBtn} onPress={pickImage}>
        <Text style={styles.pickBtnText}>{imageUri ? 'Cambiar foto' : 'Elegir foto'}</Text>
      </Pressable>
      {imageUri && <Image source={{ uri: imageUri }} style={styles.preview} />}

      <Pressable style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveBtnText}>{saving ? 'Subiendo...' : 'Subir documento'}</Text>
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
  pickBtn: { backgroundColor: '#E3DCCB', borderRadius: 8, padding: 12, alignItems: 'center' },
  pickBtnText: { color: '#23262B', fontWeight: '600', fontSize: 13 },
  preview: { width: '100%', height: 160, borderRadius: 8, marginTop: 10 },
  saveBtn: { backgroundColor: '#23262B', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 28 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#EDE7DA', fontWeight: '700', textTransform: 'uppercase', fontSize: 13 },
  errorBox: { backgroundColor: '#F4D9D3', borderRadius: 8, padding: 10, marginBottom: 8 },
  errorText: { color: '#B44B3E', fontSize: 12, fontWeight: '600' },
});
