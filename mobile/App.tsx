import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/auth';
import { ParentChildrenProvider } from './src/children';
import RootNavigator from './src/RootNavigator';

export default function App() {
  return (
    <AuthProvider>
      <ParentChildrenProvider>
        <RootNavigator />
        <StatusBar style="light" />
      </ParentChildrenProvider>
    </AuthProvider>
  );
}
