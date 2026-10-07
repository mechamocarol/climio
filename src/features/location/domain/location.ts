/**
 * Selected or searchable place used for forecasts.
 * Field names are domain-oriented, not Open-Meteo payload keys.
 */

export type Location = Readonly<{
  id: string;
  name: string;
  region: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
  timezone: string | null;
}>;
