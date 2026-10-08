jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  hasCompletedWelcome,
  markWelcomeCompleted,
} from '@/features/onboarding/storage/welcome-storage';

describe('welcome-storage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('starts as not completed', async () => {
    await expect(hasCompletedWelcome()).resolves.toBe(false);
  });

  it('marks welcome as completed', async () => {
    await markWelcomeCompleted();
    await expect(hasCompletedWelcome()).resolves.toBe(true);
  });
});
