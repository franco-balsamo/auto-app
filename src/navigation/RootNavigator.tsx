import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';

import { useAuth } from '@/hooks/useAuth';
import LoginScreen from '@/screens/LoginScreen';
import HomeScreen from '@/screens/HomeScreen';
import VehicleDetailScreen from '@/screens/VehicleDetailScreen';
import AddVehicleScreen from '@/screens/AddVehicleScreen';
import EditVehicleScreen from '@/screens/EditVehicleScreen';
import AddExpenseScreen from '@/screens/AddExpenseScreen';
import EditExpenseScreen from '@/screens/EditExpenseScreen';
import AddReminderScreen from '@/screens/AddReminderScreen';
import EditReminderScreen from '@/screens/EditReminderScreen';
import UploadDocumentScreen from '@/screens/UploadDocumentScreen';
import EditDocumentScreen from '@/screens/EditDocumentScreen';
import DirectoryScreen from '@/screens/DirectoryScreen';
import WorkshopDetailScreen from '@/screens/WorkshopDetailScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import type { Workshop } from '@/types/database';

export type HomeStackParamList = {
  Home: undefined;
  VehicleDetail: { vehicleId: string };
  AddVehicle: undefined;
  EditVehicle: { vehicleId: string };
  AddExpense: { vehicleId: string };
  EditExpense: { vehicleId: string; expenseId: string };
  AddReminder: { vehicleId: string };
  EditReminder: { vehicleId: string; reminderId: string };
  UploadDocument: { vehicleId: string };
  EditDocument: { vehicleId: string; documentId: string };
};

export type DirectoryStackParamList = {
  Directory: undefined;
  WorkshopDetail: { workshop: Workshop & { distance_km: number } };
};

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const DirectoryStack = createNativeStackNavigator<DirectoryStackParamList>();
const Tabs = createBottomTabNavigator();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen name="Home" component={HomeScreen} options={{ title: 'Mi auto' }} />
      <HomeStack.Screen name="VehicleDetail" component={VehicleDetailScreen} options={{ title: 'Ficha del vehículo' }} />
      <HomeStack.Screen name="AddVehicle" component={AddVehicleScreen} options={{ title: 'Agregar vehículo', presentation: 'modal' }} />
      <HomeStack.Screen name="EditVehicle" component={EditVehicleScreen} options={{ title: 'Editar vehículo', presentation: 'modal' }} />
      <HomeStack.Screen name="AddExpense" component={AddExpenseScreen} options={{ title: 'Cargar gasto', presentation: 'modal' }} />
      <HomeStack.Screen name="EditExpense" component={EditExpenseScreen} options={{ title: 'Editar gasto', presentation: 'modal' }} />
      <HomeStack.Screen name="AddReminder" component={AddReminderScreen} options={{ title: 'Nuevo recordatorio', presentation: 'modal' }} />
      <HomeStack.Screen name="EditReminder" component={EditReminderScreen} options={{ title: 'Editar recordatorio', presentation: 'modal' }} />
      <HomeStack.Screen name="UploadDocument" component={UploadDocumentScreen} options={{ title: 'Subir documento', presentation: 'modal' }} />
      <HomeStack.Screen name="EditDocument" component={EditDocumentScreen} options={{ title: 'Editar documento', presentation: 'modal' }} />
    </HomeStack.Navigator>
  );
}

function DirectoryStackNavigator() {
  return (
    <DirectoryStack.Navigator>
      <DirectoryStack.Screen name="Directory" component={DirectoryScreen} options={{ title: 'Directorio' }} />
      <DirectoryStack.Screen name="WorkshopDetail" component={WorkshopDetailScreen} options={{ title: 'Ficha del taller' }} />
    </DirectoryStack.Navigator>
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
          <Tabs.Screen name="Directorio" component={DirectoryStackNavigator} />
          <Tabs.Screen name="Perfil" component={ProfileScreen} />
        </Tabs.Navigator>
      ) : (
        <LoginScreen />
      )}
    </NavigationContainer>
  );
}
