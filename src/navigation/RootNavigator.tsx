import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';

import { useAuth } from '@/hooks/useAuth';
import LoginScreen from '@/screens/LoginScreen';
import HomeScreen from '@/screens/HomeScreen';
import VehicleDetailScreen from '@/screens/VehicleDetailScreen';
import AddVehicleScreen from '@/screens/AddVehicleScreen';
import AddExpenseScreen from '@/screens/AddExpenseScreen';
import AddReminderScreen from '@/screens/AddReminderScreen';
import UploadDocumentScreen from '@/screens/UploadDocumentScreen';
import DirectoryScreen from '@/screens/DirectoryScreen';
import ProfileScreen from '@/screens/ProfileScreen';

export type HomeStackParamList = {
  Home: undefined;
  VehicleDetail: { vehicleId: string };
  AddVehicle: undefined;
  AddExpense: { vehicleId: string };
  AddReminder: { vehicleId: string };
  UploadDocument: { vehicleId: string };
};

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const Tabs = createBottomTabNavigator();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen name="Home" component={HomeScreen} options={{ title: 'Mi auto' }} />
      <HomeStack.Screen name="VehicleDetail" component={VehicleDetailScreen} options={{ title: 'Ficha del vehículo' }} />
      <HomeStack.Screen name="AddVehicle" component={AddVehicleScreen} options={{ title: 'Agregar vehículo', presentation: 'modal' }} />
      <HomeStack.Screen name="AddExpense" component={AddExpenseScreen} options={{ title: 'Cargar gasto', presentation: 'modal' }} />
      <HomeStack.Screen name="AddReminder" component={AddReminderScreen} options={{ title: 'Nuevo recordatorio', presentation: 'modal' }} />
      <HomeStack.Screen name="UploadDocument" component={UploadDocumentScreen} options={{ title: 'Subir documento', presentation: 'modal' }} />
    </HomeStack.Navigator>
  );
}

export default function RootNavigator() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EDE7DA' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {session ? (
        <Tabs.Navigator screenOptions={{ headerShown: false }}>
          <Tabs.Screen name="Inicio" component={HomeStackNavigator} />
          <Tabs.Screen name="Directorio" component={DirectoryScreen} />
          <Tabs.Screen name="Perfil" component={ProfileScreen} />
        </Tabs.Navigator>
      ) : (
        <LoginScreen />
      )}
    </NavigationContainer>
  );
}
