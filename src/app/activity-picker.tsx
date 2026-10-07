import { useRouter } from 'expo-router';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ACTIVITIES,
  getActivityById,
} from '@/features/activity/domain/activities';
import { usePlanStore } from '@/features/plan/store/plan-store';
import { useClimioTheme } from '@/providers/theme-provider';
import { lightColors } from '@/shared/theme/tokens';
import { ClimioIcon } from '@/shared/ui/climio-icon';
import { ThemeToggle } from '@/shared/ui/theme-toggle';

const onGreen = lightColors.surface;

export default function ActivityPickerScreen() {
  const router = useRouter();
  const { colors } = useClimioTheme();
  const activityId = usePlanStore((state) => state.activityId);
  const setActivityId = usePlanStore((state) => state.setActivityId);
  const selectedActivity =
    activityId !== null ? getActivityById(activityId) : null;

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <View className="absolute -right-24 -top-28 h-60 w-60 rounded-full bg-blue opacity-15" />

      <View className="flex-1 px-5 pt-2">
        <View className="mb-5 flex-row items-center justify-between">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            className="h-[42px] w-[42px] items-center justify-center rounded-md border border-line bg-surface"
            onPress={() => router.back()}
          >
            <ClimioIcon name="arrow-left" size={18} color={colors.ink} />
          </Pressable>
          <ThemeToggle />
        </View>

        <Text className="font-sans text-[10px] font-extrabold uppercase tracking-[1.65px] text-green">
          Passo 1
        </Text>
        <Text className="mt-2 font-sans text-[28px] font-extrabold leading-tight tracking-tight text-ink">
          Qual atividade?
        </Text>
        <Text className="mt-2.5 mb-5 font-sans text-sm leading-5 text-ink-soft">
          Escolha o que você quer fazer. Usaremos isso depois para avaliar o
          clima.
        </Text>

        {selectedActivity ? (
          <View className="mb-4 flex-row items-center gap-3 rounded-lg border border-green bg-surface-soft px-3.5 py-3">
            <View className="h-11 w-11 items-center justify-center rounded-md bg-green">
              <ClimioIcon
                name={selectedActivity.id}
                size={22}
                color={onGreen}
              />
            </View>
            <View className="flex-1">
              <Text className="font-sans text-[9px] font-extrabold uppercase tracking-[1.2px] text-green">
                Selecionada
              </Text>
              <Text className="mt-0.5 font-sans text-sm font-bold text-ink">
                {selectedActivity.name}
              </Text>
            </View>
          </View>
        ) : null}

        <FlatList
          data={ACTIVITIES}
          keyExtractor={(item) => item.id}
          contentContainerClassName="pb-8"
          ItemSeparatorComponent={() => <View className="h-2.5" />}
          renderItem={({ item }) => {
            const selected = activityId === item.id;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                className={`min-h-[56px] flex-row items-center gap-3 rounded-lg border px-3 py-2.5 ${
                  selected
                    ? 'border-green bg-surface-soft'
                    : 'border-line bg-surface'
                }`}
                onPress={() => {
                  if (selected) {
                    setActivityId(null);
                    return;
                  }

                  setActivityId(item.id);
                  router.push('/location-picker');
                }}
              >
                <View
                  className={`h-11 w-11 items-center justify-center rounded-md ${
                    selected ? 'bg-green' : 'bg-surface-soft'
                  }`}
                >
                  <ClimioIcon
                    name={item.id}
                    size={22}
                    color={selected ? onGreen : colors.green}
                  />
                </View>
                <Text className="flex-1 font-sans text-sm font-bold text-ink">
                  {item.name}
                </Text>
                {selected ? (
                  <View className="h-5 w-5 items-center justify-center rounded-full bg-green">
                    <ClimioIcon name="check" size={12} color={onGreen} />
                  </View>
                ) : null}
              </Pressable>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}
