
import { Tabs } from 'expo-router';
import { Dumbbell, LayoutGrid, User, Utensils, Share2 } from 'lucide-react-native';
import { View } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#09090b',
          borderTopWidth: 0,
          elevation: 0,
          height: 80,
          paddingBottom: 20,
          paddingTop: 10,
          position: 'absolute',
          bottom: 24,
          left: 20,
          right: 20,
          borderRadius: 32,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.1)',
        },
        tabBarActiveTintColor: '#22c55e',
        tabBarInactiveTintColor: '#71717a',
      }}
    >
      <Tabs.Screen
        name="workout"
        options={{
          tabBarIcon: ({ color }) => <Dumbbell size={24} color={color} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          tabBarIcon: ({ color }) => <LayoutGrid size={24} color={color} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="macros"
        options={{
          tabBarIcon: ({ color }) => <Utensils size={24} color={color} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="hub"
        options={{
          tabBarIcon: ({ color }) => <Share2 size={24} color={color} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ color }) => <User size={24} color={color} strokeWidth={2.5} />,
        }}
      />
    </Tabs>
  );
}
