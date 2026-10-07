import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Location } from '@/features/location/domain/location';
import { useSearchLocations } from '@/features/location/hooks/use-search-locations';
import { usePlanStore } from '@/features/plan/store/plan-store';
import { lightColors } from '@/shared/theme/tokens';
import { ClimioIcon } from '@/shared/ui/climio-icon';

function formatLocationSubtitle(location: Location): string {
  return [location.region, location.country].filter(Boolean).join(', ');
}

export default function LocationPickerScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const selectedLocation = usePlanStore((state) => state.location);
  const setLocation = usePlanStore((state) => state.setLocation);
  const search = useSearchLocations(query);

  const trimmedQuery = query.trim();
  const showIdle = trimmedQuery.length === 0;
  const showLoading = !showIdle && search.isFetching;
  const showError = !showIdle && search.isError;
  const showEmpty =
    !showIdle &&
    !search.isFetching &&
    search.isSuccess &&
    (search.data?.length ?? 0) === 0;
  const showResults =
    !showIdle &&
    !search.isFetching &&
    search.isSuccess &&
    (search.data?.length ?? 0) > 0;

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <View className="absolute -right-24 -top-28 h-60 w-60 rounded-full bg-blue opacity-15" />

      <View className="flex-1 px-5 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          className="mb-5 h-[42px] w-[42px] items-center justify-center rounded-md border border-line bg-surface"
          onPress={() => router.back()}
        >
          <ClimioIcon name="arrow-left" size={18} color={lightColors.ink} />
        </Pressable>

        <Text className="font-sans text-[10px] font-extrabold uppercase tracking-[1.65px] text-green">
          Passo 2
        </Text>
        <Text className="mt-2 font-sans text-[28px] font-extrabold leading-tight tracking-tight text-ink">
          Onde você vai?
        </Text>
        <Text className="mt-2.5 mb-5 font-sans text-sm leading-5 text-ink-soft">
          Busque uma cidade. A previsão usará a localização que você escolher.
        </Text>

        <View className="mb-4 min-h-[54px] flex-row items-center rounded-md border border-line bg-surface-soft px-4">
          <ClimioIcon name="search" size={18} color={lightColors.inkSoft} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Ex: São Paulo"
            placeholderTextColor={lightColors.gray}
            autoCapitalize="words"
            autoCorrect={false}
            className="ml-2.5 flex-1 font-sans text-sm text-ink"
            accessibilityLabel="Buscar cidade"
          />
        </View>

        {selectedLocation ? (
          <View className="mb-4 gap-3">
            <View className="flex-row items-center gap-3 rounded-lg border border-green bg-surface-soft px-3.5 py-3">
              <View className="h-10 w-10 items-center justify-center rounded-md bg-surface-blue">
                <ClimioIcon
                  name="location"
                  size={18}
                  color={lightColors.blue}
                />
              </View>
              <View className="flex-1">
                <Text className="font-sans text-[9px] font-extrabold uppercase tracking-[1.2px] text-green">
                  Selecionada
                </Text>
                <Text className="mt-0.5 font-sans text-sm font-bold text-ink">
                  {selectedLocation.name}
                </Text>
                <Text className="font-sans text-[11px] text-ink-soft">
                  {formatLocationSubtitle(selectedLocation) || 'Local escolhido'}
                </Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              className="min-h-[48px] flex-row items-center justify-center rounded-lg bg-green px-5 active:opacity-90"
              onPress={() => router.push('/date-picker')}
            >
              <Text className="font-sans text-[13px] font-extrabold text-surface">
                Continuar
              </Text>
              <View className="ml-2">
                <ClimioIcon
                  name="arrow-right"
                  size={16}
                  color={lightColors.surface}
                />
              </View>
            </Pressable>
          </View>
        ) : null}

        {showIdle ? (
          <View className="mt-4 items-center rounded-lg bg-surface-soft px-5 py-8">
            <View className="mb-3 h-[52px] w-[52px] items-center justify-center rounded-lg bg-surface">
              <ClimioIcon name="location" size={22} color={lightColors.green} />
            </View>
            <Text className="text-center font-sans text-sm font-bold text-ink">
              Digite o nome de uma cidade
            </Text>
            <Text className="mt-1.5 max-w-[260px] text-center font-sans text-[11px] leading-4 text-ink-soft">
              Comece a escrever para ver sugestões. A localização atual do
              dispositivo ainda não está disponível nesta etapa.
            </Text>
          </View>
        ) : null}

        {showLoading ? (
          <View className="mt-10 items-center gap-3">
            <ActivityIndicator color={lightColors.blue} />
            <Text className="font-sans text-sm text-ink-soft">
              Buscando cidades…
            </Text>
          </View>
        ) : null}

        {showError ? (
          <View className="mt-4 rounded-lg border border-danger bg-danger-soft px-4 py-4">
            <Text className="font-sans text-sm font-bold text-danger">
              Não foi possível buscar
            </Text>
            <Text className="mt-1 font-sans text-[11px] text-ink-soft">
              Verifique sua conexão e tente outro nome de cidade.
            </Text>
          </View>
        ) : null}

        {showEmpty ? (
          <View className="mt-4 items-center rounded-lg bg-surface-soft px-5 py-8">
            <View className="mb-3 h-[52px] w-[52px] items-center justify-center rounded-lg bg-surface">
              <ClimioIcon name="search" size={22} color={lightColors.green} />
            </View>
            <Text className="text-center font-sans text-sm font-bold text-ink">
              Não encontramos essa cidade
            </Text>
            <Text className="mt-1.5 text-center font-sans text-[11px] text-ink-soft">
              Tente outro nome ou uma cidade próxima.
            </Text>
          </View>
        ) : null}

        {showResults ? (
          <FlatList
            data={search.data}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="pb-8"
            ItemSeparatorComponent={() => (
              <View className="ml-[54px] h-px bg-line" />
            )}
            renderItem={({ item }) => {
              const selected = selectedLocation?.id === item.id;
              const subtitle = formatLocationSubtitle(item);

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  className={`min-h-[56px] flex-row items-center gap-3 px-1 py-2.5 ${
                    selected ? 'rounded-lg bg-surface-soft' : ''
                  }`}
                  onPress={() => {
                    setLocation(item);
                    router.push('/date-picker');
                  }}
                >
                  <View className="h-10 w-10 items-center justify-center rounded-md bg-surface-blue">
                    <ClimioIcon
                      name="location"
                      size={18}
                      color={lightColors.blue}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="font-sans text-sm font-bold text-ink">
                      {item.name}
                    </Text>
                    {subtitle ? (
                      <Text className="mt-0.5 font-sans text-[11px] text-ink-soft">
                        {subtitle}
                      </Text>
                    ) : null}
                  </View>
                  {selected ? (
                    <ClimioIcon
                      name="check"
                      size={18}
                      color={lightColors.green}
                    />
                  ) : null}
                </Pressable>
              );
            }}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}
