import { useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@/navigation/RootNavigator';
import { useVehicle } from '@/hooks/useVehicle';
import { useExpenses } from '@/hooks/useExpenses';
import { useDocuments } from '@/hooks/useDocuments';
import { useReminders } from '@/hooks/useReminders';

type Props = NativeStackScreenProps<HomeStackParamList, 'VehicleDetail'>;

type Tab = 'historial' | 'documentos' | 'recordatorios';

const CATEGORY_LABELS: Record<string, string> = {
  service: 'Service', nafta: 'Nafta', seguro: 'Seguro', patente: 'Patente',
  lavado: 'Lavado', gomas: 'Gomas', otro: 'Otro',
};

const DOCUMENT_LABELS: Record<string, string> = {
  cedula: 'Cédula', seguro: 'Seguro', vtv: 'VTV', licencia: 'Licencia', otro: 'Otro',
};

function documentStatusColor(expirationDate: string | null) {
  if (!expirationDate) return '#5B6B73';
  const daysLeft = (new Date(expirationDate).getTime() - Date.now()) / 86_400_000;
  if (daysLeft < 0) return '#B44B3E';
  if (daysLeft <= 30) return '#D98E04';
  return '#3F6B4F';
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function VehicleDetailScreen({ route, navigation }: Props) {
  const { vehicleId } = route.params;
  const [tab, setTab] = useState<Tab>('historial');

  const { vehicle, error: vehicleError, refetch: refetchVehicle } = useVehicle(vehicleId);
  const { expenses, loading: loadingExpenses, error: expensesError, refetch: refetchExpenses } = useExpenses(vehicleId);
  const { documents, loading: loadingDocuments, error: documentsError, refetch: refetchDocuments } = useDocuments(vehicleId);
  const {
    reminders,
    loading: loadingReminders,
    error: remindersError,
    refetch: refetchReminders,
    markDone,
  } = useReminders(vehicleId);

  useFocusEffect(
    useCallback(() => {
      refetchVehicle();
      refetchExpenses();
      refetchDocuments();
      refetchReminders();
    }, [refetchVehicle, refetchExpenses, refetchDocuments, refetchReminders])
  );

  const tabError =
    vehicleError ??
    (tab === 'historial' ? expensesError : tab === 'documentos' ? documentsError : remindersError);

  return (
    <View style={styles.container}>
      {tabError && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{tabError}</Text>
        </View>
      )}
      {vehicle && (
        <Pressable style={styles.header} onPress={() => navigation.navigate('EditVehicle', { vehicleId })}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.brand}>{vehicle.brand} {vehicle.model}</Text>
              <Text style={styles.plate}>
                {vehicle.plate} · {vehicle.year ?? '—'} · {vehicle.current_km.toLocaleString('es-AR')} km
              </Text>
            </View>
            <Text style={styles.editLink}>Editar</Text>
          </View>
        </Pressable>
      )}

      <View style={styles.tabs}>
        {(['historial', 'documentos', 'recordatorios'] as Tab[]).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'historial' ? 'Historial' : t === 'documentos' ? 'Documentos' : 'Recordatorios'}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === 'historial' && (
        <FlatList
          data={expenses}
          keyExtractor={(e) => e.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Pressable style={styles.addBtn} onPress={() => navigation.navigate('AddExpense', { vehicleId })}>
              <Text style={styles.addBtnText}>+ Cargar gasto</Text>
            </Pressable>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => navigation.navigate('EditExpense', { vehicleId, expenseId: item.id })}>
              <Text style={styles.date}>{formatDate(item.expense_date)}</Text>
              <Text style={styles.itemTitle}>
                {CATEGORY_LABELS[item.category] ?? item.category}{item.note ? ` · ${item.note}` : ''}
              </Text>
              <Text style={styles.itemSub}>
                ${item.amount.toLocaleString('es-AR')}{item.odometer_km ? ` · ${item.odometer_km.toLocaleString('es-AR')} km` : ''}
              </Text>
            </Pressable>
          )}
          ListEmptyComponent={!loadingExpenses ? <Text style={styles.empty}>Sin gastos cargados todavía.</Text> : null}
        />
      )}

      {tab === 'documentos' && (
        <FlatList
          data={documents}
          keyExtractor={(d) => d.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Pressable style={styles.addBtn} onPress={() => navigation.navigate('UploadDocument', { vehicleId })}>
              <Text style={styles.addBtnText}>+ Subir documento</Text>
            </Pressable>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => navigation.navigate('EditDocument', { vehicleId, documentId: item.id })}>
              <View style={styles.docRow}>
                <View style={[styles.dot, { backgroundColor: documentStatusColor(item.expiration_date) }]} />
                <Text style={styles.itemTitle}>{DOCUMENT_LABELS[item.type] ?? item.type}</Text>
              </View>
              <Text style={styles.itemSub}>
                {item.expiration_date ? `Vence ${formatDate(item.expiration_date)}` : 'Sin vencimiento'}
              </Text>
            </Pressable>
          )}
          ListEmptyComponent={!loadingDocuments ? <Text style={styles.empty}>Sin documentos cargados todavía.</Text> : null}
        />
      )}

      {tab === 'recordatorios' && (
        <FlatList
          data={reminders}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Pressable style={styles.addBtn} onPress={() => navigation.navigate('AddReminder', { vehicleId })}>
              <Text style={styles.addBtnText}>+ Nuevo recordatorio</Text>
            </Pressable>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => navigation.navigate('EditReminder', { vehicleId, reminderId: item.id })}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemSub}>
                {item.due_date ? formatDate(item.due_date) : ''}
                {item.due_date && item.due_km ? ' · ' : ''}
                {item.due_km ? `${item.due_km.toLocaleString('es-AR')} km` : ''}
              </Text>
              {item.status === 'pending' && (
                <Pressable style={styles.doneBtn} onPress={() => markDone(item.id)}>
                  <Text style={styles.doneBtnText}>Marcar hecho</Text>
                </Pressable>
              )}
              {item.status === 'done' && <Text style={styles.doneLabel}>Hecho</Text>}
            </Pressable>
          )}
          ListEmptyComponent={!loadingReminders ? <Text style={styles.empty}>Sin recordatorios todavía.</Text> : null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDE7DA' },
  errorBox: { backgroundColor: '#F4D9D3', borderRadius: 8, padding: 10, margin: 16, marginBottom: 0 },
  errorText: { color: '#B44B3E', fontSize: 12, fontWeight: '600' },
  header: { padding: 16, paddingBottom: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  editLink: { fontSize: 12, color: '#D98E04', fontWeight: '700', textTransform: 'uppercase' },
  brand: { fontSize: 18, fontWeight: '700', color: '#23262B' },
  plate: { fontSize: 12, color: '#5B6B73', marginTop: 4 },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  tab: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  tabActive: { backgroundColor: '#23262B' },
  tabText: { fontSize: 13, color: '#5B6B73', fontWeight: '600' },
  tabTextActive: { color: '#FBF9F4' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  card: { backgroundColor: '#FBF9F4', borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#DCD5C4' },
  date: { fontSize: 11, color: '#5B6B73', marginBottom: 2 },
  itemTitle: { fontSize: 14, fontWeight: '700', color: '#23262B' },
  itemSub: { fontSize: 12, color: '#5B6B73', marginTop: 4 },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  addBtn: { backgroundColor: '#D98E04', borderRadius: 8, paddingVertical: 10, alignItems: 'center', marginBottom: 12 },
  addBtnText: { color: '#FBF9F4', fontWeight: '700', fontSize: 13 },
  doneBtn: { alignSelf: 'flex-start', marginTop: 8, backgroundColor: '#3F6B4F', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 10 },
  doneBtnText: { color: '#FBF9F4', fontSize: 12, fontWeight: '600' },
  doneLabel: { marginTop: 8, fontSize: 12, color: '#3F6B4F', fontWeight: '600' },
  empty: { textAlign: 'center', marginTop: 40, color: '#5B6B73' },
});
