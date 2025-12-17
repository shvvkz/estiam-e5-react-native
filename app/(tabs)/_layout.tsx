import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * TabLayout
 *
 * Defines the main tab-based navigation structure of the application.
 * This layout is responsible for configuring all bottom tabs displayed
 * to the user and their associated routes.
 *
 * Responsibilities:
 * - Configure the global Tabs navigator using Expo Router
 * - Define visible tabs (Home, Trips, Profile, Notifications)
 * - Hide technical or secondary routes from the tab bar
 * - Apply shared tab bar behavior such as haptic feedback
 * - Adapt tab colors based on the current color scheme
 *
 * Navigation rules:
 * - Routes such as "trips/[id]" and "trips/map" are intentionally hidden
 *   from the tab bar and are only accessible through programmatic navigation
 * - The tab bar is the main entry point for high-level navigation
 *
 * This layout acts as the root navigation layer for the authenticated
 * area of the application.
 */
export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="trips/index"
        options={{
          title: 'Trips',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="map.fill" color={color} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="notification"
        options={{
          title: 'Notification',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="alarm.fill" color={color} />,
        }}
      />

      <Tabs.Screen
        name="trips/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="trips/map"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
