import AsyncStorage from '@react-native-async-storage/async-storage';

const WELCOME_COMPLETED_KEY = 'climio.hasCompletedWelcome';

/** True after the user finishes the first-access welcome screen. */
export async function hasCompletedWelcome(): Promise<boolean> {
  const value = await AsyncStorage.getItem(WELCOME_COMPLETED_KEY);
  return value === 'true';
}

/** Persist that welcome was completed so later launches open home. */
export async function markWelcomeCompleted(): Promise<void> {
  await AsyncStorage.setItem(WELCOME_COMPLETED_KEY, 'true');
}
