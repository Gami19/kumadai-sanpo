import { Pressable, StyleSheet } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { theme } from '@/theme/tokens';

import { campuses, type CampusId } from './campuses';
import type { LocationCue } from './locationCue';
import type { MapLocationState } from './useMapLocation';

export type LocationButtonModel =
  | { kind: 'pending' }
  | { kind: 'blocked'; canAskAgain: boolean; reason: 'denied' | 'services-off' }
  | { kind: 'failed' }
  | { kind: 'outside' }
  | { kind: 'ready'; following: boolean; place: CampusId | null };

/**
 * バナーの文章を、右下の1つのボタンのアイコンに畳む。
 * 未許可は斜線、取得中は輪郭、追従中は塗り。座標の保存や送信はしない。
 */
export function locationButtonModel(
  devFixActive: boolean,
  live: MapLocationState,
  cue: LocationCue | null,
  following: boolean,
): LocationButtonModel {
  if (!devFixActive) {
    if (live.status === 'idle' || live.status === 'pending') {
      return { kind: 'pending' };
    }
    if (live.status === 'denied') {
      return { kind: 'blocked', canAskAgain: live.canAskAgain, reason: 'denied' };
    }
    if (live.status === 'unavailable') {
      return live.reason === 'services-off'
        ? { kind: 'blocked', canAskAgain: false, reason: 'services-off' }
        : { kind: 'failed' };
    }
  }
  if (cue?.kind === 'outside') {
    return { kind: 'outside' };
  }
  if (cue?.kind === 'here') {
    return { kind: 'ready', following, place: null };
  }
  if (cue?.kind === 'elsewhere') {
    return { kind: 'ready', following: false, place: cue.campusId };
  }
  return { kind: 'pending' };
}

type Props = {
  model: LocationButtonModel;
  onPress: () => void;
};

function appearance(model: LocationButtonModel): {
  icon: IconName;
  color: string;
  ring: boolean;
  faded: boolean;
  label: string;
  busy: boolean;
} {
  if (model.kind === 'blocked') {
    return {
      icon: 'location.slash',
      color: theme.color.ink,
      ring: false,
      faded: false,
      label: model.reason === 'services-off' ? '位置情報がオフ' : '位置情報は未許可',
      busy: false,
    };
  }
  if (model.kind === 'pending') {
    return {
      icon: 'location',
      color: theme.color.leafDark,
      ring: true,
      faded: false,
      label: '現在地を取得しています',
      busy: true,
    };
  }
  if (model.kind === 'failed') {
    return {
      icon: 'location',
      color: theme.color.ink,
      ring: false,
      faded: false,
      label: '現在地を再取得',
      busy: false,
    };
  }
  if (model.kind === 'outside') {
    return {
      icon: 'location',
      color: theme.color.ink,
      ring: false,
      faded: true,
      label: '学外',
      busy: false,
    };
  }
  if (model.place != null) {
    const label = campuses.find((campus) => campus.id === model.place)?.label ?? '';
    return {
      icon: 'location',
      color: theme.color.ink,
      ring: false,
      faded: false,
      label: `${label}へ`,
      busy: false,
    };
  }
  if (model.following) {
    return {
      icon: 'location.fill',
      color: theme.color.leafDark,
      ring: true,
      faded: false,
      label: '現在地を追従中',
      busy: false,
    };
  }
  return {
    icon: 'location',
    color: theme.color.ink,
    ring: false,
    faded: false,
    label: '現在地へ',
    busy: false,
  };
}

export function LocationButton({ model, onPress }: Props) {
  const look = appearance(model);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={look.label}
      accessibilityState={{ busy: look.busy }}
      testID="location-button"
      onPress={onPress}
      pressRetentionOffset={theme.space.md}
      style={({ pressed }) => [
        styles.button,
        look.ring ? styles.ring : null,
        look.faded ? styles.faded : null,
        pressed && !look.busy ? styles.pressed : null,
      ]}
    >
      <Icon name={look.icon} size={theme.space.lg} color={look.color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: theme.hit,
    height: theme.hit,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.paper,
    boxShadow: theme.shadow.float,
  },
  ring: {
    borderWidth: theme.border.mark,
    borderColor: theme.color.leafDark,
  },
  faded: {
    opacity: 0.45,
  },
  pressed: {
    opacity: theme.opacity.pressed,
  },
});
