import Svg, { Circle, Path, Rect } from 'react-native-svg';

import type { ActivityId } from '@/features/activity/domain/activities';

export type ClimioIconName =
  | 'arrow-left'
  | 'arrow-right'
  | 'check'
  | 'cloud'
  | 'location'
  | 'search'
  | 'wind'
  | ActivityId;

type ClimioIconProps = {
  name: ClimioIconName;
  size?: number;
  color?: string;
};

/**
 * Lightweight stroke icons aligned with the Figma Make visual reference.
 * Presentation-only — not part of domain contracts.
 */
export function ClimioIcon({
  name,
  size = 20,
  color = 'currentColor',
}: ClimioIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {renderIcon(name, color)}
    </Svg>
  );
}

function renderIcon(name: ClimioIconName, color: string) {
  const stroke = {
    stroke: color,
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (name) {
    case 'arrow-left':
      return (
        <>
          <Path d="m15 18-6-6 6-6" {...stroke} />
          <Path d="M9 12h10" {...stroke} />
        </>
      );
    case 'arrow-right':
      return (
        <>
          <Path d="m9 18 6-6-6-6" {...stroke} />
          <Path d="M5 12h10" {...stroke} />
        </>
      );
    case 'check':
      return <Path d="m5 12 4 4L19 6" {...stroke} />;
    case 'cloud':
      return (
        <Path
          d="M5 18h13a4 4 0 0 0 .5-8 7 7 0 0 0-13.2 2A3 3 0 0 0 5 18Z"
          {...stroke}
        />
      );
    case 'location':
      return (
        <>
          <Path
            d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"
            {...stroke}
          />
          <Circle cx="12" cy="10" r="2.5" {...stroke} />
        </>
      );
    case 'search':
      return (
        <>
          <Circle cx="11" cy="11" r="7" {...stroke} />
          <Path d="m20 20-4-4" {...stroke} />
        </>
      );
    case 'wind':
      return (
        <>
          <Path d="M4 8h10c3 0 3-4 0-4-1 0-2 .5-2 1" {...stroke} />
          <Path d="M4 12h15c3 0 3 4 0 4-1 0-2-.5-2-1" {...stroke} />
          <Path d="M4 16h7" {...stroke} />
        </>
      );
    case 'running':
      return (
        <>
          <Circle cx="14" cy="4" r="2" {...stroke} />
          <Path d="m7 21 3-7 2-3 3 3 4 1M6 10l4-3 4 2m-2 5 3 7" {...stroke} />
        </>
      );
    case 'skateboarding':
      return (
        <>
          <Path d="M4 15h13c2 0 3-1 3-3v-1" {...stroke} />
          <Circle cx="8" cy="18" r="1.5" {...stroke} />
          <Circle cx="17" cy="18" r="1.5" {...stroke} />
        </>
      );
    case 'cycling':
      return (
        <>
          <Circle cx="6" cy="17" r="3" {...stroke} />
          <Circle cx="18" cy="17" r="3" {...stroke} />
          <Path d="m6 17 4-8 3 8 3-6H9m5-4h3" {...stroke} />
        </>
      );
    case 'walking':
      return (
        <>
          <Circle cx="13" cy="4" r="2" {...stroke} />
          <Path d="m7 21 3-7 1-5 4 3 3 1m-7 2 5 6M7 10l4-3 3 1" {...stroke} />
        </>
      );
    case 'pet_walk':
      return (
        <>
          <Path d="M7 9 4 5v7c0 5 3 8 8 8s8-3 8-8V5l-3 4" {...stroke} />
          <Circle cx="9" cy="12" r="0.5" fill={color} stroke="none" />
          <Circle cx="15" cy="12" r="0.5" fill={color} stroke="none" />
          <Path d="M10 16h4" {...stroke} />
        </>
      );
    case 'child_walk':
      return (
        <>
          <Circle cx="12" cy="5" r="2" {...stroke} />
          <Path d="M8 21v-5l2-4-3-2m9 11v-5l-2-4 3-2m-7 2h4" {...stroke} />
        </>
      );
    case 'beach':
      return (
        <>
          <Circle cx="12" cy="12" r="4" {...stroke} />
          <Path
            d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
            {...stroke}
          />
        </>
      );
    case 'surfing':
      return (
        <>
          <Path d="M4 17c3 2 5 2 8 0s5-2 8 0M5 12c4-5 9-7 14-5-4 1-6 3-7 7" {...stroke} />
        </>
      );
    case 'picnic':
      return (
        <>
          <Path d="M5 11h14l2 10H3l2-10Z" {...stroke} />
          <Path d="m8 11 4-7 4 7M7 16h10" {...stroke} />
        </>
      );
    case 'kite':
      return (
        <>
          <Path d="m12 3 6 7-6 5-6-5 6-7Z" {...stroke} />
          <Path d="M12 15c0 4 4 2 4 6" {...stroke} />
        </>
      );
    default:
      return <Rect x="4" y="4" width="16" height="16" rx="4" {...stroke} />;
  }
}
