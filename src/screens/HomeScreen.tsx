import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useVehicles } from '@/hooks/useVehicles';

export default function HomeScreen({ navigation }: any) {
  const { vehicles, loading, error, refetch } = useVehicles();

  if (loading) return <Text style={styles.loading}>Cargando...</Text>;

  return (
    <View style={styles.container}>
      {error && (
        <Pressable onPress={refetch} style={styles.errorBox}>
          <Text style={styles.errorText}>{error} · Tocá para reintentar</Text>
        </Pressable>
      )}
      <FlatList
        data={vehicles}
        keyExtractor={(v) => v.id}
        ListHeaderComponent={
          <Pressable style={styles.addBtn} onPress={() => navigation.navigate('AddVehicle')}>
            <Text style={styles.addBtnText}>+ Agregar vehículo</Text>
          </Pressable>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate('VehicleDetail', { vehicleId: item.id })}
          >
            <Text style={styles.brand}>{item.brand} {item.model}</Text>
            <Text style={styles.plate}>{item.plate} · {item.current_km.toLocaleString('es-AR')} km</Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Todavía no cargaste ningún vehículo.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#EDE7DA' },
  loading: { padding: 24 },
  errorBox: { backgroundColor: '#F4D9D3', borderRadius: 8, padding: 10, marginBottom: 12 },
  errorText: { color: '#B44B3E', fontSize: 12, fontWeight: '600' },
  addBtn: { backgroundColor: '#D98E04', borderRadius: 8, paddingVertical: 10, alignItems: 'center', marginBottom: 12 },
  addBtnText: { color: '#FBF9F4', fontWeight: '700', fontSize: 13 },
  card: { backgroundColor: '#FBF9F4', borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#DCD5C4' },
  brand: { fontSize: 16, fontWeight: '700', color: '#23262B' },
  plate: { fontSize: 12, color: '#5B6B73', marginTop: 4 },
  empty: { textAlign: 'center', marginTop: 40, color: '#5B6B73' },
});
