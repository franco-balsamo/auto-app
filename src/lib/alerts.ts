import { Alert } from 'react-native';

export function confirmDelete(what: string, onConfirm: () => void) {
  Alert.alert(`Borrar ${what}`, 'No se puede deshacer.', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Borrar', style: 'destructive', onPress: onConfirm },
  ]);
}
