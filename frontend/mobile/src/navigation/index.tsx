import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { C } from '../theme/colors';
import { enableScreens } from 'react-native-screens';
enableScreens();

// Screens (placeholders for now)
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import ExploreScreen from '../screens/ExploreScreen';
import AppointmentsScreen from '../screens/AppointmentsScreen';
import ProfileScreen from '../screens/ProfileScreen';

export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
  BarberProfile: { barber: any };
  Booking: { barber: any; service: any };
  Confirmation: { barber: any; service: any; day: string; time: string };
  Review: { barber: any; service: string };
  BarberSetup: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.surface,
          borderTopColor: C.border,
          height: 70,
          paddingBottom: 12,
        },
        tabBarActiveTintColor: C.gold,
        tabBarInactiveTintColor: C.gray,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{ tabBarLabel: 'Radar', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>🔍</Text> }}
      />
      <Tab.Screen
        name="Appointments"
        component={AppointmentsScreen}
        options={{ tabBarLabel: 'Agenda', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>📅</Text> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Perfil', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>👤</Text> }}
      />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="BarberProfile" component={ProfileScreen} />
        <Stack.Screen name="Booking" component={ProfileScreen} />
        <Stack.Screen name="Confirmation" component={ProfileScreen} />
        <Stack.Screen name="Review" component={ProfileScreen} />
        <Stack.Screen name="BarberSetup" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}