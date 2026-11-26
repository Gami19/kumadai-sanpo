import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

export type MapLocationState =
  | { status: 'idle' }
  | { status: 'pending' }
  | { status: 'denied'; canAskAgain: boolean }
  | { status: 'unavailable'; reason: 'services-off' | 'failed' }
  | { status: 'ready'; lat: number; lon: number; accuracyMeters: number | null };

const IDLE: MapLocationState = { status: 'idle' };

function accuracyMeters(value: number | null): number | null {
  if (value == null || !Number.isFinite(value) || value < 0) {
    return null;
  }
  return value;
}

function readyFrom(location: Location.LocationObject): MapLocationState | null {
  const { latitude, longitude, accuracy } = location.coords;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }
  return {
    status: 'ready',
    lat: latitude,
    lon: longitude,
    accuracyMeters: accuracyMeters(accuracy),
  };
}

/**
 * マップが見えている間だけ、使用中の位置を購読する。
 * 座標は表示用の state にだけ置き、保存も送信もしない。購読を止めたら捨てる。
 * バックグラウンドで止め、許可ダイアログ中の inactive では止めない。
 */
export function useMapLocation(enabled: boolean): {
  state: MapLocationState;
  retry: () => void;
} {
  const [backgrounded, setBackgrounded] = useState(() => AppState.currentState === 'background');
  const [retryToken, setRetryToken] = useState(0);
  const [state, setState] = useState<MapLocationState>(IDLE);
  const watching = enabled && !backgrounded;

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      setBackgrounded(next === 'background');
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!watching) {
      return;
    }

    let removed = false;
    let sawFix = false;
    let subscription: Location.LocationSubscription | null = null;

    const publish = (next: MapLocationState) => {
      if (!removed) {
        setState(next);
      }
    };

    const fail = () => {
      if (!sawFix) {
        publish({ status: 'unavailable', reason: 'failed' });
      }
    };

    const start = async () => {
      publish({ status: 'pending' });
      try {
        const servicesOn = await Location.hasServicesEnabledAsync();
        if (removed) {
          return;
        }
        if (!servicesOn) {
          publish({ status: 'unavailable', reason: 'services-off' });
          return;
        }

        let permission = await Location.getForegroundPermissionsAsync();
        if (removed) {
          return;
        }
        if (!permission.granted && permission.canAskAgain) {
          permission = await Location.requestForegroundPermissionsAsync();
        }
        if (removed) {
          return;
        }
        if (!permission.granted) {
          publish({ status: 'denied', canAskAgain: permission.canAskAgain });
          return;
        }

        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        if (removed) {
          return;
        }
        const first = readyFrom(current);
        if (first) {
          sawFix = true;
          publish(first);
        }

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 5,
            timeInterval: 2000,
          },
          (location) => {
            const next = readyFrom(location);
            if (next) {
              sawFix = true;
              publish(next);
            }
          },
          () => {
            fail();
          },
        );
        if (removed) {
          subscription.remove();
          subscription = null;
        }
      } catch {
        fail();
      }
    };

    void start();

    return () => {
      removed = true;
      subscription?.remove();
      subscription = null;
      setState(IDLE);
    };
  }, [watching, retryToken]);

  const retry = useCallback(() => {
    setRetryToken((value) => value + 1);
  }, []);

  return { state: watching ? state : IDLE, retry };
}
