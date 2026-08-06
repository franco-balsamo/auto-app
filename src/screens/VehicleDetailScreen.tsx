import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<HomeStackParamList, 'VehicleDetail'>;

export default function VehicleDetailScreen({ route }: Props) {
  const { vehicleId } = route.params;

  // TODO: fetch expenses, documents y reminders del vehicleId
  // (ver src/hooks/useVehicles.ts como referencia de patrón)

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vehículo {vehicleId}</Text>
      <Text style={styles.hint}>
        Acá van los tabs Historial / Documentos / Recordatorios del wireframe 02.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#EDE7DA' },
  title: { fontSize: 18, fontWeight: '700', color: '#23262B' },
  hint: { fontSize: 13, color: '#5B6B73', marginTop: 8 },
});
