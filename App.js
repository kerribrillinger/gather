import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { AppProvider } from './src/AppContext';
import HomeScreen    from './src/screens/HomeScreen';
import HobbiesScreen from './src/screens/HobbiesScreen';
import JournalScreen from './src/screens/JournalScreen';
import TasksScreen   from './src/screens/TasksScreen';
import HabitsScreen  from './src/screens/HabitsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { COLORS } from './src/theme';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home:     { active: '🏠', inactive: '🏠' },
  Hobbies:  { active: '🎯', inactive: '🎯' },
  Journal:  { active: '📖', inactive: '📖' },
  Tasks:    { active: '✅', inactive: '✅' },
  Habits:   { active: '⭐', inactive: '⭐' },
  Settings: { active: '⚙️', inactive: '⚙️' },
};

function TabIcon({ name, focused }) {
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>
      {TAB_ICONS[name]?.active || '●'}
    </Text>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <NavigationContainer>
          <StatusBar style="dark" backgroundColor={COLORS.bg} />
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
              tabBarLabel: ({ focused, color }) => (
                <Text style={{ fontSize: 10, color, fontWeight: focused ? '700' : '500', marginBottom: 2 }}>
                  {route.name}
                </Text>
              ),
              tabBarStyle: {
                backgroundColor: COLORS.bgCard,
                borderTopColor: COLORS.border,
                borderTopWidth: 1,
                paddingTop: 6,
                height: 60,
              },
              tabBarActiveTintColor: COLORS.accent,
              tabBarInactiveTintColor: COLORS.textMuted,
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
      </AppProvider>
    </SafeAreaProvider>
  );
}
