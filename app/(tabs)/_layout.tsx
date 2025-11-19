// app/(tabs)/_layout.tsx

import { LogoutButton, SettingsButton } from '@/app/HeaderButtons';
import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerTitleAlign: 'center',
        // *** THIS IS THE FIX: This line hides the tab bar at the bottom ***
        tabBarStyle: { display: 'none' }, 
        headerRight: () => (
          <View style={{ flexDirection: 'row', paddingHorizontal: 15, gap: 20 }}>
            <SettingsButton />
            <LogoutButton />
          </View>
        ),
      }}>
      <Tabs.Screen
        name="index" // This is your ForYouScreen
        options={{
          title: 'Kid Tok', // This sets the title in the header
          // The tabBarIcon is no longer needed
        }}
      />
      {/* The Explore screen that we deleted is no longer here */}
    </Tabs>
  );
}