import {
  Dimensions,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  getPlanDateParts,
  listSelectablePlanDates,
} from '@/features/plan/presentation/plan-date-format';
import { useClimioTheme } from '@/providers/theme-provider';
import { lightColors } from '@/shared/theme/tokens';
import { ClimioIcon } from '@/shared/ui/climio-icon';

const onGreen = lightColors.surface;
const SELECTABLE_DAY_COUNT = 7;

type DateBottomSheetProps = {
  visible: boolean;
  selectedDate: string;
  onSelect: (date: string) => void;
  onClose: () => void;
};

function capitalizeMonth(monthLabel: string): string {
  if (monthLabel.length === 0) {
    return monthLabel;
  }
  return monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
}

/**
 * Date picker bottom sheet — matches fluxo-4 ("Para quando?").
 */
export function DateBottomSheet({
  visible,
  selectedDate,
  onSelect,
  onClose,
}: DateBottomSheetProps) {
  const { colors } = useClimioTheme();
  const insets = useSafeAreaInsets();
  const selectableDates = listSelectablePlanDates(SELECTABLE_DAY_COUNT);
  const windowHeight = Dimensions.get('window').height;
  const sheetMaxHeight = windowHeight * 0.78;

  const rows: string[][] = [];
  for (let index = 0; index < selectableDates.length; index += 4) {
    rows.push([...selectableDates.slice(index, index + 4)]);
  }

  function handleSelect(date: string) {
    onSelect(date);
    onClose();
  }

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
          accessibilityLabel="Fechar escolha de data"
          className="absolute inset-0"
          style={{ backgroundColor: 'rgba(24, 48, 44, 0.45)' }}
          onPress={onClose}
        />

        <View
          style={{
            maxHeight: sheetMaxHeight,
            backgroundColor: colors.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: Math.max(insets.bottom, 16),
          }}
        >
          <View className="mb-4 items-center">
            <View
              className="h-1 w-10 rounded-full"
              style={{ backgroundColor: colors.line }}
            />
          </View>

          <View className="mb-5 flex-row items-start justify-between gap-3">
            <View className="flex-1 pr-2">
              <Text
                className="font-sans text-[22px] font-extrabold"
                style={{ color: colors.ink }}
              >
                Para quando?
              </Text>
              <Text
                className="mt-1.5 font-sans text-[13px] leading-5"
                style={{ color: colors.inkSoft }}
              >
                Previsão disponível para os próximos 7 dias.
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              className="h-9 w-9 items-center justify-center rounded-full border"
              style={{
                borderColor: colors.line,
                backgroundColor: colors.surface,
              }}
              onPress={onClose}
            >
              <ClimioIcon name="close" size={15} color={colors.ink} />
            </Pressable>
          </View>

          <View className="gap-2.5">
            {rows.map((row) => (
              <View key={row.join('-')} className="flex-row gap-2.5">
                {row.map((item) => {
                  const parts = getPlanDateParts(item);
                  const selected = item === selectedDate;
                  const dayLabel = parts?.relativeLabel ?? parts?.weekdayLabel;
                  const month = capitalizeMonth(parts?.monthLabel ?? '');

                  return (
                    <Pressable
                      key={item}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      className="relative min-h-[96px] flex-1 items-center justify-center rounded-[18px] border px-1 py-3"
                      style={{
                        borderColor: selected ? colors.green : colors.line,
                        backgroundColor: selected ? colors.green : colors.surface,
                      }}
                      onPress={() => handleSelect(item)}
                    >
                      {selected ? (
                        <View
                          className="absolute right-2 top-2 h-[18px] w-[18px] items-center justify-center rounded-full"
                          style={{ backgroundColor: onGreen }}
                        >
                          <ClimioIcon name="check" size={10} color={colors.green} />
                        </View>
                      ) : null}
                      <Text
                        className="font-sans text-[11px] font-bold"
                        style={{ color: selected ? onGreen : colors.inkSoft }}
                      >
                        {dayLabel}
                      </Text>
                      <Text
                        className="mt-1 font-sans text-[26px] font-extrabold leading-none"
                        style={{ color: selected ? onGreen : colors.ink }}
                      >
                        {parts?.dayNumber}
                      </Text>
                      <Text
                        className="mt-1 font-sans text-[11px] font-semibold"
                        style={{ color: selected ? onGreen : colors.inkSoft }}
                      >
                        {month}
                      </Text>
                    </Pressable>
                  );
                })}
                {row.length < 4
                  ? Array.from({ length: 4 - row.length }).map((_, index) => (
                      <View key={`pad-${index}`} className="flex-1" />
                    ))
                  : null}
              </View>
            ))}
          </View>

          <View
            className="mt-5 flex-row items-start gap-3 rounded-[16px] px-3.5 py-3.5"
            style={{ backgroundColor: colors.surfaceBlue }}
          >
            <ClimioIcon name="cloud" size={20} color={colors.blue} />
            <View className="flex-1">
              <Text
                className="font-sans text-[13px] font-extrabold"
                style={{ color: colors.blueDeep }}
              >
                Previsão mais precisa
              </Text>
              <Text
                className="mt-0.5 font-sans text-[12px] leading-4"
                style={{ color: colors.inkSoft }}
              >
                Resultados para hoje e amanhã têm maior confiança.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
