import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// Contexts
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import AnalysisScreen from './src/screens/AnalysisScreen';
import BoardScreen from './src/screens/BoardScreen';
import AssignmentsGoalsScreen from './src/screens/AssignmentsGoalsScreen';
import AssignmentsScreen from './src/screens/AssignmentsScreen';
import ProgramCreationScreen from './src/screens/ProgramCreationScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ChatScreen from './src/screens/ChatScreen';
import LoadingScreen from './src/screens/LoadingScreen';
import StopwatchScreen from './src/screens/StopwatchScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Ana Sayfa') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Analiz') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else if (route.name === 'Pano') {
            iconName = focused ? 'clipboard' : 'clipboard-outline';
          } else if (route.name === 'Ödev ve Hedef') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Profil') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Ana Sayfa" component={HomeScreen} />
      <Tab.Screen name="Analiz" component={AnalysisScreen} />
      <Tab.Screen name="Pano" component={BoardScreen} />

      <Tab.Screen name="Ödev ve Hedef" component={AssignmentsGoalsScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="Assignments" component={AssignmentsScreen} />
            <Stack.Screen name="ProgramCreation" component={ProgramCreationScreen} />
            <Stack.Screen name="Stopwatch" component={StopwatchScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
