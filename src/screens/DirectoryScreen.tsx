import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useNearbyWorkshops } from '@/hooks/useNearbyWorkshops';
import type { WorkshopCategory } from '@/types/database';

export default function DirectoryScreen() {
  const [category, setCategory] = useState<WorkshopCategory | undefined>(undefined);
  const { workshops, loading, error } = useNearbyWorkshops(category);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Talleres cerca tuyo</Text>

      {loading && <Text style={styles.hint}>Buscando talleres cercanos...</Text>}
      {error && <Text style={styles.hint}>{error}</Text>}

      <FlatList
        data={workshops}
        keyExtractor={(w) => w.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>{item.category} · {item.distance_km.toFixed(1)} km</Text>
          </View>
        )}
        ListEmptyComponent={!loading ? <Text style={styles.hint}>No encontramos talleres en el radio configurado.</Text> : null}
      />

      {/* TODO: reemplazar el listado con un mapa (react-native-maps)
          combinado con la lista, según el wireframe 03 */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#EDE7DA' },
  title: { fontSize: 18, fontWeight: '700', color: '#23262B', marginBottom: 10 },
  hint: { fontSize: 13, color: '#5B6B73', marginBottom: 10 },
  card: { backgroundColor: '#FBF9F4', borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#DCD5C4' },
  name: { fontSize: 14, fontWeight: '700', color: '#23262B' },
  meta: { fontSize: 11, color: '#5B6B73', marginTop: 4, textTransform: 'capitalize' },
});
