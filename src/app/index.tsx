import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  hasCompletedWelcome,
  markWelcomeCompleted,
} from '@/features/onboarding/storage/welcome-storage';
import { useClimioTheme } from '@/providers/theme-provider';
import { lightColors } from '@/shared/theme/tokens';
import { ClimioIcon } from '@/shared/ui/climio-icon';

/** White glyph/text on green brand fills — same in Light and Dark (Figma). */
const onGreen = lightColors.surface;

/**
 * App entry: welcome only on first access; later launches go straight to home.
 */
export default function EntryScreen() {
  const router = useRouter();
  const { colors } = useClimioTheme();
  const [checking, setChecking] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const completed = await hasCompletedWelcome();
        if (cancelled) {
          return;
        }
        if (completed) {
          router.replace('/home');
          return;
        }
        setShowWelcome(true);
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleStartPlan() {
    await markWelcomeCompleted();
    router.replace('/home');
  }

  if (checking || !showWelcome) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator color={colors.green} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <View className="absolute -right-24 -top-28 h-60 w-60 rounded-full bg-blue opacity-20" />
      <View className="absolute -bottom-28 -left-24 h-52 w-52 rounded-full bg-green-bright opacity-20" />

      <View className="flex-1 justify-between px-6 pb-8 pt-10">
        <View className="flex-1 items-center justify-center px-2">
          <View className="h-[88px] w-[88px] items-center justify-center rounded-xl bg-surface-soft">
            <View className="h-[58px] w-[58px] items-center justify-center rounded-full border-2 border-green">
              <ClimioIcon name="compass" size={28} color={colors.green} />
            </View>
          </View>

          <Text className="mt-8 font-sans text-[10px] font-extrabold uppercase tracking-[1.65px] text-green">
            Comece por aqui
          </Text>
          <Text className="mt-3 text-center font-sans text-[30px] font-extrabold leading-tight tracking-tight text-ink">
            Seu próximo plano merece o momento certo
          </Text>
          <Text className="mt-4 max-w-[300px] text-center font-sans text-[15px] leading-6 text-ink-soft">
            Escolha uma atividade, um lugar e uma data para receber uma
            recomendação feita para você.
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          className="min-h-[54px] flex-row items-center justify-center rounded-lg bg-green px-5 active:opacity-90"
          onPress={() => {
            void handleStartPlan();
          }}
        >
          <Text
            className="font-sans text-[14px] font-extrabold"
            style={{ color: onGreen }}
          >
            Montar meu plano
          </Text>
          <View className="ml-2">
            <ClimioIcon name="arrow-right" size={18} color={onGreen} />
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
