import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { AppProvider, useApp, useTheme } from './src/AppContext';
import HomeScreen    from './src/screens/HomeScreen';
import HobbiesScreen from './src/screens/HobbiesScreen';
import JournalScreen from './src/screens/JournalScreen';
import TasksScreen   from './src/screens/TasksScreen';
import HabitsScreen  from './src/screens/HabitsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home:     { active: 'home',             inactive: 'home-outline'             },
  Hobbies:  { active: 'library',          inactive: 'library-outline'          },
  Journal:  { active: 'book',             inactive: 'book-outline'             },
  Tasks:    { active: 'checkmark-circle', inactive: 'checkmark-circle-outline' },
  Habits:   { active: 'star',             inactive: 'star-outline'             },
  Settings: { active: 'settings',         inactive: 'settings-outline'         },
};

// Separate component so hooks can read from AppProvider above it
function AppNavigator() {
  const insets = useSafeAreaInsets();
  const C = useTheme();
  const { state } = useApp();
  const isDark = state?.theme === 'dark';

  return (
    <NavigationContainer>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={C.bg} />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={TAB_ICONS[route.name]?.[focused ? 'active' : 'inactive'] || 'circle-outline'}
              size={22}
              color={color}
            />
          ),
          tabBarStyle: {
            backgroundColor: C.bgCard,
            borderTopColor: C.border,
            borderTopWidth: 1,
            paddingTop: 6,
            paddingBottom: insets.bottom,
            height: 60 + insets.bottom,
          },
          tabBarActiveTintColor: C.accent,
          tabBarInactiveTintColor: C.textMuted,
        })}
      >
        <Tab.Screen name="Home"     component={HomeScreen} />
        <Tab.Screen name="Hobbies"  component={HobbiesScreen} />
        <Tab.Screen name="Journal"  component={JournalScreen} />
        <Tab.Screen name="Tasks"    component={TasksScreen} />
        <Tab.Screen name="Habits"   component={HabitsScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <AppNavigator />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
