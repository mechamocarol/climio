import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ACTIVITIES,
  type ActivityId,
} from '@/features/activity/domain/activities';
import { useClimioTheme } from '@/providers/theme-provider';
import { lightColors } from '@/shared/theme/tokens';
import { ClimioIcon } from '@/shared/ui/climio-icon';

const onGreen = lightColors.surface;

type ActivityBottomSheetProps = {
  visible: boolean;
  selectedActivityId: ActivityId | null;
  onSelect: (activityId: ActivityId) => void;
  onClose: () => void;
};

/**
 * Modal bottom sheet with a 2-column activity grid (Figma prototype).
 * Presentation-only — selection is handled by the parent.
 */
export function ActivityBottomSheet({
  visible,
  selectedActivityId,
  onSelect,
  onClose,
}: ActivityBottomSheetProps) {
  const { colors } = useClimioTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar lista de atividades"
          className="absolute inset-0 bg-ink/45"
          onPress={onClose}
        />

        <View
          className="max-h-[82%] rounded-t-[28px] bg-surface px-5 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <View className="mb-4 items-center">
            <View className="h-1 w-10 rounded-full bg-line" />
          </View>

          <View className="mb-1 flex-row items-start justify-between gap-3">
            <View className="flex-1 pr-2">
              <Text className="font-sans text-[22px] font-extrabold leading-tight text-ink">
                Escolha uma atividade
              </Text>
              <Text className="mt-1.5 font-sans text-[13px] leading-5 text-ink-soft">
                Cada atividade tem condições ideais diferentes.
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              className="h-9 w-9 items-center justify-center rounded-full border border-line bg-surface"
              onPress={onClose}
            >
              <ClimioIcon name="close" size={15} color={colors.ink} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerClassName="flex-row flex-wrap justify-between gap-y-2.5 pb-3 pt-5"
          >
            {ACTIVITIES.map((activity) => {
              const selected = selectedActivityId === activity.id;

              return (
                <Pressable
                  key={activity.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  className={`relative min-h-[74px] w-[48.5%] flex-row items-center gap-2.5 rounded-[18px] border px-2.5 py-2.5 ${
                    selected
                      ? 'border-green bg-surface-soft'
                      : 'border-line bg-surface'
                  }`}
                  onPress={() => onSelect(activity.id)}
                >
                  {selected ? (
                    <View className="absolute right-2 top-2 h-[18px] w-[18px] items-center justify-center rounded-full bg-green">
                      <ClimioIcon name="check" size={10} color={onGreen} />
                    </View>
                  ) : null}

                  <View
                    className={`h-11 w-11 items-center justify-center rounded-[12px] ${
                      selected ? 'bg-green' : 'bg-surface-soft'
                    }`}
                  >
                    <ClimioIcon
                      name={activity.id}
                      size={20}
                      color={selected ? onGreen : colors.green}
                    />
                  </View>
                  <Text
                    className="flex-1 pr-1 font-sans text-[12px] font-bold leading-4 text-ink"
                    numberOfLines={2}
                  >
                    {activity.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
