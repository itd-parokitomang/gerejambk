import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import React from 'react';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="reg" />
        <Stack.Screen name="adm/index" />
        <Stack.Screen name="adm/dashboard" />
        <Stack.Screen 
          name="pages/[slug]" 
          options={{ 
            headerShown: false,
          }} 
        />
      </Stack>
    </AuthProvider>
  );
}
