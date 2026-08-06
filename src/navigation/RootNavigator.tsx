import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';

import { useAuth } from '@/hooks/useAuth';
import LoginScreen from '@/screens/LoginScreen';
import HomeScreen from '@/screens/HomeScreen';
import VehicleDetailScreen from '@/screens/VehicleDetailScreen';
import AddExpenseScreen from '@/screens/AddExpenseScreen';
import DirectoryScreen from '@/screens/DirectoryScreen';
import ProfileScreen from '@/screens/ProfileScreen';

export type HomeStackParamList = {
  Home: undefined;
  VehicleDetail: { vehicleId: string };
  AddExpense: { vehicleId: string };
};

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const Tabs = createBottomTabNavigator();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen name="Home" component={HomeScreen} options={{ title: 'Mi auto' }} />
      <HomeStack.Screen name="VehicleDetail" component={VehicleDetailScreen} options={{ title: 'Ficha del vehículo' }} />
      <HomeStack.Screen name="AddExpense" component={AddExpenseScreen} options={{ title: 'Cargar gasto', presentation: 'modal' }} />
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
