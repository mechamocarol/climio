import { useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  formatPlanDateLabel,
  getPlanDateParts,
  isSelectablePlanDate,
  listSelectablePlanDates,
} from '@/features/plan/presentation/plan-date-format';
import { usePlanStore } from '@/features/plan/store/plan-store';
import { useClimioTheme } from '@/providers/theme-provider';
import { lightColors } from '@/shared/theme/tokens';
import { ClimioIcon } from '@/shared/ui/climio-icon';
import { ThemeToggle } from '@/shared/ui/theme-toggle';

const onGreen = lightColors.surface;
const SELECTABLE_DAY_COUNT = 14;

export default function DatePickerScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { colors } = useClimioTheme();
  const date = usePlanStore((state) => state.date);
  const setDate = usePlanStore((state) => state.setDate);
  const selectableDates = listSelectablePlanDates(SELECTABLE_DAY_COUNT);
  const selectedLabel = formatPlanDateLabel(date);
  const canContinue = isSelectablePlanDate(date);

  function finishDateSelection() {
    if (!canContinue) {
      return;
    }
    if (returnTo === 'home') {
      router.replace('/home');
      return;
    }
    router.push('/summary');
  }

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
          Passo 3
        </Text>
        <Text className="mt-2 font-sans text-[28px] font-extrabold leading-tight tracking-tight text-ink">
          Quando você vai?
        </Text>
        <Text className="mt-2.5 mb-4 font-sans text-sm leading-5 text-ink-soft">
          Escolha hoje ou um dia futuro. Datas passadas não estão disponíveis.
        </Text>

        <View className="mb-4 flex-row items-center gap-3 rounded-lg border border-green bg-surface-soft px-3.5 py-3">
          <View className="h-10 w-10 items-center justify-center rounded-md bg-surface">
            <ClimioIcon name="calendar" size={18} color={colors.green} />
          </View>
          <View className="flex-1">
            <Text className="font-sans text-[9px] font-extrabold uppercase tracking-[1.2px] text-green">
              Selecionada
            </Text>
            <Text className="mt-0.5 font-sans text-sm font-bold text-ink">
              {selectedLabel}
            </Text>
          </View>
        </View>

        <FlatList
          data={selectableDates}
          keyExtractor={(item) => item}
          numColumns={4}
          columnWrapperClassName="gap-2"
          contentContainerClassName="gap-2 pb-28"
          renderItem={({ item }) => {
            const parts = getPlanDateParts(item);
            const selected = item === date;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                className={`min-h-[94px] flex-1 items-center justify-center rounded-lg border px-1 py-3 ${
                  selected
                    ? 'border-green bg-green'
                    : 'border-line bg-surface'
                }`}
                onPress={() => setDate(item)}
              >
                <Text
                  className={`font-sans text-[10px] font-bold ${
                    selected ? 'text-surface' : 'text-ink-soft'
                  }`}
                  style={selected ? { color: onGreen } : undefined}
                >
                  {parts?.relativeLabel ?? parts?.weekdayLabel}
                </Text>
                <Text
                  className={`mt-1 font-sans text-2xl font-extrabold ${
                    selected ? 'text-surface' : 'text-ink'
                  }`}
                  style={selected ? { color: onGreen } : undefined}
                >
                  {parts?.dayNumber}
                </Text>
                <Text
                  className={`mt-0.5 font-sans text-[10px] ${
                    selected ? 'text-surface' : 'text-ink-soft'
                  }`}
                  style={selected ? { color: onGreen } : undefined}
                >
                  {parts?.monthLabel}
                </Text>
              </Pressable>
            );
          }}
        />

        <View className="absolute bottom-4 left-5 right-5">
          <Pressable
            accessibilityRole="button"
            disabled={!canContinue}
            className={`min-h-[54px] flex-row items-center justify-center rounded-lg px-5 ${
              canContinue ? 'bg-green active:opacity-90' : 'bg-surface-soft'
            }`}
            onPress={finishDateSelection}
          >
            <Text
              className="font-sans text-[13px] font-extrabold"
              style={{ color: canContinue ? onGreen : colors.inkSoft }}
            >
              {returnTo === 'home' ? 'Confirmar data' : 'Continuar'}
            </Text>
            <View className="ml-2">
              <ClimioIcon
                name="arrow-right"
                size={16}
                color={canContinue ? onGreen : colors.inkSoft}
              />
            </View>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
