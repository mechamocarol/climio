import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

import {
  ThemeProvider,
  toggleThemeName,
  useClimioTheme,
} from '@/providers/theme-provider';
import { colorsByTheme } from '@/shared/theme/tokens';

const mockSetColorScheme = jest.fn();

jest.mock('nativewind', () => ({
  useColorScheme: () => ({
    colorScheme: 'light',
    setColorScheme: mockSetColorScheme,
    toggleColorScheme: jest.fn(),
  }),
  vars: (value: Record<string, string>) => value,
}));

function ThemeProbe() {
  const { theme, colors, toggleTheme, setTheme } = useClimioTheme();

  return (
    <>
      <Text testID="theme">{theme}</Text>
      <Text testID="canvas">{colors.canvas}</Text>
      <Pressable accessibilityRole="button" onPress={toggleTheme}>
        <Text>toggle</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => setTheme('dark')}>
        <Text>set-dark</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => setTheme('light')}>
        <Text>set-light</Text>
      </Pressable>
    </>
  );
}

describe('toggleThemeName', () => {
  it('switches Light ↔ Dark', () => {
    expect(toggleThemeName('light')).toBe('dark');
    expect(toggleThemeName('dark')).toBe('light');
  });
});

describe('ThemeProvider', () => {
  beforeEach(() => {
    mockSetColorScheme.mockClear();
  });

  it('starts in Light mode with light tokens', async () => {
    const { getByTestId } = await render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(getByTestId('theme').props.children).toBe('light');
    expect(getByTestId('canvas').props.children).toBe(
      colorsByTheme.light.canvas,
    );
    expect(mockSetColorScheme).toHaveBeenCalledWith('light');
  });

  it('toggles Light → Dark and Dark → Light', async () => {
    const { getByTestId, getByText } = await render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    fireEvent.press(getByText('toggle'));

    await waitFor(() => {
      expect(getByTestId('theme').props.children).toBe('dark');
    });
    expect(getByTestId('canvas').props.children).toBe(
      colorsByTheme.dark.canvas,
    );
    expect(mockSetColorScheme).toHaveBeenCalledWith('dark');

    fireEvent.press(getByText('toggle'));

    await waitFor(() => {
      expect(getByTestId('theme').props.children).toBe('light');
    });
    expect(getByTestId('canvas').props.children).toBe(
      colorsByTheme.light.canvas,
    );
  });

  it('supports explicit setTheme', async () => {
    const { getByTestId, getByText } = await render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    fireEvent.press(getByText('set-dark'));

    await waitFor(() => {
      expect(getByTestId('theme').props.children).toBe('dark');
    });

    fireEvent.press(getByText('set-light'));

    await waitFor(() => {
      expect(getByTestId('theme').props.children).toBe('light');
    });
  });
});
