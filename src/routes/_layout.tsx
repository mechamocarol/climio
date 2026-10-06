import { Stack } from 'expo-router/stack';

import { AppProviders } from '@/app/providers/app-providers';

export default function RootLayout() {
  return (
    <AppProviders>
      <Stack screenOptions={{ headerShown: false }} />
    </AppProviders>
  );
}
