import { useRouter } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getActivityById } from '@/features/activity/domain/activities';
import { formatPlanDateShortLabel } from '@/features/plan/presentation/plan-date-format';
import { usePlanRecommendation } from '@/features/recommendation/hooks/use-plan-recommendation';
import {
  buildNoRecommendationSummary,
  type NoRecommendationSummary,
} from '@/features/recommendation/presentation/no-recommendation-summary';
import {
  buildWhyThisWindowBody,
  buildWindowHeadline,
  formatLocalClockTime,
  formatWindowRangeLabel,
  formatWindowScorePercent,
  getWindowPeriodIcon,
  getWindowQualityLabel,
  summarizeWindowWeather,
} from '@/features/recommendation/presentation/window-format';
import type { RecommendationWindow } from '@/features/recommendation/domain/types';
import { useClimioTheme } from '@/providers/theme-provider';
import { lightColors } from '@/shared/theme/tokens';
import { ClimioIcon, type ClimioIconName } from '@/shared/ui/climio-icon';
import { ThemeToggle } from '@/shared/ui/theme-toggle';

const onGreen = lightColors.surface;

export default function ResultScreen() {
  const router = useRouter();
  const { colors } = useClimioTheme();
  const { plan, planReady, forecastQuery, recommendation } =
    usePlanRecommendation();

  const activity =
    plan.activityId !== null ? getActivityById(plan.activityId) : null;
  const locationLabel = plan.location
    ? [plan.location.name, plan.location.region].filter(Boolean).join(', ')
    : null;
  const dateShort = formatPlanDateShortLabel(plan.date);

  if (!planReady) {
    return (
      <ResultShell onBack={() => router.back()}>
        <StateCard
          title="Plano incompleto"
          body="Escolha atividade, localização e data antes de analisar o clima."
          actionLabel="Voltar e completar"
          onAction={() => router.replace('/home')}
        />
      </ResultShell>
    );
  }

  if (forecastQuery.isPending || forecastQuery.isFetching) {
    return (
      <LoadingState
        activityName={activity?.name ?? 'atividade'}
        onBack={() => router.back()}
      />
    );
  }

  if (forecastQuery.isError) {
    return (
      <StatusScreen>
        <ForecastErrorState
          onRetry={() => {
            void forecastQuery.refetch();
          }}
          onGoHome={() => router.replace('/home')}
        />
      </StatusScreen>
    );
  }

  if (!recommendation || recommendation.recommendation === null) {
    const emptySummary = buildNoRecommendationSummary(
      recommendation?.analyzedPeriods ?? [],
    );

    return (
      <StatusScreen>
        <NoRecommendationState
          summary={emptySummary}
          onChooseDate={() => router.replace('/home')}
        />
      </StatusScreen>
    );
  }

  const best = recommendation.recommendation;
  const weatherSummary = summarizeWindowWeather(best);
  const quality = getWindowQualityLabel(best.averagePercentage);
  const alternatives = [...recommendation.alternatives]
    .sort((a, b) => a.startTimestamp.localeCompare(b.startTimestamp))
    .slice(0, 3);
  const whyBody = buildWhyThisWindowBody(
    best,
    recommendation.explanation,
    activity?.name ?? null,
  );
  const contextLine = [
    activity?.name,
    locationLabel ? `em ${locationLabel}` : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <ResultShell onBack={() => router.back()}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10"
        showsVerticalScrollIndicator={false}
      >
        <Text className="font-sans text-[10px] font-extrabold uppercase tracking-[1.65px] text-green">
          Sua melhor janela
        </Text>
        <Text className="mt-2 font-sans text-[28px] font-extrabold leading-tight text-ink">
          O clima está do seu lado.
        </Text>
        <Text className="mt-2 font-sans text-sm text-ink-soft">
          {contextLine}
          {contextLine ? ' · ' : ''}
          {dateShort}
        </Text>

        <View className="mt-6 overflow-hidden rounded-[28px] border border-line bg-surface-soft">
          <View className="px-5 pb-4 pt-5">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-1.5 rounded-full bg-green/15 px-3 py-1.5">
                <View className="h-1.5 w-1.5 rounded-full bg-green" />
                <Text className="font-sans text-[11px] font-extrabold text-green">
                  {quality}
                </Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <ClimioIcon name="sun" size={14} color={colors.warning} />
                <Text className="font-sans text-[12px] font-bold text-ink-soft">
                  {formatWindowScorePercent(best)} ideal
                </Text>
              </View>
            </View>

            <Text className="mt-5 font-sans text-[56px] font-extrabold leading-none tracking-tight text-ink">
              {formatLocalClockTime(best.startTimestamp)}
            </Text>
            <Text className="mt-1.5 font-sans text-[15px] font-semibold text-ink-soft">
              até {formatLocalClockTime(best.endTimestamp)}
            </Text>
            <Text className="mt-3 font-sans text-[16px] font-extrabold leading-5 text-ink">
              {buildWindowHeadline(best)}
            </Text>

            <View className="mt-5 flex-row gap-2">
              {weatherSummary.temperatureLabel ? (
                <MetricChip
                  icon="thermometer"
                  value={weatherSummary.temperatureLabel}
                  label="Sensação"
                />
              ) : null}
              {weatherSummary.precipitationLabel ? (
                <MetricChip
                  icon="cloud-rain"
                  value={weatherSummary.precipitationLabel}
                  label="Chuva"
                />
              ) : null}
              {weatherSummary.windLabel ? (
                <MetricChip
                  icon="wind"
                  value={weatherSummary.windLabel}
                  label="Vento"
                />
              ) : null}
            </View>
          </View>

          <View className="flex-row items-start gap-3 border-t border-line bg-surface/70 px-5 py-4">
            <View className="mt-0.5 h-7 w-7 items-center justify-center rounded-full bg-green">
              <ClimioIcon name="check" size={14} color={onGreen} />
            </View>
            <View className="flex-1">
              <Text className="font-sans text-[14px] font-extrabold text-ink">
                Por que esse horário?
              </Text>
              <Text className="mt-1 font-sans text-[12px] leading-4 text-ink-soft">
                {whyBody}
              </Text>
            </View>
          </View>
        </View>

        {alternatives.length > 0 ? (
          <View className="mt-8">
            <Text className="font-sans text-[10px] font-extrabold uppercase tracking-[1.2px] text-green">
              Outras opções
            </Text>
            <Text className="mt-1 font-sans text-lg font-extrabold text-ink">
              Seus próximos melhores horários
            </Text>
            <View className="mt-3 gap-2.5">
              {alternatives.map((window) => (
                <AlternativeCard key={window.startTimestamp} window={window} />
              ))}
            </View>
          </View>
        ) : null}

      </ScrollView>
    </ResultShell>
  );
}

function LoadingState({
  activityName,
  onBack,
}: {
  activityName: string;
  onBack: () => void;
}) {
  const { colors } = useClimioTheme();
  const [progress, setProgress] = useState(0.22);

  useEffect(() => {
    const id = setInterval(() => {
      setProgress((current) => {
        if (current >= 0.92) {
          return 0.35;
        }
        return Math.min(0.92, current + 0.07);
      });
    }, 380);

    return () => clearInterval(id);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <View className="absolute -right-24 -top-28 h-60 w-60 rounded-full bg-blue opacity-20" />
      <View className="absolute -bottom-28 -left-24 h-52 w-52 rounded-full bg-green-bright opacity-15" />

      <View className="px-5 pt-2">
        <View className="mb-4 flex-row items-center justify-between">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            className="h-[42px] w-[42px] items-center justify-center rounded-full border border-line bg-surface"
            onPress={onBack}
          >
            <ClimioIcon name="arrow-left" size={18} color={colors.ink} />
          </Pressable>
          <ThemeToggle />
        </View>
      </View>

      <View className="flex-1 items-center justify-center px-8 pb-16">
        <ClimioIcon name="partly-cloudy" size={72} color={colors.blue} />

        <Text className="mt-10 font-sans text-[10px] font-extrabold uppercase tracking-[1.65px] text-green">
          Analisando condições
        </Text>
        <Text className="mt-3 text-center font-sans text-[28px] font-extrabold leading-tight text-ink">
          Procurando o céu ideal...
        </Text>
        <Text className="mt-3 max-w-[300px] text-center font-sans text-sm leading-5 text-ink-soft">
          Cruzando a previsão com o que deixa sua {activityName.toLowerCase()}{' '}
          mais confortável.
        </Text>

        <View className="mt-8 h-2 w-full max-w-[280px] overflow-hidden rounded-full bg-line">
          <View
            className="h-full rounded-full bg-green-bright"
            style={{
              width: `${Math.round(progress * 100)}%`,
              backgroundColor: colors.greenBright,
            }}
          />
        </View>
        <Text className="mt-3 font-sans text-[11px] text-ink-soft">
          Isso leva só alguns segundos
        </Text>
      </View>
    </SafeAreaView>
  );
}

function ResultShell({
  children,
  onBack,
}: {
  children: ReactNode;
  onBack: () => void;
}) {
  const { colors } = useClimioTheme();

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <View className="absolute -right-24 -top-28 h-60 w-60 rounded-full bg-blue opacity-15" />
      <View className="px-5 pt-2">
        <View className="mb-4 flex-row items-center justify-between">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            className="h-[42px] w-[42px] items-center justify-center rounded-full border border-line bg-surface"
            onPress={onBack}
          >
            <ClimioIcon name="arrow-left" size={18} color={colors.ink} />
          </Pressable>
          <ThemeToggle />
        </View>
      </View>
      {children}
    </SafeAreaView>
  );
}

function StatusScreen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <View className="absolute -right-24 -top-28 h-60 w-60 rounded-full bg-blue opacity-20" />
      <View className="absolute -bottom-28 -left-24 h-52 w-52 rounded-full bg-green-bright opacity-15" />
      {children}
    </SafeAreaView>
  );
}

function StateCard({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <View className="flex-1 justify-center px-6">
      <View className="rounded-xl border border-line bg-surface px-5 py-6">
        <Text className="font-sans text-xl font-extrabold text-ink">
          {title}
        </Text>
        <Text className="mt-2 font-sans text-sm leading-5 text-ink-soft">
          {body}
        </Text>
        <Pressable
          accessibilityRole="button"
          className="mt-5 min-h-[48px] items-center justify-center rounded-lg bg-green"
          onPress={onAction}
        >
          <Text
            className="font-sans text-[13px] font-extrabold"
            style={{ color: onGreen }}
          >
            {actionLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function ForecastErrorState({
  onRetry,
  onGoHome,
}: {
  onRetry: () => void;
  onGoHome: () => void;
}) {
  const { colors } = useClimioTheme();

  return (
    <View className="flex-1 px-6 pb-8">
      <View className="flex-1 items-center justify-center">
        <IconHalo tone="danger">
          <ClimioIcon name="alert" size={34} color={colors.danger} />
        </IconHalo>

        <Text className="mt-8 font-sans text-[10px] font-extrabold uppercase tracking-[1.65px] text-green">
          Ops, o tempo fechou
        </Text>
        <Text className="mt-2 max-w-[300px] text-center font-sans text-[28px] font-extrabold leading-tight text-ink">
          Não conseguimos ver a previsão
        </Text>
        <Text className="mt-3 max-w-[300px] text-center font-sans text-sm leading-5 text-ink-soft">
          Parece que houve uma instabilidade. Sua seleção está salva — tente
          novamente em instantes.
        </Text>
      </View>

      <View className="gap-3">
        <Pressable
          accessibilityRole="button"
          className="min-h-[52px] flex-row items-center justify-center gap-2 rounded-lg bg-green"
          onPress={onRetry}
        >
          <Text
            className="font-sans text-[14px] font-extrabold"
            style={{ color: onGreen }}
          >
            Tentar novamente
          </Text>
          <ClimioIcon name="arrow-right" size={16} color={onGreen} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          className="min-h-11 items-center justify-center"
          onPress={onGoHome}
        >
          <Text className="font-sans text-sm font-bold text-ink">
            Voltar ao início
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function NoRecommendationState({
  summary,
  onChooseDate,
}: {
  summary: NoRecommendationSummary;
  onChooseDate: () => void;
}) {
  const { colors } = useClimioTheme();

  return (
    <View className="flex-1 px-6 pb-8">
      <View className="flex-1 items-center justify-center">
        <IconHalo tone="blue">
          <ClimioIcon name="cloud-rain" size={32} color={colors.blue} />
        </IconHalo>

        <Text className="mt-8 font-sans text-[10px] font-extrabold uppercase tracking-[1.65px] text-green">
          {summary.eyebrow}
        </Text>
        <Text className="mt-2 max-w-[300px] text-center font-sans text-[28px] font-extrabold leading-tight text-ink">
          {summary.title}
        </Text>
        <Text className="mt-3 max-w-[300px] text-center font-sans text-sm leading-5 text-ink-soft">
          {summary.body}
        </Text>

        {summary.reasons.length > 0 ? (
          <View className="mt-6 w-full overflow-hidden rounded-[22px] border border-line bg-surface">
            {summary.reasons.map((reason, index) => (
              <View key={reason.id}>
                {index > 0 ? <View className="mx-4 h-px bg-line" /> : null}
                <View className="flex-row items-start gap-3 px-4 py-4">
                  <View className="mt-0.5 h-9 w-9 items-center justify-center rounded-[12px] bg-surface-blue">
                    <ClimioIcon
                      name={reason.icon}
                      size={18}
                      color={colors.blue}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="font-sans text-[15px] font-extrabold text-ink">
                      {reason.title}
                    </Text>
                    {reason.detail ? (
                      <Text className="mt-0.5 font-sans text-[12px] text-ink-soft">
                        {reason.detail}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <Pressable
        accessibilityRole="button"
        className="min-h-[52px] flex-row items-center justify-center gap-2 rounded-lg bg-green"
        onPress={onChooseDate}
      >
        <Text
          className="font-sans text-[14px] font-extrabold"
          style={{ color: onGreen }}
        >
          Escolher outra data
        </Text>
        <ClimioIcon name="arrow-right" size={16} color={onGreen} />
      </Pressable>
    </View>
  );
}

function IconHalo({
  children,
  tone,
}: {
  children: ReactNode;
  tone: 'danger' | 'blue';
}) {
  const tileClass =
    tone === 'danger' ? 'bg-danger-soft' : 'bg-surface-blue';

  return (
    <View className="h-[140px] w-[140px] items-center justify-center">
      <View
        className="absolute h-[132px] w-[132px] rounded-[40px] border border-line opacity-35"
        style={{ transform: [{ rotate: '14deg' }] }}
      />
      <View
        className="absolute h-[112px] w-[112px] rounded-[34px] border border-line opacity-45"
        style={{ transform: [{ rotate: '-10deg' }] }}
      />
      <View
        className={`h-[72px] w-[72px] items-center justify-center rounded-[22px] ${tileClass}`}
      >
        {children}
      </View>
    </View>
  );
}

function MetricChip({
  icon,
  value,
  label,
}: {
  icon: ClimioIconName;
  value: string;
  label: string;
}) {
  const { colors } = useClimioTheme();

  return (
    <View className="flex-1 items-center rounded-[16px] bg-surface px-2 py-3">
      <ClimioIcon name={icon} size={16} color={colors.inkSoft} />
      <Text className="mt-1.5 font-sans text-[15px] font-extrabold text-ink">
        {value}
      </Text>
      <Text className="mt-0.5 font-sans text-[10px] font-semibold text-ink-soft">
        {label}
      </Text>
    </View>
  );
}

function AlternativeCard({ window }: { window: RecommendationWindow }) {
  const { colors } = useClimioTheme();
  const weather = summarizeWindowWeather(window);
  const quality = getWindowQualityLabel(window.averagePercentage);
  const isLessFavorable = quality === 'Menos favorável';
  const periodIcon = getWindowPeriodIcon(window);

  return (
    <View className="min-h-[68px] flex-row items-center gap-3 rounded-[18px] border border-line bg-surface px-4 py-3.5">
      <View className="flex-1">
        <Text className="font-sans text-base font-extrabold text-ink">
          {formatWindowRangeLabel(window)}
        </Text>
      </View>
      <View className="flex-row items-center gap-2">
        <ClimioIcon name={periodIcon} size={16} color={colors.inkSoft} />
        {weather.temperatureLabel ? (
          <Text className="font-sans text-[13px] font-bold text-ink">
            {weather.temperatureLabel}
          </Text>
        ) : null}
        <View className="flex-row items-center gap-1.5 rounded-full bg-surface-soft px-2.5 py-1">
          <View
            className="h-1.5 w-1.5 rounded-full"
            style={{
              backgroundColor: isLessFavorable ? colors.gray : colors.green,
            }}
          />
          <Text
            className="font-sans text-[11px] font-bold"
            style={{
              color: isLessFavorable ? colors.inkSoft : colors.green,
            }}
          >
            {quality}
          </Text>
        </View>
      </View>
    </View>
  );
}
