import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Location } from '@/features/location/domain/location';
import { useSearchLocations } from '@/features/location/hooks/use-search-locations';
import {
  formatLocationDetail,
  listRecentLocations,
  rememberRecentLocation,
} from '@/features/location/presentation/recent-locations';
import { useClimioTheme } from '@/providers/theme-provider';
import { ClimioIcon } from '@/shared/ui/climio-icon';

type LocationBottomSheetProps = {
  visible: boolean;
  selectedLocation: Location | null;
  onSelect: (location: Location) => void;
  onClose: () => void;
};

/**
 * Location picker bottom sheet matching the home prototype.
 * GPS row is visible but not wired yet.
 */
export function LocationBottomSheet({
  visible,
  selectedLocation,
  onSelect,
  onClose,
}: LocationBottomSheetProps) {
  const { colors } = useClimioTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState(() => [...listRecentLocations()]);
  const search = useSearchLocations(query);

  const windowHeight = Dimensions.get('window').height;
  const sheetMaxHeight = windowHeight * 0.78;
  const sheetMinHeight = windowHeight * 0.52;

  useEffect(() => {
    if (visible) {
      setRecent([...listRecentLocations()]);
    } else {
      setQuery('');
    }
  }, [visible]);

  const trimmedQuery = query.trim();
  const showIdle = trimmedQuery.length === 0;

  const results = search.data ?? [];
  const showLoading = !showIdle && search.isFetching;
  const showError = !showIdle && search.isError;
  const showEmpty =
    !showIdle && !search.isFetching && search.isSuccess && results.length === 0;
  const showResults =
    !showIdle && !search.isFetching && search.isSuccess && results.length > 0;

  function handleSelect(location: Location) {
    rememberRecentLocation(location);
    setRecent([...listRecentLocations()]);
    onSelect(location);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        className="flex-1 justify-end"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar busca de local"
          className="absolute inset-0"
          style={{ backgroundColor: 'rgba(24, 48, 44, 0.45)' }}
          onPress={onClose}
        />

        <View
          style={{
            minHeight: sheetMinHeight,
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

          <View className="mb-4 flex-row items-center justify-between">
            <Text
              className="font-sans text-[22px] font-extrabold"
              style={{ color: colors.ink }}
            >
              Onde você vai?
            </Text>
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

          <View
            className="mb-3 min-h-[48px] flex-row items-center rounded-full px-4"
            style={{ backgroundColor: colors.surfaceSoft }}
          >
            <ClimioIcon name="search" size={18} color={colors.inkSoft} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar cidade ou bairro"
              placeholderTextColor={colors.gray}
              autoCapitalize="words"
              autoCorrect={false}
              className="ml-2.5 flex-1 font-sans text-sm"
              style={{ color: colors.ink }}
              accessibilityLabel="Buscar cidade ou bairro"
            />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: true }}
            disabled
            className="mb-4 min-h-[60px] flex-row items-center gap-3 opacity-70"
          >
            <View
              className="h-10 w-10 items-center justify-center rounded-[12px]"
              style={{ backgroundColor: colors.surfaceBlue }}
            >
              <ClimioIcon name="location" size={18} color={colors.blue} />
            </View>
            <View className="flex-1">
              <Text
                className="font-sans text-[15px] font-bold"
                style={{ color: colors.ink }}
              >
                Usar minha localização
              </Text>
              <Text
                className="mt-0.5 font-sans text-[12px]"
                style={{ color: colors.inkSoft }}
              >
                Ative a localização do dispositivo
              </Text>
            </View>
            <ClimioIcon name="chevron-right" size={18} color={colors.inkSoft} />
          </Pressable>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={{ flexGrow: 1 }}
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            {showIdle && recent.length > 0 ? (
              <>
                <Text
                  className="mb-2 font-sans text-[10px] font-extrabold uppercase tracking-[1.2px]"
                  style={{ color: colors.inkSoft }}
                >
                  Buscas recentes
                </Text>
                {recent.map((item, index) => (
                  <LocationRow
                    key={item.id}
                    location={item}
                    selected={selectedLocation?.id === item.id}
                    showDivider={index < recent.length - 1}
                    onPress={() => handleSelect(item)}
                  />
                ))}
              </>
            ) : null}

            {showLoading ? (
              <View className="items-center py-8">
                <ActivityIndicator color={colors.blue} />
              </View>
            ) : null}

            {showError ? (
              <Text
                className="py-4 font-sans text-sm"
                style={{ color: colors.danger }}
              >
                Não foi possível buscar locais. Tente de novo.
              </Text>
            ) : null}

            {showEmpty ? (
              <Text
                className="py-4 font-sans text-sm"
                style={{ color: colors.inkSoft }}
              >
                Nenhum local encontrado para “{trimmedQuery}”.
              </Text>
            ) : null}

            {showResults ? (
              <>
                <Text
                  className="mb-2 font-sans text-[10px] font-extrabold uppercase tracking-[1.2px]"
                  style={{ color: colors.inkSoft }}
                >
                  Resultados
                </Text>
                {results.map((item, index) => (
                  <LocationRow
                    key={item.id}
                    location={item}
                    selected={selectedLocation?.id === item.id}
                    showDivider={index < results.length - 1}
                    onPress={() => handleSelect(item)}
                  />
                ))}
              </>
            ) : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function LocationRow({
  location,
  selected,
  showDivider,
  onPress,
}: {
  location: Location;
  selected: boolean;
  showDivider: boolean;
  onPress: () => void;
}) {
  const { colors } = useClimioTheme();
  const detail = formatLocationDetail(location);

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected }}
        className="min-h-[60px] flex-row items-center gap-3 py-2.5"
        onPress={onPress}
      >
        <View
          className="h-10 w-10 items-center justify-center rounded-[12px]"
          style={{ backgroundColor: colors.surfaceBlue }}
        >
          <ClimioIcon name="location" size={18} color={colors.blue} />
        </View>
        <View className="flex-1">
          <Text
            className="font-sans text-[15px] font-bold"
            style={{ color: colors.ink }}
          >
            {location.name}
          </Text>
          {detail ? (
            <Text
              className="mt-0.5 font-sans text-[12px]"
              style={{ color: colors.inkSoft }}
            >
              {detail}
            </Text>
          ) : null}
        </View>
        {selected ? (
          <ClimioIcon name="check" size={18} color={colors.green} />
        ) : null}
      </Pressable>
      {showDivider ? (
        <View
          className="ml-[52px] h-px"
          style={{ backgroundColor: colors.line }}
        />
      ) : null}
    </View>
  );
}
