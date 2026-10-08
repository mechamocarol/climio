import {
  buildGpsLocationId,
  mapDeviceCoordinatesToLocation,
} from '@/features/location/data/map-device-coordinates-to-location';

const coordinates = {
  latitude: -23.5505,
  longitude: -46.6333,
} as const;

describe('buildGpsLocationId', () => {
  it('builds a deterministic synthetic id from coordinates', () => {
    expect(buildGpsLocationId(coordinates)).toBe('gps:-23.5505,-46.6333');
  });
});

describe('mapDeviceCoordinatesToLocation', () => {
  it('maps reverse-geocode labels and timezone into a domain Location', () => {
    const location = mapDeviceCoordinatesToLocation({
      coordinates,
      place: {
        city: 'São Paulo',
        region: 'São Paulo',
        country: 'Brasil',
      },
      timezone: 'America/Sao_Paulo',
    });

    expect(location).toEqual({
      id: 'gps:-23.5505,-46.6333',
      name: 'São Paulo',
      region: 'São Paulo',
      country: 'Brasil',
      latitude: -23.5505,
      longitude: -46.6333,
      timezone: 'America/Sao_Paulo',
    });
  });

  it('falls back to Minha localização when labels are missing', () => {
    const location = mapDeviceCoordinatesToLocation({
      coordinates,
      place: null,
      timezone: 'America/Sao_Paulo',
    });

    expect(location.name).toBe('Minha localização');
    expect(location.region).toBeNull();
    expect(location.country).toBeNull();
    expect(location.timezone).toBe('America/Sao_Paulo');
  });

  it('ignores blank reverse-geocode fields and uses the next useful label', () => {
    const location = mapDeviceCoordinatesToLocation({
      coordinates,
      place: {
        city: '   ',
        name: null,
        district: 'Centro',
        region: '',
        subregion: 'Subúrbio',
        country: 'Brasil',
      },
      timezone: 'America/Sao_Paulo',
    });

    expect(location.name).toBe('Centro');
    expect(location.region).toBe('Subúrbio');
    expect(location.country).toBe('Brasil');
  });

  it('prefers city over other place labels for the name', () => {
    const location = mapDeviceCoordinatesToLocation({
      coordinates,
      place: {
        city: 'Campinas',
        name: 'Rua Exemplo',
        district: 'Centro',
        region: 'São Paulo',
        country: 'Brasil',
      },
      timezone: 'America/Sao_Paulo',
    });

    expect(location.name).toBe('Campinas');
    expect(location.region).toBe('São Paulo');
  });
});
