import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { lightColors } from '@/shared/theme/tokens';
import { ClimioIcon } from '@/shared/ui/climio-icon';

export default function IndexScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <View className="absolute -right-24 -top-28 h-60 w-60 rounded-full bg-blue opacity-20" />
      <View className="absolute -bottom-28 -left-24 h-52 w-52 rounded-full bg-green-bright opacity-20" />

      <View className="flex-1 justify-between px-5 pb-7 pt-3">
        <View>
          <View className="mb-8 flex-row items-center gap-2.5">
            <View className="h-9 w-9 items-center justify-center rounded-sm bg-green">
              <ClimioIcon name="wind" size={18} color={lightColors.surface} />
            </View>
            <Text className="font-sans text-[21px] font-extrabold tracking-tight text-ink">
              climio
            </Text>
          </View>

          <View className="gap-3">
            <Text className="font-sans text-[10px] font-extrabold uppercase tracking-[1.65px] text-green">
              Previsão para a vida real
            </Text>
            <Text className="font-sans text-[31px] font-extrabold leading-[1.14] tracking-tight text-ink">
              Find your best time to go.
            </Text>
            <Text className="max-w-[320px] font-sans text-sm leading-6 text-ink-soft">
              Escolha a atividade, o lugar e o dia. A gente analisa a previsão
              hora a hora e encontra a melhor janela para você sair.
            </Text>
          </View>
        </View>

        <View className="gap-3.5">
          <Pressable
            accessibilityRole="button"
            className="min-h-[54px] flex-row items-center justify-center rounded-lg bg-green px-5 active:opacity-90"
            onPress={() => router.push('/activity-picker')}
          >
            <Text className="font-sans text-[13px] font-extrabold text-surface">
              Começar
            </Text>
            <View className="ml-3">
              <ClimioIcon
                name="arrow-right"
                size={18}
                color={lightColors.surface}
              />
            </View>
          </Pressable>
          <View className="flex-row items-center justify-center gap-2">
            <ClimioIcon name="cloud" size={15} color={lightColors.blue} />
            <Text className="font-sans text-[10px] text-ink-soft">
              Sem complicação — só o melhor momento para o seu plano.
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
