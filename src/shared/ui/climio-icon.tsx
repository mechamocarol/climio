import { Platform } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import type { ActivityId } from '@/features/activity/domain/activities';

export type ClimioIconName =
  | 'alert'
  | 'arrow-left'
  | 'arrow-right'
  | 'calendar'
  | 'check'
  | 'chevron-right'
  | 'close'
  | 'cloud'
  | 'cloud-rain'
  | 'compass'
  | 'location'
  | 'mic'
  | 'moon'
  | 'partly-cloudy'
  | 'search'
  | 'sun'
  | 'thermometer'
  | 'wind'
  | ActivityId;

type ClimioIconProps = {
  name: ClimioIconName;
  size?: number;
  color?: string;
};

/** Shared stroke icons for Climio UI. */
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
      // Avoid RN a11y props that leak invalid DOM attributes during web SSR.
      {...(Platform.OS === 'web'
        ? { focusable: false }
        : { accessible: false })}
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
    case 'alert':
      return (
        <>
          <Circle cx="12" cy="12" r="9.5" fill={color} stroke="none" />
          <Path
            d="M12 7v5.5"
            stroke="#FFFFFF"
            strokeWidth={2}
            strokeLinecap="round"
          />
          <Circle cx="12" cy="16.8" r="1.15" fill="#FFFFFF" stroke="none" />
        </>
      );
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
    case 'calendar':
      return (
        <>
          <Rect x="3" y="5" width="18" height="16" rx="3" {...stroke} />
          <Path d="M8 3v4m8-4v4M3 10h18" {...stroke} />
        </>
      );
    case 'check':
      return <Path d="m5 12 4 4L19 6" {...stroke} />;
    case 'chevron-right':
      return <Path d="m9 6 6 6-6 6" {...stroke} />;
    case 'close':
      return <Path d="M6 6l12 12M18 6 6 18" {...stroke} />;
    case 'compass':
      return (
        <>
          <Circle cx="12" cy="12" r="9" {...stroke} />
          <Path d="m14.5 9.5-2 5-5 2 2-5 5-2Z" {...stroke} />
        </>
      );
    case 'cloud':
      return (
        <Path
          d="M5 18h13a4 4 0 0 0 .5-8 7 7 0 0 0-13.2 2A3 3 0 0 0 5 18Z"
          {...stroke}
        />
      );
    case 'cloud-rain':
      return (
        <>
          <Path
            d="M5 15h13a4 4 0 0 0 .5-8 7 7 0 0 0-13.2 2A3 3 0 0 0 5 15Z"
            {...stroke}
          />
          <Path d="M8 18v2M12 17v3M16 18v2" {...stroke} />
        </>
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
    case 'mic':
      return (
        <>
          <Path d="M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3Z" {...stroke} />
          <Path d="M19 11a7 7 0 0 1-14 0M12 18v3" {...stroke} />
        </>
      );
    case 'moon':
      return (
        <Path
          d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"
          {...stroke}
        />
      );
    case 'partly-cloudy':
      return (
        <>
          <Circle cx="16" cy="7" r="2.5" {...stroke} />
          <Path
            d="M16 2.5v1.2m3.2 1.1-0.9 0.9M20.5 7h-1.2m-0.9 3.2-0.9-0.9"
            {...stroke}
          />
          <Path
            d="M5 18h12a3.5 3.5 0 0 0 .4-7 6 6 0 0 0-11.4 1.8A2.7 2.7 0 0 0 5 18Z"
            {...stroke}
          />
          <Path d="M7 20.5h6M9 22h3" {...stroke} />
        </>
      );
    case 'search':
      return (
        <>
          <Circle cx="11" cy="11" r="7" {...stroke} />
          <Path d="m20 20-4-4" {...stroke} />
        </>
      );
    case 'sun':
      return (
        <>
          <Circle cx="12" cy="12" r="4" {...stroke} />
          <Path
            d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
            {...stroke}
          />
        </>
      );
    case 'thermometer':
      return (
        <>
          <Path
            d="M14 14.5V5.5a2.5 2.5 0 0 0-5 0v9a3.5 3.5 0 1 0 5 0Z"
            {...stroke}
          />
          <Path d="M11.5 16.5v-7" {...stroke} />
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
