import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getActivityById } from '@/features/activity/domain/activities';
import {
  isPlanReadyForRecommendation,
  toHourlyForecastInput,
} from '@/features/plan/domain/plan';
import { formatPlanDateLabel } from '@/features/plan/presentation/plan-date-format';
import { usePlanStore } from '@/features/plan/store/plan-store';
import { useHourlyForecast } from '@/features/weather/hooks/use-hourly-forecast';
import { useClimioTheme } from '@/providers/theme-provider';
import { lightColors } from '@/shared/theme/tokens';
import { ClimioIcon } from '@/shared/ui/climio-icon';
import { ThemeToggle } from '@/shared/ui/theme-toggle';

const onGreen = lightColors.surface;

function formatLocationLabel(
  name: string,
  region: string | null,
): string {
  return region ? `${name}, ${region}` : name;
}

/** Plan review before analysis; also warms the hourly forecast cache. */
export default function SummaryScreen() {
  const router = useRouter();
  const { colors } = useClimioTheme();
  const activityId = usePlanStore((state) => state.activityId);
  const location = usePlanStore((state) => state.location);
  const date = usePlanStore((state) => state.date);

  const plan = { activityId, location, date };
  const planReady = isPlanReadyForRecommendation(plan);
  useHourlyForecast(toHourlyForecastInput(plan));

  const activity =
    activityId !== null ? getActivityById(activityId) : null;

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <View className="absolute -right-24 -top-28 h-60 w-60 rounded-full bg-blue opacity-20" />
      <View className="absolute -bottom-28 -left-24 h-52 w-52 rounded-full bg-green-bright opacity-15" />

      <View className="flex-1 justify-between px-5 pb-7 pt-2">
        <View>
          <View className="mb-5 flex-row items-center justify-between">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              className="h-[42px] w-[42px] items-center justify-center rounded-full border border-line bg-surface"
              onPress={() => router.back()}
            >
              <ClimioIcon name="arrow-left" size={18} color={colors.ink} />
            </Pressable>
            <ThemeToggle />
          </View>

          <Text className="font-sans text-[10px] font-extrabold uppercase tracking-[1.65px] text-green">
            Quase lá
          </Text>
          <Text className="mt-2 font-sans text-[28px] font-extrabold leading-tight tracking-tight text-ink">
            Vamos conferir seu plano
          </Text>
          <Text className="mt-2.5 mb-6 font-sans text-sm leading-5 text-ink-soft">
            Usaremos a previsão hora a hora para encontrar a melhor combinação.
          </Text>

          <View className="items-center rounded-[28px] border border-line bg-surface-soft px-5 pb-2 pt-6">
            <View className="h-16 w-16 items-center justify-center rounded-[18px] bg-green">
              {activity ? (
                <ClimioIcon name={activity.id} size={30} color={onGreen} />
              ) : (
                <ClimioIcon name="check" size={28} color={onGreen} />
              )}
            </View>

            <View className="mt-5 w-full">
              <SummaryLine
                label="Atividade"
                value={activity?.name ?? 'Não selecionada'}
              />
              <View className="h-px bg-line" />
              <SummaryLine
                label="Local"
                value={
                  location
                    ? formatLocationLabel(location.name, location.region)
                    : 'Não selecionado'
                }
              />
              <View className="h-px bg-line" />
              <SummaryLine label="Data" value={formatPlanDateLabel(date)} />
            </View>
          </View>

          <View className="mt-4 flex-row items-start gap-3 rounded-[18px] border border-line bg-surface px-4 py-3.5">
            <ClimioIcon name="compass" size={20} color={colors.blue} />
            <View className="flex-1">
              <Text className="font-sans text-[14px] font-extrabold text-ink">
                Como escolhemos?
              </Text>
              <Text className="mt-0.5 font-sans text-[12px] leading-4 text-ink-soft">
                Analisamos chuva, temperatura, vento e conforto para sua
                atividade.
              </Text>
            </View>
          </View>

          {!planReady ? (
            <View className="mt-4 rounded-lg border border-warning bg-warning-soft px-4 py-3">
              <Text className="font-sans text-sm font-bold text-ink">
                Plano incompleto
              </Text>
              <Text className="mt-1 font-sans text-[11px] text-ink-soft">
                Selecione atividade, localização e data para continuar.
              </Text>
            </View>
          ) : null}
        </View>

        <View className="gap-2">
          <Pressable
            accessibilityRole="button"
            disabled={!planReady}
            className={`min-h-[54px] flex-row items-center justify-center rounded-lg px-5 ${
              planReady ? 'bg-green active:opacity-90' : 'bg-surface-soft'
            }`}
            onPress={() => {
              if (!planReady) {
                return;
              }
              router.push('/result');
            }}
          >
            <Text
              className="font-sans text-[14px] font-extrabold"
              style={{ color: planReady ? onGreen : colors.inkSoft }}
            >
              Analisar melhor horário
            </Text>
            <View className="ml-2">
              <ClimioIcon
                name="arrow-right"
                size={16}
                color={planReady ? onGreen : colors.inkSoft}
              />
            </View>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            className="min-h-11 items-center justify-center"
            onPress={() => router.replace('/home')}
          >
            <Text className="font-sans text-sm font-bold text-ink">
              Editar plano
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-3.5">
      <Text className="font-sans text-[10px] font-extrabold uppercase tracking-[1.2px] text-ink-soft">
        {label}
      </Text>
      <Text className="font-sans text-[15px] font-extrabold text-ink">
        {value}
      </Text>
    </View>
  );
}
