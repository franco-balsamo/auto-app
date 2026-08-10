import { View, Text, Pressable, Alert, ScrollView, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { useDocuments } from '@/hooks/useDocuments';
import DateField from '@/components/DateField';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@/navigation/RootNavigator';
import type { DocumentType } from '@/types/database';

type Props = NativeStackScreenProps<HomeStackParamList, 'EditDocument'>;

const TYPES: DocumentType[] = ['cedula', 'seguro', 'vtv', 'licencia', 'otro'];
const TYPE_LABELS: Record<DocumentType, string> = {
  cedula: 'Cédula', seguro: 'Seguro', vtv: 'VTV', licencia: 'Licencia', otro: 'Otro',
};

export default function EditDocumentScreen({ route, navigation }: Props) {
  const { vehicleId, documentId } = route.params;
  const { documents, updateDocument, deleteDocument } = useDocuments(vehicleId);
  const document = documents.find((d) => d.id === documentId);

  const [type, setType] = useState<DocumentType>('cedula');
  const [expirationDate, setExpirationDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!document) return;
    setType(document.type);
    setExpirationDate(document.expiration_date ?? '');
  }, [document]);

  async function handleSave() {
    setSaving(true);
    const { error } = await updateDocument(documentId, {
      type,
      expiration_date: expirationDate || null,
    });
    setSaving(false);
    if (error) {
      setError(error);
      return;
    }
    navigation.goBack();
  }

  function handleDelete() {
    Alert.alert('Borrar documento', 'No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          const { error } = await deleteDocument(documentId);
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

      <Pressable style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveBtnText}>{saving ? 'Guardando...' : 'Guardar cambios'}</Text>
      </Pressable>

      <Pressable style={[styles.deleteBtn, deleting && styles.saveBtnDisabled]} onPress={handleDelete} disabled={deleting}>
        <Text style={styles.deleteBtnText}>{deleting ? 'Borrando...' : 'Borrar documento'}</Text>
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
  deleteBtn: { backgroundColor: '#F4D9D3', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 12 },
  deleteBtnText: { color: '#B44B3E', fontWeight: '700', textTransform: 'uppercase', fontSize: 13 },
  errorBox: { backgroundColor: '#F4D9D3', borderRadius: 8, padding: 10, marginBottom: 8 },
  errorText: { color: '#B44B3E', fontSize: 12, fontWeight: '600' },
});
