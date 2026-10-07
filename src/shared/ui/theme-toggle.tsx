import { Pressable } from 'react-native';

import { useClimioTheme } from '@/providers/theme-provider';
import { ClimioIcon } from '@/shared/ui/climio-icon';

/**
 * Figma Make–inspired theme control: 42×42 bordered icon button.
 * Light shows moon (switch to dark); Dark shows sun (switch to light).
 */
export function ThemeToggle() {
  const { theme, colors, toggleTheme } = useClimioTheme();
  const isLight = theme === 'light';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        isLight ? 'Ativar tema escuro' : 'Ativar tema claro'
      }
      accessibilityState={{ selected: !isLight }}
      className="h-[42px] w-[42px] items-center justify-center rounded-md border border-line bg-surface active:opacity-90"
      onPress={toggleTheme}
    >
      <ClimioIcon
        name={isLight ? 'moon' : 'sun'}
        size={18}
        color={colors.ink}
      />
    </Pressable>
  );
}
