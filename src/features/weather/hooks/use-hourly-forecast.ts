import { useQuery } from '@tanstack/react-query';

import type { GetHourlyForecastInput } from '@/features/weather/domain/weather-repository';
import { useWeatherRepository } from '@/providers/repositories-provider';

export function hourlyForecastQueryKey(input: GetHourlyForecastInput) {
  return [
    'weather',
    'hourlyForecast',
    {
      latitude: input.latitude,
      longitude: input.longitude,
      date: input.date,
    },
  ] as const;
}

function isValidForecastInput(
  input: GetHourlyForecastInput | null | undefined,
): input is GetHourlyForecastInput {
  return (
    input != null &&
    typeof input.latitude === 'number' &&
    Number.isFinite(input.latitude) &&
    typeof input.longitude === 'number' &&
    Number.isFinite(input.longitude) &&
    typeof input.date === 'string' &&
    input.date.length > 0
  );
}

/** Hourly forecast for an explicit `{ latitude, longitude, date }` input. */
export function useHourlyForecast(
  input: GetHourlyForecastInput | null | undefined,
) {
  const weatherRepository = useWeatherRepository();
  const enabled = isValidForecastInput(input);

  return useQuery({
    queryKey: enabled
      ? hourlyForecastQueryKey(input)
      : (['weather', 'hourlyForecast', 'disabled'] as const),
    queryFn: ({ signal }) => {
      if (!isValidForecastInput(input)) {
        throw new Error('Hourly forecast query ran without valid input');
      }

      return weatherRepository.getHourlyForecast(input, signal);
    },
    enabled,
  });
}
