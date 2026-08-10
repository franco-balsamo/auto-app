import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useState } from 'react';
import MapView, { Marker } from 'react-native-maps';
import { useNearbyWorkshops } from '@/hooks/useNearbyWorkshops';
import { WORKSHOP_CATEGORIES, WORKSHOP_CATEGORY_LABELS as CATEGORY_LABELS } from '@/lib/workshopCategories';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { DirectoryStackParamList } from '@/navigation/RootNavigator';
import type { WorkshopCategory } from '@/types/database';

const CATEGORIES = WORKSHOP_CATEGORIES;

// Fallback si todavía no hay talleres cargados en el radio (centro de CABA).
const DEFAULT_REGION = { latitude: -34.6037, longitude: -58.3816, latitudeDelta: 0.1, longitudeDelta: 0.1 };

type Props = NativeStackScreenProps<DirectoryStackParamList, 'Directory'>;

export default function DirectoryScreen({ navigation }: Props) {
  const [category, setCategory] = useState<WorkshopCategory | undefined>(undefined);
  const { workshops, loading, error } = useNearbyWorkshops(category);

  const region = workshops[0]
    ? { latitude: workshops[0].lat, longitude: workshops[0].lng, latitudeDelta: 0.1, longitudeDelta: 0.1 }
    : DEFAULT_REGION;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Talleres cerca tuyo</Text>

      <View style={styles.chipRow}>
        <Pressable onPress={() => setCategory(undefined)} style={[styles.chip, !category && styles.chipActive]}>
          <Text style={[styles.chipText, !category && styles.chipTextActive]}>Todos</Text>
        </Pressable>
        {CATEGORIES.map((c) => (
          <Pressable key={c} onPress={() => setCategory(c)} style={[styles.chip, category === c && styles.chipActive]}>
            <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{CATEGORY_LABELS[c]}</Text>
          </Pressable>
        ))}
      </View>

      {loading && <Text style={styles.hint}>Buscando talleres cercanos...</Text>}
      {error && <Text style={styles.hint}>{error}</Text>}

      <MapView style={styles.map} region={region}>
        {workshops.map((w) => (
          <Marker key={w.id} coordinate={{ latitude: w.lat, longitude: w.lng }} title={w.name} description={CATEGORY_LABELS[w.category]} />
        ))}
      </MapView>

      <FlatList
        data={workshops}
        keyExtractor={(w) => w.id}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => navigation.navigate('WorkshopDetail', { workshop: item })}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>{CATEGORY_LABELS[item.category]} · {item.distance_km.toFixed(1)} km</Text>
          </Pressable>
        )}
        ListEmptyComponent={!loading ? <Text style={styles.hint}>No encontramos talleres en el radio configurado.</Text> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#EDE7DA' },
  title: { fontSize: 18, fontWeight: '700', color: '#23262B', marginBottom: 10 },
  hint: { fontSize: 13, color: '#5B6B73', marginBottom: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: '#E3DCCB' },
  chipActive: { backgroundColor: '#23262B' },
  chipText: { fontSize: 11, color: '#23262B' },
  chipTextActive: { color: '#EDE7DA' },
  map: { width: '100%', height: 200, borderRadius: 10, marginBottom: 10 },
  card: { backgroundColor: '#FBF9F4', borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#DCD5C4' },
  name: { fontSize: 14, fontWeight: '700', color: '#23262B' },
  meta: { fontSize: 11, color: '#5B6B73', marginTop: 4 },
});
