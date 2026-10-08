import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getActivityById,
  listQuickActivities,
  type ActivityId,
} from '@/features/activity/domain/activities';
import { ActivityBottomSheet } from '@/features/activity/presentation/activity-bottom-sheet';
import type { Location } from '@/features/location/domain/location';
import { LocationBottomSheet } from '@/features/location/presentation/location-bottom-sheet';
import { isPlanReadyForRecommendation } from '@/features/plan/domain/plan';
import { DateBottomSheet } from '@/features/plan/presentation/date-bottom-sheet';
import { formatPlanDateLabel } from '@/features/plan/presentation/plan-date-format';
import { usePlanStore } from '@/features/plan/store/plan-store';
import { useClimioTheme } from '@/providers/theme-provider';
import { lightColors } from '@/shared/theme/tokens';
import { ClimioIcon } from '@/shared/ui/climio-icon';
import { ThemeToggle } from '@/shared/ui/theme-toggle';

const onGreen = lightColors.surface;
const QUICK_ACTIVITIES = listQuickActivities();

/** Home: compose Activity + Location + Date before requesting a recommendation. */
export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useClimioTheme();
  const [activitySheetOpen, setActivitySheetOpen] = useState(false);
  const [locationSheetOpen, setLocationSheetOpen] = useState(false);
  const [dateSheetOpen, setDateSheetOpen] = useState(false);
  const [nlDraft, setNlDraft] = useState('');

  const activityId = usePlanStore((state) => state.activityId);
  const location = usePlanStore((state) => state.location);
  const date = usePlanStore((state) => state.date);
  const setActivityId = usePlanStore((state) => state.setActivityId);
  const setLocation = usePlanStore((state) => state.setLocation);
  const setDate = usePlanStore((state) => state.setDate);

  const selectedActivity =
    activityId !== null ? getActivityById(activityId) : null;
  const locationLabel = location
    ? [location.name, location.region].filter(Boolean).join(', ')
    : 'Escolher local';
  const dateLabel = formatPlanDateLabel(date);
  const planReady = isPlanReadyForRecommendation({
    activityId,
    location,
    date,
  });

  function selectActivity(id: ActivityId) {
    setActivityId(id);
    setActivitySheetOpen(false);
  }

  function selectLocation(next: Location) {
    setLocation(next);
    setLocationSheetOpen(false);
  }

  function handleFindBestMoment() {
    if (activityId === null) {
      setActivitySheetOpen(true);
      return;
    }
    if (location === null) {
      setLocationSheetOpen(true);
      return;
    }
    if (!planReady) {
      setDateSheetOpen(true);
      return;
    }
    router.push('/summary');
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <View className="absolute -right-24 -top-28 h-60 w-60 rounded-full bg-blue opacity-20" />
      <View className="absolute -bottom-24 -left-20 h-48 w-48 rounded-full bg-green-bright opacity-15" />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10 pt-2"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-6 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2.5">
            <View className="h-9 w-9 items-center justify-center rounded-sm bg-green">
              <ClimioIcon name="wind" size={18} color={onGreen} />
            </View>
            <Text className="font-sans text-[21px] font-extrabold tracking-tight text-ink">
              climio
            </Text>
          </View>
          <ThemeToggle />
        </View>

        <Text className="font-sans text-[10px] font-extrabold uppercase tracking-[1.65px] text-green">
          Previsão para a vida real
        </Text>
        <Text className="mt-2 font-sans text-[28px] font-extrabold leading-tight tracking-tight text-ink">
          Qual é o melhor momento para você sair?
        </Text>
        <Text className="mt-2.5 font-sans text-sm leading-5 text-ink-soft">
          Conte seus planos. A gente encontra a melhor janela no tempo.
        </Text>

        <View className="mt-5 min-h-[54px] flex-row items-center rounded-xl border border-line bg-surface px-3.5">
          <ClimioIcon name="search" size={18} color={colors.inkSoft} />
          <TextInput
            value={nlDraft}
            onChangeText={setNlDraft}
            placeholder="Ex: correr amanhã no Ibirapuera"
            placeholderTextColor={colors.gray}
            editable={false}
            className="ml-2.5 flex-1 font-sans text-sm text-ink"
            accessibilityLabel="Busca por linguagem natural (em breve)"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Entrada por voz (em breve)"
            className="h-9 w-9 items-center justify-center rounded-full bg-surface-soft"
            disabled
          >
            <ClimioIcon name="mic" size={16} color={colors.inkSoft} />
          </Pressable>
        </View>

        <View className="mt-7 flex-row items-center justify-between">
          <Text className="font-sans text-base font-extrabold text-ink">
            Atividades rápidas
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setActivitySheetOpen(true)}
          >
            <Text className="font-sans text-sm font-bold text-green">
              Ver todas
            </Text>
          </Pressable>
        </View>

        <View className="mt-3.5 flex-row items-start justify-between">
          {QUICK_ACTIVITIES.map((activity) => {
            const selected = activityId === activity.id;

            return (
              <Pressable
                key={activity.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                className="w-[76px] items-center"
                onPress={() => selectActivity(activity.id)}
              >
                <View
                  className={`h-[76px] w-[76px] items-center justify-center rounded-[22px] ${
                    selected ? 'bg-green' : 'bg-surface-soft'
                  }`}
                  style={
                    selected
                      ? {
                          shadowColor: colors.green,
                          shadowOpacity: 0.28,
                          shadowRadius: 10,
                          shadowOffset: { width: 0, height: 4 },
                          elevation: 3,
                        }
                      : undefined
                  }
                >
                  <ClimioIcon
                    name={activity.id}
                    size={28}
                    color={selected ? onGreen : colors.green}
                  />
                </View>
                <Text className="mt-2 text-center font-sans text-[12px] font-bold text-ink">
                  {activity.name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {selectedActivity &&
        !QUICK_ACTIVITIES.some((item) => item.id === selectedActivity.id) ? (
          <View className="mt-3 flex-row items-center gap-3 rounded-lg border border-green bg-surface px-3.5 py-3">
            <View className="h-10 w-10 items-center justify-center rounded-md bg-green">
              <ClimioIcon
                name={selectedActivity.id}
                size={20}
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

        <View className="mt-6 overflow-hidden rounded-xl border border-line bg-surface">
          <PlanFieldRow
            label="Onde"
            value={locationLabel}
            iconName="location"
            iconTone="blue"
            placeholder={location === null}
            onPress={() => setLocationSheetOpen(true)}
          />
          <View className="mx-4 h-px bg-line" />
          <PlanFieldRow
            label="Quando"
            value={dateLabel}
            iconName="calendar"
            iconTone="green"
            onPress={() => setDateSheetOpen(true)}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          className="mt-6 min-h-[54px] flex-row items-center justify-center rounded-lg bg-green px-5 active:opacity-90"
          onPress={handleFindBestMoment}
        >
          <Text
            className="font-sans text-[14px] font-extrabold"
            style={{ color: onGreen }}
          >
            Encontrar melhor momento
          </Text>
          <View className="ml-2">
            <ClimioIcon name="arrow-right" size={18} color={onGreen} />
          </View>
        </Pressable>

        <View className="mt-3 flex-row items-center justify-center gap-2">
          <ClimioIcon name="cloud" size={14} color={colors.blue} />
          <Text className="font-sans text-[10px] text-ink-soft">
            Previsão hora a hora, sem complicação
          </Text>
        </View>
      </ScrollView>

      <ActivityBottomSheet
        visible={activitySheetOpen}
        selectedActivityId={activityId}
        onSelect={selectActivity}
        onClose={() => setActivitySheetOpen(false)}
      />
      <LocationBottomSheet
        visible={locationSheetOpen}
        selectedLocation={location}
        onSelect={selectLocation}
        onClose={() => setLocationSheetOpen(false)}
      />
      <DateBottomSheet
        visible={dateSheetOpen}
        selectedDate={date}
        onSelect={setDate}
        onClose={() => setDateSheetOpen(false)}
      />
    </SafeAreaView>
  );
}

function PlanFieldRow({
  label,
  value,
  iconName,
  iconTone,
  placeholder = false,
  onPress,
}: {
  label: string;
  value: string;
  iconName: 'location' | 'calendar';
  iconTone: 'blue' | 'green';
  placeholder?: boolean;
  onPress: () => void;
}) {
  const { colors } = useClimioTheme();
  const iconColor = iconTone === 'blue' ? colors.blue : colors.green;
  const iconBg =
    iconTone === 'blue' ? 'bg-surface-blue' : 'bg-surface-soft';

  return (
    <Pressable
      accessibilityRole="button"
      className="min-h-[68px] flex-row items-center gap-3 px-4 py-3.5 active:opacity-90"
      onPress={onPress}
    >
      <View
        className={`h-10 w-10 items-center justify-center rounded-[12px] ${iconBg}`}
      >
        <ClimioIcon name={iconName} size={18} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text className="font-sans text-[9px] font-extrabold uppercase tracking-[1.2px] text-ink-soft">
          {label}
        </Text>
        <Text
          className={`mt-0.5 font-sans text-[15px] font-extrabold ${
            placeholder ? 'text-ink-soft' : 'text-ink'
          }`}
        >
          {value}
        </Text>
      </View>
      <ClimioIcon name="chevron-right" size={18} color={colors.inkSoft} />
    </Pressable>
  );
}
