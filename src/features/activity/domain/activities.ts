/**
 * Stable activity catalog for the Climio MVP.
 * Identifiers follow docs/product/mvp/business-rules.md §12.
 */

export const ACTIVITY_IDS = [
  'running',
  'skateboarding',
  'cycling',
  'walking',
  'pet_walk',
  'child_walk',
  'beach',
  'surfing',
  'picnic',
  'kite',
] as const;

export type ActivityId = (typeof ACTIVITY_IDS)[number];

export type Activity = Readonly<{
  id: ActivityId;
  name: string;
}>;

export const ACTIVITIES: readonly Activity[] = [
  { id: 'running', name: 'Corrida' },
  { id: 'skateboarding', name: 'Skate' },
  { id: 'cycling', name: 'Ciclismo' },
  { id: 'walking', name: 'Caminhada' },
  { id: 'pet_walk', name: 'Passeio com pet' },
  { id: 'child_walk', name: 'Passeio com criança' },
  { id: 'beach', name: 'Ir à praia' },
  { id: 'surfing', name: 'Surfar' },
  { id: 'picnic', name: 'Piquenique' },
  { id: 'kite', name: 'Empinar pipa' },
] as const;

export function isActivityId(value: string): value is ActivityId {
  return (ACTIVITY_IDS as readonly string[]).includes(value);
}

export function getActivityById(id: ActivityId): Activity {
  const activity = ACTIVITIES.find((item) => item.id === id);
  if (!activity) {
    throw new Error(`Unknown activity id: ${id}`);
  }
  return activity;
}
