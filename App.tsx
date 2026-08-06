import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/hooks/useAuth';
import RootNavigator from '@/navigation/RootNavigator';

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </AuthProvider>
  );
}
